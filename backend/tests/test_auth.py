"""
Campus Recover — Authentication & Authorization Integration Tests
"""

import uuid
from app.models.user import User
from app.models.enums import UserRole
from app.auth.password import hash_password
from app.auth.jwt_handler import create_access_token


def test_valid_registration(client):
    """Test registering a new student with an authorized institutional email."""
    unique_email = f"student_{uuid.uuid4().hex[:6]}@student.university.edu"
    payload = {
        "name": "Alex Rivera",
        "email": unique_email,
        "password": "Password123!",
        "role": "STUDENT",
        "student_id": "STU-55443",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201

    body = response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["token_type"] == "bearer"
    assert body["data"]["user"]["email"] == unique_email
    assert body["data"]["user"]["role"] == "STUDENT"
    assert "password" not in body["data"]["user"]
    assert "password_hash" not in body["data"]["user"]


def test_invalid_email_domain_registration(client):
    """Test registration rejection when using non-institutional domain."""
    payload = {
        "name": "Alex Hacker",
        "email": "alex@gmail.com",  # Not allowed
        "password": "Password123!",
        "role": "STUDENT",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert "error" in body


def test_short_password_registration_fails(client):
    """Test registration rejection when password is shorter than 6 characters."""
    unique_email = f"user_{uuid.uuid4().hex[:6]}@student.university.edu"
    payload = {
        "name": "Alex Small",
        "email": unique_email,
        "password": "123",
        "role": "STUDENT",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_admin_self_registration_prevented(client):
    """Test that users cannot register as ADMIN directly."""
    unique_email = f"fakeadmin_{uuid.uuid4().hex[:6]}@university.edu"
    payload = {
        "name": "Fake Admin",
        "email": unique_email,
        "password": "Password123!",
        "role": "ADMIN",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_duplicate_email_registration_fails(client):
    """Test that duplicate email registration returns 400 error."""
    unique_email = f"dup_{uuid.uuid4().hex[:6]}@student.university.edu"
    payload = {
        "name": "First User",
        "email": unique_email,
        "password": "Password123!",
        "role": "STUDENT",
    }
    res1 = client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["error"]["message"]


def test_login_success(client, db_session):
    """Test logging in with valid credentials returns JWT token."""
    email = f"login_{uuid.uuid4().hex[:6]}@university.edu"
    password = "CorrectPassword123"
    user = User(
        name="Staff Member",
        email=email,
        password_hash=hash_password(password),
        role=UserRole.STAFF,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["user"]["email"] == email
    assert body["data"]["user"]["role"] == "STAFF"


def test_login_wrong_password(client, db_session):
    """Test login failure with incorrect password."""
    email = f"wrong_{uuid.uuid4().hex[:6]}@university.edu"
    user = User(
        name="Test User",
        email=email,
        password_hash=hash_password("Secret123"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        json={"email": email, "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["error"]["message"]


def test_get_current_user_profile(client, db_session):
    """Test fetching /auth/me with Bearer access token."""
    user = User(
        name="Profile User",
        email=f"profile_{uuid.uuid4().hex[:6]}@student.university.edu",
        password_hash=hash_password("Pass123"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == user.email
    assert body["data"]["name"] == "Profile User"


def test_unauthorized_request_without_token(client):
    """Test that requesting protected route without token yields 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_role_based_access_control(client, db_session):
    """Test that student is rejected (403) from admin endpoint and admin is allowed (200)."""
    # Create student
    student = User(
        name="Regular Student",
        email=f"student_{uuid.uuid4().hex[:6]}@student.university.edu",
        password_hash=hash_password("Pass123"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    # Create admin
    admin = User(
        name="Admin User",
        email=f"admin_{uuid.uuid4().hex[:6]}@university.edu",
        password_hash=hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add_all([student, admin])
    db_session.commit()

    student_token = create_access_token({"sub": str(student.id), "email": student.email, "role": student.role.value})
    admin_token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role.value})

    # Student accessing admin route -> 403 Forbidden
    res_student = client.get(
        "/auth/admin-check",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_student.status_code == 403
    assert "Access forbidden" in res_student.json()["error"]["message"]

    # Admin accessing admin route -> 200 OK
    res_admin = client.get(
        "/auth/admin-check",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["success"] is True
    assert res_admin.json()["data"]["role"] == "ADMIN"
