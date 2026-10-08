"""
Campus Recover — Unit Tests for TimeMatchingService
"""

from datetime import datetime, timezone, timedelta
import pytest

from app.ai.time_matching import TimeMatchingService
from app.models.enums import ItemType


class DummyTimeItem:
    def __init__(self, date_time: datetime, item_type: ItemType):
        self.date_time = date_time
        self.type = item_type


def test_found_within_few_hours_after_lost():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)
    lost_time = now - timedelta(hours=4)
    found_time = now

    score, details = service.compute_time_score(lost_time, found_time)

    assert score >= 0.98
    assert details["is_causally_valid"] is True
    assert details["difference_hours"] == pytest.approx(4.0, abs=0.1)


def test_found_several_days_later():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)
    lost_time = now - timedelta(days=5)
    found_time = now

    score, details = service.compute_time_score(lost_time, found_time)

    assert 0.65 <= score <= 0.85
    assert details["is_causally_valid"] is True


def test_found_months_later():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)
    lost_time = now - timedelta(days=90)
    found_time = now

    score, details = service.compute_time_score(lost_time, found_time)

    assert score < 0.20


def test_small_negative_skew_tolerance():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)
    # Lost reported at 2:00 PM, found timestamp is 1:00 PM (1h reporting estimation discrepancy)
    lost_time = now
    found_time = now - timedelta(hours=1)

    score, details = service.compute_time_score(lost_time, found_time)

    assert score >= 0.80
    assert details["is_causally_valid"] is True


def test_large_negative_skew_penalty():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)
    # Found 10 days before lost (impossible causal order)
    lost_time = now
    found_time = now - timedelta(days=10)

    score, details = service.compute_time_score(lost_time, found_time)

    assert score <= 0.10
    assert details["is_causally_valid"] is False


def test_compare_items_autodetects_types():
    service = TimeMatchingService()
    now = datetime.now(timezone.utc)

    lost_item = DummyTimeItem(date_time=now - timedelta(hours=2), item_type=ItemType.LOST)
    found_item = DummyTimeItem(date_time=now, item_type=ItemType.FOUND)

    score, details = service.compare_items(lost_item, found_item)
    assert score >= 0.98

    # Reverse order passed in arguments
    score_rev, details_rev = service.compare_items(found_item, lost_item)
    assert score_rev == score
