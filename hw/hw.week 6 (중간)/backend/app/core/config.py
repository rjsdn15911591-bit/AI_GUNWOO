from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "FridgeAI"
    DEBUG: bool = True
    SECRET_KEY: str = "dev-secret"
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/fridgeai"
    JWT_PRIVATE_KEY_PATH: str = "./keys/private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_TIMEOUT_SECONDS: int = 30
    OPENAI_MAX_RETRIES: int = 2
    POLAR_API_KEY: str = ""
    POLAR_WEBHOOK_SECRET: str = ""
    POLAR_PRODUCT_ID: str = ""
    SPOONACULAR_API_KEY: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]
    FREE_PLAN_MONTHLY_LIMIT: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
