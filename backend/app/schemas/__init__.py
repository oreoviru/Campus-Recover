"""
Campus Recover — Schemas Barrel Export
"""

from app.schemas.common import (
    PaginationMeta,
    ApiResponse,
    ErrorDetail,
    ApiErrorResponse,
)
from app.schemas.user import UserSummary, UserResponse
from app.schemas.location import (
    CampusLocationBase,
    CampusLocationCreate,
    CampusLocationUpdate,
    CampusLocationResponse,
)
from app.schemas.item import (
    ItemBase,
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemListResponse,
)

__all__ = [
    "PaginationMeta",
    "ApiResponse",
    "ErrorDetail",
    "ApiErrorResponse",
    "UserSummary",
    "UserResponse",
    "CampusLocationBase",
    "CampusLocationCreate",
    "CampusLocationUpdate",
    "CampusLocationResponse",
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemResponse",
    "ItemListResponse",
]
