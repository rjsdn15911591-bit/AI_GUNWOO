import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_google_login_returns_url(client: AsyncClient):
    resp = await client.get("/auth/google/login")
    assert resp.status_code == 200
    data = resp.json()
    assert "authorization_url" in data
    assert "accounts.google.com" in data["authorization_url"]


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401
