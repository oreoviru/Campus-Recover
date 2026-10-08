"""
Campus Recover — Campus Location Model
"""

import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.item import Item


class CampusLocation(Base):
    """CampusLocation table — pre-configured campus hotspots, buildings, and landmarks."""

    __tablename__ = "campus_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(sa.String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    latitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    building: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    floor: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    items: Mapped[List["Item"]] = relationship(
        "Item",
        back_populates="campus_location",
    )

    def __repr__(self) -> str:
        return f"<CampusLocation {self.name} ({self.building})>"
