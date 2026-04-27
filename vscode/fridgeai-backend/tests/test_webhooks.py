import pytest
import json
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_webhook_invalid_signature(client: AsyncClient):
    payload = json.dumps({"type": "subscription.created"}).encode()
    resp = await client.post(
        "/webhooks/polar",
        content=payload,
        headers={
            "X-Polar-Signature": "invalidsig",
            "Content-Type": "application/json",
        },
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_billing_status_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/billing/status")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_billing_checkout_requires_auth(client: AsyncClient):
    resp = await client.post("/api/v1/billing/checkout")
    assert resp.status_code == 401
