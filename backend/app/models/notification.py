"""
Campus Recover — Notification Model
"""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import NotificationType

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base):
    """
    Notification table — Alerts sent to users regarding AI matches,
    claim submissions, status reviews, and admin announcements.
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    type: Mapped[NotificationType] = mapped_column(
        sa.Enum(NotificationType, name="notification_type_enum", native_enum=False),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    message: Mapped[str] = mapped_column(sa.Text, nullable=False)

    related_item_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="SET NULL"),
        nullable=True,
    )
    related_match_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("matches.id", ondelete="SET NULL"),
        nullable=True,
    )

    read: Mapped[bool] = mapped_column(sa.Boolean, default=False, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    __table_args__ = (
        sa.Index("idx_notifications_user_read", "user_id", "read"),
    )

    def __repr__(self) -> str:
        return f"<Notification {self.title} for User {self.user_id} (Read: {self.read})>"
