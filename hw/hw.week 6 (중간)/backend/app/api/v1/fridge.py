import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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

router = APIRouter()


async def _get_fridge(user: User, db: AsyncSession) -> Refrigerator:
    result = await db.execute(
        select(Refrigerator).where(Refrigerator.user_id == user.id)
    )
    fridge = result.scalar_one_or_none()
    if not fridge:
        raise HTTPException(status_code=404, detail="Fridge not found")
    return fridge


@router.get("", response_model=FridgeResponse)
async def get_fridge(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    ing_result = await db.execute(
        select(Ingredient).where(Ingredient.refrigerator_id == fridge.id)
    )
    fridge.ingredients = list(ing_result.scalars().all())
    return fridge


@router.post("/ingredients", response_model=IngredientResponse, status_code=201)
async def add_ingredient(
    body: IngredientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    ingredient = Ingredient(
        refrigerator_id=fridge.id, source="manual", **body.model_dump()
    )
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.post("/ingredients/bulk", status_code=201)
async def bulk_add_ingredients(
    items: list[BulkIngredientItem],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fridge = await _get_fridge(current_user, db)
    db.add_all(
        [
            Ingredient(refrigerator_id=fridge.id, source="ai_analysis", **item.model_dump())
            for item in items
        ]
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
    for k, v in body.model_dump(exclude_none=True).items():
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
