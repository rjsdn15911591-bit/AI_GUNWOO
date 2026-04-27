import uuid
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
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
MAX_IMAGES = 3


@router.post("/upload")
async def upload_and_analyze(
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not images or len(images) == 0:
        raise HTTPException(400, {"error": "invalid_file", "detail": "No images provided"})
    if len(images) > MAX_IMAGES:
        raise HTTPException(400, {"error": "invalid_file", "detail": f"Maximum {MAX_IMAGES} images allowed"})

    # 파일 유효성 검사 및 읽기
    image_data: list[tuple[bytes, str]] = []
    for image in images:
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
        image_data.append((image_bytes, image.content_type))

    # 쿼터 확인 (분석 전)
    quota = await get_quota_status(str(current_user.id), db)
    if quota["analysis_remaining"] <= 0:
        raise HTTPException(
            402,
            {
                "error": "quota_exceeded",
                "usage_count": quota["analysis_usage"],
                "limit": quota["analysis_limit"],
                "reset_date": quota["reset_date"],
            },
        )

    # 모든 이미지 병렬 분석
    try:
        results = await asyncio.gather(
            *[analyze_image(b, ct) for b, ct in image_data],
            return_exceptions=True,
        )
    except Exception:
        raise HTTPException(500, {"error": "internal_error"})

    # 결과 병합 (에러난 이미지는 스킵, name 기준 중복 제거)
    merged: dict[str, dict] = {}
    for result in results:
        if isinstance(result, Exception):
            continue
        for item in result:
            name = item.get("name", "")
            if name and name not in merged:
                merged[name] = item

    detected = list(merged.values())

    if not detected:
        raise HTTPException(422, {"error": "parsing_failed"})

    # 쿼터 1회 차감 (분석 성공 후)
    await check_and_increment_quota(str(current_user.id), db, feature='analysis')
    await db.commit()

    updated_quota = await get_quota_status(str(current_user.id), db)
    return {
        "analysis_id": str(uuid.uuid4()),
        "detected_ingredients": detected,
        "usage_remaining": updated_quota["analysis_remaining"],
    }


@router.get("/history")
async def analysis_history(current_user: User = Depends(get_current_user)):
    return []
