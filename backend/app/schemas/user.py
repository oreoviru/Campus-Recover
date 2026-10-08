"""
Campus Recover — User Schemas
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.enums import UserRole


class UserSummary(BaseModel):
    """Public summary representation of a user (e.g. item reporter)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: UserRole
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    """Full user profile response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: UserRole
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
