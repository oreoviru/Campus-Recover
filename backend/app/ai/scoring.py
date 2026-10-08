"""
Campus Recover — Match Scoring Service

Aggregates multi-dimensional matching signals (Text, Image, Location, Time, Attributes)
into an overall recovery score using configurable weights and dynamic normalization.

Standard Phase 7 Recovery Score Weights:
  - Text Similarity: 30% (0.30)
  - Image Similarity: 30% (0.30)
  - Location Proximity: 20% (0.20)
  - Time Proximity: 10% (0.10)
  - Attributes Overlap: 10% (0.10)
"""

from typing import Optional, Dict, Any, Tuple
from app.config import settings


class MatchScoringService:
    """
    Independent service that orchestrates scoring signals into an overall recovery score.

    Supports configurable weights:
      - Text: 30% default
      - Image: 30% default (normalized proportionally when unavailable)
      - Location: 20% default
      - Time: 10% default
      - Attributes: 10% default

    When image signals are unavailable (e.g. no photo attached or corrupted file),
    weights are proportionally normalized across available signals without pretending
    image similarity exists.
    """

    def __init__(
        self,
        text_weight: Optional[float] = None,
        image_weight: Optional[float] = None,
        location_weight: Optional[float] = None,
        time_weight: Optional[float] = None,
        attribute_weight: Optional[float] = None,
    ):
        self.text_weight = text_weight if text_weight is not None else getattr(settings, "text_weight", 0.30)
        self.image_weight = image_weight if image_weight is not None else getattr(settings, "image_weight", 0.30)
        self.location_weight = location_weight if location_weight is not None else getattr(settings, "location_weight", 0.20)
        self.time_weight = time_weight if time_weight is not None else getattr(settings, "time_weight", 0.10)
        self.attribute_weight = attribute_weight if attribute_weight is not None else getattr(settings, "attribute_weight", 0.10)

    def calculate_overall_score(
        self,
        text_score: float,
        location_score: float,
        time_score: float,
        attribute_score: float,
        image_score: Optional[float] = None,
        text_details: Optional[Dict[str, Any]] = None,
        location_details: Optional[Dict[str, Any]] = None,
        time_details: Optional[Dict[str, Any]] = None,
        attribute_details: Optional[Dict[str, Any]] = None,
        image_details: Optional[Dict[str, Any]] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Compute weighted composite score and return comprehensive explainability breakdown.
        """
        # Determine available signals
        available_signals = {
            "text": (text_score, self.text_weight, text_details),
            "location": (location_score, self.location_weight, location_details),
            "time": (time_score, self.time_weight, time_details),
            "attributes": (attribute_score, self.attribute_weight, attribute_details),
        }

        # Check image availability
        has_image = image_score is not None
        if has_image:
            available_signals["image"] = (image_score, self.image_weight, image_details)

        # Sum base weights of available signals for proportional normalization
        total_available_weight = sum(w for _, w, _ in available_signals.values())

        if total_available_weight <= 0:
            total_available_weight = 1.0

        # Calculate normalized composite score
        overall_score = 0.0
        signals_breakdown: Dict[str, Any] = {}

        for name, (score, base_weight, details) in available_signals.items():
            effective_weight = base_weight / total_available_weight
            overall_score += effective_weight * score

            signals_breakdown[name] = {
                "score": round(score, 4),
                "base_weight": round(base_weight, 4),
                "effective_weight": round(effective_weight, 4),
                "status": "AVAILABLE",
                "details": details or {},
            }

        # Record unavailable signals explicitly (e.g. image)
        if not has_image:
            reason = "No photo attached on one or both item reports"
            if image_details and "reason" in image_details:
                reason = image_details["reason"]

            signals_breakdown["image"] = {
                "score": None,
                "base_weight": round(self.image_weight, 4),
                "effective_weight": 0.0,
                "status": "UNAVAILABLE",
                "reason": reason,
                "details": image_details or {},
            }

        overall_score = round(max(0.0, min(1.0, overall_score)), 4)
        confidence_level = self.classify_confidence(overall_score)

        breakdown = {
            "overall_score": overall_score,
            "confidence_level": confidence_level,
            "normalized_without_image": not has_image,
            "signals": signals_breakdown,
        }

        return overall_score, breakdown

    @staticmethod
    def classify_confidence(score: float) -> str:
        """Categorize numerical score into human-readable confidence tier."""
        if score >= 0.80:
            return "Highly Likely Match"
        elif score >= 0.65:
            return "Strong Potential Match"
        elif score >= 0.45:
            return "Possible Match"
        else:
            return "Low Confidence"


# Global default instance
match_scoring_service = MatchScoringService()
