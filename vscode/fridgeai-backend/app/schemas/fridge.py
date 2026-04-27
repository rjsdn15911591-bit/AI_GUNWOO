import uuid
from pydantic import BaseModel, field_serializer
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
    id: uuid.UUID
    name: str
    original_name: str | None
    quantity: Decimal | None
    unit: str | None
    expiry_date: date | None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("id")
    def serialize_id(self, v: uuid.UUID) -> str:
        return str(v)

    @field_serializer("quantity")
    def serialize_quantity(self, v: Decimal | None) -> float | None:
        return float(v) if v is not None else None


class BulkIngredientItem(BaseModel):
    name: str
    original_name: str | None = None
    quantity: Decimal | None = None
    unit: str | None = None


class FridgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    ingredients: list[IngredientResponse]

    model_config = {"from_attributes": True}

    @field_serializer("id")
    def serialize_id(self, v: uuid.UUID) -> str:
        return str(v)
