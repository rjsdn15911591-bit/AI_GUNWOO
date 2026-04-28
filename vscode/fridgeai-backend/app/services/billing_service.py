import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
POLAR_API_BASE = "https://api.polar.sh"


async def create_checkout_url(user_id: str) -> str:
    """Polar.sh 체크아웃 URL 생성."""
    if not settings.POLAR_API_KEY or not settings.POLAR_PRODUCT_ID:
        return f"https://buy.polar.sh/{settings.POLAR_PRODUCT_ID}?metadata[user_id]={user_id}"

    payload = {
        "product_id": settings.POLAR_PRODUCT_ID,
        "metadata": {"user_id": str(user_id)},
        "success_url": f"{settings.FRONTEND_URL}/subscription?success=1",
    }
    print(f"[Polar] checkout request product_id={settings.POLAR_PRODUCT_ID}", flush=True)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{POLAR_API_BASE}/v1/checkouts/custom",
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.POLAR_API_KEY}",
                "Content-Type": "application/json",
            },
        )

    print(f"[Polar] checkout response: status={resp.status_code} body={resp.text}", flush=True)
    resp.raise_for_status()
    return resp.json()["url"]


async def cancel_subscription(polar_subscription_id: str) -> dict:
    """Polar.sh API로 구독 즉시 취소 요청"""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.patch(
            f"{POLAR_API_BASE}/v1/subscriptions/{polar_subscription_id}",
            json={"cancel_at_period_end": True},
            headers={
                "Authorization": f"Bearer {settings.POLAR_API_KEY}",
                "Content-Type": "application/json",
            },
        )
    resp.raise_for_status()
    return resp.json()
