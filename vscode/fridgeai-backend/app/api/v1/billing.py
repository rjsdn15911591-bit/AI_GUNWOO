from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.services import billing_service

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
        "polar_subscription_id": sub.polar_subscription_id,
    }


@router.post("/checkout")
async def create_checkout(current_user: User = Depends(get_current_user)):
    try:
        url = await billing_service.create_checkout_url(str(current_user.id))
        return {"checkout_url": url}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Polar.sh 연결 오류: {e}")


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()

    if not sub or sub.plan_type != "premium" or sub.status not in ("active",):
        raise HTTPException(status_code=400, detail="활성 프리미엄 구독이 없습니다.")

    if not sub.polar_subscription_id:
        raise HTTPException(status_code=400, detail="Polar 구독 ID가 없습니다.")

    try:
        await billing_service.cancel_subscription(sub.polar_subscription_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Polar.sh 취소 요청 실패: {e}")

    sub.status = "canceled"
    from datetime import datetime, timezone
    sub.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "canceled", "message": "구독이 취소되었습니다. 현재 기간 종료까지 프리미엄 혜택이 유지됩니다."}
