"""
Campus Recover — User Model
"""

import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.claim import Claim
    from app.models.notification import Notification


class User(Base):
    """User table — students, staff, and administrators."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        sa.String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        sa.Enum(UserRole, name="user_role_enum", native_enum=False),
        default=UserRole.STUDENT,
        nullable=False,
    )
    student_id: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(sa.String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    items: Mapped[List["Item"]] = relationship(
        "Item",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    claims: Mapped[List["Claim"]] = relationship(
        "Claim",
        back_populates="claimant",
        cascade="all, delete-orphan",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
