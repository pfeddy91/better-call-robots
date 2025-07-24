import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

# --- Configuration ---
PORT = int(os.getenv("PORT", "8080"))
DOMAIN = os.getenv("NGROK_URL") 
if not DOMAIN:
    raise ValueError("NGROK_URL environment variable not set.")
WS_URL = f"wss://{DOMAIN}/ws"

# Updated greeting to reflect the new model
WELCOME_GREETING = "Hi! I am a voice assistant powered by Twilio and Google Gemini. Ask me anything!"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")