"""
Campus Recover — Text Matching Service

Generates dense semantic embeddings using Sentence-Transformers
and computes semantic similarity across item titles and descriptions.
"""

import logging
import math
import re
from typing import List, Optional, Tuple, Any

import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class TextMatchingService:
    """
    Independent service for text embedding generation and semantic similarity.
    Uses Sentence-Transformers ('all-MiniLM-L6-v2' by default) with lazy model
    loading and cosine similarity computation.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.ai_text_model
        self._model = None
        self._fallback_mode = False

    def _get_model(self):
        """Lazy load the SentenceTransformer model on first usage."""
        if self._model is None and not self._fallback_mode:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model '{self.model_name}'...")
                self._model = SentenceTransformer(self.model_name)
                logger.info("SentenceTransformer model successfully loaded.")
            except Exception as e:
                logger.warning(
                    f"Could not load SentenceTransformer '{self.model_name}': {e}. "
                    "Engaging local token-overlap fallback matching for text similarity."
                )
                self._fallback_mode = True
        return self._model

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate dense normalized embedding vector for input text.
        Returns a Python list of 384 floats (for all-MiniLM-L6-v2).
        """
        cleaned = self._clean_text(text)
        if not cleaned:
            return [0.0] * 384

        model = self._get_model()
        if model is not None:
            try:
                embedding = model.encode(
                    cleaned,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                )
                return embedding.tolist()
            except Exception as e:
                logger.warning(f"Embedding encoding error: {e}. Falling back.")

        # Fallback deterministic bag-of-words pseudo-embedding (384 dimensions)
        return self._fallback_embedding(cleaned)

    def compute_embedding_similarity(
        self,
        embedding_a: Optional[List[float]],
        embedding_b: Optional[List[float]],
    ) -> float:
        """
        Compute cosine similarity between two dense embedding vectors.
        Returns a float between 0.0 and 1.0.
        """
        if not embedding_a or not embedding_b:
            return 0.0

        vec_a = np.array(embedding_a, dtype=np.float32)
        vec_b = np.array(embedding_b, dtype=np.float32)

        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        dot = np.dot(vec_a, vec_b)
        cosine = float(dot / (norm_a * norm_b))
        # Clip to [0.0, 1.0] range
        return max(0.0, min(1.0, (cosine + 1.0) / 2.0 if cosine < 0 else cosine))

    def compute_text_similarity(self, text_a: str, text_b: str) -> float:
        """Direct text-to-text semantic similarity."""
        emb_a = self.generate_embedding(text_a)
        emb_b = self.generate_embedding(text_b)
        return self.compute_embedding_similarity(emb_a, emb_b)

    def compare_items(self, item_a: Any, item_b: Any) -> Tuple[float, dict]:
        """
        Compute comprehensive text similarity between two items.
        Compares composite title + description, title alone, and description alone.
        Returns (text_score, score_details).
        """
        title_a = getattr(item_a, "title", "") or ""
        title_b = getattr(item_b, "title", "") or ""
        desc_a = getattr(item_a, "description", "") or ""
        desc_b = getattr(item_b, "description", "") or ""

        # Title similarity
        title_sim = self.compute_text_similarity(title_a, title_b)

        # Description similarity
        desc_sim = self.compute_text_similarity(desc_a, desc_b)

        # Composite item text
        text_a_full = f"{title_a}. {desc_a}".strip()
        text_b_full = f"{title_b}. {desc_b}".strip()

        # Check cached embeddings on items if available
        emb_a = getattr(item_a, "text_embedding", None)
        emb_b = getattr(item_b, "text_embedding", None)

        if not emb_a:
            emb_a = self.generate_embedding(text_a_full)
        if not emb_b:
            emb_b = self.generate_embedding(text_b_full)

        composite_sim = self.compute_embedding_similarity(emb_a, emb_b)

        # Weighting between composite, title, and description
        # Title matches are significant indicators
        text_score = 0.50 * composite_sim + 0.35 * title_sim + 0.15 * desc_sim
        text_score = round(max(0.0, min(1.0, text_score)), 4)

        details = {
            "title_similarity": round(title_sim, 4),
            "description_similarity": round(desc_sim, 4),
            "composite_similarity": round(composite_sim, 4),
            "model": self.model_name,
            "fallback_used": self._fallback_mode,
        }

        return text_score, details

    @staticmethod
    def _clean_text(text: str) -> str:
        """Strip unnecessary whitespace and normalize casing."""
        if not text:
            return ""
        return " ".join(text.strip().split())

    @staticmethod
    def _fallback_embedding(text: str, dim: int = 384) -> List[float]:
        """
        Deterministic hash-based token projection for testing and offline environments.
        """
        vec = np.zeros(dim, dtype=np.float32)
        words = re.findall(r"\w+", text.lower())
        if not words:
            return vec.tolist()

        for word in words:
            h = hash(word)
            idx = abs(h) % dim
            sign = 1.0 if (h >> 16) & 1 else -1.0
            vec[idx] += sign

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec.tolist()


# Global default instance
text_matching_service = TextMatchingService()
