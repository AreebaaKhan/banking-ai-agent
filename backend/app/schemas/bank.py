"""
Bank and product response schemas.
"""

from pydantic import BaseModel
from datetime import datetime


class BankOut(BaseModel):
    id: str
    name: str
    slug: str
    bank_type: str
    description: str | None = None
    hq_city: str
    website: str | None = None
    overall_rating: float
    digital_rating: float
    customer_support_rating: float
    mobile_app_rating: float
    has_islamic_banking: bool
    has_mobile_app: bool
    has_internet_banking: bool
    branch_count: int
    atm_count: int

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: str
    bank_name: str | None = None
    category: str
    name: str
    description: str | None = None
    features: dict | None = None
    eligibility: dict | None = None
    fees: dict | None = None
    min_balance: float | None = None
    profit_rate: str | None = None

    class Config:
        from_attributes = True


class CardOut(BaseModel):
    id: str
    bank_name: str | None = None
    name: str
    card_type: str
    tier: str | None = None
    annual_fee: float
    cashback_rate: float | None = None
    reward_points: str | None = None
    min_income: float | None = None
    features: dict | None = None
    benefits: dict | None = None

    class Config:
        from_attributes = True


class LoanOut(BaseModel):
    id: str
    bank_name: str | None = None
    name: str
    loan_type: str
    markup_rate: str | None = None
    max_tenure_months: int | None = None
    max_amount: float | None = None
    min_income: float | None = None
    processing_fee: str | None = None
    features: dict | None = None
    eligibility: dict | None = None

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_users: int
    total_conversations: int
    total_messages: int
    popular_banks: list[dict]
    top_categories: list[dict]
    recent_activity: list[dict]
