"""
Campus Recover — Claims & Verification Unit Tests (Phase 8)
"""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.models.item import Item
from app.models.user import User
from app.models.claim import Claim
from app.models.enums import ItemType, ItemStatus, ItemCategory, ClaimStatus, UserRole
from app.auth.password import hash_verification_answer
from app.auth.jwt_handler import create_access_token


@pytest.fixture
def finder_user(db_session):
    user = User(
        name="Finder Alice",
        email=f"finder_{uuid.uuid4().hex[:8]}@student.university.edu",
        password_hash="fakehash",
        role=UserRole.STUDENT,
        student_id="STU-001",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def claimant_user(db_session):
    user = User(
        name="Claimant Bob",
        email=f"claimant_{uuid.uuid4().hex[:8]}@student.university.edu",
        password_hash="fakehash",
        role=UserRole.STUDENT,
        student_id="STU-002",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    user = User(
        name="Security Admin",
        email=f"admin_{uuid.uuid4().hex[:8]}@university.edu",
        password_hash="fakehash",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def third_party_user(db_session):
    user = User(
        name="Random Charlie",
        email=f"charlie_{uuid.uuid4().hex[:8]}@student.university.edu",
        password_hash="fakehash",
        role=UserRole.STUDENT,
        student_id="STU-003",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def found_item_with_question(db_session, finder_user):
    ans_hash = hash_verification_answer("NASA sticker on back")
    item = Item(
        user_id=finder_user.id,
        type=ItemType.FOUND,
        title="Silver MacBook Pro 14",
        description="Found in library study carrel.",
        category=ItemCategory.ELECTRONICS,
        date_time=datetime.now(timezone.utc),
        status=ItemStatus.ACTIVE,
        verification_question="What sticker is on the back cover?",
        verification_answer_hash=ans_hash,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


def test_get_verification_prompt(client: TestClient, claimant_user, found_item_with_question):
    token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/v1/claims/prompt/{found_item_with_question.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["has_verification_question"] is True
    assert data["verification_question"] == "What sticker is on the back cover?"
    assert "verification_answer_hash" not in data
    assert "hash" not in str(data)


def test_create_claim_valid(client: TestClient, claimant_user, found_item_with_question):
    token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "item_id": str(found_item_with_question.id),
        "submitted_answer": "It has a blue NASA sticker on the bottom left.",
    }
    res = client.post("/api/v1/claims", json=payload, headers=headers)
    assert res.status_code == 201
    claim_data = res.json()["data"]
    assert claim_data["status"] == "PENDING"
    assert claim_data["submitted_answer"] == payload["submitted_answer"]
    assert claim_data["verification_question"] == found_item_with_question.verification_question
    # Finder contact must NOT be exposed before approval
    assert claim_data["finder_contact"] is None
    assert "verification_answer_hash" not in claim_data


def test_create_claim_fraud_prevention_self_claim(client: TestClient, finder_user, found_item_with_question):
    token = create_access_token({"sub": str(finder_user.id), "role": finder_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "item_id": str(found_item_with_question.id),
        "submitted_answer": "My own item",
    }
    res = client.post("/api/v1/claims", json=payload, headers=headers)
    assert res.status_code == 400
    assert "reported" in res.json()["error"]["message"]


def test_create_claim_fraud_prevention_duplicate_pending(client: TestClient, claimant_user, found_item_with_question):
    token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "item_id": str(found_item_with_question.id),
        "submitted_answer": "First attempt",
    }
    client.post("/api/v1/claims", json=payload, headers=headers)

    # Second attempt should be rejected
    res2 = client.post("/api/v1/claims", json=payload, headers=headers)
    assert res2.status_code == 400
    assert "already have an active pending claim" in res2.json()["error"]["message"]


def test_finder_contact_hidden_before_approval(client: TestClient, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="NASA sticker on back",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/v1/claims/{claim.id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["data"]["finder_contact"] is None


def test_review_claim_approve_by_finder(client: TestClient, finder_user, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="NASA sticker on back",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(finder_user.id), "role": finder_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        f"/api/v1/claims/{claim.id}/review",
        json={"status": "APPROVED", "admin_notes": "Meet at Student Center Info Desk at 3 PM."},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "APPROVED"

    # Verify item status changed to CLAIMED
    db_session.refresh(found_item_with_question)
    assert found_item_with_question.status == ItemStatus.CLAIMED

    # Claimant can now see finder contact info!
    c_token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    c_res = client.get(f"/api/v1/claims/{claim.id}", headers={"Authorization": f"Bearer {c_token}"})
    claimant_view = c_res.json()["data"]
    assert claimant_view["finder_contact"] is not None
    assert claimant_view["finder_contact"]["name"] == finder_user.name
    assert claimant_view["finder_contact"]["email"] == finder_user.email


def test_review_claim_reject_by_finder(client: TestClient, finder_user, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="Wrong answer",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(finder_user.id), "role": finder_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        f"/api/v1/claims/{claim.id}/review",
        json={"status": "REJECTED", "admin_notes": "Incorrect description of stickers."},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "REJECTED"


def test_unauthorized_user_cannot_review(client: TestClient, third_party_user, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="Some answer",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(third_party_user.id), "role": third_party_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        f"/api/v1/claims/{claim.id}/review",
        json={"status": "APPROVED"},
        headers=headers,
    )
    assert res.status_code == 403


def test_admin_override(client: TestClient, admin_user, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="Valid proof",
        status=ClaimStatus.PENDING,
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        f"/api/v1/claims/{claim.id}/review",
        json={"status": "APPROVED", "admin_notes": "Admin verified serial number via student IT portal."},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "APPROVED"


def test_mark_item_recovered(client: TestClient, claimant_user, found_item_with_question, db_session):
    claim = Claim(
        item_id=found_item_with_question.id,
        claimant_id=claimant_user.id,
        submitted_answer="Valid proof",
        status=ClaimStatus.APPROVED,
    )
    found_item_with_question.status = ItemStatus.CLAIMED
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(claim)

    token = create_access_token({"sub": str(claimant_user.id), "role": claimant_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(f"/api/v1/claims/{claim.id}/recovered", headers=headers)
    assert res.status_code == 200

    db_session.refresh(found_item_with_question)
    assert found_item_with_question.status == ItemStatus.RECOVERED
