"""
Campus Recover — Campus Map & Geospatial API Tests (Phase 10)

Tests:
- Map marker discovery and type/category filters
- Privacy requirement: coordinate generalization for sensitive/valuable items
- Hotspot density aggregation
- Nearby item proximity search with Haversine distance
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.item import Item
from app.models.campus_location import CampusLocation
from app.models.enums import UserRole, ItemType, ItemStatus, ItemCategory
from app.auth.jwt_handler import create_access_token


def get_token(user: User) -> str:
    return create_access_token(data={"sub": str(user.id), "role": user.role.value})


@pytest.fixture
def test_location(db_session: Session) -> CampusLocation:
    loc = CampusLocation(
        id=uuid.uuid4(),
        name="Science & Technology Center",
        description="Engineering hall and computer laboratories",
        latitude=40.7140,
        longitude=-74.0065,
        building="Tech Tower",
        floor="3rd Floor",
        is_active=True,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)
    return loc


@pytest.fixture
def owner_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"owner_{uuid.uuid4().hex[:6]}@nyu.edu",
        password_hash="hashedpass",
        name="MacBook Owner",
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4().hex[:6]}@nyu.edu",
        password_hash="hashedpass",
        name="Map Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_list_campus_locations(client: TestClient, test_location: CampusLocation):
    res = client.get("/api/v1/locations")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 1
    found = any(loc["id"] == str(test_location.id) for loc in data)
    assert found is True


def test_map_items_and_privacy_generalization(
    client: TestClient, db_session: Session, test_location: CampusLocation, owner_user: User, admin_user: User
):
    # Sensitive item: MacBook Pro (ELECTRONICS category)
    laptop = Item(
        id=uuid.uuid4(),
        user_id=owner_user.id,
        type=ItemType.LOST,
        title="MacBook Pro 16 Space Gray",
        description="Lost in Tech Tower 3rd floor lab 304 under table 4",
        category=ItemCategory.ELECTRONICS,
        campus_location_id=test_location.id,
        location_name="Lab 304 under table 4",
        latitude=40.714088,
        longitude=-74.006522,
        status=ItemStatus.ACTIVE,
        date_time=datetime.now(timezone.utc),
    )

    # Non-sensitive item: Blue Umbrella (OTHER category)
    umbrella = Item(
        id=uuid.uuid4(),
        user_id=owner_user.id,
        type=ItemType.FOUND,
        title="Blue Foldable Umbrella",
        description="Found by the entrance doors",
        category=ItemCategory.OTHER,
        campus_location_id=test_location.id,
        location_name="Entrance lobby",
        latitude=40.714010,
        longitude=-74.006490,
        status=ItemStatus.ACTIVE,
        date_time=datetime.now(timezone.utc),
    )

    db_session.add_all([laptop, umbrella])
    db_session.commit()

    # 1. Unauthenticated public request -> PRIVACY SHIELD ENFORCED for laptop!
    public_res = client.get("/api/v1/locations/map/items")
    assert public_res.status_code == 200
    markers = public_res.json()["data"]

    laptop_marker = next((m for m in markers if m["id"] == str(laptop.id)), None)
    umbrella_marker = next((m for m in markers if m["id"] == str(umbrella.id)), None)

    assert laptop_marker is not None
    assert umbrella_marker is not None

    # Laptop MUST have generalized location for public viewers
    assert laptop_marker["is_generalized_location"] is True
    assert "General Area" in laptop_marker["location_name"]
    # Coordinates should be snapped to building center (40.7140, -74.0065) instead of exact 40.714088
    assert laptop_marker["latitude"] == test_location.latitude
    assert laptop_marker["longitude"] == test_location.longitude

    # Umbrella is non-sensitive, so not generalized
    assert umbrella_marker["is_generalized_location"] is False

    # 2. Authenticated OWNER request -> Exact pinpoint coordinates visible!
    owner_token = get_token(owner_user)
    owner_res = client.get(
        "/api/v1/locations/map/items",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert owner_res.status_code == 200
    owner_markers = owner_res.json()["data"]
    laptop_owner = next(m for m in owner_markers if m["id"] == str(laptop.id))
    assert laptop_owner["is_generalized_location"] is False
    assert laptop_owner["latitude"] == 40.714088
    assert "Lab 304" in laptop_owner["location_name"]

    # 3. Authenticated ADMIN request -> Exact pinpoint coordinates visible!
    admin_token = get_token(admin_user)
    admin_res = client.get(
        "/api/v1/locations/map/items",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_res.status_code == 200
    admin_markers = admin_res.json()["data"]
    laptop_admin = next(m for m in admin_markers if m["id"] == str(laptop.id))
    assert laptop_admin["is_generalized_location"] is False


def test_campus_hotspots(client: TestClient, db_session: Session, test_location: CampusLocation, owner_user: User):
    # Add items to location
    for i in range(3):
        db_session.add(
            Item(
                id=uuid.uuid4(),
                user_id=owner_user.id,
                type=ItemType.LOST if i % 2 == 0 else ItemType.FOUND,
                title=f"Sample Item {i}",
                description="Hotspot test",
                category=ItemCategory.BOOKS,
                campus_location_id=test_location.id,
                latitude=40.7140,
                longitude=-74.0065,
                status=ItemStatus.ACTIVE,
                date_time=datetime.now(timezone.utc),
            )
        )
    db_session.commit()

    res = client.get("/api/v1/locations/hotspots")
    assert res.status_code == 200
    hotspots = res.json()["data"]
    assert len(hotspots) >= 1

    target_hotspot = next((h for h in hotspots if h["id"] == str(test_location.id)), None)
    assert target_hotspot is not None
    assert target_hotspot["total_count"] >= 3
    assert target_hotspot["density_score"] > 0.0


def test_nearby_items_search(client: TestClient, db_session: Session, test_location: CampusLocation, owner_user: User):
    item_close = Item(
        id=uuid.uuid4(),
        user_id=owner_user.id,
        type=ItemType.LOST,
        title="Keys with NYU Lanyard",
        description="Dropped right outside Tech Tower",
        category=ItemCategory.KEYS,
        campus_location_id=test_location.id,
        latitude=40.71405,  # ~10 meters away
        longitude=-74.00652,
        status=ItemStatus.ACTIVE,
        date_time=datetime.now(timezone.utc),
    )

    item_far = Item(
        id=uuid.uuid4(),
        user_id=owner_user.id,
        type=ItemType.FOUND,
        title="Far away water bottle",
        description="Found 10km away off campus",
        category=ItemCategory.OTHER,
        latitude=40.7800,  # ~7km north in Uptown
        longitude=-74.0065,
        status=ItemStatus.ACTIVE,
        date_time=datetime.now(timezone.utc),
    )

    db_session.add_all([item_close, item_far])
    db_session.commit()

    # Search within 200m radius of Tech Tower (40.7140, -74.0065)
    res = client.get(
        "/api/v1/locations/nearby",
        params={
            "latitude": 40.7140,
            "longitude": -74.0065,
            "radius_meters": 200.0,
        },
    )
    assert res.status_code == 200
    results = res.json()["data"]

    # Close item should be found, far item should be excluded!
    close_ids = [r["item"]["id"] for r in results]
    assert str(item_close.id) in close_ids
    assert str(item_far.id) not in close_ids

    # Distance calculation check
    found_entry = next(r for r in results if r["item"]["id"] == str(item_close.id))
    assert found_entry["distance_meters"] < 200.0
    assert "m" in found_entry["distance_display"]
    assert found_entry["proximity_score"] > 0.7
