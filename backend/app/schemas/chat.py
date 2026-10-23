from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    include_health_context: bool = True


class ChatMessageResponse(BaseModel):
    id: str
    role: str  # "assistant" | "user"
    content: str
    suggestions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total: int
