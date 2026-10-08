"""
Campus Recover — Notification Pydantic Schemas (Phase 9)
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import NotificationType


class NotificationCreate(BaseModel):
    """Schema for internal notification dispatch."""
    user_id: uuid.UUID
    type: NotificationType
    title: str = Field(..., max_length=255)
    message: str
    related_item_id: Optional[uuid.UUID] = None
    related_match_id: Optional[uuid.UUID] = None


class NotificationResponse(BaseModel):
    """Full notification payload returned to the frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    related_item_id: Optional[uuid.UUID] = None
    related_match_id: Optional[uuid.UUID] = None
    read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    """Simple summary of unread alerts for quick badge polling / sync."""
    unread_count: int


class AdminBroadcastRequest(BaseModel):
    """Schema for staff/admin broadcast messages."""
    title: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=5, max_length=2000)
    target_user_id: Optional[uuid.UUID] = Field(
        None,
        description="Target user ID if sending direct announcement. If null, broadcasts campus-wide.",
    )


class NotificationListResponse(BaseModel):
    """Paginated list of notifications with unread count."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int
