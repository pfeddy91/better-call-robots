# Audio-to-Audio Pipeline Documentation

## 🎯 **Overview**

This document describes the complete audio-to-audio pipeline for real-time voice conversations using Google Gemini Live API, Twilio telephony, and our custom audio processing system.

## 🏗️ **Architecture Overview**

### **Complete Pipeline Flow**
```
Phone Call → Twilio → WebSocket → Audio Converter → Gemini Live → Audio Converter → WebSocket → Twilio → Phone Call
```

### **Detailed Component Flow**
```
1. Phone Call Initiated
   ↓
2. Twilio Receives Call
   ↓
3. Twilio Connects to WebSocket (TwiML Stream)
   ↓
4. WebSocket Server Creates Gemini Live Session
   ↓
5. Audio Streaming Begins:
   - Twilio sends μ-law audio chunks
   - AudioConverter converts μ-law → PCM 16kHz
   - Gemini Live processes audio and responds
   - AudioConverter converts PCM 24kHz → μ-law
   - WebSocket sends audio back to Twilio
   ↓
6. Real-time conversation continues
   ↓
7. Call ends, sessions cleaned up
```

## 📦 **Core Components**

### **1. Twilio Integration (`src/services/twilio.ts`)**
- **Purpose**: Handles phone call management and TwiML generation
- **Key Functions**:
  - `initiateCall()` - Starts outbound calls
  - `generateTwiML()` - Creates TwiML with WebSocket stream
  - `handleCallEvents()` - Processes call status updates

### **2. WebSocket Server (`src/services/websocket.ts`)**
- **Purpose**: Real-time audio streaming between Twilio and Gemini
- **Key Functions**:
  - `handleConnection()` - Manages WebSocket connections
  - `processAudioChunk()` - Routes audio to Gemini Live
  - `sendAudioToTwilio()` - Sends responses back to caller

### **3. Audio Converter (`src/services/audioConverter.ts`)**
- **Purpose**: Bidirectional audio format conversion
- **Key Functions**:
  - `convertTwilioToGeminiInput()` - μ-law → PCM 16kHz
  - `convertGeminiOutputToTwilio()` - PCM 24kHz → μ-law
  - `createAudioChunk()` - Audio chunk management

### **4. Gemini Live Service (`src/services/geminiLive.ts`)**
- **Purpose**: Native audio-to-audio conversation management
- **Key Functions**:
  - `createSession()` - Establishes Gemini Live session
  - `sendAudioToGemini()` - Sends audio to Gemini
  - `handleGeminiAudioResponse()` - Processes Gemini responses

### **5. Call State Management (`src/services/callState.ts`)**
- **Purpose**: Tracks call lifecycle and state
- **Key Functions**:
  - `updateCallState()` - Updates call status
  - `getActiveCalls()` - Retrieves active calls
  - `cleanupCompletedCalls()` - Removes ended calls

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Gemini Configuration
GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog

# Server Configuration
PORT=8082
NODE_ENV=development
```

### **Audio Format Specifications**
- **Twilio Input/Output**: μ-law (G.711) at 8kHz, 8-bit, mono
- **Gemini Input**: PCM 16-bit at 16kHz, mono
- **Gemini Output**: PCM 16-bit at 24kHz, mono

## 🚀 **API Endpoints**

### **Call Management**
```http
POST /api/calls/initiate
Content-Type: application/json

{
  "to_number": "+1234567890",
  "agent_id": "vodafone-broadband",
  "campaign_id": "campaign_123",
  "custom_context": {
    "customer_name": "John Doe",
    "account_id": "12345"
  }
}
```

### **Health Check**
```http
GET /api/health
```

### **Statistics**
```http
GET /api/statistics
```

## 🧪 **Testing Procedures**

### **1. Local Development Setup**

#### **Start All Services**
```bash
# Terminal 1: Start the Gemini Live API
cd services/gemini-live-api
npm run dev

# Terminal 2: Start the Python API (if needed)
cd services/api
make run

# Terminal 3: Start the frontend
cd apps/web
npm run dev

# Terminal 4: Start ngrok tunnel
cd services/gemini-live-api
./start-ngrok.sh
```

#### **Verify Services**
```bash
# Check Gemini Live API
curl http://localhost:8082/api/health

# Check Python API
curl http://localhost:8080/health

