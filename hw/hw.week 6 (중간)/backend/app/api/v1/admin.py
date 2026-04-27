"""제작자 전용 관리 API — 히든 패널에서만 호출됩니다."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.fridge import Refrigerator, Ingredient
from app.models.usage import MonthlyUsage
from app.models.subscription import Subscription
from app.services.quota_service import get_current_year_month, ADMIN_UNLIMITED

router = APIRouter()

ADMIN_SECRET = "060227"
FEATURES = ['analysis', 'recipe']


class AdminRequest(BaseModel):
    secret: str


def _verify(secret: str):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="인증 실패")


@router.post("/reset-quota")
async def reset_quota(
    body: AdminRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _verify(body.secret)
    year_month = get_current_year_month()

    for feature in FEATURES:
        result = await db.execute(
            select(MonthlyUsage).where(
                MonthlyUsage.user_id == current_user.id,
                MonthlyUsage.year_month == year_month,
                MonthlyUsage.feature == feature,
            )
        )
        usage = result.scalar_one_or_none()
        if usage:
            usage.usage_count = 0

    await db.commit()
    return {"ok": True, "message": f"{year_month} 분석·레시피 한도가 모두 초기화되었습니다."}


@router.post("/set-pro")
async def set_pro(
    body: AdminRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _verify(body.secret)
    year_month = get_current_year_month()

    for feature in FEATURES:
        result = await db.execute(
            select(MonthlyUsage).where(
                MonthlyUsage.user_id == current_user.id,
                MonthlyUsage.year_month == year_month,
                MonthlyUsage.feature == feature,
            )
        )
        usage = result.scalar_one_or_none()
        if usage:
            usage.usage_count = 0
            usage.limit_count = ADMIN_UNLIMITED
        else:
            usage = MonthlyUsage(
                user_id=current_user.id,
                year_month=year_month,
                feature=feature,
                usage_count=0,
                limit_count=ADMIN_UNLIMITED,
            )
            db.add(usage)

    await db.commit()
    return {"ok": True, "message": f"PRO 모드 활성화 (분석 {ADMIN_UNLIMITED}회 · 레시피 {ADMIN_UNLIMITED}회)"}


@router.post("/set-premium")
async def set_premium(
    body: AdminRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _verify(body.secret)

    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id).limit(1)
    )
    sub = result.scalar_one_or_none()

    far_future = datetime(2099, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)

    if sub:
        sub.status = "active"
        sub.plan_type = "premium"
        sub.current_period_start = now
        sub.current_period_end = far_future
        sub.canceled_at = None
    else:
        sub = Subscription(
            user_id=current_user.id,
            status="active",
            plan_type="premium",
            current_period_start=now,
            current_period_end=far_future,
        )
        db.add(sub)

    await db.commit()
    return {"ok": True, "message": "구독 상태가 Premium으로 설정되었습니다."}


@router.post("/reset-account")
async def reset_account(
    body: AdminRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _verify(body.secret)

    # 냉장고 재료 전체 삭제
    fridge_result = await db.execute(
        select(Refrigerator).where(Refrigerator.user_id == current_user.id)
    )
    fridge = fridge_result.scalar_one_or_none()
    if fridge:
        await db.execute(
            delete(Ingredient).where(Ingredient.refrigerator_id == fridge.id)
        )

    # 사용량 기록 전체 삭제
    await db.execute(
        delete(MonthlyUsage).where(MonthlyUsage.user_id == current_user.id)
    )

    await db.commit()
    return {"ok": True, "message": "계정 데이터가 초기화되었습니다. (냉장고 + 사용량)"}
