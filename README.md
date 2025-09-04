# 🤖 Better Call Robots
## Enterprise AI Voice Assistant Platform for Telcos & Utilities

**Revolutionizing customer support and sales with intelligent voice automation**

Transform your customer experience with AI-powered voice assistants designed for enterprise telecommunications and utility companies. Handle inbound customer support seamlessly and boost outbound sales with natural, human-like conversations.

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

## 🎯 Enterprise Use Cases

### 📞 **Inbound Customer Support**
- 24/7 automated customer service for billing inquiries
- Technical support for outages and service issues
- Account management and service upgrades
- Multi-language support for diverse customer bases

### 📈 **Outbound Sales & Upselling**
- Proactive customer retention calls
- Service upgrade recommendations
- Payment reminders and collection calls
- Market research and customer satisfaction surveys

## 🏗️ Technology Stack

### 🌐 **Frontend** (apps/web/)
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui (50+ professional components)
- **State:** React Query + React Hook Form
- **Features:** Agent configuration, multi-language support, enterprise settings

### 🔧 **Backend** (services/api/)
- **Framework:** FastAPI + Python
- **AI Engine:** Google Gemini 2.5 Flash for natural conversations
- **Voice Platform:** Twilio ConversationRelay + WebSockets
- **Voice Synthesis:** ElevenLabs for premium, human-like voice quality
- **Features:** Real-time voice processing, session management, enterprise integrations

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

## 🚀 Enterprise Features

✅ **Real-time Voice Processing** - Low-latency conversations with enterprise-grade reliability  
✅ **Premium Voice Quality** - ElevenLabs integration for natural, professional voices  
✅ **Scalable Architecture** - Monorepo design supporting enterprise deployment  
✅ **Multi-language Support** - Serve diverse customer bases globally  
✅ **Advanced Analytics** - Track call performance and customer satisfaction  
✅ **CRM Integration Ready** - Built for enterprise system integration  

## 💼 Demo

1. **Start ngrok:** `ngrok http --url=YOUR_NGROK_URL 8080`
2. **Configure Twilio:** Set webhook to `https://YOUR_NGROK_URL/twiml`
3. **Click "Talk to Agent"** in the web interface and experience enterprise-grade AI conversation!

## 📚 Documentation
- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and enterprise deployment
- [Twilio Integration Guide](./docs/TWILIO_BROWSER_VOICE_INTEGRATION.md) - Voice setup walkthrough
- [Pipeline Documentation](./docs/PIPELINE.md) - Development and deployment workflows

## 🏢 Built for Enterprise

**Better Call Robots** is specifically designed for **telecommunications companies** and **utility providers** who need:
- High-volume call handling capabilities
- Enterprise-grade security and compliance
- Seamless integration with existing CRM and billing systems
- Scalable architecture for millions of customer interactions

Perfect for **customer service automation**, **billing support**, **outage notifications**, and **proactive sales campaigns**.

---

*Revolutionizing customer experience, one conversation at a time* 🤖📞
