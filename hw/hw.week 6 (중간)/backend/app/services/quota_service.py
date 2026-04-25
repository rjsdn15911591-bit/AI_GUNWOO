from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usage import MonthlyUsage
from app.models.subscription import Subscription

KST = ZoneInfo("Asia/Seoul")


class QuotaExceededException(Exception):
    def __init__(self, usage_count: int, limit: int, reset_date: str):
        self.usage_count = usage_count
        self.limit = limit
        self.reset_date = reset_date


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


async def check_and_increment_quota(user_id, db: AsyncSession) -> None:
    year_month = get_current_year_month()
    async with db.begin_nested():
        result = await db.execute(
            select(MonthlyUsage)
            .where(
                MonthlyUsage.user_id == user_id,
                MonthlyUsage.year_month == year_month,
            )
            .with_for_update()
        )
        usage = result.scalar_one_or_none()
        if not usage:
            usage = MonthlyUsage(user_id=user_id, year_month=year_month)
            db.add(usage)
            await db.flush()

        if await get_active_subscription(user_id, db):
            return

        if usage.usage_count >= usage.limit_count:
            raise QuotaExceededException(
                usage_count=usage.usage_count,
                limit=usage.limit_count,
                reset_date=get_next_month_reset(year_month),
            )

        usage.usage_count += 1
        usage.updated_at = datetime.now(timezone.utc)


async def get_quota_status(user_id, db: AsyncSession) -> dict:
    year_month = get_current_year_month()
    result = await db.execute(
        select(MonthlyUsage).where(
            MonthlyUsage.user_id == user_id,
            MonthlyUsage.year_month == year_month,
        )
    )
    usage = result.scalar_one_or_none()
    is_premium = bool(await get_active_subscription(user_id, db))
    limit = 999999 if is_premium else (usage.limit_count if usage else 5)
    count = usage.usage_count if usage else 0
    return {
        "year_month": year_month,
        "usage_count": count,
        "limit_count": limit,
        "remaining": 999999 if is_premium else max(0, limit - count),
        "plan_type": "premium" if is_premium else "free",
        "reset_date": get_next_month_reset(year_month),
    }
