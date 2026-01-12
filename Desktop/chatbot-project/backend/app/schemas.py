from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[Dict] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    conversation_id: str
    timestamp: datetime

class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True