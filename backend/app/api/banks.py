"""
Banks & Analytics API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.bank_service import BankService
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Banks & Analytics"])


@router.get("/banks")
async def list_banks(
    banking_type: str | None = None,
    has_islamic: bool | None = None,
    min_rating: float | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all banks with optional filters."""
    banks = await BankService.search_banks(
        db=db,
        banking_type=banking_type,
        has_islamic=has_islamic,
        min_rating=min_rating,
    )
    return {
        "banks": [
            {
                "id": str(b.id),
                "name": b.name,
                "slug": b.slug,
                "bank_type": b.bank_type,
                "description": b.description,
                "overall_rating": b.overall_rating,
                "digital_rating": b.digital_rating,
                "customer_support_rating": b.customer_support_rating,
                "mobile_app_rating": b.mobile_app_rating,
                "has_islamic_banking": b.has_islamic_banking,
                "has_mobile_app": b.has_mobile_app,
                "branch_count": b.branch_count,
                "atm_count": b.atm_count,
            }
            for b in banks
        ]
    }


@router.get("/analytics")
async def get_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard analytics data."""
    return await BankService.get_analytics(db=db)
