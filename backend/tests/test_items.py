"""
Campus Recover — Item CRUD API Integration Tests
"""

import uuid
from datetime import datetime, timezone


def test_create_lost_item(client):
    """Test creating a LOST item successfully."""
    payload = {
        "type": "LOST",
        "title": "Black AirPods Pro Case",
        "description": "Lost my black AirPods Pro 2 case near the library quiet study room.",
        "category": "ELECTRONICS",
        "subcategory": "Audio Accessories",
        "color": "Black",
        "brand": "Apple",
        "location_name": "Library Study Area",
        "date_time": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 201

    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "Black AirPods Pro Case"
    assert body["data"]["type"] == "LOST"
    assert body["data"]["status"] == "ACTIVE"
    assert body["data"]["category"] == "ELECTRONICS"
    assert "id" in body["data"]


def test_create_found_item_with_verification(client):
    """Test creating a FOUND item with private verification question & answer."""
    payload = {
        "type": "FOUND",
        "title": "Black wireless earbud charging case",
        "description": "Found a black case on a chair in the library.",
        "category": "ELECTRONICS",
        "color": "Black",
        "brand": "Apple",
        "location_name": "Library 2nd Floor",
        "date_time": datetime.now(timezone.utc).isoformat(),
        "verification_question": "What is the sticker on the back?",
        "verification_answer": "a red cat sticker",
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 201

    data = response.json()["data"]
    assert data["type"] == "FOUND"
    assert data["has_verification_question"] is True
    # Private answer must NEVER be present in the response
    assert "verification_answer" not in data
    assert "verification_answer_hash" not in data


def test_create_item_validation_failure(client):
    """Test validation errors on missing/invalid fields."""
    # Description too short
    payload = {
        "type": "LOST",
        "title": "A",
        "description": "Tiny",
        "category": "ELECTRONICS",
        "date_time": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert "error" in body


def test_create_item_question_without_answer_fails(client):
    """Test that providing verification_question without answer fails."""
    payload = {
        "type": "FOUND",
        "title": "Blue Umbrella",
        "description": "Found a blue umbrella near the entrance.",
        "category": "ACCESSORIES",
        "date_time": datetime.now(timezone.utc).isoformat(),
        "verification_question": "What brand is printed on it?",
        # verification_answer is missing!
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 422


def test_get_item_by_id(client):
    """Test retrieving an existing item by UUID."""
    # First create
    create_res = client.post(
        "/items",
        json={
            "type": "LOST",
            "title": "MacBook Air Charger",
            "description": "White 35W dual USB-C charger left in lecture hall 101.",
            "category": "ELECTRONICS",
            "color": "White",
            "brand": "Apple",
            "date_time": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["data"]["id"]

    # Now get
    get_res = client.get(f"/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == item_id
    assert get_res.json()["data"]["title"] == "MacBook Air Charger"


def test_get_nonexistent_item_returns_404(client):
    """Test that a random UUID returns 404."""
    random_uuid = str(uuid.uuid4())
    res = client.get(f"/items/{random_uuid}")
    assert res.status_code == 404
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "HTTP_404"


def test_list_items_with_filters_and_pagination(client):
    """Test listing items with type filter and pagination metadata."""
    now_iso = datetime.now(timezone.utc).isoformat()
    # Create 2 items
    client.post(
        "/items",
        json={
            "type": "LOST",
            "title": "Red Water Bottle",
            "description": "Stainless steel red bottle with scratches.",
            "category": "ACCESSORIES",
            "color": "Red",
            "date_time": now_iso,
        },
    )
    client.post(
        "/items",
        json={
            "type": "FOUND",
            "title": "Red Sports Bottle",
            "description": "Found red metal flask near the gym.",
            "category": "ACCESSORIES",
            "color": "Red",
            "date_time": now_iso,
        },
    )

    # Filter for LOST
    res_lost = client.get("/items?type=LOST&page=1&per_page=10")
    assert res_lost.status_code == 200
    body = res_lost.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    assert all(item["type"] == "LOST" for item in body["data"])
    assert body["meta"]["page"] == 1
    assert body["meta"]["total"] >= 1


def test_list_items_keyword_search(client):
    """Test search query parameter."""
    now_iso = datetime.now(timezone.utc).isoformat()
    client.post(
        "/items",
        json={
            "type": "LOST",
            "title": "Sony WH-1000XM5 Headphones",
            "description": "Silver over-ear noise canceling headphones.",
            "category": "ELECTRONICS",
            "brand": "Sony",
            "date_time": now_iso,
        },
    )

    # Search for "Sony"
    res = client.get("/items?search=Sony")
    assert res.status_code == 200
    items = res.json()["data"]
    assert any("Sony" in item["title"] or "Sony" in (item["brand"] or "") for item in items)


def test_update_item(client):
    """Test updating item status and details."""
    now_iso = datetime.now(timezone.utc).isoformat()
    create_res = client.post(
        "/items",
        json={
            "type": "LOST",
            "title": "Chemistry Binder",
            "description": "Black 3-ring binder with chem notes.",
            "category": "DOCUMENTS",
            "date_time": now_iso,
        },
    )
    item_id = create_res.json()["data"]["id"]

    # Update status to MATCHED and add distinguishing marks
    update_res = client.put(
        f"/items/{item_id}",
        json={
            "status": "MATCHED",
            "distinguishing_marks": "Jane Doe written on front page",
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()["data"]
    assert updated_data["status"] == "MATCHED"
    assert updated_data["distinguishing_marks"] == "Jane Doe written on front page"


def test_delete_item(client):
    """Test deleting an item."""
    now_iso = datetime.now(timezone.utc).isoformat()
    create_res = client.post(
        "/items",
        json={
            "type": "LOST",
            "title": "Keys on Lanyard",
            "description": "Set of 3 dorm keys on a blue university lanyard.",
            "category": "KEYS",
            "date_time": now_iso,
        },
    )
    item_id = create_res.json()["data"]["id"]

    # Delete
    del_res = client.delete(f"/items/{item_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify 404
    get_res = client.get(f"/items/{item_id}")
    assert get_res.status_code == 404
