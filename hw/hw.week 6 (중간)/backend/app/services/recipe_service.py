import httpx
from app.core.config import settings

SYNONYM_MAP = {
    "대파": "파",
    "쪽파": "파",
    "방울토마토": "토마토",
    "토마테": "토마토",
    "삼겹살": "돼지고기",
}

CURATED_RECIPES = [
    {
        "id": "local-1",
        "title": "김치찌개",
        "ready_in_minutes": 30,
        "ingredients": ["김치", "돼지고기", "두부", "파"],
        "steps": [
            "냄비에 기름을 두르고 돼지고기를 볶습니다.",
            "김치를 넣고 볶다가 물을 붓습니다.",
            "두부와 파를 넣고 10분 끓입니다.",
        ],
    },
    {
        "id": "local-2",
        "title": "된장찌개",
        "ready_in_minutes": 25,
        "ingredients": ["된장", "두부", "감자", "호박", "파"],
        "steps": [
            "물을 끓이고 된장을 풀어줍니다.",
            "감자와 호박을 넣고 끓입니다.",
            "두부와 파를 넣고 마무리합니다.",
        ],
    },
    {
        "id": "local-3",
        "title": "계란볶음밥",
        "ready_in_minutes": 15,
        "ingredients": ["계란", "밥", "파", "간장"],
        "steps": [
            "팬에 기름을 두릅니다.",
            "계란을 스크램블합니다.",
            "밥과 간장을 넣고 파와 함께 볶습니다.",
        ],
    },
    {
        "id": "local-4",
        "title": "감자볶음",
        "ready_in_minutes": 20,
        "ingredients": ["감자", "양파", "간장", "참기름"],
        "steps": [
            "감자와 양파를 채 썰어 볶습니다.",
            "간장과 참기름으로 간합니다.",
        ],
    },
    {
        "id": "local-5",
        "title": "제육볶음",
        "ready_in_minutes": 25,
        "ingredients": ["돼지고기", "양파", "대파", "고추장", "간장", "마늘"],
        "steps": [
            "돼지고기를 먹기 좋은 크기로 썹니다.",
            "고추장, 간장, 마늘을 섞어 양념을 만듭니다.",
            "팬에 기름을 두르고 돼지고기를 볶다가 양파와 대파를 넣습니다.",
            "양념을 넣고 골고루 볶아 마무리합니다.",
        ],
    },
    {
        "id": "local-6",
        "title": "시금치나물",
        "ready_in_minutes": 15,
        "ingredients": ["시금치", "마늘", "참기름", "간장"],
        "steps": [
            "시금치를 끓는 물에 데칩니다.",
            "찬물에 헹구고 물기를 꼭 짭니다.",
            "마늘, 참기름, 간장으로 무쳐 마무리합니다.",
        ],
    },
    {
        "id": "local-7",
        "title": "미역국",
        "ready_in_minutes": 20,
        "ingredients": ["미역", "쇠고기", "참기름", "간장"],
        "steps": [
            "미역을 물에 불려 먹기 좋은 크기로 자릅니다.",
            "쇠고기를 참기름에 볶다가 미역을 넣고 함께 볶습니다.",
            "물을 붓고 간장으로 간하여 끓입니다.",
        ],
    },
    {
        "id": "local-8",
        "title": "파전",
        "ready_in_minutes": 20,
        "ingredients": ["파", "밀가루", "계란", "간장"],
        "steps": [
            "파를 5cm 길이로 썹니다.",
            "밀가루와 계란, 물을 섞어 반죽을 만듭니다.",
            "팬에 기름을 두르고 반죽을 펴 파를 얹어 노릇하게 굽습니다.",
        ],
    },
]


def normalize(name: str) -> str:
    return SYNONYM_MAP.get(name.strip(), name.strip())


def calculate_match_ratio(recipe_ingredients: list[str], user_ingredients: list[str]) -> float:
    if not recipe_ingredients:
        return 0.0
    user_set = {normalize(i) for i in user_ingredients}
    matched = sum(1 for i in recipe_ingredients if normalize(i) in user_set)
    return matched / len(recipe_ingredients)


async def get_recipe_recommendations(user_ingredients: list[str], limit: int = 20) -> list[dict]:
    if settings.SPOONACULAR_API_KEY:
        try:
            return await _spoonacular_recipes(user_ingredients, limit)
        except Exception:
            pass
    return _curated_recipes(user_ingredients)


async def _spoonacular_recipes(user_ingredients: list[str], limit: int) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.spoonacular.com/recipes/findByIngredients",
            params={
                "ingredients": ",".join(user_ingredients[:10]),
                "number": limit,
                "ranking": 1,
                "ignorePantry": True,
                "apiKey": settings.SPOONACULAR_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for r in data:
        matched = len(r.get("usedIngredients", []))
        missing_list = [i["name"] for i in r.get("missedIngredients", [])]
        total = matched + len(missing_list)
        ratio = matched / total if total > 0 else 0
        if ratio >= 0.4:
            results.append(
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "image": r.get("image"),
                    "ready_in_minutes": None,
                    "matched_count": matched,
                    "missing_count": len(missing_list),
                    "missing_ingredients": missing_list,
                }
            )
    return sorted(results, key=lambda x: x["matched_count"], reverse=True)


def _curated_recipes(user_ingredients: list[str]) -> list[dict]:
    results = []
    for recipe in CURATED_RECIPES:
        ratio = calculate_match_ratio(recipe["ingredients"], user_ingredients)
        if ratio >= 0.4:
            matched = int(ratio * len(recipe["ingredients"]))
            user_set = {normalize(u) for u in user_ingredients}
            missing = [
                i for i in recipe["ingredients"] if normalize(i) not in user_set
            ]
            results.append(
                {
                    "id": recipe["id"],
                    "title": recipe["title"],
                    "image": None,
                    "ready_in_minutes": recipe["ready_in_minutes"],
                    "matched_count": matched,
                    "missing_count": len(missing),
                    "missing_ingredients": missing,
                }
            )
    return sorted(results, key=lambda x: x["matched_count"], reverse=True)
