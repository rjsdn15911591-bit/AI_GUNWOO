from pydantic import BaseModel


class RecipeResponse(BaseModel):
    id: str
    title: str
    image: str | None
    ready_in_minutes: int | None
    matched_count: int
    missing_count: int
    missing_ingredients: list[str]
