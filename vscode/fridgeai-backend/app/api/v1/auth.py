from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import httpx
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, hash_token
from app.core.dependencies import get_current_user
from app.models.user import User, RefreshToken
from app.models.fridge import Refrigerator
from app.schemas.auth import GoogleLoginResponse, UserResponse

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google/login", response_model=GoogleLoginResponse)
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    url = GOOGLE_AUTH_URL + "?" + urlencode(params)
    return {"authorization_url": url}


@router.get("/google/callback")
async def google_callback(
    code: str, response: Response, db: AsyncSession = Depends(get_db)
):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_resp.json()
        if "access_token" not in token_data:
            raise HTTPException(
                status_code=400,
                detail=f"Google token error: {token_data.get('error', 'unknown')} — {token_data.get('error_description', '')}",
            )
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        userinfo = userinfo_resp.json()

    result = await db.execute(select(User).where(User.google_id == userinfo["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=userinfo["email"],
            google_id=userinfo["sub"],
            display_name=userinfo.get("name"),
            avatar_url=userinfo.get("picture"),
        )
        db.add(user)
        await db.flush()
        db.add(Refrigerator(user_id=user.id))
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(str(user.id))
    raw_refresh, hashed_refresh = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hashed_refresh,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    await db.commit()

    is_secure = settings.APP_ENV == "production"
    redirect = RedirectResponse(url="http://localhost:5173/dashboard", status_code=302)
    redirect.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    redirect.set_cookie(
        "refresh_token",
        raw_refresh,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/auth/refresh",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return redirect


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash, RefreshToken.revoked == False
        )
    )
    record = result.scalar_one_or_none()
    if not record or record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access_token = create_access_token(str(record.user_id))
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"status": "ok"}


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .values(revoked=True)
    )
    await db.commit()
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
