#!/bin/bash

# Start ngrok tunnel for Gemini Live API service
# This exposes your local server to the internet for Twilio webhooks

echo "🚀 Starting ngrok tunnel for Gemini Live API..."
echo "================================================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo "Please install ngrok: https://ngrok.com/download"
    exit 1
fi

# Start ngrok on port 8081 (Gemini Live API port)
echo "📡 Starting ngrok tunnel on port 8081..."
echo ""
echo "IMPORTANT: After ngrok starts:"
echo "1. Copy the HTTPS URL (e.g., https://xxxx.ngrok.io)"
echo "2. Update your Twilio phone number webhook to:"
echo "   https://xxxx.ngrok.io/api/inbound-call"
echo "3. Set the method to POST"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""

ngrok http 8081 