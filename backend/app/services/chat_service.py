"""
Chat service — manages conversations, messages, and AI interactions.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, Message
from app.models.product import Recommendation
from app.utils.logger import logger


class ChatService:
    """Handles conversation lifecycle and message storage."""

    @staticmethod
    async def create_conversation(
        db: AsyncSession, user_id: uuid.UUID, title: str = "New Conversation"
    ) -> Conversation:
        """Create a new conversation for a user."""
        conversation = Conversation(user_id=user_id, title=title)
        db.add(conversation)
        await db.flush()
        logger.info(f"Created conversation {conversation.id} for user {user_id}")
        return conversation

    @staticmethod
    async def get_conversations(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> tuple[list[dict], int]:
        """Get all conversations for a user, ordered by most recent."""

        # Count total
        count_query = select(func.count(Conversation.id)).where(
            Conversation.user_id == user_id,
            Conversation.is_archived == False,
        )
        total = (await db.execute(count_query)).scalar() or 0

        # Get conversations with last message preview
        query = (
            select(Conversation)
            .where(
                Conversation.user_id == user_id,
                Conversation.is_archived == False,
            )
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(query)
        conversations = result.scalars().all()

        conv_list = []
        for conv in conversations:
            # Get last message for preview
            last_msg_query = (
                select(Message.content)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg_result = await db.execute(last_msg_query)
            last_msg = last_msg_result.scalar_one_or_none()

            conv_list.append({
                "id": str(conv.id),
                "title": conv.title,
                "message_count": conv.message_count,
                "is_archived": conv.is_archived,
                "created_at": conv.created_at,
                "updated_at": conv.updated_at,
                "last_message": (last_msg[:100] + "..." if last_msg and len(last_msg) > 100 else last_msg),
            })

        return conv_list, total

    @staticmethod
    async def get_conversation_with_messages(
        db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID
    ) -> dict | None:
        """Get a conversation with all its messages."""
        result = await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            return None

        return {
            "id": str(conv.id),
            "title": conv.title,
            "created_at": conv.created_at,
            "messages": [
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "agent_name": msg.agent_name,
                    "created_at": msg.created_at,
                }
                for msg in conv.messages
            ],
        }

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        role: str,
        content: str,
        agent_name: str | None = None,
    ) -> Message:
        """Add a message to a conversation and update message count."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            agent_name=agent_name,
        )
        db.add(message)

        # Update conversation metadata
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(
                message_count=Conversation.message_count + 1,
                updated_at=datetime.now(timezone.utc),
            )
        )
        await db.flush()
        return message

    @staticmethod
    async def update_conversation_title(
        db: AsyncSession, conversation_id: uuid.UUID, title: str
    ) -> None:
        """Update conversation title (used for auto-titling from first message)."""
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(title=title)
        )

    @staticmethod
    async def delete_conversation(
        db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a conversation and all its messages."""
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            return False

        await db.delete(conv)
        logger.info(f"Deleted conversation {conversation_id}")
        return True

    @staticmethod
    async def log_recommendation(
        db: AsyncSession,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID,
        bank_name: str | None = None,
        product_name: str | None = None,
        category: str | None = None,
        reasoning: str | None = None,
    ) -> None:
        """Log a recommendation for analytics."""
        rec = Recommendation(
            user_id=user_id,
            conversation_id=conversation_id,
            bank_name=bank_name,
            product_name=product_name,
            category=category,
            reasoning=reasoning,
        )
        db.add(rec)
