"""
Campus Recover — Database Session Management

Provides the SQLAlchemy engine, session factory, and Base class.
All models inherit from Base. All routes use get_db() for sessions.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


# Create the SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    echo=settings.debug,  # Log SQL in dev mode
    pool_pre_ping=True,   # Verify connections before use
    pool_size=10,
    max_overflow=20,
)

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
