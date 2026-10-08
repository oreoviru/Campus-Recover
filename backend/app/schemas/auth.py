"""
Campus Recover — Auth Schemas
"""

import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from app.models.enums import UserRole
from app.schemas.user import UserResponse
from app.config import settings


class UserRegister(BaseModel):
    """Registration request payload."""
    name: str = Field(min_length=2, max_length=255, description="Full name")
    email: EmailStr = Field(description="Institutional email address")
    password: str = Field(min_length=6, max_length=128, description="Password (min 6 characters)")
    role: UserRole = Field(default=UserRole.STUDENT, description="Role: STUDENT or STAFF")
    student_id: Optional[str] = Field(None, max_length=50, description="Optional university student ID")

    @field_validator("email")
    @classmethod
    def validate_institutional_email(cls, v: str) -> str:
        """Validate that email belongs to an allowed institutional domain."""
        allowed_domains = settings.allowed_email_domains_list
        if allowed_domains and len(allowed_domains) > 0 and allowed_domains[0] != "":
            domain = v.split("@")[-1].lower()
            if domain not in [d.lower() for d in allowed_domains]:
                raise ValueError(
                    f"Email domain '@{domain}' is not permitted. "
                    f"Must be an authorized institutional domain ({', '.join(allowed_domains)})."
                )
        return v

    @field_validator("role")
    @classmethod
    def prevent_self_admin_registration(cls, v: UserRole) -> UserRole:
        """Prevent self-assigning ADMIN role during public registration."""
        if v == UserRole.ADMIN:
            raise ValueError("Admin role cannot be self-assigned during registration.")
        return v


class UserLogin(BaseModel):
    """Login request payload."""
    email: EmailStr
    password: str = Field(min_length=1)


class Token(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Parsed token payload data."""
    user_id: Optional[uuid.UUID] = None
    role: Optional[UserRole] = None
