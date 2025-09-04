# Gemini Live API Service - Implementation Plan

## 🎯 **Objective**

Develop a Node.js backend service for "Better Call Robots" that provides real-time, bidirectional voice AI conversations using Google Gemini Live API with Twilio telephony integration and Vertex AI Search for knowledge retrieval (RAG).

## 🏗️ **Architecture Overview**

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Frontend │ │ Twilio Voice │ │ Gemini Live API │
│ (React) │◄──►│ Platform │◄──►│ Service │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│ │
▼ ▼
┌─────────────────┐ ┌─────────────────┐
│ Node.js/Express │ │ Vertex AI Search│
│ WebSocket │ │ (RAG) │
│ Server │ │ │
└─────────────────┘ └─────────────────┘


### **Core Technologies**
- **Backend Framework**: Node.js with Express.js
- **Telephony**: Twilio Programmable Voice
- **Conversational AI**: Google Gemini Live API (`gemini-2.5-flash-preview-native-audio-dialog`)
- **Knowledge Retrieval**: Google Vertex AI Search
- **Real-time Communication**: WebSockets

### **Key Design Principles**
- **Real-time**: Sub-500ms latency for natural conversation flow
- **Bidirectional**: Full-duplex audio streaming
- **Scalable**: Non-blocking I/O for concurrent calls
- **Resilient**: Graceful error handling and fallbacks
- **Observable**: Comprehensive logging and metrics

---

## 📋 **Phase-by-Phase Implementation**

### **Phase 1: Project Setup & Basic Server Structure**

#### **1.1 Initialize Node.js Project**

**Dependencies to Install:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "twilio": "^4.20.0", 
    "@google-cloud/vertexai": "^1.4.0",
    "ws": "^8.14.0",
    "dotenv": "^16.3.0",
    "uuid": "^9.0.0",
    "winston": "^3.11.0",
    "multer": "^1.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0"
  }
}
```

#### **1.2 Environment Configuration**

**Create `.env.example` file:**
```env
# Server Configuration
PORT=8081
NODE_ENV=development

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Gemini Live API Configuration
GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog

# Vertex AI Search Configuration
VERTEX_AI_SEARCH_DATASTORE_ID=your_datastore_id
VERTEX_AI_SEARCH_LOCATION=global
```

#### **1.3 Core API Endpoints (Placeholder)**

**Initial Route Structure:**
- `POST /api/inbound-call` - Handle incoming calls from Twilio
- `POST /api/outbound-call` - Initiate calls from frontend
- `POST /api/twilio-events` - Receive Twilio status updates
- `WS /voice-stream` - Real-time audio streaming
- `GET /health` - Health check endpoint

**Success Criteria for Phase 1:**
- ✅ Server starts and listens on configured port
- ✅ All placeholder endpoints respond with 200 status
- ✅ Environment variables are properly loaded
- ✅ Basic logging is functional

---

### **Phase 2: Twilio Integration for Telephony**

#### **2.1 Inbound Call Handling**

**Endpoint: `POST /api/inbound-call`**

**TwiML Response Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://your-domain.com/voice-stream">
            <Parameter name="callSid" value="{CallSid}" />
            <Parameter name="agentId" value="{AgentId}" />
        </Stream>
    </Connect>
</Response>
```

#### **2.2 Outbound Call Initiation**

**Request Format:**
```json
{
  "to_number": "+1234567890",
  "agent_id": "agent_123",
  "campaign_id": "campaign_456",
  "custom_context": {
    "customer_name": "John Doe",
    "account_id": "12345"
  }
}
```

**Success Criteria for Phase 2:**
- ✅ Inbound calls successfully connect and receive TwiML
- ✅ Outbound calls are initiated and connect properly
- ✅ Twilio events are received and logged
- ✅ Call state is properly tracked throughout lifecycle

---

### **Phase 3: Gemini Live API & Real-Time Audio Handling**

#### **3.1 WebSocket Server Implementation**

**Connection Flow:**
1. Twilio connects via TwiML `<Stream>` directive
2. Server authenticates connection using parameters
3. Gemini Live session is established
4. Bidirectional audio proxy begins

#### **3.2 Audio Format Conversion**
- **Twilio Format**: μ-law (G.711) at 8kHz, base64 encoded
- **Gemini Format**: Linear PCM, specific format requirements
- **Conversion Pipeline**: Decode base64 → Convert μ-law to PCM → Send to Gemini

