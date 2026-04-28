from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import httpx
import asyncio
from app.core.config import settings
from app.api.v1 import auth, fridge, analysis, quota, recipes, billing, admin
from app.webhooks import polar as polar_webhook

app = FastAPI(
    title=settings.APP_NAME,
    description="냉장고 AI 식재료 관리 & 레시피 추천 서비스 API",
    version="1.0.0",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://ai-gunwoo-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(fridge.router, prefix="/api/v1/fridge", tags=["fridge"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(quota.router, prefix="/api/v1/quota", tags=["quota"])
app.include_router(recipes.router, prefix="/api/v1/recipes", tags=["recipes"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(polar_webhook.router, prefix="/webhooks", tags=["webhooks"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME}


_image_cache: dict[str, tuple[bytes, str]] = {}  # LRU 캐시: url -> (content, content_type)
_CACHE_MAX = 200
_image_sem = asyncio.Semaphore(4)  # 외부 이미지 서버 동시 요청 최대 4개

def _cache_put(url: str, content: bytes, content_type: str):
    if url in _image_cache:
        del _image_cache[url]
    elif len(_image_cache) >= _CACHE_MAX:
        _image_cache.pop(next(iter(_image_cache)))  # 가장 오래된 항목 제거 (LRU)
    _image_cache[url] = (content, content_type)

@app.get("/api/v1/image-proxy", tags=["image"])
async def image_proxy(url: str = Query(...)):
    """외부 이미지를 프록시 + LRU 메모리 캐시 (CORB 방지, 렉 감소)"""
    from urllib.parse import urlparse
    allowed_hosts = ["upload.wikimedia.org", "images.pexels.com", "pixabay.com"]
    host = urlparse(url).netloc
    if not any(host.endswith(h) for h in allowed_hosts):
        return Response(status_code=403)

    if url in _image_cache:
        content, content_type = _image_cache[url]
        return Response(
            content=content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=604800", "X-Cache": "HIT"},
        )

    _headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://en.wikipedia.org/",
        "Accept": "image/webp,image/jpeg,image/*",
    }
    async with _image_sem:
        try:
            async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                resp = await client.get(url, headers=_headers)
                # 429 → 2초 대기 후 1회 재시도
                if resp.status_code == 429:
                    await asyncio.sleep(2)
                    resp = await client.get(url, headers=_headers)
                if resp.status_code != 200:
                    return Response(status_code=resp.status_code)
                content_type = resp.headers.get("content-type", "image/jpeg")
                _cache_put(url, resp.content, content_type)
                return Response(
                    content=resp.content,
                    media_type=content_type,
                    headers={"Cache-Control": "public, max-age=604800", "X-Cache": "MISS"},
                )
        except Exception:
            return Response(status_code=502)
