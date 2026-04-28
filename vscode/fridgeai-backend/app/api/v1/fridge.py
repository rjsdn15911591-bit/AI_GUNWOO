import uuid
import json
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.fridge import Refrigerator, Ingredient
from app.schemas.fridge import (
    IngredientCreate,
    IngredientUpdate,
    IngredientResponse,
    BulkIngredientItem,
    FridgeResponse,
)
from app.services.ingredient_normalizer import normalize_name
from app.services.ai_service import get_openai_client
from app.core.config import settings

router = APIRouter()


async def _get_fridge(user: User, db: AsyncSession) -> Refrigerator:
    result = await db.execute(
        select(Refrigerator).where(Refrigerator.user_id == user.id)
    )
    fridge = result.scalar_one_or_none()
    if not fridge:
        raise HTTPException(status_code=404, detail="Fridge not found")
    return fridge


async def _merge_or_add(
    fridge_id: uuid.UUID,
    name: str,
    quantity: float | None,
    unit: str | None,
    source: str,
    db: AsyncSession,
    expiry_date=None,
) -> Ingredient:
    """동의어 정규화 후 같은 이름 + 같은 유효기한이면 수량 합산, 다르면 새로 추가"""
    normalized = normalize_name(name)

    existing = await db.execute(
        select(Ingredient).where(
            Ingredient.refrigerator_id == fridge_id,
            Ingredient.name == normalized,
            Ingredient.expiry_date == expiry_date,  # 유효기한 다르면 별개 재료
        )
    )
    ing = existing.scalar_one_or_none()

    if ing:
        if quantity is not None and ing.quantity is not None:
            ing.quantity = ing.quantity + Decimal(str(quantity))
        elif quantity is not None:
            ing.quantity = Decimal(str(quantity))
        return ing
    else:
        new_ing = Ingredient(
            refrigerator_id=fridge_id,
            name=normalized,
            original_name=name if name != normalized else None,
            quantity=Decimal(str(quantity)) if quantity is not None else None,
            unit=unit,
            source=source,
            expiry_date=expiry_date,
        )
        db.add(new_ing)
        return new_ing


@router.get("", response_model=FridgeResponse)
async def get_fridge(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Refrigerator)
        .where(Refrigerator.user_id == current_user.id)
        .options(selectinload(Refrigerator.ingredients))
    )
    fridge = result.scalar_one_or_none()
    if not fridge:
        raise HTTPException(status_code=404, detail="Fridge not found")
    return fridge


