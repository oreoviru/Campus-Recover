"""
Campus Recover — Database Session Management

Provides the SQLAlchemy engine, session factory, and Base class.
All models inherit from Base. All routes use get_db() for sessions.
Compatible with PostgreSQL (production/docker) and SQLite (testing/local fallback).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# Engine configuration depending on DB dialect
engine_kwargs = {
    "echo": settings.debug,
}

if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

# Create the SQLAlchemy engine
engine = create_engine(settings.database_url, **engine_kwargs)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """
    Dependency that provides a database session.
    Ensures the session is closed after the request completes.

    Usage in FastAPI:
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
