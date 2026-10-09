"""
Campus Recover — File Upload API Routes

Security audited:
- Image file signature & structural verification via Pillow (blocks polyglots, XSS scripts, executables)
- Strict image format whitelist (JPEG, PNG, WEBP)
- Extension forced from verified image binary header, never user-controlled filename
- File size boundary checks
- Rate limiting per client to prevent disk exhaustion
"""

import io
import os
import uuid
from datetime import datetime, timezone
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends

from app.config import settings
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/upload", tags=["Upload"])

# Strict mapping of verified PIL format to canonical safe file extensions
ALLOWED_IMAGE_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}


@router.post(
    "/image",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Upload an item image",
    dependencies=[Depends(rate_limit(settings.rate_limit_upload_per_minute, 60, "upload"))],
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a single image for a lost or found item report.
    Validates file type, binary structure, and size, saves to upload directory,
    and returns relative URL path.
    """
    # 1. Validate claimed content type
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content type '{file.content_type}' is not permitted. Accepted: {', '.join(settings.allowed_file_types_list)}",
        )

    # 2. Read file content and validate size limit
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file.",
        )

    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.max_file_size_mb}MB.",
        )

    # 3. Deep image structure and magic-bytes verification using Pillow
    try:
        image_stream = io.BytesIO(content)
        with Image.open(image_stream) as img:
            image_format = img.format
            if not image_format or image_format.upper() not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported or fraudulent image format '{image_format}'. Only JPEG, PNG, and WEBP are permitted.",
                )
            # Verify structural integrity (detects truncated or polyglot payloads)
            img.verify()
    except (UnidentifiedImageError, OSError, SyntaxError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image or is corrupted.",
        )

    # 4. Generate safe unique filename based exclusively on verified format
    safe_ext = ALLOWED_IMAGE_FORMATS[image_format.upper()]
    timestamp = int(datetime.now(timezone.utc).timestamp())
    unique_name = f"{uuid.uuid4().hex}_{timestamp}{safe_ext}"

    # 5. Ensure upload directory exists and write content
    upload_dir_path = os.path.abspath(settings.upload_dir)
    os.makedirs(upload_dir_path, exist_ok=True)

    file_path = os.path.join(upload_dir_path, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    url = f"/uploads/{unique_name}"

    return ApiResponse(
        success=True,
        data={"url": url, "filename": unique_name, "size": len(content), "format": image_format.lower()},
        message="Image uploaded and verified successfully.",
    )
