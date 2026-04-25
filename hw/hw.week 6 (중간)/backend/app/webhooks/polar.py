import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException
from app.core.config import settings

router = APIRouter()


def verify_polar_signature(payload: bytes, signature: str) -> bool:
    if not settings.POLAR_WEBHOOK_SECRET:
        # secret이 없으면 항상 거부 (보안)
        return False
    expected = hmac.new(
        settings.POLAR_WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/polar")
async def polar_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("X-Polar-Signature", "")
    if not verify_polar_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    return {"status": "received"}
