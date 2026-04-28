import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from standardwebhooks import Webhook, WebhookVerificationError
from app.core.config import settings
from app.core.database import get_db
from app.models.subscription import Subscription, WebhookEvent
from fastapi import Depends

router = APIRouter()


def _get_webhook_client() -> Webhook:
    """Polar.sh webhook 검증 클라이언트 (standardwebhooks 사용).
    Polar 고유 prefix polar_whs_ → whsec_ 로 변환 후 전달."""
    secret = settings.POLAR_WEBHOOK_SECRET
    if not secret:
        raise HTTPException(status_code=500, detail="POLAR_WEBHOOK_SECRET not configured")
    if secret.startswith("polar_whs_"):
        secret = "whsec_" + secret[len("polar_whs_"):]
    return Webhook(secret)


async def _upsert_subscription(data: dict, db: AsyncSession) -> None:
    """Polar 구독 데이터를 DB에 반영"""
    polar_sub_id = data.get("id")
    user_id = (data.get("metadata") or {}).get("user_id")
    if not polar_sub_id or not user_id:
        return

    status_map = {
        "active": "active",
        "canceled": "canceled",
        "revoked": "expired",
        "incomplete": "past_due",
        "past_due": "past_due",
    }
    polar_status = data.get("status", "active")
    db_status = status_map.get(polar_status, polar_status)
    # canceled = 취소 요청됨, 기간 종료까지 premium 유지; expired = 즉시 free
    plan_type = "free" if db_status == "expired" else "premium"

    period_start = data.get("current_period_start")
    period_end = data.get("current_period_end")
    canceled_at = data.get("canceled_at")

    result = await db.execute(
        select(Subscription).where(Subscription.polar_subscription_id == polar_sub_id)
    )
    sub = result.scalar_one_or_none()

    if sub:
        sub.status = db_status
        sub.plan_type = plan_type
        if period_start:
            sub.current_period_start = datetime.fromisoformat(period_start.replace("Z", "+00:00"))
        if period_end:
            sub.current_period_end = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
        if canceled_at:
            sub.canceled_at = datetime.fromisoformat(canceled_at.replace("Z", "+00:00"))
        sub.updated_at = datetime.now(timezone.utc)
    else:
        sub = Subscription(
            user_id=user_id,
            polar_subscription_id=polar_sub_id,
            polar_customer_id=data.get("customer_id"),
            status=db_status,
            plan_type=plan_type,
            current_period_start=datetime.fromisoformat(period_start.replace("Z", "+00:00")) if period_start else None,
            current_period_end=datetime.fromisoformat(period_end.replace("Z", "+00:00")) if period_end else None,
            canceled_at=datetime.fromisoformat(canceled_at.replace("Z", "+00:00")) if canceled_at else None,
        )
        db.add(sub)


async def _handle_revoked(data: dict, db: AsyncSession) -> None:
    """취소 후 기간 종료 → 즉시 free로 전환"""
    polar_sub_id = data.get("id")
    if not polar_sub_id:
        return
    result = await db.execute(
        select(Subscription).where(Subscription.polar_subscription_id == polar_sub_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.status = "expired"
        sub.plan_type = "free"
        sub.updated_at = datetime.now(timezone.utc)


async def _handle_payment_failed(data: dict, db: AsyncSession) -> None:
    polar_sub_id = (data.get("subscription") or {}).get("id") or data.get("subscription_id")
    if not polar_sub_id:
        return
    result = await db.execute(
        select(Subscription).where(Subscription.polar_subscription_id == polar_sub_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.status = "past_due"
        sub.updated_at = datetime.now(timezone.utc)


@router.post("/polar")
async def polar_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    headers = dict(request.headers)

    try:
        wh = _get_webhook_client()
        wh.verify(payload, headers)
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        body = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = body.get("type", "")
    event_id = body.get("id") or headers.get("webhook-id", "")
    event_data = body.get("data", {})

    # 멱등성 보장: 이미 처리된 이벤트 무시
    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.polar_event_id == event_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_processed"}

    event_record = WebhookEvent(
        provider="polar",
        event_type=event_type,
        polar_event_id=event_id,
        payload=body,
        processed=False,
    )
    db.add(event_record)

    try:
        if event_type in ("subscription.created", "subscription.updated", "subscription.activated", "subscription.canceled"):
            await _upsert_subscription(event_data, db)
        elif event_type == "subscription.revoked":
            await _handle_revoked(event_data, db)
        elif event_type in ("order.paid", "payment.succeeded"):
            sub_data = event_data.get("subscription") or event_data
            if sub_data.get("id"):
                await _upsert_subscription(sub_data, db)
        elif event_type in ("payment.failed", "subscription.past_due"):
            await _handle_payment_failed(event_data, db)

        event_record.processed = True
        event_record.processed_at = datetime.now(timezone.utc)
    except Exception as e:
        event_record.error_message = str(e)

    await db.commit()
    return {"status": "ok"}
