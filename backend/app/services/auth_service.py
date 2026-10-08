"""
Campus Recover — Auth Service Layer

Business logic for user registration, credential authentication, and JWT issuance.
"""

import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token


class AuthService:
    """Service providing core authentication and registration logic."""

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch user by lowercase email."""
        return db.query(User).filter(User.email == email.strip().lower()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user by UUID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def register_user(db: Session, register_data: UserRegister) -> User:
        """
        Register a new user after verifying email uniqueness and hashing password.
        """
        normalized_email = register_data.email.strip().lower()

        # Check existing user
        if AuthService.get_user_by_email(db, normalized_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this institutional email address already exists.",
            )

        # Hash password and create user
        db_user = User(
            name=register_data.name.strip(),
            email=normalized_email,
            password_hash=hash_password(register_data.password),
            role=register_data.role,
            student_id=register_data.student_id.strip() if register_data.student_id else None,
            is_active=True,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Validate credentials and active status.
        Raises HTTP 401 if credentials are invalid or user inactive.
        """
        normalized_email = email.strip().lower()
        user = AuthService.get_user_by_email(db, normalized_email)

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact campus security.",
            )

        return user

    @staticmethod
    def login_user(db: Session, login_data: UserLogin) -> Dict[str, Any]:
        """
        Authenticate user and return signed JWT token with user profile.
        """
        user = AuthService.authenticate_user(
            db=db,
            email=login_data.email,
            password=login_data.password,
        )

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
        token = create_access_token(data=token_payload)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user,
        }


auth_service = AuthService()
