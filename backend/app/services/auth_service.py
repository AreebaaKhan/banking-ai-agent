"""
Authentication service — handles signup, login, token refresh, and logout.

Separation of concerns: API routes handle HTTP concerns (request/response),
this service handles business logic (validation, hashing, token creation).
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Session
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()


class AuthService:
    """Stateless service — each method receives db session from the route."""

    @staticmethod
    async def signup(
        db: AsyncSession, email: str, full_name: str, password: str, city: str | None = None
    ) -> dict:
        """Register a new user. Returns tokens + user data."""

        # Check if email already exists
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("An account with this email already exists")

        # Create user
        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            city=city,
        )
        db.add(user)
        await db.flush()  # Get the generated UUID

        # Generate tokens
        access_token = create_access_token(str(user.id), user.email)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token session
        session = Session(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session)

        logger.info(f"New user registered: {email}")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "city": user.city,
                "created_at": user.created_at,
            },
        }

    @staticmethod
    async def login(db: AsyncSession, email: str, password: str) -> dict:
        """Authenticate user, return tokens."""

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        # Generate tokens
        access_token = create_access_token(str(user.id), user.email)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token
        session = Session(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session)

        logger.info(f"User logged in: {email}")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "city": user.city,
                "created_at": user.created_at,
            },
        }

    @staticmethod
    async def refresh_token(db: AsyncSession, refresh_token: str) -> dict:
        """Issue new access token using a valid refresh token."""

        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        # Verify session exists and is not revoked
        result = await db.execute(
            select(Session).where(
                Session.refresh_token == refresh_token,
                Session.is_revoked == False,
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            raise ValueError("Session not found or revoked")

        if session.expires_at < datetime.now(timezone.utc):
            raise ValueError("Refresh token expired")

        # Get user
        result = await db.execute(select(User).where(User.id == session.user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        # Generate new access token
        access_token = create_access_token(str(user.id), user.email)

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    @staticmethod
    async def logout(db: AsyncSession, user_id: uuid.UUID) -> None:
        """Revoke all refresh tokens for a user (logout from all devices)."""
        result = await db.execute(
            select(Session).where(
                Session.user_id == user_id,
                Session.is_revoked == False,
            )
        )
        sessions = result.scalars().all()
        for session in sessions:
            session.is_revoked = True

        logger.info(f"User logged out: {user_id}")

    @staticmethod
    async def change_password(
        db: AsyncSession, user: "User", current_password: str, new_password: str
    ) -> None:
        """Change user password after verifying the current one."""
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        await db.flush()
        logger.info(f"Password changed for user: {user.email}")
