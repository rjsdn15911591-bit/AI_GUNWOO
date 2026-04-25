from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, fridge, analysis, quota, recipes, billing
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
app.include_router(polar_webhook.router, prefix="/webhooks", tags=["webhooks"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
