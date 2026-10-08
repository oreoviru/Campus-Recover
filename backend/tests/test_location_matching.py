"""
Campus Recover — Unit Tests for LocationMatchingService
"""

import uuid
import pytest
from app.ai.location_matching import LocationMatchingService


class DummyLocationItem:
    def __init__(self, lat=None, lon=None, campus_location_id=None, location_name=None):
        self.latitude = lat
        self.longitude = lon
        self.campus_location_id = campus_location_id
        self.location_name = location_name


def test_haversine_distance_same_point():
    dist = LocationMatchingService.haversine_distance(40.7128, -74.0060, 40.7128, -74.0060)
    assert dist == pytest.approx(0.0, abs=1e-3)


def test_haversine_distance_known():
    # NYC to Philadelphia is ~130 km (130,000 m)
    dist = LocationMatchingService.haversine_distance(40.7128, -74.0060, 39.9526, -75.1652)
    assert 120_000 < dist < 140_000


def test_distance_to_score_decay():
    service = LocationMatchingService()

    score_0 = service.distance_to_score(0)
    score_30 = service.distance_to_score(30)
    score_150 = service.distance_to_score(150)
    score_400 = service.distance_to_score(400)
    score_900 = service.distance_to_score(900)
    score_3000 = service.distance_to_score(3000)

    assert score_0 == 1.0
    assert 0.95 <= score_30 <= 1.0
    assert 0.75 <= score_150 < 0.95
    assert 0.50 <= score_400 < 0.75
    assert 0.20 <= score_900 < 0.50
    assert score_3000 == 0.0


def test_same_building_high_score():
    service = LocationMatchingService()
    shared_loc_id = uuid.uuid4()

    item_a = DummyLocationItem(lat=40.7128, lon=-74.0060, campus_location_id=shared_loc_id, location_name="Room 204")
    item_b = DummyLocationItem(lat=40.7129, lon=-74.0061, campus_location_id=shared_loc_id, location_name="Room 204")

    score, details = service.compare_items(item_a, item_b)

    assert score >= 0.90
    assert details["same_building"] is True
    assert details["distance_meters"] < 25


def test_different_buildings():
    service = LocationMatchingService()

    item_a = DummyLocationItem(lat=40.7128, lon=-74.0060, campus_location_id=uuid.uuid4(), location_name="Library Tower")
    item_b = DummyLocationItem(lat=40.7300, lon=-74.0300, campus_location_id=uuid.uuid4(), location_name="Athletic Complex")

    score, details = service.compare_items(item_a, item_b)

    assert score < 0.25
    assert details["same_building"] is False
