"""
Campus Recover — Unit Tests for MatchScoringService
"""

import pytest
from app.ai.scoring import MatchScoringService


def test_default_weights_and_normalization_without_image():
    service = MatchScoringService()

    text_score = 0.80
    loc_score = 0.90
    time_score = 1.00
    attr_score = 0.70

    overall_score, breakdown = service.calculate_overall_score(
        text_score=text_score,
        location_score=loc_score,
        time_score=time_score,
        attribute_score=attr_score,
        image_score=None,
    )

    # Base weights: 0.30 text, 0.20 loc, 0.10 time, 0.10 attr = 0.70 total
    # Normalized weights:
    # text: 0.30 / 0.70 = ~0.4286
    # loc:  0.20 / 0.70 = ~0.2857
    # time: 0.10 / 0.70 = ~0.1429
    # attr: 0.10 / 0.70 = ~0.1429
    expected_score = (
        (0.30 / 0.70) * 0.80
        + (0.20 / 0.70) * 0.90
        + (0.10 / 0.70) * 1.00
        + (0.10 / 0.70) * 0.70
    )

    assert overall_score == pytest.approx(round(expected_score, 4), abs=1e-3)
    assert breakdown["normalized_without_image"] is True

    # Check that image is clearly labeled as UNAVAILABLE
    signals = breakdown["signals"]
    assert signals["image"]["status"] == "UNAVAILABLE"
    assert signals["image"]["score"] is None
    assert signals["image"]["effective_weight"] == 0.0
    assert len(signals["image"]["reason"]) > 0

    # Check available signal effective weights sum to 1.0
    effective_sum = sum(
        s["effective_weight"] for k, s in signals.items() if s["status"] == "AVAILABLE"
    )
    assert effective_sum == pytest.approx(1.0, abs=1e-3)


def test_scoring_with_image_present():
    service = MatchScoringService()

    overall_score, breakdown = service.calculate_overall_score(
        text_score=1.0,
        location_score=1.0,
        time_score=1.0,
        attribute_score=1.0,
        image_score=1.0,
    )

    assert overall_score == 1.0
    assert breakdown["normalized_without_image"] is False
    assert breakdown["signals"]["image"]["status"] == "AVAILABLE"
    assert breakdown["signals"]["image"]["effective_weight"] == pytest.approx(0.30, abs=1e-3)


def test_confidence_tiers():
    service = MatchScoringService()

    assert service.classify_confidence(0.95) == "Highly Likely Match"
    assert service.classify_confidence(0.80) == "Highly Likely Match"
    assert service.classify_confidence(0.72) == "Strong Potential Match"
    assert service.classify_confidence(0.65) == "Strong Potential Match"
    assert service.classify_confidence(0.50) == "Possible Match"
    assert service.classify_confidence(0.45) == "Possible Match"
    assert service.classify_confidence(0.30) == "Low Confidence"
