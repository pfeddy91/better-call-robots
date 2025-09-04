# 🎤 Gemini Live Audio Testing Interface

## Overview

This interface provides a simple way to test the Gemini Live API with real-time microphone input without needing to make phone calls. Perfect for debugging and development!

## 🚀 Quick Start

### 1. Start the Audio Test Interface

```bash
cd services/gemini-live-api
./start-audio-test.sh
```

### 2. Open the Test Interface

Open your browser and go to:
- **Audio Test Interface**: http://localhost:8082/test-audio-interface.html
- **Text Test Interface**: http://localhost:8082/test-interface.html

## 🎯 Features

### Audio Test Interface
- **Real-time microphone input** with audio visualization
- **Live audio streaming** to Gemini Live API
- **Real-time logs** showing all API interactions
- **Audio level meters** for input and output
- **Session management** with statistics
- **Export logs** for debugging

### Text Test Interface
- **Connection testing** for Gemini Live API
- **Session creation** and management
- **Text message testing** with responses
- **Session information** and statistics

## 🔧 How to Use

### Audio Testing Workflow

1. **Connect Audio**
   - Click "🔗 Connect Audio" button
   - Grant microphone permissions when prompted
   - Wait for session creation

2. **Test Microphone**
   - Click "🎤 Test Microphone" to verify input
   - Watch the audio visualizer for input levels

3. **Start Conversation**
   - Speak into your microphone
   - Watch real-time logs for API interactions
   - Listen for Gemini's audio responses

4. **Monitor Logs**
   - Real-time logs show all API calls
   - Audio chunk processing details
   - Error messages and debugging info

5. **Export Data**
   - Click "💾 Export Logs" to save for analysis
   - View session statistics and metrics

### Text Testing Workflow

1. **Test Connection**
   - Click "Test Connection" to verify Gemini Live API access
   - Check credentials and configuration

2. **Create Session**
   - Select agent type and customer name
   - Create a test session without phone call

3. **Send Messages**
   - Enter text messages to test conversation flow
   - View Gemini's text responses

4. **Monitor Sessions**
   - View all active sessions
   - Check session details and metrics

## 📊 Monitoring & Debugging

### Real-time Metrics
- **Audio Chunks**: Number of audio packets processed
- **Response Time**: Average time for Gemini responses
- **Errors**: Number of failed requests
- **Session Duration**: How long the session has been active

### Log Levels
- **INFO**: General information and status updates
- **SUCCESS**: Successful operations
- **WARNING**: Non-critical issues
- **ERROR**: Failed operations and errors
- **AUDIO**: Audio-specific operations

### Common Issues

#### Microphone Not Working
```bash
# Check browser permissions
# Ensure microphone access is granted
# Try refreshing the page
```

#### No Audio Response
```bash
# Check Gemini Live API connection
curl http://localhost:8082/api/test/gemini-connection

# Check session status
curl http://localhost:8082/api/test/sessions
```

#### High Latency
```bash
# Check network connectivity
# Monitor audio chunk size
# Verify Gemini Live session stability
```

## 🔌 API Endpoints

### Audio Testing
```http
POST /api/test/create-audio-session
{
  "agentId": "vodafone-broadband",
  "customerName": "Test User",
  "audioQuality": "high"
}

POST /api/test/send-audio
{
  "sessionId": "session_id",
  "audioData": "base64_audio_data",
  "timestamp": 1234567890
}

DELETE /api/test/end-session/:sessionId
```

### Text Testing
```http
GET /api/test/gemini-connection
POST /api/test/create-session
POST /api/test/send-text
GET /api/test/sessions
GET /api/test/stats
```

## 🛠️ Development

### Adding New Test Features

1. **Add API Endpoints** in `src/routes/test.ts`
2. **Update UI** in `test-audio-interface.html`
3. **Add Logging** for debugging
4. **Test Locally** before committing

### Customizing Audio Quality

```javascript
// In the test interface
const audioQuality = document.getElementById('audioQuality').value;
// Options: 'high', 'medium', 'low'
```

### Extending Logging

```javascript
// Add custom log levels
addLog('Custom message', 'custom-level');
```

## 📈 Performance Tips

### For Better Audio Quality
- Use high-quality microphone
- Ensure quiet environment
- Set audio quality to "high"
- Monitor audio levels

### For Faster Testing
- Use "low" audio quality for quick tests
- Keep sessions short
- Clear logs regularly
- Monitor response times

### For Debugging
- Enable auto-scroll in logs
- Export logs frequently
- Monitor error rates
- Check session statistics

## 🔐 Security Notes

- **Local Testing Only**: This interface is for local development
- **No Production Data**: Don't use with real customer data
- **Temporary Sessions**: Sessions are cleaned up automatically
- **Log Sanitization**: Sensitive data is not logged

## 📚 Related Documentation

- [Gemini Live API Documentation](https://ai.google.dev/docs/live)
- [PIPELINE.md](../docs/PIPELINE.md) - Complete audio pipeline
- [GEMINI-LIVE.md](GEMINI-LIVE.md) - Implementation details

---

**🎯 Ready to test!** Start with the audio interface for real-time testing or the text interface for basic functionality testing. 