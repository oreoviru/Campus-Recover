"""
Campus Recover — Admin Dashboard & Moderation Tests (Phase 11)

Tests:
1. Strict Role-Based Access Control (RBAC):
   - 401 when no token is provided
   - 403 when authenticated as STUDENT or STAFF
   - 200 when authenticated as ADMIN
2. KPI Metrics calculation (Overview stats, recovery rate)
3. Charts & Analytics telemetry
4. User management (listing, filtering, suspending, reactivating, preventing self-suspension)
5. Report moderation (listing, filtering, deleting)
6. Claims review & moderation (approving, rejecting)
7. Campus locations management (CRUD operations)
8. Suspicious activity detection & manual overrides (dismissing, manual flagging)
"""

import uuid
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from app.models.item import Item
from app.models.user import User
from app.models.claim import Claim
from app.models.campus_location import CampusLocation
from app.models.enums import ItemType, ItemStatus, ItemCategory, ClaimStatus, UserRole
from app.auth.jwt_handler import create_access_token


@pytest.fixture
def test_admin_user(db_session):
    user = User(
        name="Chief Administrator",
        email=f"admin_{uuid.uuid4().hex[:8]}@university.edu",
        password_hash="fakehash",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_student_user(db_session):
    user = User(
        name="Student User",
        email=f"student_{uuid.uuid4().hex[:8]}@student.university.edu",
        password_hash="fakehash",
        role=UserRole.STUDENT,
        student_id="STU-99001",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_staff_user(db_session):
    user = User(
        name="Campus Staff",
        email=f"staff_{uuid.uuid4().hex[:8]}@university.edu",
        password_hash="fakehash",
        role=UserRole.STAFF,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(test_admin_user):
    return create_access_token(
        data={"sub": str(test_admin_user.id), "email": test_admin_user.email, "role": "ADMIN"}
    )


@pytest.fixture
def student_token(test_student_user):
    return create_access_token(
        data={"sub": str(test_student_user.id), "email": test_student_user.email, "role": "STUDENT"}
    )


@pytest.fixture
def staff_token(test_staff_user):
    return create_access_token(
        data={"sub": str(test_staff_user.id), "email": test_staff_user.email, "role": "STAFF"}
    )


# ----------------------------------------------------------------------
# 1. Strict Role-Based Access Control
# ----------------------------------------------------------------------
def test_admin_rbac_unauthenticated(client: TestClient):
    """Accessing admin endpoints without token must return 401."""
    res = client.get("/api/v1/admin/stats")
    assert res.status_code == 401


def test_admin_rbac_student_forbidden(client: TestClient, student_token: str):
    """Students attempting to access admin endpoints must be rejected with 403."""
    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403
    assert "Access forbidden" in res.json()["error"]["message"]


def test_admin_rbac_staff_forbidden(client: TestClient, staff_token: str):
    """Staff attempting to access admin-only console must be rejected with 403."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403


def test_admin_rbac_admin_authorized(client: TestClient, admin_token: str):
    """Admin credentials successfully access admin endpoints with 200."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 200
    assert res.json()["success"] is True


# ----------------------------------------------------------------------
# 2. Executive Metrics & KPIs
# ----------------------------------------------------------------------
def test_admin_stats_calculation(client: TestClient, db_session, test_admin_user, admin_token):
    """Verify accurate aggregation of users, reports, claims, and recovery rate."""
    now = datetime.now(timezone.utc)

    # Create Lost and Found items
    lost_item_1 = Item(
        user_id=test_admin_user.id,
        type=ItemType.LOST,
        title="Lost Dell XPS",
        description="Silver laptop left in library",
        category=ItemCategory.ELECTRONICS,
        date_time=now,
        status=ItemStatus.RECOVERED,  # 1 recovered!
    )
    lost_item_2 = Item(
        user_id=test_admin_user.id,
        type=ItemType.LOST,
        title="Lost Blue Backpack",
        description="Bag with notebook",
        category=ItemCategory.BAGS,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    found_item = Item(
        user_id=test_admin_user.id,
        type=ItemType.FOUND,
        title="Found Silver Earbuds",
        description="AirPods Pro found in cafe",
        category=ItemCategory.ELECTRONICS,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    db_session.add_all([lost_item_1, lost_item_2, found_item])
    db_session.commit()

    # Create a pending claim
    claim = Claim(
        item_id=found_item.id,
        claimant_id=test_admin_user.id,
        submitted_answer="My name is engraved",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["total_users"] >= 1
    assert data["total_lost_reports"] >= 2
    assert data["total_found_reports"] >= 1
    assert data["total_recovered_items"] >= 1
    assert data["recovery_rate"] > 0
    assert data["pending_claims"] >= 1


# ----------------------------------------------------------------------
# 3. Charts & Analytics Telemetry
# ----------------------------------------------------------------------
def test_admin_charts_telemetry(client: TestClient, db_session, admin_token):
    """Verify charts data returns expected collections for Recharts."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/charts?days=14", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "lost_vs_found" in data
    assert "reports_over_time" in data
    assert isinstance(data["reports_over_time"], list)
    assert "categories" in data
    assert isinstance(data["categories"], list)
    assert "campus_locations" in data
    assert "recovery_breakdown" in data
    assert "overall_recovery_rate" in data


# ----------------------------------------------------------------------
# 4. User Administration & Suspension
# ----------------------------------------------------------------------
def test_admin_user_management(client: TestClient, db_session, test_student_user, test_admin_user, admin_token):
    """Admin can list users, search, and toggle suspension status."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List users
    res = client.get(f"/api/v1/admin/users?search={test_student_user.name}", headers=headers)
    assert res.status_code == 200
    users = res.json()["data"]
    assert any(u["id"] == str(test_student_user.id) for u in users)

    # 2. Suspend student user
    res = client.post(
        f"/api/v1/admin/users/{test_student_user.id}/toggle-status",
        headers=headers,
        json={"is_active": False, "reason": "Repeated false claim reports"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["is_active"] is False

    # 3. Verify user is now inactive in DB
    db_session.refresh(test_student_user)
    assert test_student_user.is_active is False

    # 4. Reactivate user
    res = client.post(
        f"/api/v1/admin/users/{test_student_user.id}/toggle-status",
        headers=headers,
        json={"is_active": True},
    )
    assert res.status_code == 200
    assert res.json()["data"]["is_active"] is True

    # 5. Prevent self-suspension by admin
    res = client.post(
        f"/api/v1/admin/users/{test_admin_user.id}/toggle-status",
        headers=headers,
        json={"is_active": False},
    )
    assert res.status_code == 400
    assert "cannot suspend their own account" in res.json()["error"]["message"]


# ----------------------------------------------------------------------
# 5. Report Moderation & Deletion
# ----------------------------------------------------------------------
def test_admin_report_deletion(client: TestClient, db_session, test_student_user, admin_token):
    """Admin can list reports and permanently delete spam/inappropriate reports."""
    now = datetime.now(timezone.utc)
    item = Item(
        user_id=test_student_user.id,
        type=ItemType.LOST,
        title="Spam Test Item to Delete",
        description="This is an offensive or test item",
        category=ItemCategory.OTHER,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List reports
    res = client.get("/api/v1/admin/reports", headers=headers)
    assert res.status_code == 200
    reports = res.json()["data"]
    assert any(r["id"] == str(item.id) for r in reports)

    # 2. Delete report
    res = client.delete(
        f"/api/v1/admin/reports/{item.id}?reason=Violates community guidelines",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 3. Verify deleted from DB
    deleted = db_session.get(Item, item.id)
    assert deleted is None


# ----------------------------------------------------------------------
# 6. Claims Administration & Review
# ----------------------------------------------------------------------
def test_admin_claims_review(client: TestClient, db_session, test_student_user, admin_token):
    """Admin can review, approve, and reject ownership claims."""
    now = datetime.now(timezone.utc)
    found_item = Item(
        user_id=test_student_user.id,
        type=ItemType.FOUND,
        title="Found Gold Watch",
        description="Found in sports complex",
        category=ItemCategory.ACCESSORIES,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    db_session.add(found_item)
    db_session.commit()

    claim = Claim(
        item_id=found_item.id,
        claimant_id=test_student_user.id,
        submitted_answer="Leather strap with engraved initials VS",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List claims
    res = client.get("/api/v1/admin/claims", headers=headers)
    assert res.status_code == 200
    claims = res.json()["data"]
    assert any(c["id"] == str(claim.id) for c in claims)

    # 2. Approve claim
    res = client.post(
        f"/api/v1/admin/claims/{claim.id}/approve?notes=Serial numbers match",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "APPROVED"

    db_session.refresh(claim)
    assert claim.status == ClaimStatus.APPROVED

    # 3. Reject claim
    res = client.post(
        f"/api/v1/admin/claims/{claim.id}/reject?notes=Discrepancy in watch color",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "REJECTED"


# ----------------------------------------------------------------------
# 7. Campus Locations Management
# ----------------------------------------------------------------------
def test_admin_locations_crud(client: TestClient, db_session, admin_token):
    """Admin can list, create, update, and delete campus locations."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a location
    loc_payload = {
        "name": "Design Innovation Lab",
        "description": "3D printers and fabrication lab",
        "latitude": 28.9845,
        "longitude": 77.0905,
        "building": "Block C",
        "floor": "Floor 2",
        "is_active": True,
    }
    res = client.post("/api/v1/admin/locations", headers=headers, json=loc_payload)
    assert res.status_code == 201
    created_loc = res.json()["data"]
    loc_id = created_loc["id"]
    assert created_loc["name"] == "Design Innovation Lab"

    # 2. List locations
    res = client.get("/api/v1/admin/locations", headers=headers)
    assert res.status_code == 200
    assert any(l["id"] == loc_id for l in res.json()["data"])

    # 3. Update location
    res = client.put(
        f"/api/v1/admin/locations/{loc_id}",
        headers=headers,
        json={"name": "Makerspace & Innovation Lab", "is_active": False},
    )
    assert res.status_code == 200
    assert res.json()["data"]["name"] == "Makerspace & Innovation Lab"
    assert res.json()["data"]["is_active"] is False

    # 4. Delete location
    res = client.delete(f"/api/v1/admin/locations/{loc_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["success"] is True


# ----------------------------------------------------------------------
# 8. Suspicious Activity Detection & Manual Overrides
# ----------------------------------------------------------------------
def test_admin_suspicious_activity(client: TestClient, db_session, test_student_user, admin_token):
    """Verify heuristic detection of spam/suspicious items and manual flag dismissal."""
    now = datetime.now(timezone.utc)
    spam_item = Item(
        user_id=test_student_user.id,
        type=ItemType.LOST,
        title="test fake item asdf",
        description="sample test blah blah",
        category=ItemCategory.OTHER,
        date_time=now,
        status=ItemStatus.ACTIVE,
    )
    db_session.add(spam_item)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Check suspicious activity list
    res = client.get("/api/v1/admin/suspicious", headers=headers)
    assert res.status_code == 200
    suspicious = res.json()["data"]
    # Spam heuristic should catch the item
    assert any(s.get("item_id") == str(spam_item.id) for s in suspicious)

    # 2. Dismiss flag
    res = client.post(f"/api/v1/admin/suspicious/{spam_item.id}/dismiss", headers=headers)
    assert res.status_code == 200

    # 3. Manually re-flag item
    res = client.post(
        f"/api/v1/admin/suspicious/{spam_item.id}/flag?reason=Requires+serial+number+verification",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
