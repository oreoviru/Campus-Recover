"""
Campus Recover — AI Matching Engine Service

Coordinates all dimensional matching sub-services (Text, Image, Location, Time, Attributes),
evaluates candidate pairs, ranks prospective matches, and saves strong matches.
"""

import logging
import uuid
from typing import List, Optional, Tuple, Dict, Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.item import Item
from app.models.match import Match
from app.models.enums import ItemType, ItemStatus, MatchStatus
from app.ai.text_matching import TextMatchingService, text_matching_service
from app.ai.image_embedding import ImageEmbeddingService, image_embedding_service
from app.ai.image_matching import ImageMatchingService, image_matching_service
from app.ai.location_matching import LocationMatchingService, location_matching_service
from app.ai.time_matching import TimeMatchingService, time_matching_service
from app.ai.attribute_matching import AttributeMatchingService, attribute_matching_service
from app.ai.scoring import MatchScoringService, match_scoring_service

logger = logging.getLogger(__name__)


class MatchingEngineService:
    """
    Independent engine orchestrating cross-dimensional lost & found item matching.
    """

    def __init__(
        self,
        text_service: Optional[TextMatchingService] = None,
        image_service: Optional[ImageMatchingService] = None,
        image_embedding_srv: Optional[ImageEmbeddingService] = None,
        location_service: Optional[LocationMatchingService] = None,
        time_service: Optional[TimeMatchingService] = None,
        attribute_service: Optional[AttributeMatchingService] = None,
        scoring_service: Optional[MatchScoringService] = None,
        match_threshold: Optional[float] = None,
    ):
        self.text_service = text_service or text_matching_service
        self.image_service = image_service or image_matching_service
        self.image_embedding_srv = image_embedding_srv or image_embedding_service
        self.location_service = location_service or location_matching_service
        self.time_service = time_service or time_matching_service
        self.attribute_service = attribute_service or attribute_matching_service
        self.scoring_service = scoring_service or match_scoring_service
        self.match_threshold = match_threshold if match_threshold is not None else settings.match_threshold

    def ensure_text_embedding(self, db: Session, item: Item) -> List[float]:
        """
        Generate and persist text embedding for an item if not yet cached.
        """
        if item.text_embedding and len(item.text_embedding) > 0:
            return item.text_embedding

        composite_text = f"{item.title}. {item.description}".strip()
        embedding = self.text_service.generate_embedding(composite_text)
        item.text_embedding = embedding
        try:
            db.commit()
            db.refresh(item)
        except Exception as e:
            logger.warning(f"Could not persist text embedding to database: {e}")
            db.rollback()

        return embedding

    def ensure_image_embedding(self, db: Session, item: Item) -> Optional[List[float]]:
        """
        Generate and persist image embedding for an item if photo exists and not yet cached.
        """
        if item.image_embedding and len(item.image_embedding) > 0:
            return item.image_embedding

        if not item.image_url:
            return None

        embedding = self.image_embedding_srv.generate_embedding(item.image_url)
        if embedding:
            item.image_embedding = embedding
            try:
                db.commit()
                db.refresh(item)
            except Exception as e:
                logger.warning(f"Could not persist image embedding to database: {e}")
                db.rollback()

        return embedding

    def score_pair(
        self, item_a: Item, item_b: Item, db: Optional[Session] = None
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Compute similarity score between two items across all dimensions.
        Returns (overall_score, score_breakdown).
        """
        # 1. Text Similarity
        text_score, text_details = self.text_service.compare_items(item_a, item_b)

        # 2. Location Similarity
        loc_score, loc_details = self.location_service.compare_items(item_a, item_b)

        # 3. Time Similarity
        time_score, time_details = self.time_service.compare_items(item_a, item_b)

        # 4. Attribute Similarity
        attr_score, attr_details = self.attribute_service.compare_items(item_a, item_b)

        # 5. Image Similarity
        if db:
            if item_a.image_url and not item_a.image_embedding:
                self.ensure_image_embedding(db, item_a)
            if item_b.image_url and not item_b.image_embedding:
                self.ensure_image_embedding(db, item_b)

        image_score, image_details = self.image_service.compare_items(item_a, item_b, db=db)

        # 6. Composite Weighted Score
        overall_score, breakdown = self.scoring_service.calculate_overall_score(
            text_score=text_score,
            location_score=loc_score,
            time_score=time_score,
            attribute_score=attr_score,
            image_score=image_score,
            text_details=text_details,
            location_details=loc_details,
            time_details=time_details,
            attribute_details=attr_details,
            image_details=image_details,
        )

        return overall_score, breakdown

    def process_new_item(
        self,
        db: Session,
        new_item: Item,
        save_matches: bool = True,
        threshold: Optional[float] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Evaluate candidate matches when a new LOST or FOUND item is created.
        - If new_item is LOST: queries candidate FOUND items.
        - If new_item is FOUND: queries candidate LOST items.
        Ranks candidates by overall score, persists strong matches, and returns results.
        """
        cutoff = threshold if threshold is not None else self.match_threshold

        # 1. Ensure embeddings exist for new item
        self.ensure_text_embedding(db, new_item)
        if new_item.image_url:
            self.ensure_image_embedding(db, new_item)

        # 2. Query opposite active items
        opposite_type = ItemType.FOUND if new_item.type == ItemType.LOST else ItemType.LOST

        query = (
            select(Item)
            .where(
                Item.type == opposite_type,
                Item.status == ItemStatus.ACTIVE,
                Item.id != new_item.id,
            )
            .limit(100)  # Consider top 100 recent candidates for scoring
        )

        candidates = db.scalars(query).all()
        results: List[Dict[str, Any]] = []

        for candidate in candidates:
            # Pre-filter: category compatibility check
            cat_score = self.attribute_service.compute_category_score(
                new_item.category, candidate.category
            )
            if cat_score == 0.0:
                continue

            # Ensure candidate has text embedding
            if not candidate.text_embedding:
                self.ensure_text_embedding(db, candidate)

            # Ensure candidate has image embedding if photo exists
            if candidate.image_url and not candidate.image_embedding:
                self.ensure_image_embedding(db, candidate)

            # Compute similarity score
            overall_score, breakdown = self.score_pair(new_item, candidate, db=db)

            # Determine lost vs found IDs
            if new_item.type == ItemType.LOST:
                lost_id = new_item.id
                found_id = candidate.id
            else:
                lost_id = candidate.id
                found_id = new_item.id

            is_strong = overall_score >= cutoff
            img_score = breakdown["signals"]["image"]["score"]

            result_entry = {
                "candidate_item": candidate,
                "lost_item_id": lost_id,
                "found_item_id": found_id,
                "overall_score": overall_score,
                "confidence_level": breakdown["confidence_level"],
                "text_score": breakdown["signals"]["text"]["score"],
                "image_score": img_score,
                "location_score": breakdown["signals"]["location"]["score"],
                "time_score": breakdown["signals"]["time"]["score"],
                "attribute_score": breakdown["signals"]["attributes"]["score"],
                "score_breakdown": breakdown,
                "is_saved_match": False,
                "match_id": None,
            }

            # 3. Save strong matches to database if requested
            if save_matches and is_strong:
                match_record = self._save_or_update_match(
                    db=db,
                    lost_id=lost_id,
                    found_id=found_id,
                    text_score=result_entry["text_score"],
                    image_score=img_score,
                    location_score=result_entry["location_score"],
                    time_score=result_entry["time_score"],
                    attribute_score=result_entry["attribute_score"],
                    overall_score=overall_score,
                    breakdown=breakdown,
                )
                if match_record:
                    result_entry["is_saved_match"] = True
                    result_entry["match_id"] = match_record.id

            results.append(result_entry)

        # 4. Rank candidates descending by overall score
        results.sort(key=lambda x: x["overall_score"], reverse=True)

        return results[:limit]

    def _save_or_update_match(
        self,
        db: Session,
        lost_id: uuid.UUID,
        found_id: uuid.UUID,
        text_score: float,
        image_score: Optional[float],
        location_score: float,
        time_score: float,
        attribute_score: float,
        overall_score: float,
        breakdown: Dict[str, Any],
    ) -> Optional[Match]:
        """
        Create or update a Match record in the database.
        """
        try:
            # Check if match already exists
            existing_match = db.scalars(
                select(Match).where(
                    Match.lost_item_id == lost_id,
                    Match.found_item_id == found_id,
                )
            ).first()

            if existing_match:
                existing_match.text_score = text_score
                existing_match.image_score = image_score
                existing_match.location_score = location_score
                existing_match.time_score = time_score
                existing_match.attribute_score = attribute_score
                existing_match.overall_score = overall_score
                existing_match.score_breakdown = breakdown
                db.commit()
                db.refresh(existing_match)
                return existing_match
            else:
                new_match = Match(
                    lost_item_id=lost_id,
                    found_item_id=found_id,
                    text_score=text_score,
                    image_score=image_score,
                    location_score=location_score,
                    time_score=time_score,
                    attribute_score=attribute_score,
                    overall_score=overall_score,
                    score_breakdown=breakdown,
                    status=MatchStatus.PENDING,
                )
                db.add(new_match)
                db.commit()
                db.refresh(new_match)

                # Dispatch match found notifications
                try:
                    from app.services.notification_service import notification_service
                    lost_item = db.get(Item, lost_id)
                    found_item = db.get(Item, found_id)
                    if lost_item and found_item:
                        notification_service.notify_match_found(db, lost_item, found_item, new_match)
                except Exception as n_err:
                    logger.warning(f"Could not dispatch match notification: {n_err}")

                return new_match
        except Exception as e:
            logger.error(f"Error saving match record: {e}")
            db.rollback()
            return None


# Global default instance
matching_engine_service = MatchingEngineService()
