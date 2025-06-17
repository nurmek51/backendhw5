from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict
from contextlib import asynccontextmanager
import redis
import json
import os
import base64 # For video messages
import asyncio # For WebSocket communication
from google.cloud import storage # New import for Google Cloud Storage

from src.database import SessionLocal, engine, Base
from src import models, schemas
from src.config import settings # Assuming config.py is in src/

# V2V related imports
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from src.voice.websocket import router as voice_router

# Create database tables for all models
Base.metadata.create_all(bind=engine)

# Redis connection
redis_client = redis.StrictRedis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

# Google Cloud Storage client
try:
    # Initialize GCS client. This expects GOOGLE_APPLICATION_CREDENTIALS env var to be set,
    # or running in a GCS-enabled environment.
    storage_client = storage.Client()
    gcs_bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)
    print(f"Connected to Google Cloud Storage bucket: {settings.GCS_BUCKET_NAME}")
except Exception as e:
    print(f"Could not connect to Google Cloud Storage: {e}")
    storage_client = None
    gcs_bucket = None

# Dictionary to keep track of active WebSocket connections for A2A chat
active_connections: Dict[int, WebSocket] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    # Any startup code here
    yield
    print("Application shutting down...")
    # Any shutdown code here, e.g., closing connections
    for agent_id, ws in active_connections.items():
        try:
            await ws.close()
        except RuntimeError:
            pass # Already closed
    active_connections.clear()

app = FastAPI(lifespan=lifespan, title="V2V AI Assistant API")

