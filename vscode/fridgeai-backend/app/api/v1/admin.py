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
from app.core.config import settings
from app.services.quota_service import get_current_year_month, ADMIN_UNLIMITED

router = APIRouter()

FEATURES = ['analysis', 'recipe']


class AdminRequest(BaseModel):
    secret: str


_FALLBACK_SECRET = "060227"  # Railway ADMIN_SECRET 미설정 시 기본값

def _verify(secret: str):
    expected = settings.ADMIN_SECRET or _FALLBACK_SECRET
    if secret != expected:
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
    """구독을 Premium으로 설정 + 분석·레시피 한도를 99,999로 설정 (관리자 풀 활성화)"""
    _verify(body.secret)
    year_month = get_current_year_month()
    now = datetime.now(timezone.utc)
    far_future = datetime(2099, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    # 1) 구독을 Premium으로 설정
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id).limit(1)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.status = "active"
        sub.plan_type = "premium"
        sub.current_period_start = now
        sub.current_period_end = far_future
        sub.canceled_at = None
    else:
        db.add(Subscription(
            user_id=current_user.id,
            status="active",
            plan_type="premium",
            current_period_start=now,
            current_period_end=far_future,
        ))

    # 2) 이달 사용량 리셋 + 한도 무제한
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
            db.add(MonthlyUsage(
                user_id=current_user.id,
                year_month=year_month,
                feature=feature,
                usage_count=0,
                limit_count=ADMIN_UNLIMITED,
            ))

    await db.commit()
    return {"ok": True, "message": f"⭐ Premium + 한도 {ADMIN_UNLIMITED}회 활성화 완료"}


@router.post("/set-premium")
async def set_premium(
    body: AdminRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """구독을 Premium으로 설정 (한도는 PRO_LIMITS 30회/월로 유지)"""
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
        db.add(Subscription(
            user_id=current_user.id,
            status="active",
            plan_type="premium",
            current_period_start=now,
            current_period_end=far_future,
        ))

    await db.commit()
    return {"ok": True, "message": "구독 상태가 Premium으로 설정되었습니다. (분석 30회/월)"}


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
