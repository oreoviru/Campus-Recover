"""
Campus Recover — Notification API Router (Phase 9)

Provides endpoints for:
- Listing notifications with pagination and unread filtering
- Unread badge counter for quick navbar polling
- Mark single notification as read
- Mark all notifications as read
- Deleting notifications
- Campus-wide admin broadcasts
- Real-time WebSocket subscriptions
"""

import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.models.enums import NotificationType
from app.schemas.common import ApiResponse
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    AdminBroadcastRequest,
)
from app.services.notification_service import notification_service
from app.websocket.connection_manager import ws_manager
from app.auth.jwt_handler import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ApiResponse[NotificationListResponse])
def get_notifications(
    unread_only: bool = Query(False, description="Filter for unread alerts only"),
    type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated notifications for the authenticated user.
    """
    items, total, unread_count = notification_service.get_notifications_for_user(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=type,
        page=page,
        per_page=per_page,
    )

    notifications_resp = [NotificationResponse.model_validate(n) for n in items]
    data = NotificationListResponse(
        notifications=notifications_resp,
        total=total,
        unread_count=unread_count,
        page=page,
        per_page=per_page,
    )

    return ApiResponse(
        success=True,
        data=data,
        message="Notifications retrieved successfully.",
    )


@router.get("/unread-count", response_model=ApiResponse[UnreadCountResponse])
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve current count of unread notifications for badge rendering.
    """
    count = notification_service.get_unread_count(db, current_user.id)
    return ApiResponse(
        success=True,
        data=UnreadCountResponse(unread_count=count),
        message="Unread notification count retrieved.",
    )


@router.post("/{notification_id}/read", response_model=ApiResponse[NotificationResponse])
def mark_notification_as_read(
    notification_id: uuid.UUID = Path(..., description="ID of the notification to mark read"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark an individual notification as read.
    """
    notification = notification_service.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )

    return ApiResponse(
        success=True,
        data=NotificationResponse.model_validate(notification),
        message="Notification marked as read.",
    )


@router.post("/read-all", response_model=ApiResponse[dict])
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all unread notifications for the authenticated user as read.
    """
    updated_count = notification_service.mark_all_as_read(db, current_user.id)
    return ApiResponse(
        success=True,
        data={"marked_read": updated_count},
        message=f"{updated_count} notifications marked as read.",
    )


@router.delete("/{notification_id}", response_model=ApiResponse[dict])
def delete_notification(
    notification_id: uuid.UUID = Path(..., description="ID of notification to delete"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dismiss and permanently delete a user notification.
    """
    deleted = notification_service.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )

    return ApiResponse(
        success=True,
        data={"deleted": True},
        message="Notification deleted successfully.",
    )


@router.post("/admin-broadcast", response_model=ApiResponse[dict])
def broadcast_admin_announcement(
    broadcast_in: AdminBroadcastRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Send an official campus alert to all students or a specific user (Admin only).
    """
    count = notification_service.admin_broadcast(
        db=db,
        admin_user=admin_user,
        broadcast_in=broadcast_in,
    )
    return ApiResponse(
        success=True,
        data={"recipients_notified": count},
        message=f"Broadcast delivered to {count} recipient(s).",
    )


# -------------------------------------------------------------------------
# Real-Time WebSocket Endpoint
# -------------------------------------------------------------------------

@router.websocket("/ws")
async def notifications_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Real-time notification subscription over WebSocket.
    Client provides JWT in query param: ws://host/api/v1/notifications/ws?token=<jwt>
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user_id_str, websocket)

    # Send initial connection handshake
    try:
        await websocket.send_json({
            "event": "connected",
            "message": "Connected to Campus Recover Real-Time Notification Stream",
        })

        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(user_id_str, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for user {user_id_str}: {e}")
        await ws_manager.disconnect(user_id_str, websocket)
