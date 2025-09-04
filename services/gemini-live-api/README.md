# Gemini Live API Service

Real-time voice AI service using Google Gemini Live API with Twilio telephony integration and Vertex AI Search for knowledge retrieval.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables in .env
# Then start the development server
npm run dev
```

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- Google Cloud Platform account with Vertex AI enabled
- Twilio account with programmable voice
- Valid SSL certificate for production (WebSocket requires HTTPS)

## 🔧 Environment Configuration

Create a `.env` file with the following variables:

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

## 📚 API Endpoints

### Health Check
```http
GET /health
```

Returns service health status and dependency checks.

### Inbound Call Handler
```http
POST /api/inbound-call
```

Handles incoming calls from Twilio. Returns TwiML to connect call to WebSocket stream.

### Outbound Call Initiation
```http
POST /api/outbound-call
Content-Type: application/json

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

### Twilio Events
```http
POST /api/twilio-events
```

Receives status updates from Twilio about call progress.

### Voice Stream WebSocket
```
WS /voice-stream?callSid={callSid}&agentId={agentId}
```

Real-time bidirectional audio streaming for voice conversations.

## 🛠️ Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## 🏗️ Architecture

```
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
```

## 📁 Project Structure

```
src/
├── config/           # Configuration management
├── middleware/       # Express middleware
├── routes/          # API route handlers
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🔒 Security Features

- Helmet.js security headers
- CORS configuration
- Request validation
- Twilio webhook signature validation
- Rate limiting (TODO)
- Input sanitization

## 📊 Monitoring & Logging

The service includes comprehensive structured logging with Winston:

- Request/response logging
- Call event tracking
- Error logging with context
- Performance metrics
- Health check monitoring

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Requirements
- SSL/TLS certificate for WebSocket connections
- Environment variables properly configured
- Google Cloud service account with appropriate permissions
- Twilio webhook URLs configured

### Scaling Considerations
- Use a load balancer for multiple instances
- Implement Redis for session state (TODO)
- Configure proper health checks
- Monitor WebSocket connection limits

## 🧪 Testing

Run the test suite:
```bash
# Unit tests
npm test

# Integration tests (TODO)
npm run test:integration

# End-to-end tests (TODO)
npm run test:e2e
```

## 🔄 Implementation Status

### ✅ Phase 1: Complete
- [x] Project setup with TypeScript
- [x] Express server with middleware
- [x] WebSocket server for voice streaming
- [x] Health check endpoint
- [x] Placeholder API endpoints
- [x] Comprehensive logging
- [x] Error handling

### 🚧 Phase 2: In Progress
- [ ] Twilio webhook signature validation
- [ ] Complete call flow testing
- [ ] Call state persistence

### 📋 Phase 3: Planned
- [ ] Gemini Live API integration
- [ ] Audio format conversion
- [ ] Real-time audio processing

### 📋 Phase 4: Planned
- [ ] Vertex AI Search integration
- [ ] RAG with tool calling
- [ ] Knowledge base management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 