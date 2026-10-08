"""
Campus Recover — Match Pydantic Schemas
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MatchStatus, ItemType, ItemStatus, ItemCategory
from app.schemas.item import ItemResponse


class MatchSignalDetail(BaseModel):
    score: Optional[float] = None
    base_weight: float
    effective_weight: float
    status: str
    reason: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class MatchScoreBreakdown(BaseModel):
    overall_score: float
    confidence_level: str
    normalized_without_image: bool
    signals: Dict[str, MatchSignalDetail]


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lost_item_id: uuid.UUID
    found_item_id: uuid.UUID
    text_score: float
    image_score: Optional[float] = None
    location_score: float
    time_score: float
    attribute_score: float
    overall_score: float
    status: MatchStatus
    score_breakdown: Optional[Dict[str, Any]] = None
    created_at: datetime

    # Populated when eager loaded
    lost_item: Optional[ItemResponse] = None
    found_item: Optional[ItemResponse] = None


class MatchCandidateResult(BaseModel):
    """Result structure when running matching for an item."""
    candidate_item: ItemResponse
    lost_item_id: uuid.UUID
    found_item_id: uuid.UUID
    overall_score: float
    confidence_level: str
    text_score: float
    location_score: float
    time_score: float
    attribute_score: float
    image_score: Optional[float] = None
    score_breakdown: Dict[str, Any]
    is_saved_match: bool = False
    match_id: Optional[uuid.UUID] = None
