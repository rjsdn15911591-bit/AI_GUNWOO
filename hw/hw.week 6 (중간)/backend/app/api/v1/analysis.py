import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_service import analyze_image
from app.services.quota_service import (
    check_and_increment_quota,
    get_quota_status,
    QuotaExceededException,
)

router = APIRouter()
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024


@router.post("/upload")
async def upload_and_analyze(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400,
            {"error": "invalid_file", "detail": f"Unsupported: {image.content_type}"},
        )
    image_bytes = await image.read()
    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(
            400, {"error": "invalid_file", "detail": "File too large (max 10MB)"}
        )

    quota = await get_quota_status(str(current_user.id), db)
    if quota["plan_type"] == "free" and quota["remaining"] <= 0:
        raise HTTPException(
            402,
            {
                "error": "quota_exceeded",
                "usage_count": quota["usage_count"],
                "limit": quota["limit_count"],
                "reset_date": quota["reset_date"],
            },
        )

    try:
        detected = await analyze_image(image_bytes, image.content_type)
    except TimeoutError:
        raise HTTPException(408, {"error": "analysis_timeout"})
    except Exception:
        raise HTTPException(500, {"error": "internal_error"})

    if not detected:
        raise HTTPException(422, {"error": "parsing_failed"})

    await check_and_increment_quota(str(current_user.id), db)
    await db.commit()

    updated_quota = await get_quota_status(str(current_user.id), db)
    return {
        "analysis_id": str(uuid.uuid4()),
        "detected_ingredients": detected,
        "usage_remaining": updated_quota["remaining"],
    }


@router.get("/history")
async def analysis_history(current_user: User = Depends(get_current_user)):
    return []
