"""
Campus Recover — Unit Tests for AttributeMatchingService
"""

import pytest
from app.ai.attribute_matching import AttributeMatchingService
from app.models.enums import ItemCategory


class DummyAttrItem:
    def __init__(
        self,
        category=ItemCategory.ELECTRONICS,
        subcategory=None,
        color=None,
        brand=None,
        serial_number=None,
        distinguishing_marks=None,
    ):
        self.category = category
        self.subcategory = subcategory
        self.color = color
        self.brand = brand
        self.serial_number = serial_number
        self.distinguishing_marks = distinguishing_marks


def test_category_exact_match():
    service = AttributeMatchingService()
    assert service.compute_category_score(ItemCategory.ELECTRONICS, ItemCategory.ELECTRONICS) == 1.0


def test_category_incompatible():
    service = AttributeMatchingService()
    assert service.compute_category_score(ItemCategory.ELECTRONICS, ItemCategory.CLOTHING) == 0.0


def test_color_family_match():
    service = AttributeMatchingService()

    # "space gray" and "silver" belong to gray family
    assert service.compute_color_score("Space Gray", "Silver") >= 0.80

    # "midnight blue" and "navy" belong to blue family
    assert service.compute_color_score("Midnight Blue", "Navy") >= 0.80

    # Black vs White is mismatch
    assert service.compute_color_score("Black", "White") <= 0.20


def test_brand_matching():
    service = AttributeMatchingService()

    assert service.compute_brand_score("Apple", "apple") == 1.0
    assert service.compute_brand_score("The North Face", "North Face") >= 0.90
    assert service.compute_brand_score("Apple", "Samsung") == 0.0


def test_serial_number_exact_match():
    service = AttributeMatchingService()

    # Identical serials
    assert service.compute_serial_score("C02XG123456", "c02-xg123456") == 1.0

    # Conflicting serials
    assert service.compute_serial_score("C02XG123456", "S9988776655") == 0.0

    # One missing
    assert service.compute_serial_score("C02XG123456", None) is None


def test_compare_items_exact_serial_boost():
    service = AttributeMatchingService()

    item_a = DummyAttrItem(
        category=ItemCategory.ELECTRONICS,
        brand="Apple",
        color="Space Gray",
        serial_number="C02-ABC-123",
    )
    item_b = DummyAttrItem(
        category=ItemCategory.ELECTRONICS,
        brand="Apple",
        color="Space Gray",
        serial_number="C02ABC123",
    )

    score, details = service.compare_items(item_a, item_b)
    assert score == 1.0
    assert details["serial_score"] == 1.0


def test_compare_items_conflicting_serial_penalty():
    service = AttributeMatchingService()

    item_a = DummyAttrItem(
        category=ItemCategory.ELECTRONICS,
        brand="Apple",
        color="Space Gray",
        serial_number="C02-AAA-111",
    )
    item_b = DummyAttrItem(
        category=ItemCategory.ELECTRONICS,
        brand="Apple",
        color="Space Gray",
        serial_number="C02-BBB-222",
    )

    score, details = service.compare_items(item_a, item_b)
    assert score <= 0.10
    assert details["serial_score"] == 0.0
