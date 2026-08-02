"""
Agent tools — database query functions exposed as tools for OpenAI Agents SDK.

These tools allow agents to query real banking data from PostgreSQL,
making their recommendations data-driven rather than hallucinated.
"""

import json
from agents import function_tool
from app.database import async_session
from app.utils.logger import logger


@function_tool
async def query_banks(
    banking_type: str = "",
    has_islamic_banking: bool = False,
    min_rating: float = 0.0,
) -> str:
    """
    Query Pakistani banks from the database with optional filters.

    Args:
        banking_type: Filter by type — 'conventional', 'islamic', 'microfinance', 'digital'. Leave empty for all.
        has_islamic_banking: If true, only return banks with Islamic banking services.
        min_rating: Minimum overall rating (1.0 - 5.0).

    Returns:
        JSON string with list of matching banks and their details.
    """
    from sqlalchemy import select
    from app.models.bank import Bank

    async with async_session() as db:
        query = select(Bank)

        if banking_type:
            query = query.where(Bank.bank_type == banking_type)
        if has_islamic_banking:
            query = query.where(Bank.has_islamic_banking == True)
        if min_rating > 0:
            query = query.where(Bank.overall_rating >= min_rating)

        query = query.order_by(Bank.overall_rating.desc())
        result = await db.execute(query)
        banks = result.scalars().all()

        bank_list = []
        for b in banks:
            bank_list.append({
                "name": b.name,
                "type": b.bank_type,
                "overall_rating": b.overall_rating,
                "digital_rating": b.digital_rating,
                "customer_support_rating": b.customer_support_rating,
                "mobile_app_rating": b.mobile_app_rating,
                "has_islamic_banking": b.has_islamic_banking,
                "has_mobile_app": b.has_mobile_app,
                "has_internet_banking": b.has_internet_banking,
                "branch_count": b.branch_count,
                "atm_count": b.atm_count,
                "hq_city": b.hq_city,
                "website": b.website,
                "description": b.description,
            })

        return json.dumps(bank_list, indent=2)


@function_tool
async def get_products(
    category: str = "",
    bank_name: str = "",
) -> str:
    """
    Get banking products (accounts) from the database.

    Args:
        category: Product category — 'savings_account', 'current_account', 'student_account', 'salary_account', 'business_account', 'islamic_account', 'digital_account', 'freelancer_account'. Leave empty for all.
        bank_name: Filter by bank name (partial match). Leave empty for all banks.

    Returns:
        JSON string with matching products and their features, eligibility, and fees.
    """
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.bank import Bank

    async with async_session() as db:
        query = select(Product, Bank.name.label("bank_name")).join(Bank)

        if category:
            query = query.where(Product.category == category)
        if bank_name:
            query = query.where(Bank.name.ilike(f"%{bank_name}%"))

        result = await db.execute(query)
        rows = result.all()

        products = []
        for product, bname in rows:
            products.append({
                "bank": bname,
                "name": product.name,
                "category": product.category,
                "description": product.description,
                "features": product.features,
                "eligibility": product.eligibility,
                "fees": product.fees,
                "min_balance": product.min_balance,
                "profit_rate": product.profit_rate,
            })

        return json.dumps(products, indent=2)


@function_tool
async def get_cards(
    card_type: str = "",
    bank_name: str = "",
) -> str:
    """
    Get credit/debit cards from the database.

    Args:
        card_type: Filter by type — 'credit', 'debit', 'prepaid'. Leave empty for all.
        bank_name: Filter by bank name (partial match). Leave empty for all.

    Returns:
        JSON string with matching cards and their features, fees, and benefits.
    """
    from sqlalchemy import select
    from app.models.product import Card
    from app.models.bank import Bank

    async with async_session() as db:
        query = select(Card, Bank.name.label("bank_name")).join(Bank)

        if card_type:
            query = query.where(Card.card_type == card_type)
        if bank_name:
            query = query.where(Bank.name.ilike(f"%{bank_name}%"))

        result = await db.execute(query)
        rows = result.all()

        cards = []
        for card, bname in rows:
            cards.append({
                "bank": bname,
                "name": card.name,
                "card_type": card.card_type,
                "tier": card.tier,
                "annual_fee": card.annual_fee,
                "cashback_rate": card.cashback_rate,
                "reward_points": card.reward_points,
                "min_income": card.min_income,
                "features": card.features,
                "benefits": card.benefits,
            })

        return json.dumps(cards, indent=2)


@function_tool
async def get_loans(
    loan_type: str = "",
    bank_name: str = "",
    max_income_required: float = 0.0,
) -> str:
    """
    Get loan/financing products from the database.

    Args:
        loan_type: Filter by type — 'home_loan', 'car_financing', 'personal_loan', 'business_loan', 'sme_loan', 'education_loan', 'islamic_financing'. Leave empty for all.
        bank_name: Filter by bank name (partial match). Leave empty for all.
        max_income_required: Filter loans where minimum income requirement is at or below this value (in PKR). Use 0 for no filter.

    Returns:
        JSON string with matching loans and their rates, tenure, eligibility, and features.
    """
    from sqlalchemy import select
    from app.models.product import Loan
    from app.models.bank import Bank

    async with async_session() as db:
        query = select(Loan, Bank.name.label("bank_name")).join(Bank)

        if loan_type:
            query = query.where(Loan.loan_type == loan_type)
        if bank_name:
            query = query.where(Bank.name.ilike(f"%{bank_name}%"))
        if max_income_required > 0:
            query = query.where(
                (Loan.min_income == None) | (Loan.min_income <= max_income_required)
            )

        result = await db.execute(query)
        rows = result.all()

        loans = []
        for loan, bname in rows:
            loans.append({
                "bank": bname,
                "name": loan.name,
                "loan_type": loan.loan_type,
                "markup_rate": loan.markup_rate,
                "max_tenure_months": loan.max_tenure_months,
                "max_amount": loan.max_amount,
                "min_income": loan.min_income,
                "processing_fee": loan.processing_fee,
                "features": loan.features,
                "eligibility": loan.eligibility,
            })

        return json.dumps(loans, indent=2)


@function_tool
async def compare_banks(bank_names: str) -> str:
    """
    Compare two or more banks side by side.

    Args:
        bank_names: Comma-separated bank names to compare. Example: "HBL, Meezan Bank, UBL"

    Returns:
        JSON string with a detailed comparison of the requested banks.
    """
    from sqlalchemy import select
    from app.models.bank import Bank

    names = [n.strip() for n in bank_names.split(",")]

    async with async_session() as db:
        banks = []
        for name in names:
            result = await db.execute(
                select(Bank).where(Bank.name.ilike(f"%{name}%"))
            )
            bank = result.scalar_one_or_none()
            if bank:
                banks.append({
                    "name": bank.name,
                    "type": bank.bank_type,
                    "overall_rating": bank.overall_rating,
                    "digital_rating": bank.digital_rating,
                    "customer_support_rating": bank.customer_support_rating,
                    "mobile_app_rating": bank.mobile_app_rating,
                    "has_islamic_banking": bank.has_islamic_banking,
                    "branch_count": bank.branch_count,
                    "atm_count": bank.atm_count,
                    "description": bank.description,
                })

        return json.dumps(banks, indent=2)
