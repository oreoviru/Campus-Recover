"""
Campus Recover — Claim Model
"""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import ClaimStatus

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.user import User


class Claim(Base):
    """
    Claim table — Formal claims submitted by users asserting ownership
    over a found item report.
    """

    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    claimant_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Verification question copied/referenced from the item at claim time
    verification_question: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    verification_answer_hash: Mapped[str | None] = mapped_column(sa.String(255), nullable=True)
    submitted_answer: Mapped[str] = mapped_column(sa.Text, nullable=False)

    status: Mapped[ClaimStatus] = mapped_column(
        sa.Enum(ClaimStatus, name="claim_status_enum", native_enum=False),
        default=ClaimStatus.PENDING,
        index=True,
        nullable=False,
    )
    admin_notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

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
    item: Mapped["Item"] = relationship("Item", back_populates="claims")
    claimant: Mapped["User"] = relationship("User", back_populates="claims")

    __table_args__ = (
        sa.Index("idx_claims_item_claimant", "item_id", "claimant_id"),
    )

    def __repr__(self) -> str:
        return f"<Claim {self.id} for Item {self.item_id} ({self.status})>"
