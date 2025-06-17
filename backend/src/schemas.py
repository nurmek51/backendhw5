from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Agent Schemas
class AgentBase(BaseModel):
    name: str = Field(..., example="AgentSmith")
    status: Literal["online", "offline", "busy"] = "offline"

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str = Field(..., example="Hello, Agent!")
    message_type: Literal["text", "voice", "video"] = "text"

class MessageCreate(MessageBase):
    receiver_id: int = Field(..., example=2)

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    timestamp: datetime

    class Config:
        from_attributes = True 