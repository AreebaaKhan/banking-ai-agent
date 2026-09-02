"""
Agent tools — database query functions available for LLM tool calling.

These tools allow agents to query real banking data from PostgreSQL,
making their recommendations data-driven rather than hallucinated.

Architecture:
- TOOL_DEFINITIONS: OpenAI-compatible JSON schemas sent to the LLM
- execute_tool(): Dispatcher that runs the right function when the LLM calls a tool
- Each function queries the database and returns JSON for the LLM to use
"""

import json
from app.database import async_session
from app.utils.logger import logger


# ─── OpenAI-Compatible Tool Definitions ──────────────────────────────
# These are sent to the LLM so it knows what tools are available.
# Format follows the OpenAI function calling spec exactly.

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_banks",
            "description": "Query Pakistani banks from the database. Use this when the user asks about banks, bank comparisons, or needs bank recommendations. Returns real data including ratings, features, and branch counts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "banking_type": {
                        "type": "string",
                        "description": "Filter by type: 'conventional', 'islamic', 'microfinance', 'digital'. Omit for all types.",
                        "enum": ["conventional", "islamic", "microfinance", "digital"],
                    },
                    "has_islamic_banking": {
                        "type": "boolean",
                        "description": "If true, only return banks with Islamic banking services.",
                    },
                    "min_rating": {
                        "type": "number",
                        "description": "Minimum overall rating (1.0 - 5.0). Omit for no minimum.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_products",
            "description": "Get banking products (accounts) from the database. Use this when the user asks about account types, savings accounts, current accounts, student accounts, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Product category filter.",
                        "enum": [
                            "savings_account", "current_account", "student_account",
                            "salary_account", "business_account", "islamic_account",
                            "digital_account", "freelancer_account",
                        ],
                    },
                    "bank_name": {
                        "type": "string",
                        "description": "Filter by bank name (partial match). Example: 'HBL', 'Meezan'.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_cards",
            "description": "Get credit/debit card products from the database. Use this when the user asks about cards, cashback, rewards, or card comparisons.",
            "parameters": {
                "type": "object",
                "properties": {
                    "card_type": {
                        "type": "string",
                        "description": "Filter by card type.",
                        "enum": ["credit", "debit", "prepaid"],
                    },
                    "bank_name": {
                        "type": "string",
                        "description": "Filter by bank name (partial match).",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_loans",
            "description": "Get loan and financing products from the database. Use this when the user asks about loans, mortgages, car financing, personal loans, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "loan_type": {
                        "type": "string",
                        "description": "Filter by loan type.",
                        "enum": [
                            "home_loan", "car_financing", "personal_loan",
                            "business_loan", "sme_loan", "education_loan",
                            "islamic_financing",
                        ],
                    },
                    "bank_name": {
                        "type": "string",
                        "description": "Filter by bank name (partial match).",
                    },
                    "max_income_required": {
                        "type": "number",
                        "description": "Filter loans where minimum income requirement is at or below this value (in PKR). Use 0 for no filter.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_banks",
            "description": "Compare two or more banks side by side. Use this when the user explicitly wants to compare specific banks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "bank_names": {
                        "type": "string",
                        "description": "Comma-separated bank names to compare. Example: 'HBL, Meezan Bank, UBL'",
                    },
                },
                "required": ["bank_names"],
            },
        },
    },
]


# ─── Tool Executor (Dispatcher) ──────────────────────────────────────

async def execute_tool(tool_name: str, arguments: dict) -> str:
    """
    Execute a tool by name and return the result as a JSON string.
    
    This is called by the orchestrator when the LLM decides to use a tool.
    """
    try:
        if tool_name == "query_banks":
            return await query_banks(**arguments)
        elif tool_name == "get_products":
            return await get_products(**arguments)
        elif tool_name == "get_cards":
            return await get_cards(**arguments)
        elif tool_name == "get_loans":
            return await get_loans(**arguments)
        elif tool_name == "compare_banks":
            return await compare_banks(**arguments)
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
    except Exception as e:
        logger.error(f"Tool execution error ({tool_name}): {e}")
        return json.dumps({"error": f"Failed to query database: {str(e)}"})


# ─── Tool Functions ──────────────────────────────────────────────────


async def query_banks(
    banking_type: str = "",
    has_islamic_banking: bool = False,
    min_rating: float = 0.0,
) -> str:
    """
    Query Pakistani banks from the database with optional filters.
    Returns JSON string with list of matching banks and their details.
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

        query = query.order_by(Bank.overall_rating.desc()).limit(10)
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

        logger.info(f"query_banks returned {len(bank_list)} results")
        return json.dumps(bank_list, indent=2)


async def get_products(
    category: str = "",
    bank_name: str = "",
) -> str:
    """
    Get banking products (accounts) from the database.
    Returns JSON string with matching products and their features.
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

        query = query.limit(15)
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

        logger.info(f"get_products returned {len(products)} results")
        return json.dumps(products, indent=2)


async def get_cards(
    card_type: str = "",
    bank_name: str = "",
) -> str:
    """
    Get credit/debit cards from the database.
    Returns JSON string with matching cards and their features.
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

        query = query.limit(15)
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

        logger.info(f"get_cards returned {len(cards)} results")
        return json.dumps(cards, indent=2)


async def get_loans(
    loan_type: str = "",
    bank_name: str = "",
    max_income_required: float = 0.0,
) -> str:
    """
    Get loan/financing products from the database.
    Returns JSON string with matching loans and their details.
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

        query = query.limit(15)
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

        logger.info(f"get_loans returned {len(loans)} results")
        return json.dumps(loans, indent=2)


async def compare_banks(bank_names: str) -> str:
    """
    Compare two or more banks side by side.
    Returns JSON string with detailed comparison data.
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

        logger.info(f"compare_banks returned {len(banks)} results for: {bank_names}")
        return json.dumps(banks, indent=2)
