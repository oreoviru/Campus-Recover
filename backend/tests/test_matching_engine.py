"""
Campus Recover — Unit Tests for MatchingEngineService
"""

import uuid
from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.match import Match
from app.models.enums import ItemType, ItemStatus, ItemCategory, MatchStatus
from app.ai.engine import MatchingEngineService


def test_score_pair_integration():
    engine = MatchingEngineService()
    now = datetime.now(timezone.utc)

    shared_loc = uuid.uuid4()

    lost_laptop = Item(
        id=uuid.uuid4(),
        type=ItemType.LOST,
        title="14-inch Apple MacBook Pro M2 Space Gray",
        description="Lost in the library 2nd floor study carrel. Has a blue sticker on lid.",
        category=ItemCategory.ELECTRONICS,
        subcategory="Laptop",
        color="Space Gray",
        brand="Apple",
        serial_number="C02XYZ12345",
        campus_location_id=shared_loc,
        location_name="Library 2nd Floor Carrel",
        latitude=40.7128,
        longitude=-74.0060,
        date_time=now - timedelta(hours=3),
        status=ItemStatus.ACTIVE,
    )

    found_laptop = Item(
        id=uuid.uuid4(),
        type=ItemType.FOUND,
        title="Apple MacBook Pro Space Gray",
        description="Found in library second floor desk area.",
        category=ItemCategory.ELECTRONICS,
        subcategory="Laptop",
        color="Space Gray",
        brand="Apple",
        serial_number="C02XYZ12345",
        campus_location_id=shared_loc,
        location_name="Library 2nd Floor Desks",
        latitude=40.7129,
        longitude=-74.0061,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )

    score, breakdown = engine.score_pair(lost_laptop, found_laptop)

    assert score >= 0.85
    assert breakdown["confidence_level"] == "Highly Likely Match"
    assert breakdown["normalized_without_image"] is True
    assert breakdown["signals"]["text"]["score"] > 0.70
    assert breakdown["signals"]["location"]["score"] > 0.90
    assert breakdown["signals"]["time"]["score"] > 0.95
    assert breakdown["signals"]["attributes"]["score"] == 1.0  # Identical serial number


def test_score_pair_with_images_integration():
    engine = MatchingEngineService()
    now = datetime.now(timezone.utc)

    # Unit dummy vectors simulating image embeddings
    vec1 = [0.0] * 512
    vec1[0] = 1.0
    vec2 = [0.0] * 512
    vec2[0] = 0.95
    vec2[1] = 0.312  # unit norm roughly

    lost_with_img = Item(
        id=uuid.uuid4(),
        type=ItemType.LOST,
        title="Red Backpack",
        description="Lost red backpack",
        category=ItemCategory.BAGS,
        date_time=now,
        status=ItemStatus.ACTIVE,
        image_url="/uploads/red_bag.jpg",
        image_embedding=vec1,
    )
    found_with_img = Item(
        id=uuid.uuid4(),
        type=ItemType.FOUND,
        title="Red Backpack",
        description="Found red backpack",
        category=ItemCategory.BAGS,
        date_time=now,
        status=ItemStatus.ACTIVE,
        image_url="/uploads/found_bag.jpg",
        image_embedding=vec2,
    )

    score, breakdown = engine.score_pair(lost_with_img, found_with_img)
    assert breakdown["normalized_without_image"] is False
    assert breakdown["signals"]["image"]["status"] == "AVAILABLE"
    assert breakdown["signals"]["image"]["score"] is not None
    assert breakdown["signals"]["image"]["effective_weight"] == 0.30


def test_process_new_item_lost_finds_found(db_session: Session):
    engine = MatchingEngineService(match_threshold=0.45)
    now = datetime.now(timezone.utc)

    # 1. Existing Found Items in DB
    found_item_match = Item(
        id=uuid.uuid4(),
        type=ItemType.FOUND,
        title="Sony Noise Canceling WH-1000XM4 Headphones",
        description="Found black headphones on a bench in the student union atrium.",
        category=ItemCategory.ELECTRONICS,
        subcategory="Headphones",
        color="Black",
        brand="Sony",
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    found_item_unrelated = Item(
        id=uuid.uuid4(),
        type=ItemType.FOUND,
        title="Red Patagonia Winter Jacket",
        description="Turned in heavy winter jacket left in dining hall.",
        category=ItemCategory.CLOTHING,
        subcategory="Jacket",
        color="Red",
        brand="Patagonia",
        date_time=now,
        status=ItemStatus.ACTIVE,
    )

    db_session.add(found_item_match)
    db_session.add(found_item_unrelated)
    db_session.commit()

    # 2. New Lost Item created
    new_lost_item = Item(
        id=uuid.uuid4(),
        type=ItemType.LOST,
        title="Black Sony Headphones",
        description="I lost my Sony over-ear noise canceling headphones around student union.",
        category=ItemCategory.ELECTRONICS,
        subcategory="Headphones",
        color="Black",
        brand="Sony",
        date_time=now - timedelta(hours=2),
        status=ItemStatus.ACTIVE,
    )
    db_session.add(new_lost_item)
    db_session.commit()

    # 3. Process matching
    results = engine.process_new_item(db=db_session, new_item=new_lost_item, save_matches=True)

    assert len(results) > 0
    top_match = results[0]

    assert top_match["candidate_item"].id == found_item_match.id
    assert top_match["overall_score"] >= 0.60
    assert top_match["is_saved_match"] is True
    assert top_match["lost_item_id"] == new_lost_item.id
    assert top_match["found_item_id"] == found_item_match.id

    # Verify Match record persisted in DB
    saved_match = db_session.get(Match, top_match["match_id"])
    assert saved_match is not None
    assert saved_match.status == MatchStatus.PENDING
    assert saved_match.overall_score == top_match["overall_score"]


def test_process_new_item_found_finds_lost_reverse(db_session: Session):
    engine = MatchingEngineService(match_threshold=0.45)
    now = datetime.now(timezone.utc)

    # 1. Existing Lost Item
    existing_lost = Item(
        id=uuid.uuid4(),
        type=ItemType.LOST,
        title="Hydro Flask 32oz Wide Mouth (Navy Blue)",
        description="Left water bottle in gym locker room.",
        category=ItemCategory.SPORTS,
        subcategory="Water Bottle",
        color="Navy Blue",
        brand="Hydro Flask",
        date_time=now - timedelta(hours=5),
        status=ItemStatus.ACTIVE,
    )
    db_session.add(existing_lost)
    db_session.commit()

    # 2. New Found Item
    new_found = Item(
        id=uuid.uuid4(),
        type=ItemType.FOUND,
        title="Navy Blue Metal Water Bottle - Hydro Flask",
        description="Found in athletic gym locker area.",
        category=ItemCategory.SPORTS,
        subcategory="Water Bottle",
        color="Blue",
        brand="Hydro Flask",
        date_time=now - timedelta(hours=1),
        status=ItemStatus.ACTIVE,
    )
    db_session.add(new_found)
    db_session.commit()

    # 3. Process matching for the new FOUND item
    results = engine.process_new_item(db=db_session, new_item=new_found, save_matches=True)

    assert len(results) > 0
    top = results[0]
    assert top["candidate_item"].id == existing_lost.id
    assert top["lost_item_id"] == existing_lost.id
    assert top["found_item_id"] == new_found.id
    assert top["is_saved_match"] is True
