import json
import time
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.fridge import Refrigerator, Ingredient
from app.services.recipe_service import get_recipe_recommendations, CURATED_RECIPES
from app.services.ai_service import get_openai_client
from app.services.quota_service import (
    check_and_increment_quota,
    get_quota_status,
    QuotaExceededException,
)

router = APIRouter()


# ── 요청 스키마 ─────────────────────────────────────────────────────────
class AICandidateRequest(BaseModel):
    food_types: list[str] = []   # 밥류, 면류, 빵류, 기타 (복수 선택)
    custom_type: str | None = None  # 기타 직접 입력
    tastes: list[str] = []       # 매운음식, 단음식, 짠음식 (복수 선택)


class AIGenerateRequest(BaseModel):
    food_types: list[str] = []
    custom_type: str | None = None
    tastes: list[str] = []
    selected_dish: str = ""      # 사용자가 선택한 후보 요리명


# ── 시스템 프롬프트 ──────────────────────────────────────────────────────
CANDIDATES_SYSTEM_PROMPT = """당신은 냉장고 재료를 보고 만들 수 있는 요리를 추천하는 요리 전문가입니다.
주어진 재료와 조건으로 만들 수 있는 후보 요리 3개를 반드시 아래 JSON 형식으로만 반환하세요.

형식:
{
  "candidates": [
    {"name": "요리명", "description": "사용 핵심 재료와 맛 특징을 포함한 한 줄 설명"},
    {"name": "요리명", "description": "한 줄 설명"},
    {"name": "요리명", "description": "한 줄 설명"}
  ]
}

규칙:
- 반드시 3개만 반환
- 냉장고 재료를 최대한 활용할 수 있는 요리 우선 추천
- 사용자가 지정한 음식 종류(밥류/면류/빵류 등)에 부합하는 요리
- 사용자가 지정한 맛(매운/단/짠) 특성을 충족하는 요리
- 음식 종류나 맛을 지정하지 않은 경우 냉장고 재료에 가장 적합한 요리 자유 추천
- JSON 외 텍스트 출력 금지"""

RECIPE_SYSTEM_PROMPT = """당신은 요리 전문가입니다. 사용자가 선택한 요리의 레시피 1개를 반드시 아래 JSON 형식으로만 반환하세요.

형식:
{
  "title": "요리명",
  "ready_in_minutes": 숫자,
  "serving": "1인분 기준",
  "ingredients_detail": [
    "재료명 정확한수량 단위 (예: 돼지고기 앞다리살 150g, 간장 1T·15ml, 계란 1개)",
    ...
  ],
  "steps": [
    "🔪 [손질] 조리도구·온도·시간을 포함한 구체적 설명. 👉 이렇게 하는 이유",
    "🔥 [볶기/굽기] ...",
    ...
  ],
  "tips": "💡 핵심 포인트\\n• 팁1\\n• 팁2",
  "nutrition": {
    "calories": 숫자,
    "protein": 숫자,
    "carbs": 숫자,
    "fat": 숫자
  }
}

필수 규칙:
- 반드시 1인분 기준으로 작성
- 재료별 정확한 중량(g/ml) 또는 계량 단위(1T=15ml / 1t=5ml / 1C=200ml) 표기
- 조리 온도(강불/중불/약불 또는 °C), 조리도구(팬/냄비/뚝배기 등), 조리 시간(분/초) 명시
- 단계마다 이모지 라벨 사용 (🔪손질 / 🔥볶기·굽기 / 💧끓이기 / 🥣양념·무치기 / ❄️냉각 / ✨마무리)
- 중요 주의사항은 ⚠️, 이유 설명은 👉 로 표기
- 냉장고 재료 중 수량·단위가 있는 경우 이를 반드시 참고해 레시피 분량 조정
- nutrition은 1인분 기준 추정값 (calories=kcal, protein/carbs/fat=g), 정수로 반환
- JSON 외 텍스트 출력 금지"""


def _build_ingredient_string(all_ingredients) -> str:
    """냉장고 재료 목록을 수량·단위 포함한 문자열로 변환"""
    lines = []
    for i in all_ingredients:
        line = i.name
        if i.quantity is not None:
            qty_str = str(int(i.quantity) if i.quantity == int(i.quantity) else float(i.quantity))
            line += f" {qty_str}"
            if i.unit:
                line += i.unit
        elif i.unit:
            line += f" ({i.unit})"
        lines.append(line)
    return "\n".join(f"- {l}" for l in lines)


def _build_preference_string(food_types: list[str], custom_type: str | None, tastes: list[str]) -> str:
    parts = []
    if food_types:
        type_str = ", ".join(food_types)
        if "기타" in food_types and custom_type:
            type_str = type_str.replace("기타", f"기타({custom_type})")
        parts.append(f"음식 종류: {type_str}")
    if tastes:
        parts.append(f"맛 선호: {', '.join(tastes)}")
    return "\n".join(parts) if parts else "선호 조건 없음 (자유 추천)"


