"""
Campus Recover — Notification Service Layer (Phase 9)

Handles database persistence, unread counter aggregation, mark-as-read mutations,
and real-time dispatch via WebSocket connection manager.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Tuple, Optional, Any, Dict
from sqlalchemy import select, func, desc, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.models.item import Item
from app.models.match import Match
from app.models.claim import Claim
from app.models.enums import NotificationType
from app.schemas.notification import NotificationCreate, AdminBroadcastRequest
from app.websocket.connection_manager import ws_manager

logger = logging.getLogger(__name__)


class NotificationService:
    """Service layer for user alerts, unread counts, and real-time delivery."""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: uuid.UUID,
        type: NotificationType,
        title: str,
        message: str,
        related_item_id: Optional[uuid.UUID] = None,
        related_match_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        """
        Persist a new notification in the database and push in real-time over WebSocket.
        """
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            related_item_id=related_item_id,
            related_match_id=related_match_id,
            read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Calculate current unread count for real-time badge
        unread_count = NotificationService.get_unread_count(db, user_id)

        # Dispatch real-time WebSocket event
        payload: Dict[str, Any] = {
            "event": "new_notification",
            "notification": {
                "id": str(notification.id),
                "user_id": str(notification.user_id),
                "type": notification.type.value if hasattr(notification.type, "value") else str(notification.type),
                "title": notification.title,
                "message": notification.message,
                "related_item_id": str(notification.related_item_id) if notification.related_item_id else None,
                "related_match_id": str(notification.related_match_id) if notification.related_match_id else None,
                "read": notification.read,
                "created_at": notification.created_at.isoformat(),
            },
            "unread_count": unread_count,
        }
        ws_manager.dispatch_push(str(user_id), payload)
        return notification

    @staticmethod
    def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
        """Efficient query to get total unread alerts for a user."""
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
        return db.scalar(query) or 0

    @staticmethod
    def get_notifications_for_user(
        db: Session,
        user_id: uuid.UUID,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Notification], int, int]:
        """
        List notifications for current user with optional unread filter and pagination.
        Returns: (notifications, total_count, unread_count)
        """
        base_filter = [Notification.user_id == user_id]
        if unread_only:
            base_filter.append(Notification.read == False)  # noqa: E712
        if notification_type:
            base_filter.append(Notification.type == notification_type)

        # Total matching filter
        total_query = select(func.count(Notification.id)).where(*base_filter)
        total = db.scalar(total_query) or 0

        # Unread count (always total unread for user badge)
        unread_count = NotificationService.get_unread_count(db, user_id)

        # Paged items
        offset = (page - 1) * per_page
        query = (
            select(Notification)
            .where(*base_filter)
            .order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(per_page)
        )
        items = list(db.scalars(query).all())
        return items, total, unread_count

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[Notification]:
        """Mark a single notification as read."""
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        notification = db.scalars(query).first()
        if not notification:
            return None

        if not notification.read:
            notification.read = True
            db.commit()
            db.refresh(notification)

            # Send real-time badge count decrement
            unread_count = NotificationService.get_unread_count(db, user_id)
            ws_manager.dispatch_push(
                str(user_id),
                {
                    "event": "unread_count_update",
                    "unread_count": unread_count,
                    "notification_id": str(notification.id),
                },
            )

        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: uuid.UUID) -> int:
        """Mark all unread notifications for a user as read."""
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.read == False,  # noqa: E712
            )
            .values(read=True)
        )
        result = db.execute(stmt)
        db.commit()

        # Update real-time counter to 0
        ws_manager.dispatch_push(
            str(user_id),
            {
                "event": "unread_count_update",
                "unread_count": 0,
            },
        )
        return result.rowcount or 0

    @staticmethod
    def delete_notification(
        db: Session,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """Delete a notification owned by the current user."""
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        notification = db.scalars(query).first()
        if not notification:
            return False

        was_unread = not notification.read
        db.delete(notification)
        db.commit()

        if was_unread:
            unread_count = NotificationService.get_unread_count(db, user_id)
            ws_manager.dispatch_push(
                str(user_id),
                {
                    "event": "unread_count_update",
                    "unread_count": unread_count,
                },
            )
        return True

    @staticmethod
    def admin_broadcast(
        db: Session,
        admin_user: User,
        broadcast_in: AdminBroadcastRequest,
    ) -> int:
        """
        Send an official campus security announcement to a specific user or all registered users.
        """
        now = datetime.now(timezone.utc)
        if broadcast_in.target_user_id:
            # Single recipient
            target_user = db.get(User, broadcast_in.target_user_id)
            if not target_user:
                return 0

            NotificationService.create_notification(
                db=db,
                user_id=target_user.id,
                type=NotificationType.ADMIN_MESSAGE,
                title=f"Campus Notice: {broadcast_in.title}",
                message=broadcast_in.message,
            )
            return 1
        else:
            # Campus-wide broadcast
            users_query = select(User.id).where(User.is_active == True)  # noqa: E712
            all_user_ids = list(db.scalars(users_query).all())

            notifications = [
                Notification(
                    id=uuid.uuid4(),
                    user_id=uid,
                    type=NotificationType.ADMIN_MESSAGE,
                    title=f"Campus Announcement: {broadcast_in.title}",
                    message=broadcast_in.message,
                    read=False,
                    created_at=now,
                )
                for uid in all_user_ids
            ]
            db.add_all(notifications)
            db.commit()

            # Push real-time event to all active sockets
            for uid in all_user_ids:
                unread = NotificationService.get_unread_count(db, uid)
                ws_manager.dispatch_push(
                    str(uid),
                    {
                        "event": "new_notification",
                        "notification": {
                            "type": NotificationType.ADMIN_MESSAGE.value,
                            "title": f"Campus Announcement: {broadcast_in.title}",
                            "message": broadcast_in.message,
                            "read": False,
                            "created_at": now.isoformat(),
                        },
                        "unread_count": unread,
                    },
                )
            return len(all_user_ids)

    # -------------------------------------------------------------------------
    # Domain Event Triggers
    # -------------------------------------------------------------------------

    @staticmethod
    def notify_match_found(
        db: Session,
        lost_item: Item,
        found_item: Item,
        match: Match,
    ) -> None:
        """Notify both the lost reporter and found reporter when an AI match is detected."""
        score_pct = int(match.overall_score * 100)

        # 1. Notify owner of lost item
        if lost_item.user_id:
            NotificationService.create_notification(
                db=db,
                user_id=lost_item.user_id,
                type=NotificationType.MATCH_FOUND,
                title=f"Potential Match Found: {lost_item.title} ({score_pct}%)",
                message=(
                    f"Our AI matching engine found a {score_pct}% similarity match "
                    f"with a reported found item: '{found_item.title}'. "
                    f"Review the match candidates to initiate an ownership claim."
                ),
                related_item_id=lost_item.id,
                related_match_id=match.id,
            )

        # 2. Notify finder of found item
        if found_item.user_id:
            NotificationService.create_notification(
                db=db,
                user_id=found_item.user_id,
                type=NotificationType.MATCH_FOUND,
                title=f"Potential Owner Match: {found_item.title} ({score_pct}%)",
                message=(
                    f"An item you found ('{found_item.title}') matched a lost item report "
                    f"for '{lost_item.title}' ({score_pct}% confidence). "
                    f"The owner has been alerted to review and verify."
                ),
                related_item_id=found_item.id,
                related_match_id=match.id,
            )

    @staticmethod
    def notify_claim_submitted(
        db: Session,
        claim: Claim,
        item: Item,
        claimant: User,
    ) -> None:
        """Alert the finder when a student submits an ownership claim with verification answers."""
        if item.user_id and item.user_id != claimant.id:
            NotificationService.create_notification(
                db=db,
                user_id=item.user_id,
                type=NotificationType.CLAIM_SUBMITTED,
                title="New Ownership Claim Received",
                message=(
                    f"{claimant.name} has submitted an ownership claim for your found item: "
                    f"'{item.title}'. Please review their submitted verification proof."
                ),
                related_item_id=item.id,
            )

    @staticmethod
    def notify_claim_approved(
        db: Session,
        claim: Claim,
        item: Item,
    ) -> None:
        """Alert the claimant when their claim is approved and contact info is unlocked."""
        NotificationService.create_notification(
            db=db,
            user_id=claim.claimant_id,
            type=NotificationType.CLAIM_APPROVED,
            title="Ownership Claim Approved! 🎉",
            message=(
                f"Your claim for '{item.title}' has been approved! "
                f"Finder contact coordinates and campus recovery handover details are now available."
            ),
            related_item_id=item.id,
        )

    @staticmethod
    def notify_claim_rejected(
        db: Session,
        claim: Claim,
        item: Item,
        notes: Optional[str] = None,
    ) -> None:
        """Alert the claimant when their claim is rejected."""
        reason_text = f" Reason: {notes}" if notes else " Please reach out to campus security if you have questions."
        NotificationService.create_notification(
            db=db,
            user_id=claim.claimant_id,
            type=NotificationType.CLAIM_REJECTED,
            title="Ownership Claim Not Approved",
            message=(
                f"Your claim for '{item.title}' could not be verified and was not approved.{reason_text}"
            ),
            related_item_id=item.id,
        )

    @staticmethod
    def notify_item_recovered(
        db: Session,
        claim: Claim,
        item: Item,
    ) -> None:
        """Alert both parties when physical custody is confirmed and item is RECOVERED."""
        # Notify claimant
        NotificationService.create_notification(
            db=db,
            user_id=claim.claimant_id,
            type=NotificationType.ITEM_RECOVERED,
            title="Item Handover Confirmed (Recovered)",
            message=(
                f"Custody handover for '{item.title}' has been completed. "
                f"The item is now officially registered as RECOVERED."
            ),
            related_item_id=item.id,
        )

        # Notify finder if different
        if item.user_id and item.user_id != claim.claimant_id:
            NotificationService.create_notification(
                db=db,
                user_id=item.user_id,
                type=NotificationType.ITEM_RECOVERED,
                title="Item Successfully Returned to Owner",
                message=(
                    f"Thank you for helping campus security! '{item.title}' has been "
                    f"successfully returned to its owner and marked RECOVERED."
                ),
                related_item_id=item.id,
            )


notification_service = NotificationService()
