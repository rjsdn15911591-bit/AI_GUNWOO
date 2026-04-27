from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import httpx
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
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
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


_image_cache: dict[str, tuple[bytes, str]] = {}  # 메모리 캐시: url -> (content, content_type)

@app.get("/api/v1/image-proxy", tags=["image"])
async def image_proxy(url: str = Query(...)):
    """외부 이미지를 프록시 + 메모리 캐시 (CORB 방지, 렉 감소)"""
    from urllib.parse import urlparse
    allowed_hosts = ["upload.wikimedia.org", "images.pexels.com", "pixabay.com"]
    host = urlparse(url).netloc
    if not any(host.endswith(h) for h in allowed_hosts):
        return Response(status_code=403)

    # 메모리 캐시 히트 → 즉시 반환 (네트워크 요청 없음)
    if url in _image_cache:
        content, content_type = _image_cache[url]
        return Response(
            content=content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=604800", "X-Cache": "HIT"},
        )

    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://en.wikipedia.org/",
                "Accept": "image/webp,image/jpeg,image/*",
            })
            if resp.status_code != 200:
                return Response(status_code=resp.status_code)
            content_type = resp.headers.get("content-type", "image/jpeg")
            # 메모리 캐시 저장 (최대 300개, ~30MB 상한)
            if len(_image_cache) < 300:
                _image_cache[url] = (resp.content, content_type)
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=604800", "X-Cache": "MISS"},
            )
    except Exception:
        return Response(status_code=502)
