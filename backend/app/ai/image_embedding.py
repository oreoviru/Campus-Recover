"""
Campus Recover — Image Embedding Service

Generates 512-dimensional visual embeddings for item images using CLIP-compatible
neural networks (SentenceTransformer clip-ViT-B-32) or a lightweight, zero-download
computer vision feature extractor for local development and constrained environments.

Features:
- Full CLIP support via sentence-transformers (clip-ViT-B-32 / openai/clip-vit-base-patch32)
- Lightweight CV spatial-color histogram & gradient fallback (512 dimensions, zero download)
- Seamless handling of missing, unreadable, or corrupted images
- Graceful error isolation on model failure (never crashes or fakes similarity)
- Efficient normalized vector generation for fast cosine comparison
"""

import os
import io
import logging
from pathlib import Path
from typing import Optional, List, Union

import numpy as np
from PIL import Image, UnidentifiedImageError

from app.config import settings

logger = logging.getLogger(__name__)


class ImageEmbeddingService:
    """
    Independent service for generating and managing visual embeddings.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.raw_model_name = model_name or settings.ai_image_model
        # Standardize aliases
        if self.raw_model_name.lower() in ("clip-vit-b-32", "sentence-transformers/clip-vit-b-32", "openai/clip-vit-base-patch32"):
            self.model_name = "clip-ViT-B-32"
        else:
            self.model_name = self.raw_model_name

        self._is_lightweight_configured = self.model_name.lower() in ("lightweight", "cv", "histogram", "none")
        self._model = None
        self._load_failed = False
        self._active_engine = "lightweight" if self._is_lightweight_configured else "clip"

    @property
    def active_engine(self) -> str:
        """Indicates whether running with 'clip' or 'lightweight' engine."""
        return self._active_engine

    def _get_model(self):
        """Lazy load SentenceTransformer CLIP model, falling back to lightweight if unavailable."""
        if self._is_lightweight_configured or self._load_failed:
            return None

        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading CLIP image model: {self.model_name}...")
                self._model = SentenceTransformer(self.model_name)
                self._active_engine = "clip"
                logger.info("Successfully initialized CLIP visual model.")
            except Exception as e:
                logger.warning(
                    f"Could not initialize CLIP model '{self.model_name}': {e}. "
                    "Switching to lightweight computer vision feature extractor."
                )
                self._load_failed = True
                self._active_engine = "lightweight"
                self._model = None

        return self._model

    def resolve_image_path(self, path_str: str) -> Optional[Path]:
        """
        Locates image file on disk, handling relative /uploads URLs, relative paths,
        and absolute file system paths.
        """
        if not path_str or not isinstance(path_str, str):
            return None

        clean_path = path_str.strip()

        # Handle API upload URL format (e.g., '/uploads/filename.jpg')
        if clean_path.startswith("/uploads/"):
            filename = clean_path.replace("/uploads/", "")
            target = Path(settings.upload_dir) / filename
            if target.exists() and target.is_file():
                return target

        if clean_path.startswith("uploads/"):
            filename = clean_path.replace("uploads/", "")
            target = Path(settings.upload_dir) / filename
            if target.exists() and target.is_file():
                return target

        # Direct path check
        direct = Path(clean_path)
        if direct.exists() and direct.is_file():
            return direct

        # Relative to project or upload dir
        relative_upload = Path(settings.upload_dir) / os.path.basename(clean_path)
        if relative_upload.exists() and relative_upload.is_file():
            return relative_upload

        return None

    def _load_pil_image(
        self, image_input: Union[str, Path, Image.Image, bytes]
    ) -> Optional[Image.Image]:
        """
        Safely loads and validates a PIL Image from multiple input types.
        Returns None if image is missing, corrupted, or unreadable.
        """
        if image_input is None:
            return None

        try:
            if isinstance(image_input, Image.Image):
                return image_input.convert("RGB")

            if isinstance(image_input, (bytes, bytearray)):
                img = Image.open(io.BytesIO(image_input))
                img.verify()
                # Reopen for actual decoding after verify
                return Image.open(io.BytesIO(image_input)).convert("RGB")

            if isinstance(image_input, (str, Path)):
                file_path = self.resolve_image_path(str(image_input))
                if not file_path:
                    logger.debug(f"Image path could not be resolved or does not exist: {image_input}")
                    return None

                # Open and verify image structure
                with open(file_path, "rb") as f:
                    data = f.read()
                if not data:
                    logger.warning(f"Image file is empty (0 bytes): {file_path}")
                    return None

                img = Image.open(io.BytesIO(data))
                img.verify()
                return Image.open(io.BytesIO(data)).convert("RGB")

        except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as e:
            logger.warning(f"Invalid or corrupted image data ({type(e).__name__}): {e}")
            return None
        except Exception as e:
            logger.warning(f"Unexpected error loading image: {e}")
            return None

        return None

    def extract_lightweight_embedding(self, image: Image.Image) -> List[float]:
        """
        Lightweight Computer Vision Feature Extractor.
        
        Extracts a deterministic, 512-dimensional normalized visual descriptor
        based on spatial-color histograms and directional luminance gradient energy.
        
        Provides real visual matching without downloading neural model weights:
        - Resizes to standard 128x128 resolution
        - Computes multi-channel color histograms across 5 spatial regions (4 quadrants + center)
        - Computes spatial luminance distribution and edge gradient energy
        - L2-normalizes to unit sphere (norm = 1.0) for standard cosine similarity
        """
        img = image.convert("RGB").resize((128, 128))
        arr = np.array(img, dtype=np.float32) / 255.0

        h, w, _ = arr.shape
        regions = [
            arr[:h // 2, :w // 2],          # Top-Left
            arr[:h // 2, w // 2:],          # Top-Right
            arr[h // 2:, :w // 2],          # Bottom-Left
            arr[h // 2:, w // 2:],          # Bottom-Right
            arr[h // 4:3 * h // 4, w // 4:3 * w // 4],  # Center focus
        ]

        features: List[float] = []

        # 1. Spatial Color Histograms (64 bins * 5 regions = 320 features)
        for reg in regions:
            for c in range(3):
                hist, _ = np.histogram(reg[:, :, c], bins=21, range=(0.0, 1.0))
                features.extend([float(x) for x in hist])  # 21 * 3 = 63 bins
            features.append(float(np.mean(reg)))           # 1 mean intensity bin

        # 2. Spatial 8x8 Luminance Grid (64 features)
        gray = 0.2989 * arr[:, :, 0] + 0.5870 * arr[:, :, 1] + 0.1140 * arr[:, :, 2]
        gray_uint8 = (np.clip(gray, 0.0, 1.0) * 255.0).astype(np.uint8)
        small_gray = np.array(Image.fromarray(gray_uint8).resize((8, 8))) / 255.0
        features.extend([float(x) for x in small_gray.flatten()])

        # 3. Horizontal and Vertical Edge Gradients (64 + 64 = 128 features)
        gx = np.abs(np.diff(gray, axis=1))
        gy = np.abs(np.diff(gray, axis=0))
        gx_uint8 = (np.clip(gx, 0.0, 1.0) * 255.0).astype(np.uint8)
        gy_uint8 = (np.clip(gy, 0.0, 1.0) * 255.0).astype(np.uint8)
        small_gx = np.array(Image.fromarray(gx_uint8).resize((8, 8))) / 255.0
        small_gy = np.array(Image.fromarray(gy_uint8).resize((8, 8))) / 255.0
        features.extend([float(x) for x in small_gx.flatten()])
        features.extend([float(x) for x in small_gy.flatten()])

        # Truncate or pad to exactly 512 dimensions
        vec = np.array(features[:512], dtype=np.float32)
        if len(vec) < 512:
            vec = np.pad(vec, (0, 512 - len(vec)), "constant")

        # L2 unit normalization
        norm = np.linalg.norm(vec)
        if norm > 1e-8:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return [round(float(val), 5) for val in vec]

    def generate_embedding(
        self, image_input: Union[str, Path, Image.Image, bytes, None]
    ) -> Optional[List[float]]:
        """
        Generate a normalized 512-dimensional vector embedding for an image.
        
        Returns:
            List[float] of length 512, or None if image is missing, corrupt, or unreadable.
        """
        if image_input is None:
            return None

        pil_image = self._load_pil_image(image_input)
        if pil_image is None:
            return None

        # Check if running CLIP model or lightweight CV
        model = self._get_model()

        if model is not None:
            try:
                raw_emb = model.encode(pil_image)
                vec = np.array(raw_emb, dtype=np.float32).flatten()
                norm = np.linalg.norm(vec)
                if norm > 1e-8:
                    vec = vec / norm
                return [round(float(x), 5) for x in vec]
            except Exception as e:
                logger.warning(
                    f"CLIP embedding generation failed: {e}. "
                    "Falling back to lightweight computer vision feature extractor."
                )
                self._load_failed = True
                self._active_engine = "lightweight"

        # Lightweight fallback
        return self.extract_lightweight_embedding(pil_image)


# Global default instance
image_embedding_service = ImageEmbeddingService()
