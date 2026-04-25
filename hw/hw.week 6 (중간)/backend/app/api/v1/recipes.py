from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.fridge import Refrigerator, Ingredient
from app.services.recipe_service import get_recipe_recommendations, CURATED_RECIPES

router = APIRouter()


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
    return {"id": recipe_id, "detail": "Spoonacular API에서 조회"}
