"""
Campus Recover — Notification System Tests (Phase 9)

Tests notification persistence, unread counting, mark as read,
mark all as read, deletion, admin broadcast, and event triggers.
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.item import Item
from app.models.claim import Claim
from app.models.notification import Notification
from app.models.enums import UserRole, ItemType, ItemStatus, ItemCategory, ClaimStatus, NotificationType
from app.auth.jwt_handler import create_access_token
from app.services.notification_service import notification_service


def get_token(user: User) -> str:
    return create_access_token(data={"sub": str(user.id), "role": user.role.value})


@pytest.fixture
def student_user_a(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"student_a_{uuid.uuid4().hex[:6]}@nyu.edu",
        password_hash="hashedpassword123",
        name="Student Alice",
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def student_user_b(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"student_b_{uuid.uuid4().hex[:6]}@nyu.edu",
        password_hash="hashedpassword123",
        name="Student Bob",
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
        password_hash="hashedpassword123",
        name="Campus Security Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_create_and_list_notifications(client: TestClient, db_session: Session, student_user_a: User):
    token = get_token(student_user_a)

    # Initially empty
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] == 0
    assert data["unread_count"] == 0

    # Create 2 notifications directly via service
    notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.MATCH_FOUND,
        title="Potential Match Found",
        message="A 92% match has been computed for your lost keys.",
    )
    notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.CLAIM_APPROVED,
        title="Claim Approved",
        message="Your claim for Blue Backpack has been approved.",
    )

    # Verify list
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] == 2
    assert data["unread_count"] == 2
    assert len(data["notifications"]) == 2


def test_unread_count_endpoint(client: TestClient, db_session: Session, student_user_a: User):
    token = get_token(student_user_a)

    # 0 unread
    res = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["unread_count"] == 0

    # Add 1 alert
    notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.ADMIN_MESSAGE,
        title="Campus Notice",
        message="Library closing early tonight.",
    )

    res = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["unread_count"] == 1


def test_mark_as_read(client: TestClient, db_session: Session, student_user_a: User):
    token = get_token(student_user_a)

    notif = notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.MATCH_FOUND,
        title="New Match",
        message="A new match was found.",
    )
    assert notif.read is False

    # Mark as read
    res = client.post(
        f"/api/v1/notifications/{notif.id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["read"] is True

    # Check unread count is now 0
    res_count = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert res_count.json()["data"]["unread_count"] == 0


def test_mark_all_as_read(client: TestClient, db_session: Session, student_user_a: User):
    token = get_token(student_user_a)

    for i in range(3):
        notification_service.create_notification(
            db=db_session,
            user_id=student_user_a.id,
            type=NotificationType.MATCH_FOUND,
            title=f"Match #{i}",
            message=f"Detail #{i}",
        )

    res_count = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert res_count.json()["data"]["unread_count"] == 3

    # Mark all read
    res = client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["marked_read"] == 3

    # Verify unread count is now 0
    res_count = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert res_count.json()["data"]["unread_count"] == 0


def test_user_cannot_access_other_user_notification(
    client: TestClient, db_session: Session, student_user_a: User, student_user_b: User
):
    token_b = get_token(student_user_b)

    notif_a = notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.CLAIM_SUBMITTED,
        title="Alice's Notification",
        message="Private to Alice",
    )

    # Bob tries to mark Alice's notification as read
    res = client.post(
        f"/api/v1/notifications/{notif_a.id}/read",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 404

    # Bob tries to delete Alice's notification
    res_del = client.delete(
        f"/api/v1/notifications/{notif_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_del.status_code == 404


def test_delete_notification(client: TestClient, db_session: Session, student_user_a: User):
    token = get_token(student_user_a)

    notif = notification_service.create_notification(
        db=db_session,
        user_id=student_user_a.id,
        type=NotificationType.ADMIN_MESSAGE,
        title="To Delete",
        message="This will be dismissed",
    )

    res = client.delete(f"/api/v1/notifications/{notif.id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["deleted"] is True

    # Listing notifications returns empty
    res_list = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res_list.json()["data"]["total"] == 0


def test_admin_broadcast(client: TestClient, db_session: Session, admin_user: User, student_user_a: User):
    admin_token = get_token(admin_user)
    student_token = get_token(student_user_a)

    # Student cannot broadcast
    student_res = client.post(
        "/api/v1/notifications/admin-broadcast",
        json={"title": "Unauthorized", "message": "Should fail"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert student_res.status_code == 403

    # Admin broadcasts to student_user_a specifically
    admin_res = client.post(
        "/api/v1/notifications/admin-broadcast",
        json={
            "title": "Item ready for pickup",
            "message": "Your MacBook is ready at Kimmel Security Desk.",
            "target_user_id": str(student_user_a.id),
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_res.status_code == 200
    assert admin_res.json()["data"]["recipients_notified"] == 1

    # Student receives it
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert res.json()["data"]["total"] == 1
    item = res.json()["data"]["notifications"][0]
    assert item["type"] == NotificationType.ADMIN_MESSAGE.value
    assert "Item ready for pickup" in item["title"]


def test_claim_triggers_notifications(
    client: TestClient, db_session: Session, student_user_a: User, student_user_b: User
):
    token_a = get_token(student_user_a)
    token_b = get_token(student_user_b)

    # Bob reports a found item
    found_item = Item(
        id=uuid.uuid4(),
        user_id=student_user_b.id,
        type=ItemType.FOUND,
        title="Silver Hydroflask",
        description="Found at Silver Center 1st floor",
        category=ItemCategory.OTHER,
        status=ItemStatus.ACTIVE,
        verification_question="What stickers are on it?",
        verification_answer_hash="somehash123",
        date_time=datetime.now(timezone.utc),
    )
    db_session.add(found_item)
    db_session.commit()

    # Alice submits a claim on Bob's found item
    claim_res = client.post(
        "/api/v1/claims",
        json={
            "item_id": str(found_item.id),
            "submitted_answer": "NYU Violet sticker and NASA sticker",
        },
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert claim_res.status_code == 201
    claim_id = claim_res.json()["data"]["id"]

    # Bob (the finder) should have received a CLAIM_SUBMITTED notification!
    bob_notifs = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token_b}"})
    assert bob_notifs.status_code == 200
    bob_data = bob_notifs.json()["data"]
    assert bob_data["total"] == 1
    assert bob_data["notifications"][0]["type"] == NotificationType.CLAIM_SUBMITTED.value

    # Bob approves the claim
    approve_res = client.post(
        f"/api/v1/claims/{claim_id}/approve",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert approve_res.status_code == 200

    # Alice (claimant) should now receive a CLAIM_APPROVED notification!
    alice_notifs = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token_a}"})
    assert alice_notifs.status_code == 200
    alice_data = alice_notifs.json()["data"]
    assert alice_data["total"] == 1
    assert alice_data["notifications"][0]["type"] == NotificationType.CLAIM_APPROVED.value
