const { GeminiLiveService } = require('./dist/services/geminiLive');

async function testGeminiLive() {
  try {
    console.log('Testing Gemini Live service...');
    
    const geminiService = GeminiLiveService.getInstance();
    console.log('Gemini service instance created');
    
    const sessionId = await geminiService.createSession('test-call-123', 'default', {
      callType: 'inbound'
    });
    
    console.log('Session created successfully:', sessionId);
    
    // Clean up
    geminiService.endSession(sessionId);
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testGeminiLive(); 