#### **3.3 Session State Management**
- Active Gemini Live sessions
- Audio buffer management
- Conversation context preservation
- Error state handling and recovery

**Success Criteria for Phase 3:**
- ✅ WebSocket connections establish successfully
- ✅ Audio flows bidirectionally without significant latency
- ✅ Gemini Live sessions are stable and responsive
- ✅ Audio quality is acceptable for voice conversations
- ✅ Memory usage remains stable during long calls

---

### **Phase 4: RAG with Vertex AI Search**

#### **4.1 Tool Integration with Gemini Live**

**Tool Definition:**
```javascript
const knowledgeRetrieverTool = {
  name: 'knowledge_retriever',
  description: 'Retrieves specific information from the company\'s internal documents to answer user questions accurately.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant information in the knowledge base.'
      }
    },
    required: ['query']
  }
};
```

#### **4.2 RAG Conversation Flow**
1. **User speaks** → Audio sent to Gemini Live
2. **Gemini processes** → Determines if knowledge retrieval needed
3. **Tool call triggered** → `knowledge_retriever` function called
4. **Search execution** → Query Vertex AI Search
5. **Results formatting** → Format search results for Gemini
6. **Tool response** → Send results back to Gemini
7. **Final response** → Gemini generates answer with retrieved context
8. **Audio output** → Synthesized speech sent to user

**Success Criteria for Phase 4:**
- ✅ Knowledge retrieval works seamlessly during conversations
- ✅ Search results are relevant and accurately formatted
- ✅ Tool calls don't introduce noticeable latency
- ✅ Fallback mechanisms work when search fails
- ✅ Knowledge base stays synchronized with uploaded content

---

## 🎯 **Success Metrics & KPIs**

### **Technical Performance**
- **Latency**: < 500ms from user speech end to AI response start
- **Audio Quality**: Clear, natural-sounding voice with minimal artifacts
- **Uptime**: > 99.9% availability
- **Concurrent Calls**: Support for 100+ simultaneous conversations

### **AI Performance**
- **Grounded Task Success Rate**: > 90% (answers are correct and based on knowledge base)
- **Tool Call Accuracy**: > 95% (knowledge retrieval triggers appropriately)
- **Search Relevance**: > 85% (retrieved documents are relevant to query)

### **User Experience**
- **Conversational Naturalness**: > 70% of calls completed without human escalation
- **Response Relevance**: > 90% of responses directly address user questions
- **Call Completion Rate**: > 80% of calls reach successful resolution

## 🔧 **Development & Deployment**

### **Testing Strategy**
- **Unit Tests**: Core functions and services
- **Integration Tests**: Twilio webhooks and Gemini API integration
- **Load Tests**: Concurrent call handling
- **End-to-End Tests**: Complete call flows with knowledge retrieval

### **Monitoring & Observability**
- **Structured Logging**: Winston with JSON format
- **Metrics Collection**: Call duration, latency, error rates
- **Health Checks**: Service dependency monitoring
- **Alerting**: Critical error notifications

---

## 🚀 **Getting Started**

### **Quick Start Commands**
```bash
# Navigate to service directory
cd services/gemini-live-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your credentials

# Start development server
npm run dev

# Run tests
npm test
```

### **Environment Setup**
1. **Google Cloud**: Enable Vertex AI and set up service account
2. **Twilio**: Configure webhook URLs for your phone number
3. **SSL/TLS**: Ensure WebSocket endpoints are accessible via HTTPS
4. **Monitoring**: Set up logging and monitoring infrastructure

---

## 📝 **Implementation Notes**

### **Key Differences from Current Python API**
- **Language**: Node.js vs Python (better for real-time WebSocket handling)
- **Architecture**: Direct Gemini Live integration vs Twilio ConversationRelay
- **Audio Processing**: Real-time streaming vs request-response pattern
- **Knowledge Integration**: Tool-based RAG vs prompt injection

### **Migration Strategy**
- Run both services in parallel during development
- Use API gateway for A/B testing between architectures
- Implement feature flags for gradual rollout
- Monitor performance metrics during transition

### **Risk Mitigation**
- Comprehensive fallback mechanisms
- Circuit breakers for external API calls
- Graceful degradation under load
- Detailed error tracking and alerting