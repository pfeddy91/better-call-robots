# Voice AI API Service

FastAPI backend service for BetterCallRobots voice AI platform.

## Features
- Twilio Voice integration with ConversationRelay
- Google Gemini AI for conversation handling
- WebSocket real-time communication
- Session management for concurrent calls

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Run the server:
   ```bash
   python main.py
   ```

## Environment Variables
- `GOOGLE_API_KEY` - Google Gemini API key
- `NGROK_URL` - Your ngrok forwarding URL
- `PORT` - Server port (default: 8080)

## API Endpoints
- `POST /twiml` - Twilio webhook endpoint
- `WebSocket /ws` - Real-time voice communication
