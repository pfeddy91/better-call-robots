# 🤖 BetterCallRobots - AI Voice Assistant Platform

A scalable monorepo containing a complete voice AI platform with React frontend and Python backend.

## 🏗️ Monorepo Structure

```
better-call-robots/
├── 📱 apps/
│   ├── web/                    # React frontend (BetterCallRobots UI)
│   ├── mobile/                 # Future: React Native app
│   └── admin/                  # Future: Admin dashboard
├── 🔧 services/
│   ├── api/                    # Python FastAPI + Twilio + Gemini
│   ├── voice-engine/           # Future: Voice processing
│   └── analytics/              # Future: Analytics service
├── 📦 packages/
│   └── shared-types/           # TypeScript interfaces
└── 📚 docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Twilio Account with Voice capabilities
- Google AI API key
- ngrok for local development

### Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/egrinstein/voice_startup.git
   cd better-call-robots
   npm run install:all
   ```

2. **Set up backend environment:**
   ```bash
   cd services/api
   cp .env.example .env
   # Edit .env with your API keys
   pip install -r requirements.txt
   ```

3. **Start development servers:**
   ```bash
   # From root directory - starts both frontend and backend
   npm run dev
   
   # Or individually:
   npm run web:dev    # Frontend on http://localhost:5173
   npm run api:dev    # Backend on http://localhost:8080
   ```

## 🌐 Frontend (apps/web/)
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui (50+ components)
- **State:** React Query + React Hook Form
- **Features:** Agent configuration, multi-language support, advanced settings

## 🔧 Backend (services/api/)
- **Framework:** FastAPI + Python
- **AI:** Google Gemini 2.5 Flash
- **Voice:** Twilio ConversationRelay + WebSockets
- **Features:** Real-time voice processing, session management

## 📦 Packages
- **shared-types:** TypeScript interfaces for type safety between frontend/backend

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start both frontend and backend
- `npm run web:dev` - Frontend development server
- `npm run api:dev` - Backend development server
- `npm run build` - Build frontend for production
- `npm run clean` - Clean all node_modules and cache

### Workspace Commands
```bash
# Install dependencies for specific workspace
npm install --workspace=apps/web

# Run commands in specific workspace
npm run build --workspace=apps/web
```

## 📱 Usage

1. **Start ngrok:** `ngrok http --url=YOUR_NGROK_URL 8080`
2. **Configure Twilio:** Set webhook to `https://YOUR_NGROK_URL/twiml`
3. **Call your Twilio number** and interact with the AI assistant!

## 📚 Documentation
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Frontend Specifications](./docs/FRONTEND_SPECIFICATIONS.md)
- [Backend API Documentation](./docs/BACKEND_API_SPECIFICATIONS.md)

## 🤝 Contributing
This is a scalable monorepo designed for growth. Each service and app can be developed independently while sharing common types and utilities.

## 📄 License
MIT
