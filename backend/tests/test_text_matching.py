"""
Campus Recover — Unit Tests for TextMatchingService
"""

import pytest
from app.ai.text_matching import TextMatchingService


class DummyItem:
    def __init__(self, title: str, description: str, text_embedding=None):
        self.title = title
        self.description = description
        self.text_embedding = text_embedding


def test_text_embedding_generation():
    service = TextMatchingService()
    embedding = service.generate_embedding("Space Gray MacBook Pro 14 inch")

    assert isinstance(embedding, list)
    assert len(embedding) == 384
    assert all(isinstance(x, float) for x in embedding)


def test_empty_text_embedding():
    service = TextMatchingService()
    embedding = service.generate_embedding("")

    assert isinstance(embedding, list)
    assert len(embedding) == 384


def test_identical_text_similarity():
    service = TextMatchingService()
    text = "Blue hydro flask water bottle 32oz"
    score = service.compute_text_similarity(text, text)

    assert score >= 0.99


def test_semantic_similarity_vs_unrelated():
    service = TextMatchingService()
    query = "Apple laptop MacBook Pro with charger"
    related = "MacBook Air 13-inch space gray notebook"
    unrelated = "Red wool winter scarf left in gym"

    sim_related = service.compute_text_similarity(query, related)
    sim_unrelated = service.compute_text_similarity(query, unrelated)

    assert sim_related > sim_unrelated
    assert sim_related > 0.30


def test_compare_items():
    service = TextMatchingService()
    item_lost = DummyItem(
        title="Black Sony Noise Canceling Headphones",
        description="Lost near the library study tables. Model WH-1000XM4.",
    )
    item_found = DummyItem(
        title="Sony Over-Ear Black Headphones",
        description="Found on a 2nd floor library desk.",
    )
    item_other = DummyItem(
        title="Chemistry Lab Safety Glasses",
        description="Clear plastic goggles left in chemistry room.",
    )

    score_match, details_match = service.compare_items(item_lost, item_found)
    score_other, details_other = service.compare_items(item_lost, item_other)

    assert score_match > score_other
    assert score_match > 0.60
    assert "title_similarity" in details_match
    assert "description_similarity" in details_match
    assert "composite_similarity" in details_match
