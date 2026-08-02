"""
Bank and Branch models.

Design: Banks are the top-level entity. Each bank has many branches.
The `type` field distinguishes Islamic vs conventional banking.
Ratings are stored as floats (1-5 scale) for comparison queries.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    bank_type: Mapped[str] = mapped_column(
        String(50), nullable=False  # 'conventional', 'islamic', 'microfinance', 'digital'
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hq_city: Mapped[str] = mapped_column(String(100), default="Karachi")
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Ratings (1.0 - 5.0)
    overall_rating: Mapped[float] = mapped_column(Float, default=3.0)
    digital_rating: Mapped[float] = mapped_column(Float, default=3.0)
    customer_support_rating: Mapped[float] = mapped_column(Float, default=3.0)
    mobile_app_rating: Mapped[float] = mapped_column(Float, default=3.0)

    # Features
    has_islamic_banking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_mobile_app: Mapped[bool] = mapped_column(Boolean, default=True)
    has_internet_banking: Mapped[bool] = mapped_column(Boolean, default=True)
    branch_count: Mapped[int] = mapped_column(Integer, default=0)
    atm_count: Mapped[int] = mapped_column(Integer, default=0)

    # Metadata
    established_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    swift_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        back_populates="bank", cascade="all, delete-orphan"
    )
    branches: Mapped[list["Branch"]] = relationship(
        back_populates="bank", cascade="all, delete-orphan"
    )
    cards: Mapped[list["Card"]] = relationship(
        back_populates="bank", cascade="all, delete-orphan"
    )
    loans: Mapped[list["Loan"]] = relationship(
        back_populates="bank", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Bank {self.name}>"


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banks.id", ondelete="CASCADE"), nullable=False
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    area: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_digital: Mapped[bool] = mapped_column(Boolean, default=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bank: Mapped["Bank"] = relationship(back_populates="branches")

    def __repr__(self) -> str:
        return f"<Branch {self.bank_id} - {self.city}>"


# Resolve forward refs
from app.models.product import Product, Card, Loan  # noqa: E402
