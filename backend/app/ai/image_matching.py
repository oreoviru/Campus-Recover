"""
Campus Recover — Image Matching Service

Compares visual representations between lost and found items using cosine similarity
over CLIP or normalized computer-vision visual embeddings.

Key responsibilities:
- Cosine similarity calculation over 512-dimensional visual vectors
- Item pair visual comparison with complete signal attribution
- Missing image detection (e.g., reports without photos)
- Unreadable/corrupted image isolation
- Detailed signal explainability dictionary returned for score aggregation
"""

import logging
from typing import Optional, Tuple, Dict, Any, List
import numpy as np

from app.ai.image_embedding import ImageEmbeddingService, image_embedding_service

logger = logging.getLogger(__name__)


class ImageMatchingService:
    """
    Independent service for computing visual similarity between items.
    """

    def __init__(self, embedding_service: Optional[ImageEmbeddingService] = None):
        self.embedding_service = embedding_service or image_embedding_service

    def calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Compute standard cosine similarity between two float vectors.
        Returns float between 0.0 and 1.0.
        """
        if not vec1 or not vec2:
            return 0.0

        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 <= 1e-8 or norm2 <= 1e-8:
            return 0.0

        sim = float(np.dot(v1, v2) / (norm1 * norm2))
        # Clamp bounds
        return round(max(0.0, min(1.0, sim)), 4)

    def _classify_similarity(self, score: float) -> str:
        """Classify visual similarity score into qualitative indicator."""
        if score >= 0.85:
            return "Extremely High Visual Match"
        elif score >= 0.70:
            return "Strong Visual Resemblance"
        elif score >= 0.50:
            return "Moderate Visual Similarity"
        else:
            return "Low Visual Resemblance"

    def compare_items(
        self, item_a: Any, item_b: Any, db: Optional[Any] = None
    ) -> Tuple[Optional[float], Dict[str, Any]]:
        """
        Compare visual appearance of two items.
        
        Returns:
            Tuple of (similarity_score, signal_details)
            If either item lacks an image or embedding fails, returns (None, details)
            with status="UNAVAILABLE" and descriptive explanation.
        """
        item_a_url = getattr(item_a, "image_url", None)
        item_b_url = getattr(item_b, "image_url", None)

        # Check if one or both items have no photo attached
        if not item_a_url or not item_b_url:
            return None, {
                "status": "UNAVAILABLE",
                "reason": "Photo missing on one or both item reports",
                "item_a_has_image": bool(item_a_url),
                "item_b_has_image": bool(item_b_url),
            }

        # Retrieve or compute embedding for item_a
        emb_a = getattr(item_a, "image_embedding", None)
        if not emb_a or len(emb_a) == 0:
            emb_a = self.embedding_service.generate_embedding(item_a_url)
            if emb_a and hasattr(item_a, "image_embedding"):
                item_a.image_embedding = emb_a
                if db:
                    try:
                        db.commit()
                    except Exception as e:
                        logger.debug(f"Could not save embedding for item_a: {e}")
                        db.rollback()

        # Retrieve or compute embedding for item_b
        emb_b = getattr(item_b, "image_embedding", None)
        if not emb_b or len(emb_b) == 0:
            emb_b = self.embedding_service.generate_embedding(item_b_url)
            if emb_b and hasattr(item_b, "image_embedding"):
                item_b.image_embedding = emb_b
                if db:
                    try:
                        db.commit()
                    except Exception as e:
                        logger.debug(f"Could not save embedding for item_b: {e}")
                        db.rollback()

        # Check if either embedding failed (missing file, corrupted format, etc.)
        if not emb_a or not emb_b:
            return None, {
                "status": "UNAVAILABLE",
                "reason": "Could not extract valid visual embedding from image files",
                "item_a_has_image": bool(item_a_url),
                "item_b_has_image": bool(item_b_url),
                "item_a_embedded": bool(emb_a),
                "item_b_embedded": bool(emb_b),
            }

        # Calculate cosine similarity
        similarity = self.calculate_cosine_similarity(emb_a, emb_b)

        return similarity, {
            "status": "AVAILABLE",
            "similarity": similarity,
            "engine": self.embedding_service.active_engine,
            "model": self.embedding_service.model_name,
            "confidence": self._classify_similarity(similarity),
            "reasons": [
                f"Visual cosine similarity score: {round(similarity * 100, 1)}%",
                f"Visual model engine: {self.embedding_service.active_engine.upper()}",
            ],
        }


# Global default instance
image_matching_service = ImageMatchingService()
