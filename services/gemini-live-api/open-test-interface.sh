#!/bin/bash

# Open Gemini Live Audio Test Interface
# This script opens the test interface in your default browser

echo "🎤 Opening Gemini Live Audio Test Interface..."

# Check if server is running
if curl -s http://localhost:8082/api/health > /dev/null; then
    echo "✅ Server is running on port 8082"
    
    # Determine the OS and open the appropriate URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "📱 Opening audio test interface..."
        open "http://localhost:8082/test-audio-interface.html"
        
        echo "📱 Opening text test interface..."
        open "http://localhost:8082/test-interface.html"
        
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "📱 Opening audio test interface..."
        xdg-open "http://localhost:8082/test-audio-interface.html" 2>/dev/null || \
        sensible-browser "http://localhost:8082/test-audio-interface.html" 2>/dev/null || \
        echo "Please open: http://localhost:8082/test-audio-interface.html"
        
        echo "📱 Opening text test interface..."
        xdg-open "http://localhost:8082/test-interface.html" 2>/dev/null || \
        sensible-browser "http://localhost:8082/test-interface.html" 2>/dev/null || \
        echo "Please open: http://localhost:8082/test-interface.html"
        
    else
        # Windows or other
        echo "📱 Please open these URLs in your browser:"
        echo "   • Audio Test: http://localhost:8082/test-audio-interface.html"
        echo "   • Text Test:  http://localhost:8082/test-interface.html"
    fi
    
    echo ""
    echo "🎯 Test Interface Features:"
    echo "   • Real-time microphone input"
    echo "   • Audio visualization"
    echo "   • Live API logs"
    echo "   • Session management"
    echo "   • Export capabilities"
    echo ""
    echo "🧪 This is running in test mode with mock responses"
    echo "   No real Gemini Live API connection required"
    
else
    echo "❌ Server is not running on port 8082"
    echo ""
    echo "🔧 To start the test server:"
    echo "   cd services/gemini-live-api"
    echo "   node test-simple-server.js"
    echo ""
    echo "   Or for the full server (requires env vars):"
    echo "   npm run dev"
fi 