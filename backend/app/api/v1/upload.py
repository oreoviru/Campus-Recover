"""
Campus Recover — File Upload API Routes
"""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends

from app.config import settings
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post(
    "/image",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Upload an item image",
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a single image for a lost or found item report.
    Validates file type and size, saves to the upload directory,
    and returns the relative URL path for storage on the Item record.
    """
    # Validate content type
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Accepted: {', '.join(settings.allowed_file_types_list)}",
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.max_file_size_mb}MB.",
        )

    # Generate unique filename: uuid_timestamp.ext
    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}_{int(datetime.utcnow().timestamp())}{ext}"

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)

    file_path = os.path.join(settings.upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Return URL path (served by StaticFiles mount in development)
    url = f"/uploads/{unique_name}"

    return ApiResponse(
        success=True,
        data={"url": url, "filename": unique_name, "size": len(content)},
        message="Image uploaded successfully.",
    )
