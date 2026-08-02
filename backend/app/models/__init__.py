"""
ORM Models package — imports all models so Alembic can discover them.
"""

from app.models.user import User, Session
from app.models.conversation import Conversation, Message
from app.models.bank import Bank, Branch
from app.models.product import Product, Card, Loan, Recommendation, UserPreference

__all__ = [
    "User",
    "Session",
    "Conversation",
    "Message",
    "Bank",
    "Branch",
    "Product",
    "Card",
    "Loan",
    "Recommendation",
    "UserPreference",
]
