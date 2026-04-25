from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime


class IngredientCreate(BaseModel):
    name: str
    quantity: Decimal | None = None
    unit: str | None = None
    expiry_date: date | None = None


class IngredientUpdate(BaseModel):
    name: str | None = None
    quantity: Decimal | None = None
    unit: str | None = None
    expiry_date: date | None = None


class IngredientResponse(BaseModel):
    id: str
    name: str
    original_name: str | None
    quantity: Decimal | None
    unit: str | None
    expiry_date: date | None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class BulkIngredientItem(BaseModel):
    name: str
    original_name: str | None = None
    quantity: Decimal | None = None
    unit: str | None = None


class FridgeResponse(BaseModel):
    id: str
    name: str
    ingredients: list[IngredientResponse]

    class Config:
        from_attributes = True
