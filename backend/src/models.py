from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="offline") # e.g., online, offline, busy
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender_agent")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver_agent")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    content = Column(String, nullable=False)
    message_type = Column(String, default="text") # e.g., text, voice, video
    timestamp = Column(DateTime, default=func.now())

    sender_agent = relationship("Agent", foreign_keys="Message.sender_id", back_populates="sent_messages")
    receiver_agent = relationship("Agent", foreign_keys="Message.receiver_id", back_populates="received_messages") 