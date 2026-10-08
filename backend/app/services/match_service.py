"""
Campus Recover — Match Service Layer

Encapsulates database operations for Match records computed by the AI Matching Engine.
"""

import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from app.models.match import Match
from app.models.item import Item
from app.models.enums import MatchStatus, ItemType


class MatchService:
    """Service layer for retrieving and managing matches."""

    @staticmethod
    def get_match_by_id(db: Session, match_id: uuid.UUID) -> Optional[Match]:
        """Fetch a match with eager loaded items."""
        query = (
            select(Match)
            .where(Match.id == match_id)
            .options(
                joinedload(Match.lost_item).joinedload(Item.campus_location),
                joinedload(Match.found_item).joinedload(Item.campus_location),
            )
        )
        return db.scalars(query).first()

    @staticmethod
    def list_matches_for_item(
        db: Session,
        item_id: uuid.UUID,
        status: Optional[MatchStatus] = None,
        limit: int = 50,
    ) -> List[Match]:
        """Retrieve matches associated with a specific lost or found item."""
        query = (
            select(Match)
            .where((Match.lost_item_id == item_id) | (Match.found_item_id == item_id))
            .options(
                joinedload(Match.lost_item).joinedload(Item.campus_location),
                joinedload(Match.found_item).joinedload(Item.campus_location),
            )
            .order_by(desc(Match.overall_score))
        )

        if status:
            query = query.where(Match.status == status)

        return list(db.scalars(query.limit(limit)).all())

    @staticmethod
    def list_matches_for_user(
        db: Session,
        user_id: uuid.UUID,
        status: Optional[MatchStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Match], int]:
        """
        Retrieve matches where the current user reported either the lost or found item.
        """
        # Find item IDs owned by user
        user_items_query = select(Item.id).where(Item.user_id == user_id)
        user_item_ids = list(db.scalars(user_items_query).all())

        if not user_item_ids:
            return [], 0

        query = (
            select(Match)
            .where(
                (Match.lost_item_id.in_(user_item_ids))
                | (Match.found_item_id.in_(user_item_ids))
            )
            .options(
                joinedload(Match.lost_item).joinedload(Item.campus_location),
                joinedload(Match.found_item).joinedload(Item.campus_location),
            )
            .order_by(desc(Match.overall_score))
        )

        if status:
            query = query.where(Match.status == status)

        total = len(list(db.scalars(query).all()))

        offset = (page - 1) * per_page
        matches = list(db.scalars(query.offset(offset).limit(per_page)).all())
        return matches, total

    @staticmethod
    def update_match_status(
        db: Session,
        match_id: uuid.UUID,
        status: MatchStatus,
    ) -> Optional[Match]:
        """Update status of a match (e.g. CONFIRMED, REJECTED)."""
        match = db.get(Match, match_id)
        if not match:
            return None
        match.status = status
        db.commit()
        db.refresh(match)
        return match


match_service = MatchService()
