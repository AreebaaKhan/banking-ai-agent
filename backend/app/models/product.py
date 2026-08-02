"""
Product, Card, Loan, Recommendation, and UserPreference models.

Design: Products use JSONB for flexible features/eligibility/fees since
each product category has different attributes. Cards and Loans are
separate tables because they have distinct structured fields that benefit
from proper column-level typing and indexing.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    """Generic banking product (accounts, services, etc.)."""

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banks.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
        # 'savings_account', 'current_account', 'student_account',
        # 'salary_account', 'business_account', 'islamic_account',
        # 'digital_account', 'freelancer_account'
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Flexible JSONB for category-specific data
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    eligibility: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fees: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    min_balance: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_rate: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bank: Mapped["Bank"] = relationship(back_populates="products")

    def __repr__(self) -> str:
        return f"<Product {self.name}>"


class Card(Base):
    """Credit and debit cards."""

    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banks.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    card_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True  # 'credit', 'debit', 'prepaid'
    )
    tier: Mapped[str | None] = mapped_column(
        String(50), nullable=True  # 'classic', 'gold', 'platinum', 'signature'
    )
    annual_fee: Mapped[float] = mapped_column(Float, default=0.0)
    cashback_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    reward_points: Mapped[str | None] = mapped_column(String(255), nullable=True)
    min_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    benefits: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bank: Mapped["Bank"] = relationship(back_populates="cards")

    def __repr__(self) -> str:
        return f"<Card {self.name}>"


class Loan(Base):
    """Loan and financing products."""

    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banks.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    loan_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
        # 'home_loan', 'car_financing', 'personal_loan', 'business_loan',
        # 'sme_loan', 'education_loan', 'islamic_financing'
    )
    markup_rate: Mapped[str | None] = mapped_column(String(100), nullable=True)
    max_tenure_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_fee: Mapped[str | None] = mapped_column(String(100), nullable=True)
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    eligibility: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bank: Mapped["Bank"] = relationship(back_populates="loans")

    def __repr__(self) -> str:
        return f"<Loan {self.name}>"


class Recommendation(Base):
    """Logs every recommendation the AI makes — for analytics and auditing."""

    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="recommendations")

    def __repr__(self) -> str:
        return f"<Recommendation {self.bank_name} - {self.product_name}>"


class UserPreference(Base):
    """Stores user banking preferences for personalized recommendations."""

    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    banking_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True  # 'islamic', 'conventional', 'both'
    )
    income_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreference user={self.user_id}>"


# Resolve forward refs
from app.models.bank import Bank  # noqa: E402
from app.models.user import User  # noqa: E402
