"""
Campus Recover — Common API Schemas
"""

from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Metadata for paginated collection responses."""
    page: int = Field(ge=1, description="Current page number")
    per_page: int = Field(ge=1, le=100, description="Items per page")
    total: int = Field(ge=0, description="Total number of matching records")
    total_pages: int = Field(ge=0, description="Total number of pages")


class ApiResponse(BaseModel, Generic[T]):
    """Standard success API response envelope."""
    success: bool = True
    data: T
    message: Optional[str] = None
    meta: Optional[PaginationMeta] = None


class ErrorDetail(BaseModel):
    """Detailed error object."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ApiErrorResponse(BaseModel):
    """Standard error API response envelope."""
    success: bool = False
    error: ErrorDetail
