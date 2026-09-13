"""
Analytics API — dashboard data for conversations, categories, and activity.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("")
async def get_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard analytics for the current user.
    Returns conversation counts, top categories, and recent activity.
    """

    # Total conversations (non-archived)
    total_convs_q = select(func.count(Conversation.id)).where(
        Conversation.user_id == user.id,
        Conversation.is_archived == False,
    )
    total_conversations = (await db.execute(total_convs_q)).scalar() or 0

    # Total messages across all conversations
    total_msgs_q = (
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user.id)
    )
    total_messages = (await db.execute(total_msgs_q)).scalar() or 0

    # Top categories — derived from agent_name in assistant messages
    # We extract meaningful category names from agent names
    top_cats_q = (
        select(
            Message.agent_name,
            func.count(Message.id).label("count"),
        )
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.user_id == user.id,
            Message.role == "assistant",
            Message.agent_name.isnot(None),
            Message.agent_name != "",
        )
        .group_by(Message.agent_name)
        .order_by(desc("count"))
        .limit(5)
    )
    top_cats_result = await db.execute(top_cats_q)
    top_categories = [
        {"category": row.agent_name, "count": row.count}
        for row in top_cats_result
    ]

    # Recent activity — last 5 conversations with title, message count, date
    recent_q = (
        select(Conversation)
        .where(
            Conversation.user_id == user.id,
            Conversation.is_archived == False,
        )
        .order_by(Conversation.updated_at.desc())
        .limit(5)
    )
    recent_result = await db.execute(recent_q)
    recent_conversations = recent_result.scalars().all()

    recent_activity = [
        {
            "id": str(conv.id),
            "title": conv.title,
            "messages": conv.message_count,
            "date": conv.updated_at.isoformat() if conv.updated_at else conv.created_at.isoformat(),
        }
        for conv in recent_conversations
    ]

    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "top_categories": top_categories,
        "recent_activity": recent_activity,
    }
