"""
Bank data service — queries for agents and API endpoints.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bank import Bank, Branch
from app.models.product import Product, Card, Loan
from app.utils.logger import logger


class BankService:
    """Database queries for banking data — used by both API routes and agent tools."""

    @staticmethod
    async def get_all_banks(db: AsyncSession) -> list[Bank]:
        """Retrieve all banks."""
        result = await db.execute(select(Bank).order_by(Bank.overall_rating.desc()))
        return list(result.scalars().all())

    @staticmethod
    async def get_bank_by_slug(db: AsyncSession, slug: str) -> Bank | None:
        result = await db.execute(select(Bank).where(Bank.slug == slug))
        return result.scalar_one_or_none()

    @staticmethod
    async def search_banks(
        db: AsyncSession,
        banking_type: str | None = None,
        city: str | None = None,
        has_islamic: bool | None = None,
        min_rating: float | None = None,
    ) -> list[Bank]:
        """Filter banks by criteria."""
        query = select(Bank)

        if banking_type:
            query = query.where(Bank.bank_type == banking_type)
        if has_islamic is True:
            query = query.where(Bank.has_islamic_banking == True)
        if min_rating:
            query = query.where(Bank.overall_rating >= min_rating)

        query = query.order_by(Bank.overall_rating.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_products(
        db: AsyncSession,
        bank_id: str | None = None,
        category: str | None = None,
    ) -> list[Product]:
        """Get products, optionally filtered by bank or category."""
        query = select(Product).join(Bank)

        if bank_id:
            query = query.where(Product.bank_id == bank_id)
        if category:
            query = query.where(Product.category == category)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_cards(
        db: AsyncSession,
        bank_id: str | None = None,
        card_type: str | None = None,
    ) -> list[Card]:
        """Get cards with optional filters."""
        query = select(Card).join(Bank)

        if bank_id:
            query = query.where(Card.bank_id == bank_id)
        if card_type:
            query = query.where(Card.card_type == card_type)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_loans(
        db: AsyncSession,
        bank_id: str | None = None,
        loan_type: str | None = None,
        max_income: float | None = None,
    ) -> list[Loan]:
        """Get loans with optional filters."""
        query = select(Loan).join(Bank)

        if bank_id:
            query = query.where(Loan.bank_id == bank_id)
        if loan_type:
            query = query.where(Loan.loan_type == loan_type)
        if max_income:
            query = query.where(
                (Loan.min_income == None) | (Loan.min_income <= max_income)
            )

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_branches(
        db: AsyncSession,
        bank_id: str | None = None,
        city: str | None = None,
    ) -> list[Branch]:
        """Get branches for a bank in a specific city."""
        query = select(Branch)

        if bank_id:
            query = query.where(Branch.bank_id == bank_id)
        if city:
            query = query.where(Branch.city.ilike(f"%{city}%"))

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_analytics(db: AsyncSession) -> dict:
        """Compute dashboard analytics from banking data."""
        from app.models.user import User
        from app.models.conversation import Conversation, Message
        from app.models.product import Recommendation

        # Total counts
        users_count = await db.execute(select(func.count(User.id)))
        conv_count = await db.execute(select(func.count(Conversation.id)))
        msg_count = await db.execute(select(func.count(Message.id)))

        # Most recommended banks
        rec_query = (
            select(
                Recommendation.bank_name,
                func.count(Recommendation.id).label("count"),
            )
            .where(Recommendation.bank_name != None)
            .group_by(Recommendation.bank_name)
            .order_by(func.count(Recommendation.id).desc())
            .limit(5)
        )
        popular_banks_result = await db.execute(rec_query)
        popular_banks = [
            {"name": row.bank_name, "count": row.count}
            for row in popular_banks_result
        ]

        # Top recommendation categories
        cat_query = (
            select(
                Recommendation.category,
                func.count(Recommendation.id).label("count"),
            )
            .where(Recommendation.category != None)
            .group_by(Recommendation.category)
            .order_by(func.count(Recommendation.id).desc())
            .limit(5)
        )
        cat_result = await db.execute(cat_query)
        top_categories = [
            {"category": row.category, "count": row.count}
            for row in cat_result
        ]

        # Recent conversations
        recent_query = (
            select(Conversation)
            .order_by(Conversation.updated_at.desc())
            .limit(10)
        )
        recent_result = await db.execute(recent_query)
        recent_activity = [
            {
                "title": conv.title,
                "messages": conv.message_count,
                "date": conv.updated_at.isoformat(),
            }
            for conv in recent_result.scalars()
        ]

        return {
            "total_users": users_count.scalar() or 0,
            "total_conversations": conv_count.scalar() or 0,
            "total_messages": msg_count.scalar() or 0,
            "popular_banks": popular_banks,
            "top_categories": top_categories,
            "recent_activity": recent_activity,
        }
