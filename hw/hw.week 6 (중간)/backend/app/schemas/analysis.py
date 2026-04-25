from pydantic import BaseModel


class DetectedIngredient(BaseModel):
    name: str
    quantity: float | None
    unit: str | None
    confidence: float


class AnalysisResponse(BaseModel):
    analysis_id: str
    detected_ingredients: list[DetectedIngredient]
    usage_remaining: int
