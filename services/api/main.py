import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
from llm import GeminiLLM, GREETING
from settings import PORT, WS_URL

# Initialize the LLM
llm = GeminiLLM()

# Create FastAPI app
app = FastAPI()

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*", "ngrok-skip-browser-warning"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "python-api"}

@app.post("/twiml")
async def twiml_endpoint():
    """Endpoint that returns TwiML for Twilio to connect to the WebSocket"""
    # Note: Twilio ConversationRelay has built-in TTS. We specify a provider and voice.
    # You can change 'ElevenLabs' to 'Amazon' or 'Google' if you prefer their TTS.
    xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
    <Connect>
    <ConversationRelay url="{WS_URL}" welcomeGreeting="{GREETING}" ttsProvider="ElevenLabs" voice="FGY2WhTYpPnrIDTdsKH5" />
    </Connect>
    </Response>"""
    
    return Response(content=xml_response, media_type="text/xml")

@app.get("/voice/token")
async def voice_token(identity: str = "demo-user"):
    """Issue a short-lived Twilio Voice Access Token for browser SDK."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    api_key_sid = os.getenv("TWILIO_API_KEY_SID")
    api_key_secret = os.getenv("TWILIO_API_KEY_SECRET")
    twiml_app_sid = os.getenv("TWILIO_TWIML_APP_SID")
    ttl_seconds = int(os.getenv("TOKEN_TTL_SECONDS", "3600"))

    if not all([account_sid, api_key_sid, api_key_secret, twiml_app_sid]):
        raise HTTPException(status_code=500, detail="Twilio env vars not configured")

    token = AccessToken(
        account_sid=account_sid,
        signing_key_sid=api_key_sid,
        secret=api_key_secret,
        identity=identity,
        ttl=ttl_seconds,
    )
    voice_grant = VoiceGrant(outgoing_application_sid=twiml_app_sid)
    token.add_grant(voice_grant)

    jwt = token.to_jwt().decode("utf-8") if hasattr(token.to_jwt(), "decode") else token.to_jwt()
    return {"token": jwt, "identity": identity, "ttl": ttl_seconds}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    call_sid = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "setup":
                call_sid = message["callSid"]
                print(f"Setup for call: {call_sid}")
                # Start a new chat session for this call
                llm.create_session(call_sid)
                
            elif message["type"] == "prompt":
                if not call_sid:
                    print(f"Error: Received prompt for unknown call_sid {call_sid}")
                    continue

                user_prompt = message["voicePrompt"]
                print(f"Processing prompt: {user_prompt}")
                
                try:
                    response_text = llm.send_message(call_sid, user_prompt)
                    
                    # Send the complete response back to Twilio.
                    # Twilio's ConversationRelay will handle the text-to-speech conversion.
                    await websocket.send_text(
                        json.dumps({
                            "type": "text",
                            "token": response_text,
                            "last": True  # Indicate this is the full and final message
                        })
                    )
                    print(f"Sent response: {response_text}")
                except ValueError as e:
                    print(f"Error getting response: {e}")
                    continue
                
            elif message["type"] == "interrupt":
                print(f"Handling interruption for call {call_sid}.")
                
            else:
                print(f"Unknown message type received: {message['type']}")
                
    except WebSocketDisconnect:
        print(f"WebSocket connection closed for call {call_sid}")
        if call_sid:
            llm.end_session(call_sid)
            print(f"Cleared session for call {call_sid}")

if __name__ == "__main__":
    print(f"Starting server on port {PORT}")
    print(f"WebSocket URL for Twilio: {WS_URL}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)