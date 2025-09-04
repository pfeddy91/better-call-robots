#!/bin/bash

echo "🔍 Better Call Robots - Server Status Check"
echo "==========================================="
echo ""

# Check Python API
echo -n "1. Python API (Port 8080): "
if curl -s http://localhost:8080/docs | grep -q "FastAPI" 2>/dev/null; then
    echo "✅ Running"
    echo "   - Docs: http://localhost:8080/docs"
else
    echo "❌ Not Running"
    echo "   - Start with: cd services/api && make run"
fi

echo ""

# Check Node.js API
echo -n "2. Node.js Gemini Live API (Port 8081): "
if curl -s http://localhost:8081/health | jq -r '.data.status' 2>/dev/null | grep -q "healthy"; then
    echo "✅ Running"
    echo "   - Health: http://localhost:8081/health"
else
    echo "❌ Not Running"
    echo "   - Start with: cd services/gemini-live-api && npm run dev"
fi

echo ""

# Check Frontend
echo -n "3. React Frontend (Port 5173): "
if curl -s http://localhost:5173 | grep -q "Better Call Robots" 2>/dev/null; then
    echo "✅ Running"
    echo "   - URL: http://localhost:5173"
else
    echo "❌ Not Running"
    echo "   - Start with: cd apps/web && npm run dev"
fi

echo ""
echo "==========================================="
echo "To start all services, run:"
echo "1. cd services/api && make run &"
echo "2. cd services/gemini-live-api && npm run dev &"
echo "3. cd apps/web && npm run dev &" 