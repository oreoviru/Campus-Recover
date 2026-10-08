"""
Campus Recover — Password & Secret Hashing Utilities

Uses direct bcrypt hashing for maximum performance and compatibility with
modern Python versions (3.11 - 3.14+) without passlib deprecation issues.
"""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with automatic salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def hash_verification_answer(answer: str) -> str:
    """Normalize and hash a private verification challenge answer."""
    normalized = answer.strip().lower()
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(normalized.encode("utf-8"), salt).decode("utf-8")


def verify_verification_answer(submitted_answer: str, hashed_answer: str) -> bool:
    """Verify a claimant's submitted answer against the stored answer hash."""
    try:
        normalized = submitted_answer.strip().lower()
        return bcrypt.checkpw(
            normalized.encode("utf-8"),
            hashed_answer.encode("utf-8"),
        )
    except Exception:
        return False
