#!/bin/bash

# Start Audio Test Interface
# This script starts the Gemini Live API server and opens the audio test interface

echo "🎤 Starting Gemini Live Audio Test Interface..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the services/gemini-live-api directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting Gemini Live API server on port 8082..."
npm run dev &

# Wait a moment for the server to start
sleep 3

# Check if server is running
if curl -s http://localhost:8082/api/health > /dev/null; then
    echo "✅ Server is running on http://localhost:8082"
    echo ""
    echo "🎯 Audio Test Interface is ready!"
    echo "📱 Open your browser and go to:"
    echo "   http://localhost:8082/test-audio-interface.html"
    echo ""
    echo "🔧 Or use the existing test interface:"
    echo "   http://localhost:8082/test-interface.html"
    echo ""
    echo "📋 Available test endpoints:"
    echo "   • GET  /api/health - Health check"
    echo "   • GET  /api/test/gemini-connection - Test Gemini connection"
    echo "   • POST /api/test/create-audio-session - Create audio session"
    echo "   • POST /api/test/send-audio - Send audio data"
    echo "   • DELETE /api/test/end-session/:id - End session"
    echo ""
    echo "🛑 Press Ctrl+C to stop the server"
else
    echo "❌ Failed to start server. Check the logs above for errors."
    exit 1
fi

# Keep the script running
wait 