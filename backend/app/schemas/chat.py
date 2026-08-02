"""
Chat and conversation request/response schemas.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: str | None = None  # None = create new conversation


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    agent_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    title: str
    message_count: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    last_message: str | None = None

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: list[MessageOut]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    conversations: list[ConversationOut]
    total: int
