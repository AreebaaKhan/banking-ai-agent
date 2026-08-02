"""
Seed data for Pakistani banks, products, cards, and loans.

This script populates the database with real Pakistani banking data.
Run it after creating the database tables.

Usage: python -m seed_data.seed_banks
"""

import asyncio
import uuid
from app.database import async_session, engine, Base
from app.models.bank import Bank, Branch
from app.models.product import Product, Card, Loan
from app.utils.logger import logger


# ─── Bank Data ────────────────────────────────────────────────────────

BANKS = [
    {
        "name": "Habib Bank Limited",
        "slug": "hbl",
        "bank_type": "conventional",
        "description": "Pakistan's largest private bank with the widest branch network. Strong digital presence with the HBL Mobile app. Offers comprehensive banking services including Islamic banking through HBL Islamic.",
        "hq_city": "Karachi",
        "website": "https://www.hbl.com",
        "overall_rating": 4.3,
        "digital_rating": 4.2,
        "customer_support_rating": 3.8,
        "mobile_app_rating": 4.1,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 1700,
        "atm_count": 2200,
        "established_year": 1947,
        "swift_code": "HABORPKAXXX",
    },
    {
        "name": "Meezan Bank",
        "slug": "meezan",
        "bank_type": "islamic",
        "description": "Pakistan's largest Islamic bank and the first dedicated Islamic bank. Offers a full range of Shariah-compliant banking services. Winner of multiple 'Best Islamic Bank' awards. Known for transparent and ethical banking.",
        "hq_city": "Karachi",
        "website": "https://www.meezanbank.com",
        "overall_rating": 4.5,
        "digital_rating": 4.3,
        "customer_support_rating": 4.2,
        "mobile_app_rating": 4.4,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 1000,
        "atm_count": 800,
        "established_year": 2002,
        "swift_code": "MEABORPKAXXX",
    },
    {
        "name": "United Bank Limited",
        "slug": "ubl",
        "bank_type": "conventional",
        "description": "One of Pakistan's largest commercial banks. Known for its UBL Digital App and Omni branchless banking. Offers both conventional and Islamic banking services through UBL Ameen.",
        "hq_city": "Karachi",
        "website": "https://www.ubldigital.com",
        "overall_rating": 4.1,
        "digital_rating": 4.0,
        "customer_support_rating": 3.7,
        "mobile_app_rating": 4.0,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 1400,
        "atm_count": 1500,
        "established_year": 1959,
        "swift_code": "UNABORPKAXXX",
    },
    {
        "name": "Allied Bank Limited",
        "slug": "abl",
        "bank_type": "conventional",
        "description": "First Muslim bank established in Asia after independence. Strong branch network across Pakistan. Offers myABL digital banking app and Islamic banking through Allied Islamic.",
        "hq_city": "Lahore",
        "website": "https://www.abl.com",
        "overall_rating": 3.9,
        "digital_rating": 3.7,
        "customer_support_rating": 3.6,
        "mobile_app_rating": 3.8,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 1400,
        "atm_count": 1300,
        "established_year": 1942,
        "swift_code": "ABORPORPKAXXX",
    },
    {
        "name": "Bank Alfalah",
        "slug": "alfalah",
        "bank_type": "conventional",
        "description": "Known for innovative digital banking and best-in-class Alfa app. Part of Abu Dhabi Group. Offers comprehensive banking with strong credit card portfolio and Islamic banking services.",
        "hq_city": "Karachi",
        "website": "https://www.bankalfalah.com",
        "overall_rating": 4.2,
        "digital_rating": 4.5,
        "customer_support_rating": 3.9,
        "mobile_app_rating": 4.5,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 800,
        "atm_count": 1000,
        "established_year": 1997,
        "swift_code": "ALFHPKAKAXXX",
    },
    {
        "name": "MCB Bank",
        "slug": "mcb",
        "bank_type": "conventional",
        "description": "Muslim Commercial Bank — one of the oldest and most reliable banks. Known for strong corporate banking and MCB Arif Habib Savings. Offers MCB Live app for digital banking.",
        "hq_city": "Lahore",
        "website": "https://www.mcb.com.pk",
        "overall_rating": 4.0,
        "digital_rating": 3.8,
        "customer_support_rating": 3.7,
        "mobile_app_rating": 3.9,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 1500,
        "atm_count": 1600,
        "established_year": 1947,
        "swift_code": "MUCBORPKAXXX",
    },
    {
        "name": "Faysal Bank",
        "slug": "faysal",
        "bank_type": "islamic",
        "description": "Fully converted to Islamic banking. Offers Shariah-compliant products across personal, corporate, and SME banking. Known for competitive profit rates on savings.",
        "hq_city": "Karachi",
        "website": "https://www.faysalbank.com",
        "overall_rating": 4.0,
        "digital_rating": 3.8,
        "customer_support_rating": 3.8,
        "mobile_app_rating": 3.7,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 650,
        "atm_count": 500,
        "established_year": 1994,
        "swift_code": "FABORPKAXXX",
    },
    {
        "name": "Bank Al Habib",
        "slug": "al-habib",
        "bank_type": "conventional",
        "description": "Known for excellent customer service and personal banking relationships. Conservative, well-managed bank with strong deposit base. Offers both conventional and Islamic banking.",
        "hq_city": "Karachi",
        "website": "https://www.bankalhabib.com",
        "overall_rating": 4.1,
        "digital_rating": 3.6,
        "customer_support_rating": 4.3,
        "mobile_app_rating": 3.5,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 900,
        "atm_count": 700,
        "established_year": 1991,
        "swift_code": "BAABORPKAXXX",
    },
    {
        "name": "Standard Chartered Pakistan",
        "slug": "scb",
        "bank_type": "conventional",
        "description": "International bank with premium banking services. Best known for premium credit cards, wealth management, and priority banking. Higher minimum balances but premium experience.",
        "hq_city": "Karachi",
        "website": "https://www.sc.com/pk",
        "overall_rating": 4.0,
        "digital_rating": 4.1,
        "customer_support_rating": 4.0,
        "mobile_app_rating": 4.2,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 100,
        "atm_count": 150,
        "established_year": 1863,
        "swift_code": "SCBORPKAXXX",
    },
    {
        "name": "Askari Bank",
        "slug": "askari",
        "bank_type": "conventional",
        "description": "Part of the Fauji Foundation group. Strong presence in garrison cities. Offers iBank digital platform and Islamic banking services. Known for defense sector banking.",
        "hq_city": "Rawalpindi",
        "website": "https://www.askaribank.com.pk",
        "overall_rating": 3.7,
        "digital_rating": 3.5,
        "customer_support_rating": 3.5,
        "mobile_app_rating": 3.4,
        "has_islamic_banking": True,
        "has_mobile_app": True,
        "has_internet_banking": True,
        "branch_count": 560,
        "atm_count": 600,
        "established_year": 1991,
        "swift_code": "ASCMPORPKAXXX",
    },
    {
        "name": "SadaPay",
        "slug": "sadapay",
        "bank_type": "digital",
        "description": "Pakistan's leading digital-only financial platform. No minimum balance, no monthly fees. Freelancer-friendly with USD wire transfers. Mastercard debit card included. Best for tech-savvy users.",
        "hq_city": "Lahore",
        "website": "https://www.sadapay.pk",
        "overall_rating": 4.3,
        "digital_rating": 4.8,
        "customer_support_rating": 4.0,
        "mobile_app_rating": 4.7,
        "has_islamic_banking": False,
        "has_mobile_app": True,
        "has_internet_banking": False,
        "branch_count": 0,
        "atm_count": 0,
        "established_year": 2020,
        "swift_code": None,
    },
    {
        "name": "NayaPay",
        "slug": "nayapay",
        "bank_type": "digital",
        "description": "Digital wallet and payment platform. Offers Visa debit card, QR payments, and business accounts. Good for small businesses and freelancers. Split bill feature for groups.",
        "hq_city": "Karachi",
        "website": "https://www.nayapay.com",
        "overall_rating": 4.1,
        "digital_rating": 4.6,
        "customer_support_rating": 3.8,
        "mobile_app_rating": 4.5,
        "has_islamic_banking": False,
        "has_mobile_app": True,
        "has_internet_banking": False,
        "branch_count": 0,
        "atm_count": 0,
        "established_year": 2021,
        "swift_code": None,
    },
]


