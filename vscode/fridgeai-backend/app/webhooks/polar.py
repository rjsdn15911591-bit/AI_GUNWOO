import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.subscription import Subscription, WebhookEvent
from fastapi import Depends

router = APIRouter()


def verify_polar_signature(payload: bytes, webhook_id: str, webhook_timestamp: str, signature_header: str) -> bool:
    """StandardWebhooks 스펙 서명 검증"""
    if not settings.POLAR_WEBHOOK_SECRET:
        return False
    # 서명 대상: "{msg_id}.{timestamp}.{body}"
    to_sign = f"{webhook_id}.{webhook_timestamp}.{payload.decode('utf-8')}"
    expected = base64.b64encode(
        hmac.new(settings.POLAR_WEBHOOK_SECRET.encode(), to_sign.encode(), hashlib.sha256).digest()
    ).decode()
    expected_header = f"v1,{expected}"
    # 여러 서명이 공백으로 구분될 수 있음
    for sig in signature_header.split(" "):
        if hmac.compare_digest(sig, expected_header):
            return True
    return False


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
    plan_type = "free" if db_status in ("expired", "canceled") else "premium"

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
    webhook_id = request.headers.get("webhook-id", "")
    webhook_timestamp = request.headers.get("webhook-timestamp", "")
    signature_header = request.headers.get("webhook-signature", "")

    if not verify_polar_signature(payload, webhook_id, webhook_timestamp, signature_header):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        body = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = body.get("type", "")
    event_id = body.get("id") or webhook_id
    event_data = body.get("data", {})

    # 멱등성 보장: 이미 처리된 이벤트 무시
    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.polar_event_id == event_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_processed"}

    # 이벤트 저장
    event_record = WebhookEvent(
        provider="polar",
        event_type=event_type,
        polar_event_id=event_id,
        payload=body,
        processed=False,
    )
    db.add(event_record)

    try:
        if event_type in ("subscription.created", "subscription.updated", "subscription.activated"):
            await _upsert_subscription(event_data, db)
        elif event_type == "subscription.canceled":
            # canceled: 기간 종료까지 premium 유지, status만 canceled로
            await _upsert_subscription(event_data, db)
        elif event_type == "subscription.revoked":
            await _handle_revoked(event_data, db)
        elif event_type in ("order.paid", "payment.succeeded"):
            # 결제 성공 시 subscription 상태 active 보장
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
    # Polar.sh에는 항상 200 반환 (재전송 방지)
    return {"status": "ok"}
