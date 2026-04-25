import json
import base64
from openai import AsyncOpenAI
from app.core.config import settings

_client = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_retries=settings.OPENAI_MAX_RETRIES,
        )
    return _client


SYSTEM_PROMPT = """당신은 식재료 인식 전문가입니다.
이미지에서 보이는 모든 식재료를 JSON 배열로만 반환하세요.
각 항목 형식: {"name": "재료명(한국어)", "quantity": 숫자, "unit": "단위", "confidence": 0~1}
재료가 없으면 빈 배열 [] 반환.
JSON 외 다른 텍스트 출력 절대 금지."""


def parse_ai_response(content: str) -> list[dict]:
    try:
        data = json.loads(content)
        if isinstance(data, dict):
            data = data.get("items", data.get("ingredients", []))
        if not isinstance(data, list):
            return []
        return [
            item
            for item in data
            if isinstance(item, dict) and item.get("confidence", 0) >= 0.3
        ]
    except (json.JSONDecodeError, TypeError):
        return []


async def analyze_image(image_bytes: bytes, content_type: str = "image/jpeg") -> list[dict]:
    b64 = base64.b64encode(image_bytes).decode()
    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        max_tokens=1000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type};base64,{b64}"},
                    },
                    {"type": "text", "text": "이 이미지의 식재료를 분석해주세요."},
                ],
            }
        ],
        response_format={"type": "json_object"},
    )
    return parse_ai_response(response.choices[0].message.content)
