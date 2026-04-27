import uuid
from pydantic import BaseModel, field_serializer


class GoogleLoginResponse(BaseModel):
    authorization_url: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    avatar_url: str | None

    model_config = {"from_attributes": True}

    @field_serializer('id')
    def serialize_id(self, v: uuid.UUID) -> str:
        return str(v)
