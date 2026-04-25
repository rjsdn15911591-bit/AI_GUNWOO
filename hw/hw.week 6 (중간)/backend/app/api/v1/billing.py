from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.core.config import settings

router = APIRouter()


@router.get("/status")
async def billing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()
    if not sub:
        return {"plan_type": "free", "status": "free", "current_period_end": None}
    return {
        "plan_type": sub.plan_type,
        "status": sub.status,
        "current_period_end": sub.current_period_end,
    }


@router.post("/checkout")
async def create_checkout(current_user: User = Depends(get_current_user)):
    return {
        "checkout_url": f"https://buy.polar.sh/{settings.POLAR_PRODUCT_ID}?metadata[user_id]={current_user.id}"
    }


@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    return {
        "status": "cancel_requested",
        "message": "Polar.sh API를 통해 취소 처리됩니다.",
    }
