"""
Chat API endpoints — conversations and messaging with SSE streaming.
"""

import uuid
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chat import (
    SendMessageRequest,
    ConversationListResponse,
    ConversationDetail,
    ConversationOut,
)
from app.services.chat_service import ChatService
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.logger import logger

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the current user."""
    conversations, total = await ChatService.get_conversations(
        db=db, user_id=user.id, limit=limit, offset=offset
    )
    return {"conversations": conversations, "total": total}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a conversation with all its messages."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    result = await ChatService.get_conversation_with_messages(
        db=db, conversation_id=conv_uuid, user_id=user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return result


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    deleted = await ChatService.delete_conversation(
        db=db, conversation_id=conv_uuid, user_id=user.id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted"}


@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message and get AI response via Server-Sent Events (SSE).

    If conversation_id is null, creates a new conversation.
    Returns a streaming response with the AI's reply.
    """
    # Create or get conversation
    if request.conversation_id:
        try:
            conv_uuid = uuid.UUID(request.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation ID")

        conv = await ChatService.get_conversation_with_messages(
            db=db, conversation_id=conv_uuid, user_id=user.id
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation_id = conv_uuid
    else:
        # Create new conversation with truncated first message as title
        title = request.message[:80] + ("..." if len(request.message) > 80 else "")
        conv = await ChatService.create_conversation(
            db=db, user_id=user.id, title=title
        )
        conversation_id = conv.id
        await db.commit()

    # Store user message
    await ChatService.add_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )
    await db.commit()

    # Get conversation history for context
    conv_data = await ChatService.get_conversation_with_messages(
        db=db, conversation_id=conversation_id, user_id=user.id
    )

    async def generate_stream():
        """Stream AI response via SSE."""
        try:
            # Import here to avoid circular imports
            from app.agents.orchestrator import run_agent

            full_response = ""
            agent_name = None

            # Send conversation_id first (important for new conversations)
            yield f"data: {json.dumps({'type': 'conversation_id', 'id': str(conversation_id)})}\n\n"

            async for chunk in run_agent(
                message=request.message,
                conversation_history=conv_data.get("messages", []) if conv_data else [],
                user_info={"name": user.full_name, "city": user.city},
                db=db,
            ):
                if chunk.get("type") == "content":
                    full_response += chunk["content"]
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk.get("type") == "agent_name":
                    agent_name = chunk["name"]
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk.get("type") == "error":
                    yield f"data: {json.dumps(chunk)}\n\n"

            # Store complete AI response
            if full_response:
                await ChatService.add_message(
                    db=db,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                    agent_name=agent_name,
                )
                await db.commit()

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'content': 'I apologize, but I encountered an issue. Please try again.'})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
