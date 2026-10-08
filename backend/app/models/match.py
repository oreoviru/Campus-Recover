"""
Campus Recover — Match Model
"""

import uuid
from datetime import datetime, timezone
from typing import Any, TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import MatchStatus

if TYPE_CHECKING:
    from app.models.item import Item


class Match(Base):
    """
    Match table — Records potential matches computed by the AI Matching Engine
    between a lost item report and a found item report.
    """

    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    lost_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    found_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Dimensional Scores (0.00 to 1.00)
    text_score: Mapped[float] = mapped_column(sa.Float, default=0.0, nullable=False)
    image_score: Mapped[float | None] = mapped_column(sa.Float, nullable=True)
    location_score: Mapped[float] = mapped_column(sa.Float, default=0.0, nullable=False)
    time_score: Mapped[float] = mapped_column(sa.Float, default=0.0, nullable=False)
    attribute_score: Mapped[float] = mapped_column(sa.Float, default=0.0, nullable=False)
    overall_score: Mapped[float] = mapped_column(
        sa.Float,
        default=0.0,
        index=True,
        nullable=False,
    )

    # Detailed Explainability JSON
    score_breakdown: Mapped[dict[str, Any] | None] = mapped_column(sa.JSON, nullable=True)

    status: Mapped[MatchStatus] = mapped_column(
        sa.Enum(MatchStatus, name="match_status_enum", native_enum=False),
        default=MatchStatus.PENDING,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lost_item: Mapped["Item"] = relationship(
        "Item",
        foreign_keys=[lost_item_id],
        back_populates="lost_matches",
    )
    found_item: Mapped["Item"] = relationship(
        "Item",
        foreign_keys=[found_item_id],
        back_populates="found_matches",
    )

    __table_args__ = (
        sa.UniqueConstraint("lost_item_id", "found_item_id", name="uq_matches_lost_found"),
    )

    def __repr__(self) -> str:
        return f"<Match {self.lost_item_id} <-> {self.found_item_id} ({self.overall_score:.2f})>"
