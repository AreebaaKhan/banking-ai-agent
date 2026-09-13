"""
Async SQLAlchemy engine and session factory.

Architecture decision: We use async SQLAlchemy because FastAPI is async-native
and our chat endpoints need non-blocking DB access while streaming AI responses.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Connection pool tuned for Neon serverless Postgres:
# - pool_pre_ping: test connections before use (detects Neon's idle disconnects)
# - pool_recycle: 300s matches Neon's ~5 min idle timeout
# - pool_timeout: fail fast if no connection available
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_pre_ping=True,
    pool_timeout=30,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a DB session per request, auto-closes."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
