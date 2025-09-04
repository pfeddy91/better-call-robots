#!/bin/bash

# Gemini Live API Test Script
# This script tests the Gemini Live API without requiring phone calls

API_BASE="http://localhost:8081"

echo "🧪 Gemini Live API Test Suite"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$API_BASE/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# Test 2: Gemini Connection
echo "2️⃣  Testing Gemini Live Connection..."
CONNECTION_RESPONSE=$(curl -s "$API_BASE/api/test/gemini-connection")
if echo "$CONNECTION_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Gemini connection successful${NC}"
    echo "$CONNECTION_RESPONSE" | python3 -m json.tool | head -20
else
    echo -e "${RED}❌ Gemini connection failed${NC}"
    echo "$CONNECTION_RESPONSE" | python3 -m json.tool
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "1. Check if service account file exists at the configured path"
    echo "2. Verify the service account has the necessary permissions"
    echo "3. Check if the project ID is correct"
    echo "4. Ensure you have internet connectivity"
    exit 1
fi
echo ""

# Test 3: Create Session
echo "3️⃣  Creating Test Session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_BASE/api/test/create-session" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"default","customerName":"Test User"}')

if echo "$SESSION_RESPONSE" | grep -q '"success":true'; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -oP '"sessionId":"\K[^"]+')
    echo -e "${GREEN}✅ Session created: $SESSION_ID${NC}"
    echo "$SESSION_RESPONSE" | python3 -m json.tool
else
    echo -e "${RED}❌ Failed to create session${NC}"
    echo "$SESSION_RESPONSE" | python3 -m json.tool
    exit 1
fi
echo ""

# Test 4: Send Message to Session
if [ ! -z "$SESSION_ID" ]; then
    echo "4️⃣  Sending test message to session..."
    MESSAGE_RESPONSE=$(curl -s -X POST "$API_BASE/api/test/send-text" \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\":\"$SESSION_ID\",\"text\":\"Hello, what can you help me with?\"}")
    
    if echo "$MESSAGE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Message sent and response received${NC}"
        echo "$MESSAGE_RESPONSE" | python3 -m json.tool
    else
        echo -e "${RED}❌ Failed to send message${NC}"
        echo "$MESSAGE_RESPONSE" | python3 -m json.tool
    fi
    echo ""
    
    # Test 5: Get Session Info
    echo "5️⃣  Getting session information..."
    INFO_RESPONSE=$(curl -s "$API_BASE/api/test/session/$SESSION_ID")
    if echo "$INFO_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Session info retrieved${NC}"
        echo "$INFO_RESPONSE" | python3 -m json.tool | head -30
    else
        echo -e "${RED}❌ Failed to get session info${NC}"
        echo "$INFO_RESPONSE" | python3 -m json.tool
    fi
    echo ""
    
    # Test 6: End Session
    echo "6️⃣  Ending test session..."
    END_RESPONSE=$(curl -s -X DELETE "$API_BASE/api/test/session/$SESSION_ID")
    if echo "$END_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Session ended successfully${NC}"
    else
        echo -e "${RED}❌ Failed to end session${NC}"
        echo "$END_RESPONSE"
    fi
fi

echo ""
echo "=============================="
echo -e "${GREEN}Test suite completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Open test-interface.html in your browser for interactive testing"
echo "2. Check the logs: tail -f *.log"
echo "3. Make a test phone call if all tests pass" 