# ─── Products (Accounts) ────────────────────────────────────────────

PRODUCTS = [
    # HBL Products
    {"bank_slug": "hbl", "category": "savings_account", "name": "HBL Savings Account",
     "description": "Standard savings account with competitive profit rates.",
     "features": {"online_banking": True, "debit_card": True, "cheque_book": True, "sms_alerts": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Passport photo", "Income proof"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 20, "cheque_book_fee": 200},
     "min_balance": 5000, "profit_rate": "Up to 14.5% p.a."},
    {"bank_slug": "hbl", "category": "student_account", "name": "HBL Student Account (HBL Konnect)",
     "description": "Designed for students aged 18+ with low minimum balance.",
     "features": {"online_banking": True, "debit_card": True, "fee_payments": True, "zero_min_balance": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Student ID / Enrollment letter"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 0},
     "min_balance": 0, "profit_rate": "Up to 11% p.a."},

    # Meezan Products
    {"bank_slug": "meezan", "category": "savings_account", "name": "Meezan Savings Account",
     "description": "Shariah-compliant savings account based on Mudarabah principle.",
     "features": {"shariah_compliant": True, "online_banking": True, "debit_card": True, "profit_sharing": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Passport photo", "Utility bill"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 17, "cheque_book_fee": 150},
     "min_balance": 10000, "profit_rate": "Up to 15.5% p.a. (profit-sharing)"},
    {"bank_slug": "meezan", "category": "islamic_account", "name": "Meezan Asaan Account",
     "description": "Easy-to-open Islamic digital account with zero minimum balance.",
     "features": {"shariah_compliant": True, "biometric_verification": True, "debit_card": True, "zero_min_balance": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC only"]},
     "fees": {"monthly_fee": 0},
     "min_balance": 0, "profit_rate": "Up to 13% p.a."},

    # Bank Alfalah Products
    {"bank_slug": "alfalah", "category": "savings_account", "name": "Alfalah Orbit Savings",
     "description": "Digital-first savings account through the Alfa app. One of the best digital banking experiences in Pakistan.",
     "features": {"digital_onboarding": True, "instant_debit_card": True, "qr_payments": True, "bill_payments": True, "raast": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 0},
     "min_balance": 0, "profit_rate": "Up to 14% p.a."},
    {"bank_slug": "alfalah", "category": "freelancer_account", "name": "Alfalah Freelancer Account",
     "description": "Designed for freelancers with USD receiving capability and competitive forex rates.",
     "features": {"usd_receiving": True, "competitive_forex": True, "digital_onboarding": True, "dedicated_support": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Freelancer platform profile"]},
     "fees": {"monthly_fee": 0},
     "min_balance": 0, "profit_rate": "Up to 12% p.a."},

    # UBL Products
    {"bank_slug": "ubl", "category": "savings_account", "name": "UBL Savings Account",
     "description": "Standard savings account with UBL Digital app access.",
     "features": {"online_banking": True, "debit_card": True, "ubl_omni": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Passport photo"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 18},
     "min_balance": 5000, "profit_rate": "Up to 13.5% p.a."},
    {"bank_slug": "ubl", "category": "digital_account", "name": "UBL Digital Account",
     "description": "Open account remotely through UBL Digital app without visiting branch.",
     "features": {"remote_opening": True, "video_kyc": True, "debit_card": True, "instant_activation": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC"]},
     "fees": {"monthly_fee": 0},
     "min_balance": 0, "profit_rate": "Up to 12% p.a."},

    # SadaPay Products
    {"bank_slug": "sadapay", "category": "digital_account", "name": "SadaPay Personal Account",
     "description": "Zero-fee digital account with free Mastercard. Best for freelancers and digital-native users.",
     "features": {"zero_fees": True, "free_mastercard": True, "usd_wire": True, "instant_notifications": True, "spending_analytics": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC"]},
     "fees": {"monthly_fee": 0, "card_fee": 0, "atm_fee": 0},
     "min_balance": 0, "profit_rate": "N/A"},

    # MCB Products
    {"bank_slug": "mcb", "category": "savings_account", "name": "MCB Savings Account",
     "description": "Reliable savings account from one of Pakistan's oldest banks.",
     "features": {"online_banking": True, "debit_card": True, "cheque_book": True, "mcb_live_app": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Passport photo", "Utility bill"]},
     "fees": {"monthly_fee": 0, "atm_fee_other_bank": 20},
     "min_balance": 10000, "profit_rate": "Up to 14% p.a."},

    # Standard Chartered Products
    {"bank_slug": "scb", "category": "savings_account", "name": "SC Savings Account",
     "description": "Premium savings account with international banking standards.",
     "features": {"priority_banking": True, "international_transfers": True, "wealth_management": True},
     "eligibility": {"min_age": 18, "documents": ["CNIC", "Income proof", "Bank statement"]},
     "fees": {"monthly_fee": 500, "waived_if_balance_above": 100000},
     "min_balance": 25000, "profit_rate": "Up to 13% p.a."},
]


# ─── Cards ───────────────────────────────────────────────────────────

CARDS = [
    # HBL Cards
    {"bank_slug": "hbl", "name": "HBL GreenCard", "card_type": "credit", "tier": "classic",
     "annual_fee": 1500, "cashback_rate": 1.0, "reward_points": "1 point per Rs 25 spent",
     "min_income": 30000,
     "features": {"contactless": True, "online_shopping": True, "fuel_surcharge_waiver": True},
     "benefits": {"airport_lounge": False, "travel_insurance": False, "cashback_categories": ["grocery", "fuel"]}},
    {"bank_slug": "hbl", "name": "HBL FuelSaver Card", "card_type": "credit", "tier": "gold",
     "annual_fee": 2500, "cashback_rate": 5.0, "reward_points": "5% cashback on fuel",
     "min_income": 50000,
     "features": {"fuel_cashback": True, "contactless": True},
     "benefits": {"fuel_discount": "5% cashback on all fuel stations", "free_supplementary": True}},

    # Meezan Cards
    {"bank_slug": "meezan", "name": "Meezan Visa Debit Card", "card_type": "debit", "tier": "classic",
     "annual_fee": 0, "cashback_rate": None, "reward_points": None, "min_income": None,
     "features": {"shariah_compliant": True, "atm_access": True, "pos_transactions": True, "online_shopping": True},
     "benefits": {"islamic_banking": True}},

    # Bank Alfalah Cards
    {"bank_slug": "alfalah", "name": "Alfalah Orbit Rewards Card", "card_type": "credit", "tier": "platinum",
     "annual_fee": 5000, "cashback_rate": 2.0, "reward_points": "2x points on dining & shopping",
     "min_income": 60000,
     "features": {"rewards_program": True, "contactless": True, "installment_plans": True},
     "benefits": {"airport_lounge": True, "dining_discounts": True, "movie_discounts": True}},
    {"bank_slug": "alfalah", "name": "Alfalah Cashback Card", "card_type": "credit", "tier": "gold",
     "annual_fee": 2000, "cashback_rate": 3.0, "reward_points": "Up to 3% cashback",
     "min_income": 40000,
     "features": {"unlimited_cashback": True, "contactless": True},
     "benefits": {"grocery_cashback": "3%", "fuel_cashback": "2%", "general_cashback": "1%"}},

    # SCB Cards
    {"bank_slug": "scb", "name": "SC Visa Platinum Card", "card_type": "credit", "tier": "platinum",
     "annual_fee": 10000, "cashback_rate": 1.5, "reward_points": "360° Rewards program",
     "min_income": 100000,
     "features": {"premium_rewards": True, "travel_insurance": True, "purchase_protection": True},
     "benefits": {"airport_lounge": True, "global_acceptance": True, "concierge_service": True, "travel_miles": True}},

    # MCB Cards
    {"bank_slug": "mcb", "name": "MCB Visa Gold Card", "card_type": "credit", "tier": "gold",
     "annual_fee": 3000, "cashback_rate": 1.5, "reward_points": "1 point per Rs 30 spent",
     "min_income": 50000,
     "features": {"contactless": True, "installment_plans": True},
     "benefits": {"shopping_discounts": True, "dining_offers": True}},
]


# ─── Loans ───────────────────────────────────────────────────────────

LOANS = [
    # HBL Loans
    {"bank_slug": "hbl", "name": "HBL Home Loan", "loan_type": "home_loan",
     "markup_rate": "KIBOR + 2.5% to 3.5%", "max_tenure_months": 300, "max_amount": 50000000,
     "min_income": 75000, "processing_fee": "Up to 1% of loan amount",
     "features": {"fixed_rate_option": True, "step_up_plan": True, "insurance_included": True},
     "eligibility": {"min_age": 25, "max_age": 60, "employment": "Salaried or Self-employed", "min_experience": "2 years"}},
    {"bank_slug": "hbl", "name": "HBL Car Loan", "loan_type": "car_financing",
     "markup_rate": "KIBOR + 2% to 3%", "max_tenure_months": 84, "max_amount": 10000000,
     "min_income": 50000, "processing_fee": "Rs 5,000 flat",
     "features": {"new_and_used_cars": True, "insurance_financing": True},
     "eligibility": {"min_age": 21, "employment": "Salaried or Self-employed"}},

    # Meezan Loans (Islamic Financing)
    {"bank_slug": "meezan", "name": "Meezan Easy Home (Diminishing Musharakah)", "loan_type": "home_loan",
     "markup_rate": "Profit rate 18-22% p.a. (variable)", "max_tenure_months": 300, "max_amount": 75000000,
     "min_income": 100000, "processing_fee": "Up to 1%",
     "features": {"shariah_compliant": True, "diminishing_musharakah": True, "takaful_included": True},
     "eligibility": {"min_age": 25, "max_age": 60, "employment": "Salaried or Business"}},
    {"bank_slug": "meezan", "name": "Meezan Car Ijarah", "loan_type": "car_financing",
     "markup_rate": "Rental based (competitive rates)", "max_tenure_months": 60, "max_amount": 10000000,
     "min_income": 50000, "processing_fee": "Rs 3,000 - 5,000",
     "features": {"shariah_compliant": True, "ijarah_model": True, "takaful_included": True},
     "eligibility": {"min_age": 21, "employment": "Salaried or Business"}},

    # Bank Alfalah Loans
    {"bank_slug": "alfalah", "name": "Alfalah Car Finance", "loan_type": "car_financing",
     "markup_rate": "KIBOR + 1.75% to 3%", "max_tenure_months": 84, "max_amount": 10000000,
     "min_income": 40000, "processing_fee": "Rs 3,500",
     "features": {"quick_approval": True, "new_and_used": True, "insurance_available": True},
     "eligibility": {"min_age": 21, "employment": "Salaried or Self-employed"}},
    {"bank_slug": "alfalah", "name": "Alfalah Personal Loan", "loan_type": "personal_loan",
     "markup_rate": "KIBOR + 4% to 8%", "max_tenure_months": 60, "max_amount": 3000000,
     "min_income": 35000, "processing_fee": "1% of loan amount",
     "features": {"no_collateral": True, "quick_disbursement": True},
     "eligibility": {"min_age": 22, "max_age": 58, "employment": "Salaried"}},

    # UBL Loans
    {"bank_slug": "ubl", "name": "UBL Drive (Car Loan)", "loan_type": "car_financing",
     "markup_rate": "KIBOR + 2% to 3%", "max_tenure_months": 84, "max_amount": 10000000,
     "min_income": 50000, "processing_fee": "Rs 5,000",
     "features": {"new_and_used": True, "online_tracking": True},
     "eligibility": {"min_age": 21, "employment": "Salaried or Business"}},

    # MCB Loans
    {"bank_slug": "mcb", "name": "MCB Home Loan", "loan_type": "home_loan",
     "markup_rate": "KIBOR + 2.5% to 4%", "max_tenure_months": 240, "max_amount": 30000000,
     "min_income": 100000, "processing_fee": "Up to 1%",
     "features": {"flexible_tenure": True, "balance_transfer": True},
     "eligibility": {"min_age": 25, "max_age": 60, "employment": "Salaried or Business"}},
]


async def seed_database():
    """Populate the database with Pakistani banking data."""
    import app.models  # noqa: ensure models are loaded

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if data already exists
        from sqlalchemy import select, func
        count = (await db.execute(select(func.count(Bank.id)))).scalar()
        if count > 0:
            logger.info(f"Database already has {count} banks. Skipping seed.")
            return

        # Insert banks
        bank_map = {}
        for bank_data in BANKS:
            bank = Bank(**bank_data)
            db.add(bank)
            bank_map[bank_data["slug"]] = bank

        await db.flush()
        logger.info(f"Seeded {len(BANKS)} banks")

        # Insert products
        for product_data in PRODUCTS:
            slug = product_data.pop("bank_slug")
            bank = bank_map[slug]
            product = Product(bank_id=bank.id, **product_data)
            db.add(product)

        logger.info(f"Seeded {len(PRODUCTS)} products")

        # Insert cards
        for card_data in CARDS:
            slug = card_data.pop("bank_slug")
            bank = bank_map[slug]
            card = Card(bank_id=bank.id, **card_data)
            db.add(card)

        logger.info(f"Seeded {len(CARDS)} cards")

        # Insert loans
        for loan_data in LOANS:
            slug = loan_data.pop("bank_slug")
            bank = bank_map[slug]
            loan = Loan(bank_id=bank.id, **loan_data)
            db.add(loan)

        logger.info(f"Seeded {len(LOANS)} loans")

        await db.commit()
        logger.info("Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_database())