@router.post("/ingredients", response_model=IngredientResponse, status_code=201)
async def add_ingredient(
    body: IngredientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    ingredient = await _merge_or_add(
        fridge.id, body.name, body.quantity, body.unit, "manual", db, expiry_date=body.expiry_date
    )
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.post("/ingredients/bulk", status_code=201)
async def bulk_add_ingredients(
    items: list[BulkIngredientItem] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    for item in items:
        await _merge_or_add(
            fridge.id, item.name, item.quantity, item.unit, "ai_analysis", db
        )
    await db.commit()
    return {"added": len(items)}


@router.patch("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: str,
    body: IngredientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == uuid.UUID(ingredient_id),
            Ingredient.refrigerator_id == fridge.id,
        )
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ingredient, k, v)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.delete("/ingredients/{ingredient_id}", status_code=204)
async def delete_ingredient(
    ingredient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == uuid.UUID(ingredient_id),
            Ingredient.refrigerator_id == fridge.id,
        )
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    await db.delete(ingredient)
    await db.commit()


VALID_CATEGORIES = {
    'vegetable', 'fruit', 'meat_fish', 'dairy',
    'cooked', 'egg_convenience', 'ready_made', 'sauce', 'beverage', 'grain', 'other'
}
VALID_STORAGE = {'실온', '냉장', '냉동'}

CLASSIFY_SYSTEM = """당신은 한국 식재료 분류 전문가입니다.
주어진 식재료 이름 목록을 카테고리와 보관 방법으로 분류하세요.

【카테고리 목록】
- vegetable: 채소류 (야채, 나물, 버섯 등)
- fruit: 과일류
- meat_fish: 육류·생선·해산물 (생닭/닭고기 포함, 완제품 치킨 제외)
- dairy: 유제품 (우유, 치즈, 버터, 요거트 등)
- cooked: 조리식품·반찬 (김치, 두부, 어묵, 나물무침 등)
- egg_convenience: 달걀·간편식 (계란, 라면, 즉석밥 등)
- ready_made: 완제품 (바로 먹거나 간단히 데워 먹는 완성 식품)
- sauce: 소스·양념·장류·조미료
- beverage: 음료·주류·물
- grain: 곡물·건식품·견과류·면류·빵류·통조림
- other: 위 어디에도 해당하지 않는 경우

【보관 방법】
- 냉동: 얼려서 보관
- 냉장: 냉장 보관
- 실온: 상온 보관

【분류 참고 규칙 — 아래 예시를 기준으로 판단하세요】

vegetable (냉장):
  시금치, 상추, 깻잎, 쑥갓, 콩나물, 숙주, 부추, 쪽파, 대파, 미나리 → 냉장, 단기
  배추, 양배추, 당근, 무, 오이, 호박, 애호박, 단호박, 가지, 고추, 청양고추, 피망, 파프리카,
  토마토, 방울토마토, 브로콜리, 버섯류, 셀러리 → 냉장
  양파, 마늘, 생강, 감자, 고구마, 도라지, 연근 → 실온

fruit (냉장):
  딸기, 체리, 블루베리, 복숭아, 자두, 수박, 멜론, 아보카도, 바나나 → 냉장, 단기
  사과, 배, 귤, 오렌지, 레몬, 포도, 파인애플, 키위, 망고 → 냉장

meat_fish (냉장, 단기, 부패주의):
  쇠고기, 돼지고기, 닭고기, 생닭, 삼겹살, 목살, 닭가슴살 등 생육 → 냉장
  고등어, 꽁치, 갈치, 광어, 연어, 참치(생), 오징어, 새우, 바지락 등 생선·해산물 → 냉장
  베이컨, 소시지, 햄 → 냉장

dairy (냉장, 단기):
  우유, 두유, 요거트, 요구르트, 치즈, 버터, 생크림, 크림치즈 → 냉장

cooked (냉장, 단기):
  김치, 깍두기, 장아찌, 두부, 순두부, 연두부, 어묵, 묵, 나물무침, 반찬류 → 냉장

egg_convenience:
  계란, 달걀, 메추리알 → 냉장, 단기
  라면, 컵라면, 즉석밥 → 실온

ready_made — 보관 방법은 종류에 따라 다름:
  냉동: 피자, 만두, 치킨(완제품), 돈까스, 탕수육, 떡볶이, 순대, 핫도그, 어묵바, 볶음밥
  냉장: 케이크, 샌드위치, 도시락, 김밥, 초밥, 파스타(완제품), 햄버거, 타코, 부리토
  실온: 붕어빵, 도넛, 와플

  ※ 치킨(완제품, 조리된 것)은 ready_made / 닭고기(생육)는 meat_fish 로 구분

sauce (실온):
  간장, 된장, 고추장, 쌈장, 고춧가루, 소금, 설탕, 식초, 참기름, 들기름, 식용유,
  케첩, 마요네즈, 굴소스, 미림, 맛술, 청주, 밀가루, 전분, 향신료, 후추 → 실온
  마요네즈, 머스터드, 잼 → 냉장

beverage:
  주스, 콜라, 사이다, 맥주, 와인, 소주, 막걸리, 커피, 녹차, 음료, 탄산수, 이온음료,
  칵테일, 하이볼, 위스키, 보드카 → 냉장
  생수, 물 → 실온

grain (실온):
  쌀, 잡곡, 보리, 현미, 귀리, 오트밀, 파스타(건면), 스파게티(건면), 국수, 당면,
  건미역, 다시마, 견과류, 호두, 아몬드, 빵, 식빵, 베이글, 크래커, 시리얼,
  참치캔, 통조림류, 콩류, 렌틸, 초콜릿 → 실온

JSON 형식으로만 응답하세요:
{"재료명": {"category": "카테고리", "storage": "냉장|냉동|실온"}}
"""


@router.post("/ingredients/classify")
async def classify_ingredients(
    names: list[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
):
    """재료 이름 목록을 AI로 카테고리 + 보관방법 분류 (최대 30개)"""
    if not names:
        return {}
    names = names[:30]

    client = get_openai_client()
    prompt = "다음 식재료들을 분류하세요:\n" + "\n".join(f"- {n}" for n in names)

    try:
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": CLASSIFY_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            response_format={"type": "json_object"},
            max_tokens=800,
        )
        raw = resp.choices[0].message.content or "{}"
        result: dict = json.loads(raw)
        # 유효한 값만 반환, 구형 포맷(문자열)도 허용
        validated = {}
        for k, v in result.items():
            if isinstance(v, dict):
                cat = v.get("category")
                storage = v.get("storage")
                if cat in VALID_CATEGORIES:
                    validated[k] = {
                        "category": cat,
                        "storage": storage if storage in VALID_STORAGE else None,
                    }
            elif isinstance(v, str) and v in VALID_CATEGORIES:
                validated[k] = {"category": v, "storage": None}
        return validated
    except Exception:
        return {}
