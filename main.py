import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from llm import GeminiLLM
from settings import PORT, WS_URL, WELCOME_GREETING

# Initialize the LLM
llm = GeminiLLM()

# Create FastAPI app
app = FastAPI()

@app.post("/twiml")
async def twiml_endpoint():
    """Endpoint that returns TwiML for Twilio to connect to the WebSocket"""
    # Note: Twilio ConversationRelay has built-in TTS. We specify a provider and voice.
    # You can change 'ElevenLabs' to 'Amazon' or 'Google' if you prefer their TTS.
    xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
    <Connect>
    <ConversationRelay url="{WS_URL}" welcomeGreeting="{WELCOME_GREETING}" ttsProvider="ElevenLabs" voice="FGY2WhTYpPnrIDTdsKH5" />
    </Connect>
    </Response>"""
    
    return Response(content=xml_response, media_type="text/xml")

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
                if not call_sid or not llm.has_session(call_sid):
                    print(f"Error: Received prompt for unknown call_sid {call_sid}")
                    continue

                user_prompt = message["voicePrompt"]
                print(f"Processing prompt: {user_prompt}")
                
                try:
                    response_text = await llm.get_response(call_sid, user_prompt)
                    
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
            llm.remove_session(call_sid)
            print(f"Cleared session for call {call_sid}")

if __name__ == "__main__":
    print(f"Starting server on port {PORT}")
    print(f"WebSocket URL for Twilio: {WS_URL}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)