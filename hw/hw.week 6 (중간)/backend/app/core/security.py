import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from jose import jwt
from app.core.config import settings


def _load_key(path: str) -> str:
    return Path(path).read_text()


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        _load_key(settings.JWT_PRIVATE_KEY_PATH),
        algorithm="RS256",
    )


def create_refresh_token() -> tuple[str, str]:
    raw = str(uuid.uuid4())
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def verify_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _load_key(settings.JWT_PUBLIC_KEY_PATH),
        algorithms=["RS256"],
    )


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
