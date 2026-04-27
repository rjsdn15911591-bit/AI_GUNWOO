import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analysis_requires_auth(client: AsyncClient):
    resp = await client.post("/api/v1/analysis/upload")
    assert resp.status_code == 401


def test_parse_ai_response_valid():
    from app.services.ai_service import parse_ai_response

    raw = '[{"name": "당근", "quantity": 2, "unit": "개", "confidence": 0.95}]'
    result = parse_ai_response(raw)
    assert len(result) == 1
    assert result[0]["name"] == "당근"


def test_parse_ai_response_filters_low_confidence():
    from app.services.ai_service import parse_ai_response

    raw = '[{"name": "뭔가", "quantity": 1, "unit": "개", "confidence": 0.2}]'
    result = parse_ai_response(raw)
    assert len(result) == 0


def test_parse_ai_response_bad_json():
    from app.services.ai_service import parse_ai_response

    result = parse_ai_response("not json")
    assert result == []


def test_parse_ai_response_dict_wrapper():
    from app.services.ai_service import parse_ai_response

    raw = '{"ingredients": [{"name": "양파", "quantity": 1, "unit": "개", "confidence": 0.8}]}'
    result = parse_ai_response(raw)
    assert len(result) == 1
    assert result[0]["name"] == "양파"
