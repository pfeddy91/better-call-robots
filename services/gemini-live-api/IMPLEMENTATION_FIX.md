# Gemini Live API Implementation Fix

## Summary

The original Gemini Live API implementation was fundamentally flawed and would never work. It attempted to manually construct WebSocket connections to incorrect endpoints and manage authentication manually, instead of using the official Google Cloud SDK.

## Critical Issues with Original Implementation

### 1. **Incorrect WebSocket URL**
```typescript
// ❌ WRONG - This URL does not exist for Live API
private readonly GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/v1alpha/models/gemini-1.5-flash:streamGenerateContent';
```

The Live API does not use this endpoint. The correct approach is to use the official SDK which handles the connection internally.

### 2. **Manual Authentication Management**
```typescript
// ❌ WRONG - Manual JWT token management
private async getAccessToken(): Promise<string> {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const jwtClient = new JWT({...});
  // 100+ lines of manual token management
}
```

The Live API uses API keys, not service account tokens for this use case.

### 3. **Incorrect Message Format**
```typescript
// ❌ WRONG - Guessed message structure
const initMessage = {
  setup: {
    model: serviceConfig.google.geminiModel,
    config: {
      responseModalities: ['AUDIO', 'TEXT'],
      // ... more guessed structure
    },
  },
};
ws.send(JSON.stringify(initMessage));
```

This message format was completely wrong and not based on official documentation.

### 4. **Manual WebSocket Management**
The original code tried to manually handle WebSocket events, connections, and message parsing instead of using the SDK's built-in methods.

## Correct Implementation

### 1. **Use Official Google GenAI SDK**
```typescript
// ✅ CORRECT - Official SDK
import { GoogleGenAI, Modality } from '@google/genai';

const genaiClient = new GoogleGenAI({
  apiKey: serviceConfig.google.apiKey,
});
```

### 2. **Proper Connection Method**
```typescript
// ✅ CORRECT - SDK handles connection
const geminiSession = await this.genaiClient.live.connect({
  model: "gemini-2.5-flash-preview-native-audio-dialog",
  callbacks: {
    onopen: () => { /* session connected */ },
    onmessage: (message) => { /* handle response */ },
    onerror: (error) => { /* handle error */ },
    onclose: (event) => { /* session closed */ },
  },
  config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: systemPrompt,
  },
});
```

### 3. **Proper Audio Streaming**
```typescript
// ✅ CORRECT - SDK method for sending audio
await session.geminiSession.sendRealtimeInput({
  audio: {
    data: pcmAudio,
    mimeType: "audio/pcm;rate=16000"
  }
});
```

### 4. **No Manual Authentication**
The SDK handles all authentication automatically with the API key.

## Key Architectural Changes

### Dependencies
```json
{
  "dependencies": {
    // ❌ REMOVED: "@google-cloud/vertexai": "^1.4.0",
    // ❌ REMOVED: "google-auth-library": "^10.2.1", 
    // ❌ REMOVED: "ws": "^8.14.2"
    
    // ✅ ADDED: Official Google GenAI SDK
    "@google/genai": "^1.12.0"
  }
}
```

### Configuration
```typescript
// ✅ ADDED: API key configuration
export interface ServiceConfig {
  google: {
    projectId: string;
    credentials: string;
    apiKey: string; // ← New field for Live API
    geminiModel: string;
    vertexAi: {
      datastoreId: string;
      location: string;
    };
  };
}
```

### Environment Variables
```bash
# ✅ REQUIRED: API key for Live API
GOOGLE_API_KEY=your_api_key_here
```

## Code Comparison

### Before (Wrong)
```typescript
// Manual WebSocket connection
const ws = new WebSocket(this.GEMINI_WS_URL, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});

// Manual message construction
const audioMessage = {
  realtimeInput: {
    mediaChunks: [{
      mimeType: 'audio/pcm',
      data: pcmAudio,
    }],
  },
};
ws.send(JSON.stringify(audioMessage));
```

### After (Correct)
```typescript
// SDK handles connection
const geminiSession = await this.genaiClient.live.connect({...});

// SDK method for audio
await geminiSession.sendRealtimeInput({
  audio: {
    data: pcmAudio,
    mimeType: "audio/pcm;rate=16000"
  }
});
```

## Why This Fix is Critical

1. **The original implementation would never work** - it was connecting to the wrong endpoint with the wrong authentication and wrong message format.

2. **The SDK is the only supported way** - Google provides the SDK specifically to handle all the complexity of connection management, authentication, and message formatting.

3. **Future-proof** - The SDK will be updated as the API evolves, ensuring compatibility.

4. **Error handling** - The SDK provides proper error handling and retry logic.

5. **Type safety** - The SDK provides TypeScript types for all methods and responses.

## Status

✅ **Core implementation fixed** - The `GeminiLiveService` now uses the correct SDK approach  
🔧 **Remaining work** - Some supporting files still need to be updated to remove old dependencies  
📚 **Documentation** - Official Live API docs: https://ai.google.dev/gemini-api/docs/live

## Testing

Run the test script to verify the new implementation:
```bash
node test-new-implementation.js
```

This demonstrates that the architecture is now correct and follows the official documentation. 