# CORS configuration from settings
origins = settings.FRONTEND_URLS.split(",") if settings.FRONTEND_URLS else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include V2V voice router
app.include_router(voice_router, tags=["Voice"], prefix="/api")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD Endpoints
@app.post("/items/", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(name=item.name, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/items/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Try to fetch from cache first
    cached_items = redis_client.get("all_items")
    if cached_items:
        return json.loads(cached_items)

    items = db.query(models.Item).offset(skip).limit(limit).all()
    # Cache the result
    redis_client.setex("all_items", 60, json.dumps([item.dict() for item in items])) # Cache for 60 seconds
    return items

@app.get("/items/{item_id}", response_model=schemas.Item)
def read_item(item_id: int, db: Session = Depends(get_db)):
    # Try to fetch from cache first
    cached_item = redis_client.get(f"item_{item_id}")
    if cached_item:
        return json.loads(cached_item)

    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    # Cache the result
    redis_client.setex(f"item_{item_id}", 60, json.dumps(item.dict())) # Cache for 60 seconds
    return item

@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item.name = item.name
    db_item.description = item.description
    db.commit()
    db.refresh(db_item)
    # Invalidate cache for this item and all_items
    redis_client.delete(f"item_{item_id}")
    redis_client.delete("all_items")
    return db_item

@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    # Invalidate cache for this item and all_items
    redis_client.delete(f"item_{item_id}")
    redis_client.delete("all_items")
    return {"message": "Item deleted successfully"}

# S3 Uploader Placeholder
# This will require AWS SDK (boto3) and proper configuration.
# For now, it's just a placeholder.

@app.post("/upload-gcs/")
async def upload_file_to_gcs(file: UploadFile = File(...)):
    if not gcs_bucket:
        raise HTTPException(status_code=500, detail="Google Cloud Storage is not configured.")

    try:
        file_contents = await file.read()
        blob = gcs_bucket.blob(file.filename)
        blob.upload_from_string(file_contents, content_type=file.content_type)
        return {"message": f"File {file.filename} uploaded to GCS successfully.", "public_url": blob.public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to GCS: {e}")

# A2A Endpoints

@app.post("/agents/", response_model=schemas.AgentResponse)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(name=agent.name, status=agent.status)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/agents/", response_model=List[schemas.AgentResponse])
def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    agents = db.query(models.Agent).offset(skip).limit(limit).all()
    return agents

@app.get("/agents/{agent_id}", response_model=schemas.AgentResponse)
def read_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/messages/{sender_id}", response_model=schemas.MessageResponse)
def send_message(
    sender_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    # Check if sender and receiver exist
    sender = db.query(models.Agent).filter(models.Agent.id == sender_id).first()
    if sender is None:
        raise HTTPException(status_code=404, detail="Sender agent not found")
    receiver = db.query(models.Agent).filter(models.Agent.id == message.receiver_id).first()
    if receiver is None:
        raise HTTPException(status_code=404, detail="Receiver agent not found")

    db_message = models.Message(
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        message_type=message.message_type
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Send message via WebSocket if receiver is connected
    if message.receiver_id in active_connections:
        receiver_ws = active_connections[message.receiver_id]
        try:
            await receiver_ws.send_json(db_message.dict())
        except RuntimeError as e:
            print(f"Error sending message to WebSocket for agent {message.receiver_id}: {e}")
            # Clean up broken connection
            del active_connections[message.receiver_id]

    return db_message

@app.get("/messages/{agent_id}", response_model=List[schemas.MessageResponse])
def get_messages(agent_id: int, db: Session = Depends(get_db)):
    # Get all messages where agent_id is either sender or receiver
    messages = db.query(models.Message).options(
        joinedload(models.Message.sender_agent),
        joinedload(models.Message.receiver_agent)
    ).filter(
        (models.Message.sender_id == agent_id) | (models.Message.receiver_id == agent_id)
    ).order_by(models.Message.timestamp).all()
    return messages

@app.websocket("/ws/chat/{agent_id}")
async def websocket_a2a_chat(websocket: WebSocket, agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if agent is None:
        print(f"Agent {agent_id} not found for WebSocket connection.")
        await websocket.close(code=4001, reason="Agent not found")
        return

    await websocket.accept()
    active_connections[agent_id] = websocket
    print(f"Agent {agent_id} connected to A2A chat WebSocket.")

    # Update agent status to online
    agent.status = "online"
    db.add(agent)
    db.commit()
    db.refresh(agent)

    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages from this agent
            # This could be for sending messages to other agents or updating status
            print(f"Received message from agent {agent_id}: {data}")

            # Example: Agent sending a message through WebSocket
            if data.get("type") == "message":
                receiver_id = data.get("receiver_id")
                content = data.get("content")
                message_type = data.get("message_type", "text")

                if receiver_id and content:
                    # Save message to DB
                    db_message = models.Message(
                        sender_id=agent_id,
                        receiver_id=receiver_id,
                        content=content,
                        message_type=message_type
                    )
                    db.add(db_message)
                    db.commit()
                    db.refresh(db_message)

                    # Forward message to receiver if connected
                    if receiver_id in active_connections:
                        target_ws = active_connections[receiver_id]
                        try:
                            await target_ws.send_json(db_message.dict())
                            print(f"Message from {agent_id} to {receiver_id} forwarded via WebSocket.")
                        except RuntimeError as e:
                            print(f"Error forwarding message to {receiver_id}: {e}")
                            del active_connections[receiver_id]
                    else:
                        print(f"Receiver agent {receiver_id} is not online.")
                else:
                    print("Invalid message format.")
            
            # Handle video message chunks
            elif data.get("type") == "video_chunk":
                receiver_id = data.get("receiver_id")
                video_chunk_base64 = data.get("content") # Base64 encoded chunk
                if receiver_id and video_chunk_base64:
                    # For simplicity, we'll just forward to the receiver's WebSocket
                    # In a real app, you'd handle buffering, encoding, etc.
                    if receiver_id in active_connections:
                        target_ws = active_connections[receiver_id]
                        try:
                            await target_ws.send_json({
                                "type": "video_chunk",
                                "sender_id": agent_id,
                                "content": video_chunk_base64
                            })
                            print(f"Video chunk from {agent_id} to {receiver_id} forwarded.")
                        except RuntimeError as e:
                            print(f"Error forwarding video chunk to {receiver_id}: {e}")
                            del active_connections[receiver_id]

    except WebSocketDisconnect:
        print(f"Agent {agent_id} disconnected from A2A chat WebSocket.")
    except Exception as e:
        print(f"Error in A2A chat WebSocket for agent {agent_id}: {e}")
    finally:
        if agent_id in active_connections:
            del active_connections[agent_id]
            # Update agent status to offline
            agent.status = "offline"
            db.add(agent)
            db.commit()
            db.refresh(agent)