# Check frontend
curl http://localhost:5178/
```

### **2. Phone Call Testing**

#### **Test Call Flow**
1. **Initiate Test Call**:
   ```bash
   curl -X POST http://localhost:8082/api/calls/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "to_number": "+YOUR_PHONE_NUMBER",
       "agent_id": "vodafone-broadband",
       "custom_context": {
         "customer_name": "Test User"
       }
     }'
   ```

2. **Monitor Logs**:
   ```bash
   # Watch Gemini Live API logs
   tail -f services/gemini-live-api/logs/app.log

   # Watch Python API logs
   tail -f services/api/logs/app.log
   ```

3. **Check Call Status**:
   ```bash
   curl http://localhost:8082/api/calls/active
   ```

#### **Expected Call Flow**
```
1. Call initiated → Twilio receives call
2. TwiML generated → WebSocket connection established
3. Gemini Live session created → Audio streaming begins
4. Real-time conversation → Audio flows bidirectionally
5. Call ends → Sessions cleaned up
```

### **3. Audio Quality Testing**

#### **Test Audio Conversion**
```bash
# Test μ-law to PCM conversion
node -e "
const { audioConverter } = require('./src/services/audioConverter');
const testAudio = Buffer.alloc(1000, 0xFF).toString('base64');
const result = audioConverter.convertTwilioToGeminiInput(testAudio);
console.log('Conversion result:', result.success);
"
```

#### **Test Gemini Live Connection**
```bash
# Test basic connection
node test-audio-implementation.js
```

## 📊 **Monitoring & Metrics**

### **Key Metrics**
- **Call Duration**: Average call length
- **Audio Latency**: Time from input to response
- **Conversion Performance**: Audio processing time
- **Session Count**: Active Gemini Live sessions
- **Error Rate**: Failed audio conversions

### **Health Checks**
```bash
# Check service health
curl http://localhost:8082/api/health

# Get detailed statistics
curl http://localhost:8082/api/statistics
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. WebSocket Connection Failed**
```bash
# Check ngrok tunnel
curl https://your-ngrok-url.ngrok.io/api/health

# Check Twilio WebSocket URL
# Ensure TwiML points to correct WebSocket endpoint
```

#### **2. Audio Conversion Errors**
```bash
# Check audio format compatibility
node -e "
const { audioConverter } = require('./src/services/audioConverter');
console.log('Audio formats:', audioConverter.getAudioFormatConstants());
"
```

#### **3. Gemini Live Authentication**
```bash
# Check Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
node test-audio-implementation.js
```

#### **4. High Latency**
- Check network connectivity
- Monitor audio conversion performance
- Verify Gemini Live session stability

### **Debug Commands**
```bash
# Check active sessions
curl http://localhost:8082/api/sessions

# Check call state
curl http://localhost:8082/api/calls/state

# Monitor real-time logs
tail -f services/gemini-live-api/logs/app.log | grep -E "(ERROR|WARN|audio|session)"
```

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Set up proper Google Cloud authentication
- [ ] Configure Twilio webhook URLs
- [ ] Set up ngrok or public domain
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Test with real phone numbers

### **Environment Variables**
```bash
# Production environment
NODE_ENV=production
PORT=8082
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
GOOGLE_CLOUD_PROJECT_ID=your_production_project
GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog
```

## 📈 **Performance Optimization**

### **Latency Optimization**
- **Audio Chunk Size**: Optimize for 20-50ms chunks
- **Conversion Caching**: Cache common audio patterns
- **Connection Pooling**: Reuse Gemini Live sessions
- **Parallel Processing**: Process multiple audio chunks

### **Quality Optimization**
- **Audio Resampling**: High-quality resampling algorithms
- **Noise Suppression**: Apply noise reduction
- **Echo Cancellation**: Remove echo artifacts
- **Volume Normalization**: Consistent audio levels

## 🔐 **Security Considerations**

### **Authentication**
- **Twilio**: Use webhook signatures for verification
- **Google Cloud**: Use service account credentials
- **WebSocket**: Implement connection authentication

### **Data Protection**
- **Audio Encryption**: Encrypt audio in transit
- **Session Isolation**: Separate sessions per call
- **Log Sanitization**: Remove sensitive data from logs

## 📚 **Additional Resources**

### **Documentation**
- [Gemini Live API Documentation](https://ai.google.dev/docs/live)
- [Twilio Voice API](https://www.twilio.com/docs/voice)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)

### **Testing Tools**
- [ngrok](https://ngrok.com/) - Local tunnel for testing
- [Twilio CLI](https://www.twilio.com/docs/twilio-cli) - Command line tools
- [Google Cloud Console](https://console.cloud.google.com/) - Cloud management

---

**Pipeline Status**: ✅ **READY FOR TESTING** - Complete audio-to-audio implementation with comprehensive monitoring and testing procedures. 