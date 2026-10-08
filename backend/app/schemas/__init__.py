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
from app.schemas.auth import UserRegister, UserLogin, Token, TokenData
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
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    UnreadCountResponse,
    AdminBroadcastRequest,
    NotificationListResponse,
)

__all__ = [
    "PaginationMeta",
    "ApiResponse",
    "ErrorDetail",
    "ApiErrorResponse",
    "UserSummary",
    "UserResponse",
    "UserRegister",
    "UserLogin",
    "Token",
    "TokenData",
    "CampusLocationBase",
    "CampusLocationCreate",
    "CampusLocationUpdate",
    "CampusLocationResponse",
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemResponse",
    "ItemListResponse",
    "NotificationCreate",
    "NotificationResponse",
    "UnreadCountResponse",
    "AdminBroadcastRequest",
    "NotificationListResponse",
]
