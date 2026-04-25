from pydantic import BaseModel


class GoogleLoginResponse(BaseModel):
    authorization_url: str


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    avatar_url: str | None

    class Config:
        from_attributes = True
