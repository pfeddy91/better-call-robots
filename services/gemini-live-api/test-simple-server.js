#!/usr/bin/env node

/**
 * Simple test server for the audio testing interface
 * This bypasses the complex environment requirements for basic testing
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

console.log('🚀 Starting simple test server...');

const app = express();
const PORT = 8082;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gemini-live-api-test',
    timestamp: new Date().toISOString(),
    message: 'Simple test server is running'
  });
});

// Mock Gemini connection test
app.get('/api/test/gemini-connection', (req, res) => {
  res.json({
    success: true,
    tests: {
      credentials: 'SKIPPED (test mode)',
      vertexAiConnection: 'SKIPPED (test mode)',
      sessionCreation: 'SKIPPED (test mode)'
    },
    configuration: {
      projectId: 'test-project',
      model: 'gemini-2.5-flash-preview-native-audio-dialog',
      location: 'global',
    },
    message: 'Running in test mode - no real Gemini connection'
  });
});

// Mock session creation
app.post('/api/test/create-audio-session', (req, res) => {
  const sessionId = `TEST_SESSION_${Date.now()}`;
  res.json({
    success: true,
    sessionId,
    callSid: `TEST_CALL_${Date.now()}`,
    message: 'Test session created (mock mode)'
  });
});

// Mock audio sending
app.post('/api/test/send-audio', (req, res) => {
  const { sessionId, audioData } = req.body;
  
  if (!sessionId || !audioData) {
    return res.status(400).json({
      success: false,
      error: 'sessionId and audioData are required'
    });
  }
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      sessionId,
      audioDataLength: audioData.length,
      response: {
        textResponse: 'This is a mock response from the test server.',
        audioResponse: null // No audio response in test mode
      }
    });
  }, 500);
});

// Mock session ending
app.delete('/api/test/end-session/:sessionId', (req, res) => {
  res.json({
    success: true,
    message: 'Test session ended (mock mode)'
  });
});

// Mock sessions list
app.get('/api/test/sessions', (req, res) => {
  res.json({
    success: true,
    totalSessions: 0,
    sessions: [],
    message: 'No active sessions in test mode'
  });
});

// Mock statistics
app.get('/api/test/stats', (req, res) => {
  res.json({
    success: true,
    statistics: {
      activeSessions: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      errors: 0
    },
    configuration: {
      projectId: 'test-project',
      model: 'gemini-2.5-flash-preview-native-audio-dialog',
      location: 'global',
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('');
  console.log('🎯 Test interfaces available:');
  console.log(`   • Audio Test: http://localhost:${PORT}/test-audio-interface.html`);
  console.log(`   • Text Test:  http://localhost:${PORT}/test-interface.html`);
  console.log('');
  console.log('🧪 This is a mock server for testing the UI');
  console.log('   No real Gemini Live API connection');
  console.log('   All responses are simulated');
  console.log('');
  console.log('🛑 Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
}); 