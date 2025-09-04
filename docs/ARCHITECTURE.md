# BetterCallRobots - Architecture Documentation

## 🏗️ Monorepo Structure Overview

This document outlines the **actual** architecture of the BetterCallRobots platform after the complete monorepo restructuring. The project is now organized as a scalable, modern monorepo with clear separation of concerns.

## 📁 **ACTUAL** Directory Structure

```
better-call-robots/
├── 📱 apps/                          # Application Layer
│   ├── 🌐 web/                       # React Frontend (BetterCallRobots UI)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # 50+ shadcn/ui components
│   │   │   │   ├── AppSidebar.tsx    # Main navigation sidebar
│   │   │   │   └── Dashboard.tsx     # Dashboard component
│   │   │   ├── pages/                # 9 React pages
│   │   │   │   ├── NewAgent.tsx      # ⭐ Advanced agent config (531 lines)
│   │   │   │   ├── Build.tsx         # Agent building interface
│   │   │   │   ├── FinalizedAgent.tsx# Deployment management
│   │   │   │   ├── TestAgent.tsx     # Agent testing interface
│   │   │   │   ├── Evaluate.tsx      # Performance evaluation
│   │   │   │   ├── Integrations.tsx  # Third-party integrations
│   │   │   │   ├── Telephony.tsx     # Phone system configuration
│   │   │   │   ├── Index.tsx         # Dashboard homepage
│   │   │   │   └── NotFound.tsx      # 404 error page
│   │   │   ├── hooks/                # React hooks
│   │   │   ├── lib/                  # Utility functions
│   │   │   ├── config/               # Frontend configuration
│   │   │   ├── App.tsx               # Main React app component
│   │   │   ├── main.tsx              # React entry point
│   │   │   └── index.css             # Global styles
│   │   ├── public/                   # Static assets
│   │   ├── package.json              # Frontend dependencies
│   │   ├── vite.config.ts            # Vite configuration
│   │   ├── tailwind.config.ts        # Tailwind CSS configuration
│   │   └── tsconfig.json             # TypeScript configuration
│   ├── 📱 mobile/                    # Future: React Native app
│   └── 🛠️ admin/                     # Future: Admin dashboard
│
├── 🔧 services/                      # Service Layer
│   ├── 🌍 api/                       # ✅ Python FastAPI Backend
│   │   ├── prompts/                  # AI prompts directory
│   │   │   ├── greeting.txt          # Vodafone greeting message
│   │   │   └── system_prompt.txt     # Gemini system instructions
│   │   ├── main.py                   # ⭐ FastAPI server + WebSocket
│   │   ├── llm.py                    # Google Gemini AI integration
│   │   ├── settings.py               # Environment configuration
│   │   ├── requirements.txt          # Python dependencies
│   │   ├── README.md                 # API service documentation
│   │   ├── .env.example              # Environment template
│   │   ├── .gitignore                # API-specific git ignores
│   │   └── Makefile                  # Build scripts
│   ├── 🎤 voice-engine/              # Future: Advanced voice processing
│   └── 📊 analytics/                 # Future: Usage analytics service
│
├── 📦 packages/                      # Shared Code Layer
│   ├── 🔷 shared-types/              # TypeScript interfaces
│   │   ├── src/
│   │   │   ├── agent.ts              # Agent configuration types
│   │   │   └── index.ts              # Main exports
│   │   ├── package.json              # Package configuration
│   │   └── tsconfig.json             # TypeScript configuration
│   ├── 🎨 ui-components/             # Future: Shared UI component library
│   ├── ⚙️ config/                    # Future: Shared configurations
│   └── 🛠️ utils/                     # Future: Shared utility functions
│
├── 🛠️ tools/                         # Development Tools
│   ├── scripts/                      # Future: Build/deployment scripts
│   └── configs/                      # Future: Shared tooling configs
│
├── 🏗️ infrastructure/                # Future: Docker, K8s, deployment
│
├── 📚 docs/                          # Documentation
│   ├── ARCHITECTURE.md               # ✅ This file (now accurate!)
│   └── ngrok.png                     # Ngrok setup documentation
│
├── 📄 package.json                   # ✅ Root workspace configuration
├── 📄 package-lock.json              # NPM lock file
├── 📄 .gitignore                     # Git ignore rules
└── 📄 README.md                      # ✅ Updated monorepo documentation
```

## 🎯 **Key Features by Component**

### 🌐 **Frontend (apps/web/)**
- **Framework:** React 18 + TypeScript + Vite
- **UI System:** Tailwind CSS + shadcn/ui (50+ components)
- **State Management:** React Query + React Hook Form
- **Branding:** BetterCallRobots with microphone logo
- **Navigation:** Collapsible sidebar with 5 main sections
- **Key Features:**
  - Advanced agent configuration with inbound/outbound types
  - Multi-language support (15+ languages including English, Chinese, Croatian, etc.)
  - Collapsible form sections for better UX
  - Form validation with real-time feedback
  - Advanced settings toggles (end call, language detection, etc.)

### 🔧 **Backend (services/api/)**
- **Framework:** Python FastAPI
- **AI Integration:** Google Gemini 2.5 Flash model
- **Voice Processing:** Twilio ConversationRelay + WebSockets
- **TTS Provider:** ElevenLabs (configurable)
- **Key Features:**
  - Real-time voice conversation handling
  - Session management for concurrent calls
  - Twilio webhook endpoint (`/twiml`)
  - WebSocket endpoint (`/ws`) for real-time communication
  - Custom Vodafone broadband assistant persona

