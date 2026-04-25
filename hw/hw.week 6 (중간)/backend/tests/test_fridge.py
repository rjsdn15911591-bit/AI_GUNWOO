import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_fridge_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/fridge")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_add_ingredient_unauthenticated(client: AsyncClient):
    resp = await client.post("/api/v1/fridge/ingredients", json={"name": "당근"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_ingredient_unauthenticated(client: AsyncClient):
    resp = await client.delete("/api/v1/fridge/ingredients/some-id")
    assert resp.status_code == 401
