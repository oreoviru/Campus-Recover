"""
Campus Recover — AI Matching Engine Package
"""

from app.ai.text_matching import TextMatchingService, text_matching_service
from app.ai.image_embedding import ImageEmbeddingService, image_embedding_service
from app.ai.image_matching import ImageMatchingService, image_matching_service
from app.ai.location_matching import LocationMatchingService, location_matching_service
from app.ai.time_matching import TimeMatchingService, time_matching_service
from app.ai.attribute_matching import AttributeMatchingService, attribute_matching_service
from app.ai.scoring import MatchScoringService, match_scoring_service
from app.ai.engine import MatchingEngineService, matching_engine_service

__all__ = [
    "TextMatchingService",
    "text_matching_service",
    "ImageEmbeddingService",
    "image_embedding_service",
    "ImageMatchingService",
    "image_matching_service",
    "LocationMatchingService",
    "location_matching_service",
    "TimeMatchingService",
    "time_matching_service",
    "AttributeMatchingService",
    "attribute_matching_service",
    "MatchScoringService",
    "match_scoring_service",
    "MatchingEngineService",
    "matching_engine_service",
]