### 📦 **Shared Types (packages/shared-types/)**
- **Purpose:** Ensure type safety between frontend and backend
- **Key Types:**
- `AgentConfig` - Complete agent configuration interface
- `AgentSettings` - Boolean feature flags
  - API request/response interfaces

## 🔄 **Migration Summary: What Changed**

### ✅ **Successfully Moved:**
| **From** | **To** | **Status** |
|----------|--------|------------|
| `main.py` (root) | `services/api/main.py` | ✅ Moved |
| `llm.py` (root) | `services/api/llm.py` | ✅ Moved |
| `settings.py` (root) | `services/api/settings.py` | ✅ Moved |
| `requirements.txt` (root) | `services/api/requirements.txt` | ✅ Moved |
| `prompts/` (root) | `services/api/prompts/` | ✅ Moved |
| `Makefile` (root) | `services/api/Makefile` | ✅ Moved |

### ✅ **Successfully Created:**
- `package.json` (root) - Workspace configuration with npm workspaces
- `services/api/README.md` - API service documentation
- `services/api/.env.example` - Environment template
- `services/api/.gitignore` - API-specific git ignores
- `README.md` (updated) - Comprehensive monorepo documentation

### ✅ **Successfully Cleaned:**
- Removed `Voice-AI-Agent-Dashboard/` legacy directory
- Removed Python cache files from root
- Root directory now contains only workspace management files

## 🚀 **Development Workflow**

### **Starting the Application**

```bash
# Start both frontend and backend together
npm run dev

# Or start individually:
npm run web:dev    # Frontend on http://localhost:5173
npm run api:dev    # Backend on http://localhost:8080
```

### **Workspace Commands**

```bash
# Install all dependencies
npm run install:all

# Build frontend for production
npm run build

# Clean all caches and node_modules
npm run clean

# Run commands in specific workspace
npm install --workspace=apps/web
npm run build --workspace=apps/web
```

### **Backend Development**

```bash
# Navigate to API service
cd services/api

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Install Python dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

## 🔗 **Integration Points**

### **Frontend ↔ Backend Communication**
- Frontend running on `http://localhost:5173`
- Backend API on `http://localhost:8080`
- WebSocket connection for real-time voice processing
- Shared TypeScript types ensure API contract compliance

### **Twilio Integration**
- Webhook endpoint: `POST /twiml`
- WebSocket endpoint: `/ws`
- Configured for Vodafone broadband support persona
- ElevenLabs TTS voice: `FGY2WhTYpPnrIDTdsKH5`

### **Google Gemini AI**
- Model: `gemini-2.5-flash`
- Session management for concurrent conversations
- Custom system prompt for Vodafone support context

## 🛡️ **Architecture Benefits**

### **🔄 Code Organization**
- Clear separation between frontend and backend
- Shared types prevent API contract mismatches
- Scalable structure for adding new services/apps

### **⚡ Development Efficiency**
- Single repository for entire platform
- Workspace commands for unified development
- Hot reload for both frontend and backend

### **📈 Scalability**
- Easy to add new applications (mobile, admin)
- Microservices-ready backend architecture
- Independent deployment of services

### **👥 Team Collaboration**
- Clear ownership boundaries
- Consistent project structure across services
- Shared documentation and standards

## 🗺️ **Future Expansion**

### **Phase 2: Enhanced Services**
- `services/voice-engine/` - Advanced voice processing capabilities
- `services/analytics/` - Usage tracking and performance metrics
- Enhanced AI capabilities and multi-model support

### **Phase 3: Additional Applications**
- `apps/mobile/` - React Native mobile app for agent management
- `apps/admin/` - Advanced admin dashboard for user management
- Desktop application for complex agent configuration

### **Phase 4: Shared Packages**
- `packages/ui-components/` - Reusable UI component library
- `packages/config/` - Shared configuration management
- `packages/utils/` - Common utility functions

## 📋 **Key Files for Development**

### **Most Important Files:**
1. **`apps/web/src/pages/NewAgent.tsx`** - Advanced agent configuration UI (531 lines)
2. **`services/api/main.py`** - FastAPI server with Twilio/WebSocket integration
3. **`services/api/llm.py`** - Google Gemini AI conversation handling
4. **`package.json`** (root) - Workspace configuration and scripts

### **Configuration Files:**
- **`apps/web/vite.config.ts`** - Frontend build configuration
- **`services/api/settings.py`** - Backend environment configuration
- **`services/api/.env.example`** - Environment variables template

## ✅ **Current Status: Production Ready**

The BetterCallRobots platform is now properly architected as a scalable monorepo with:

- ✅ **Working Frontend** - Complete BetterCallRobots UI with 9 pages and 50+ components
- ✅ **Working Backend** - FastAPI + Twilio + Google Gemini integration
- ✅ **Proper Structure** - Clean monorepo organization following industry standards
- ✅ **Documentation** - Comprehensive guides and setup instructions
- ✅ **Development Workflow** - Unified commands for frontend and backend development

The platform is ready for serious development and deployment! 🚀 