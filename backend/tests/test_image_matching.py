"""
Campus Recover — Image Matching & Embedding Unit Tests (Phase 7)
"""

import os
import tempfile
from PIL import Image
import pytest

from app.ai.image_embedding import ImageEmbeddingService, image_embedding_service
from app.ai.image_matching import ImageMatchingService, image_matching_service
from app.ai.scoring import MatchScoringService


@pytest.fixture
def temp_images_dir():
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield tmp_dir


@pytest.fixture
def sample_red_image(temp_images_dir):
    img = Image.new("RGB", (100, 100), color=(220, 20, 20))
    path = os.path.join(temp_images_dir, "red_phone.jpg")
    img.save(path)
    return path


@pytest.fixture
def sample_red_similar_image(temp_images_dir):
    img = Image.new("RGB", (110, 110), color=(210, 30, 25))
    path = os.path.join(temp_images_dir, "red_phone_angle2.jpg")
    img.save(path)
    return path


@pytest.fixture
def sample_blue_image(temp_images_dir):
    img = Image.new("RGB", (100, 100), color=(10, 40, 210))
    path = os.path.join(temp_images_dir, "blue_bottle.jpg")
    img.save(path)
    return path


@pytest.fixture
def sample_corrupt_file(temp_images_dir):
    path = os.path.join(temp_images_dir, "corrupt.jpg")
    with open(path, "wb") as f:
        f.write(b"NOT_A_VALID_IMAGE_FILE_RANDOM_BYTES_XYZ")
    return path


@pytest.fixture
def sample_empty_file(temp_images_dir):
    path = os.path.join(temp_images_dir, "empty.jpg")
    with open(path, "wb") as f:
        pass
    return path


class DummyItem:
    def __init__(self, image_url=None, image_embedding=None):
        self.image_url = image_url
        self.image_embedding = image_embedding


# --- ImageEmbeddingService Tests ---

def test_image_embedding_generation_from_pil():
    img = Image.new("RGB", (80, 80), color=(50, 100, 150))
    emb = image_embedding_service.generate_embedding(img)
    assert emb is not None
    assert isinstance(emb, list)
    assert len(emb) == 512
    assert all(isinstance(x, float) for x in emb)


def test_image_embedding_generation_from_file(sample_red_image):
    emb = image_embedding_service.generate_embedding(sample_red_image)
    assert emb is not None
    assert len(emb) == 512


def test_image_embedding_missing_or_empty_inputs(sample_empty_file):
    assert image_embedding_service.generate_embedding(None) is None
    assert image_embedding_service.generate_embedding("") is None
    assert image_embedding_service.generate_embedding("/non/existent/photo.jpg") is None
    assert image_embedding_service.generate_embedding(sample_empty_file) is None


def test_image_embedding_corrupt_image(sample_corrupt_file):
    emb = image_embedding_service.generate_embedding(sample_corrupt_file)
    assert emb is None


def test_lightweight_development_extractor(sample_red_image, sample_blue_image):
    lightweight_svc = ImageEmbeddingService(model_name="lightweight")
    assert lightweight_svc.active_engine == "lightweight"

    emb_red = lightweight_svc.generate_embedding(sample_red_image)
    emb_blue = lightweight_svc.generate_embedding(sample_blue_image)

    assert emb_red is not None and len(emb_red) == 512
    assert emb_blue is not None and len(emb_blue) == 512

    # Verify not fake: real vectors computed from image content
    assert emb_red != emb_blue


# --- ImageMatchingService Tests ---

def test_cosine_similarity_calculation():
    matcher = ImageMatchingService()
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert matcher.calculate_cosine_similarity(v1, v2) == 1.0

    v3 = [0.0, 1.0, 0.0]
    assert matcher.calculate_cosine_similarity(v1, v3) == 0.0


def test_compare_items_both_valid(sample_red_image, sample_red_similar_image):
    matcher = ImageMatchingService()
    item_a = DummyItem(image_url=sample_red_image)
    item_b = DummyItem(image_url=sample_red_similar_image)

    score, details = matcher.compare_items(item_a, item_b)
    assert score is not None
    assert 0.0 <= score <= 1.0
    assert details["status"] == "AVAILABLE"
    assert "similarity" in details


def test_compare_items_one_missing_image(sample_red_image):
    matcher = ImageMatchingService()
    item_a = DummyItem(image_url=sample_red_image)
    item_b = DummyItem(image_url=None)

    score, details = matcher.compare_items(item_a, item_b)
    assert score is None
    assert details["status"] == "UNAVAILABLE"
    assert details["item_a_has_image"] is True
    assert details["item_b_has_image"] is False


def test_compare_items_corrupt_image(sample_red_image, sample_corrupt_file):
    matcher = ImageMatchingService()
    item_a = DummyItem(image_url=sample_red_image)
    item_b = DummyItem(image_url=sample_corrupt_file)

    score, details = matcher.compare_items(item_a, item_b)
    assert score is None
    assert details["status"] == "UNAVAILABLE"


# --- MatchScoringService Phase 7 5-Dimensional Weights Tests ---

def test_match_scoring_5_dimensions_with_image():
    scorer = MatchScoringService()
    text_score = 0.80
    image_score = 0.90
    loc_score = 0.70
    time_score = 0.60
    attr_score = 0.50

    # Weights: Text 30%, Image 30%, Location 20%, Time 10%, Attributes 10%
    expected = (
        0.30 * text_score
        + 0.30 * image_score
        + 0.20 * loc_score
        + 0.10 * time_score
        + 0.10 * attr_score
    )

    overall, breakdown = scorer.calculate_overall_score(
        text_score=text_score,
        location_score=loc_score,
        time_score=time_score,
        attribute_score=attr_score,
        image_score=image_score,
    )

    assert pytest.approx(overall, abs=1e-3) == round(expected, 4)
    assert breakdown["normalized_without_image"] is False
    assert breakdown["signals"]["image"]["status"] == "AVAILABLE"
    assert breakdown["signals"]["image"]["score"] == 0.90
    assert breakdown["signals"]["image"]["base_weight"] == 0.30
    assert breakdown["signals"]["image"]["effective_weight"] == 0.30


def test_match_scoring_5_dimensions_without_image():
    scorer = MatchScoringService()
    text_score = 0.80
    loc_score = 0.70
    time_score = 0.60
    attr_score = 0.50

    # Available total weight = 0.30 + 0.20 + 0.10 + 0.10 = 0.70
    expected = (
        (0.30 / 0.70) * text_score
        + (0.20 / 0.70) * loc_score
        + (0.10 / 0.70) * time_score
        + (0.10 / 0.70) * attr_score
    )

    overall, breakdown = scorer.calculate_overall_score(
        text_score=text_score,
        location_score=loc_score,
        time_score=time_score,
        attribute_score=attr_score,
        image_score=None,
    )

    assert pytest.approx(overall, abs=1e-3) == round(expected, 4)
    assert breakdown["normalized_without_image"] is True
    assert breakdown["signals"]["image"]["status"] == "UNAVAILABLE"
    assert breakdown["signals"]["image"]["score"] is None
    assert breakdown["signals"]["image"]["effective_weight"] == 0.0
