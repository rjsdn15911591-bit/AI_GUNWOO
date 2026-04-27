from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usage import MonthlyUsage
from app.models.subscription import Subscription

KST = ZoneInfo("Asia/Seoul")

# ── 플랜별 기능별 한도 ──────────────────────────────────────────────────
FREE_LIMITS: dict[str, int] = {
    'analysis': 5,
    'recipe': 10,
}
PRO_LIMITS: dict[str, int] = {
    'analysis': 30,
    'recipe': 30,
}
ADMIN_UNLIMITED = 99999  # 관리자 set-pro 시 설정되는 특수값


class QuotaExceededException(Exception):
    def __init__(self, usage_count: int, limit: int, reset_date: str, feature: str = 'analysis'):
        self.usage_count = usage_count
        self.limit = limit
        self.reset_date = reset_date
        self.feature = feature


def get_current_year_month() -> str:
    return datetime.now(KST).strftime("%Y-%m")


def get_next_month_reset(year_month: str) -> str:
    year, month = int(year_month[:4]), int(year_month[5:])
    if month == 12:
        next_dt = datetime(year + 1, 1, 1, tzinfo=KST)
    else:
        next_dt = datetime(year, month + 1, 1, tzinfo=KST)
    return next_dt.isoformat()


async def get_active_subscription(user_id, db: AsyncSession):
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.plan_type == "premium",
        )
    )
    return result.scalar_one_or_none()


async def _get_or_create_usage(
    user_id, year_month: str, feature: str, limit: int, db: AsyncSession
) -> MonthlyUsage:
    result = await db.execute(
        select(MonthlyUsage)
        .where(
            MonthlyUsage.user_id == user_id,
            MonthlyUsage.year_month == year_month,
            MonthlyUsage.feature == feature,
        )
        .with_for_update()
    )
    usage = result.scalar_one_or_none()
    if not usage:
        usage = MonthlyUsage(
            user_id=user_id,
            year_month=year_month,
            feature=feature,
            limit_count=limit,
        )
        db.add(usage)
        await db.flush()
    return usage


async def check_and_increment_quota(
    user_id, db: AsyncSession, feature: str = 'analysis'
) -> None:
    year_month = get_current_year_month()
    is_premium = bool(await get_active_subscription(user_id, db))
    limit = PRO_LIMITS.get(feature, 5) if is_premium else FREE_LIMITS.get(feature, 5)

    async with db.begin_nested():
        usage = await _get_or_create_usage(user_id, year_month, feature, limit, db)

        # 관리자 무제한 모드 (limit_count가 99999 이상)
        if usage.limit_count >= ADMIN_UNLIMITED:
            usage.usage_count += 1
            usage.updated_at = datetime.now(timezone.utc)
            return

        # 한도 갱신 (플랜 변경 반영)
        usage.limit_count = limit

        if usage.usage_count >= limit:
            raise QuotaExceededException(
                usage_count=usage.usage_count,
                limit=limit,
                reset_date=get_next_month_reset(year_month),
                feature=feature,
            )

        usage.usage_count += 1
        usage.updated_at = datetime.now(timezone.utc)


async def get_quota_status(user_id, db: AsyncSession) -> dict:
    year_month = get_current_year_month()
    is_premium = bool(await get_active_subscription(user_id, db))
    reset_date = get_next_month_reset(year_month)
    plan_type = "premium" if is_premium else "free"

    async def _feature_status(feature: str) -> dict:
        result = await db.execute(
            select(MonthlyUsage).where(
                MonthlyUsage.user_id == user_id,
                MonthlyUsage.year_month == year_month,
                MonthlyUsage.feature == feature,
            )
        )
        usage = result.scalar_one_or_none()
        count = usage.usage_count if usage else 0
        # 관리자 무제한 모드 체크
        if usage and usage.limit_count >= ADMIN_UNLIMITED:
            limit = ADMIN_UNLIMITED
        else:
            limit = PRO_LIMITS[feature] if is_premium else FREE_LIMITS[feature]
        return {
            "usage_count": count,
            "limit_count": limit,
            "remaining": max(0, limit - count),
        }

    analysis = await _feature_status('analysis')
    recipe = await _feature_status('recipe')

    return {
        "year_month": year_month,
        "plan_type": plan_type,
        "reset_date": reset_date,
        # 냉장고 분석
        "analysis_usage": analysis["usage_count"],
        "analysis_limit": analysis["limit_count"],
        "analysis_remaining": analysis["remaining"],
        # 레시피 생성
        "recipe_usage": recipe["usage_count"],
        "recipe_limit": recipe["limit_count"],
        "recipe_remaining": recipe["remaining"],
        # 하위 호환 (기존 코드가 usage_count를 보는 경우)
        "usage_count": analysis["usage_count"],
        "limit_count": analysis["limit_count"],
        "remaining": analysis["remaining"],
    }
