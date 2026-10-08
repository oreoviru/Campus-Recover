"""
Campus Recover — Item Model
"""

import uuid
from datetime import datetime, timezone
from typing import List, Any, TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import ItemType, ItemStatus, ItemCategory

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.campus_location import CampusLocation
    from app.models.match import Match
    from app.models.claim import Claim


class Item(Base):
    """
    Item table — Lost and Found reports submitted by users.
    Contains characteristics, geolocations, timestamps, cached embeddings,
    and private verification challenge fields.
    """

    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    type: Mapped[ItemType] = mapped_column(
        sa.Enum(ItemType, name="item_type_enum", native_enum=False),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(sa.String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(sa.Text, nullable=False)
    category: Mapped[ItemCategory] = mapped_column(
        sa.Enum(ItemCategory, name="item_category_enum", native_enum=False),
        index=True,
        nullable=False,
    )
    subcategory: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    brand: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    distinguishing_marks: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    # Location Information
    location_name: Mapped[str | None] = mapped_column(sa.String(255), nullable=True)
    campus_location_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("campus_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    latitude: Mapped[float | None] = mapped_column(sa.Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(sa.Float, nullable=True)

    # Temporal & Media Information
    date_time: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
    )
    image_url: Mapped[str | None] = mapped_column(sa.String(500), nullable=True)

    # Embeddings for AI Matching (cached vectors stored as JSON arrays)
    text_embedding: Mapped[List[float] | None] = mapped_column(sa.JSON, nullable=True)
    image_embedding: Mapped[List[float] | None] = mapped_column(sa.JSON, nullable=True)

    # Lifecycle Status
    status: Mapped[ItemStatus] = mapped_column(
        sa.Enum(ItemStatus, name="item_status_enum", native_enum=False),
        default=ItemStatus.ACTIVE,
        index=True,
        nullable=False,
    )

    # Private Verification (Found items only — never exposed publicly)
    verification_question: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    verification_answer_hash: Mapped[str | None] = mapped_column(
        sa.String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="items")
    campus_location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        back_populates="items",
    )
    lost_matches: Mapped[List["Match"]] = relationship(
        "Match",
        primaryjoin="Item.id == foreign(Match.lost_item_id)",
        back_populates="lost_item",
        cascade="all, delete-orphan",
    )
    found_matches: Mapped[List["Match"]] = relationship(
        "Match",
        primaryjoin="Item.id == foreign(Match.found_item_id)",
        back_populates="found_item",
        cascade="all, delete-orphan",
    )
    claims: Mapped[List["Claim"]] = relationship(
        "Claim",
        back_populates="item",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        sa.Index("idx_items_type_status", "type", "status"),
        sa.Index("idx_items_category_status", "category", "status"),
    )

    def __repr__(self) -> str:
        return f"<Item {self.title} ({self.type} - {self.status})>"