async def _get_fridge_ingredients(user: User, db: AsyncSession):
    result = await db.execute(
        select(Refrigerator).where(Refrigerator.user_id == user.id)
    )
    fridge = result.scalar_one_or_none()
    if not fridge:
        raise HTTPException(status_code=400, detail="냉장고에 재료가 없습니다. 먼저 재료를 추가해주세요.")

    ing_result = await db.execute(
        select(Ingredient).where(Ingredient.refrigerator_id == fridge.id)
    )
    ingredients = ing_result.scalars().all()
    if not ingredients:
        raise HTTPException(status_code=400, detail="냉장고에 재료가 없습니다. 먼저 재료를 추가해주세요.")
    return ingredients


# ── 라우터 ──────────────────────────────────────────────────────────────
@router.get("/recommend")
async def recommend_recipes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Refrigerator).where(Refrigerator.user_id == current_user.id)
    )
    fridge = result.scalar_one_or_none()
    if not fridge:
        return []
    ing_result = await db.execute(
        select(Ingredient).where(Ingredient.refrigerator_id == fridge.id)
    )
    ingredients = [i.name for i in ing_result.scalars().all()]
    return await get_recipe_recommendations(ingredients)


@router.get("/bookmarks")
async def get_bookmarks(current_user: User = Depends(get_current_user)):
    return []


@router.post("/ai-candidates")
async def ai_get_candidates(
    body: AICandidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """냉장고 재료 + 선호 조건으로 후보 요리 3개 추천 (쿼터 미차감 — ai-generate 시 차감)"""
    # 쿼터 잔여 확인만 (차감 안 함)
    quota = await get_quota_status(str(current_user.id), db)
    if quota["recipe_remaining"] <= 0:
        raise HTTPException(
            status_code=402,
            detail=f"AI 레시피 생성 한도({quota['recipe_limit']}회)를 초과했습니다. "
                   f"다음 달 {quota['reset_date'][:10]}에 초기화됩니다.",
        )

    all_ingredients = await _get_fridge_ingredients(current_user, db)
    ingredients_str = _build_ingredient_string(all_ingredients)
    preference_str = _build_preference_string(body.food_types, body.custom_type, body.tastes)

    user_prompt = (
        f"냉장고 재료 목록 (수량·단위 포함):\n{ingredients_str}\n\n"
        f"사용자 선호 조건:\n{preference_str}\n\n"
        "위 재료와 조건으로 만들 수 있는 후보 요리 3개를 추천해주세요. "
        "냉장고 재료를 최대한 활용하는 요리를 우선하세요."
    )

    client = get_openai_client()
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": CANDIDATES_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        data = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"후보 요리 추천에 실패했습니다: {str(e)}")

    return {
        "candidates": data.get("candidates", []),
        "recipe_remaining": quota["recipe_remaining"],
        "recipe_limit": quota["recipe_limit"],
    }


@router.post("/ai-generate")
async def ai_generate_recipe(
    body: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """선택한 요리의 전체 레시피 생성"""
    quota = await get_quota_status(str(current_user.id), db)
    if quota["recipe_remaining"] <= 0:
        raise HTTPException(
            status_code=402,
            detail=f"AI 레시피 생성 한도({quota['recipe_limit']}회)를 초과했습니다. "
                   f"다음 달 {quota['reset_date'][:10]}에 초기화됩니다.",
        )

    all_ingredients = await _get_fridge_ingredients(current_user, db)
    ingredients_str = _build_ingredient_string(all_ingredients)
    preference_str = _build_preference_string(body.food_types, body.custom_type, body.tastes)

    dish_clause = f"요리: {body.selected_dish}\n\n" if body.selected_dish else ""
    user_prompt = (
        f"{dish_clause}"
        f"냉장고 재료 목록 (수량·단위 포함):\n{ingredients_str}\n\n"
        f"사용자 선호 조건:\n{preference_str}\n\n"
        "위 재료로 선택한 요리의 레시피를 1인분 기준으로 만들어주세요. "
        "수량이 적힌 재료는 그 양을 반드시 고려해 분량을 조정하세요."
    )

    client = get_openai_client()
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": RECIPE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2500,
        )
        recipe_data = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 레시피 생성에 실패했습니다: {str(e)}")

    await check_and_increment_quota(str(current_user.id), db, feature='recipe')
    await db.commit()

    steps = recipe_data.get("steps", [])
    return {
        "id": f"ai-{int(time.time() * 1000)}",
        "title": recipe_data.get("title", body.selected_dish or "AI 생성 레시피"),
        "image": None,
        "ready_in_minutes": recipe_data.get("ready_in_minutes"),
        "serving": recipe_data.get("serving", "1인분 기준"),
        "ingredients_detail": recipe_data.get("ingredients_detail", []),
        "steps": steps,
        "tips": recipe_data.get("tips"),
        "instructions": [{"step": i + 1, "description": s} for i, s in enumerate(steps)],
        "nutrition": recipe_data.get("nutrition"),
    }


@router.post("/{recipe_id}/bookmark")
async def bookmark_recipe(recipe_id: str, current_user: User = Depends(get_current_user)):
    return {"status": "bookmarked", "recipe_id": recipe_id}


@router.get("/{recipe_id}")
async def get_recipe_detail(
    recipe_id: str, current_user: User = Depends(get_current_user)
):
    for r in CURATED_RECIPES:
        if str(r["id"]) == recipe_id:
            return {
                **r,
                "instructions": [
                    {"step": i + 1, "description": s}
                    for i, s in enumerate(r["steps"])
                ],
            }
    return {"id": recipe_id, "detail": "레시피를 찾을 수 없습니다."}
