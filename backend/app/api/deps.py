"""
Campus Recover — API Dependencies

Shared FastAPI dependencies used across routes:
- get_db: Database session
- get_current_user: JWT-authenticated user
- require_admin: Admin-only access
"""

# Database dependency is re-exported from database.session
from app.database.session import get_db  # noqa: F401

# Auth dependencies will be added in Phase 3:
# from app.auth.jwt_handler import get_current_user, require_admin
