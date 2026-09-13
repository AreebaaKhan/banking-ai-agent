"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    MessageResponse,
    ChangePasswordRequest,
)
from app.services.auth_service import AuthService
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    try:
        result = await AuthService.signup(
            db=db,
            email=request.email,
            full_name=request.full_name,
            password=request.password,
            city=request.city,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return tokens."""
    try:
        result = await AuthService.login(db=db, email=request.email, password=request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh")
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Get a new access token using refresh token."""
    try:
        result = await AuthService.refresh_token(db=db, refresh_token=request.refresh_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", response_model=MessageResponse)
async def logout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user — revokes all refresh tokens."""
    await AuthService.logout(db=db, user_id=user.id)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        city=user.city,
        created_at=user.created_at,
    )


@router.put("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change user password."""
    try:
        await AuthService.change_password(
            db=db,
            user=user,
            current_password=request.current_password,
            new_password=request.new_password,
        )
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
