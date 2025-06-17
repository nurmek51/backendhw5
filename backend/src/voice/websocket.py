from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, status
from openai import OpenAI, OpenAIError
from ..config import settings
import tempfile
import os

# Initialize OpenAI client only if API key is provided
openai_client = None
if settings.OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        print("OpenAI client initialized successfully.")
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        openai_client = None
else:
    print("OPENAI_API_KEY is not set. Voice chat functionality will be disabled.")

router = APIRouter()

@router.websocket("/ws/voice-chat")
async def websocket_voice_chat(websocket: WebSocket):
    if not openai_client:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="OpenAI API key is not configured or invalid.")
        return

    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()

            # Save temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(data)
                tmp_path = tmp.name

            try:
                # Transcribe audio
                with open(tmp_path, "rb") as audio_file:
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )

                # Get AI response
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": transcript.text}]
                )
                reply_text = response.choices[0].message.content

                # Generate speech
                tts_response = openai_client.audio.speech.create(
                    model="tts-1",
                    voice="nova",
                    input=reply_text,
                )

                # Send mp3 file to client
                await websocket.send_bytes(tts_response.read())
            except OpenAIError as e:
                print(f"OpenAI API Error: {e}")
                await websocket.send_text(f"Error: OpenAI API Error: {e}")
            finally:
                # Clean up the temporary file
                os.remove(tmp_path)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason=f"Server error: {e}")
