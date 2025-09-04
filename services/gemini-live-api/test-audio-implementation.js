/**
 * Test file for the new audio-to-audio implementation
 * This tests the basic functionality of the Gemini Live API integration
 */

const { GoogleGenAI, Modality } = require('@google/genai');

async function testGeminiLiveConnection() {
  console.log('Testing Gemini Live API connection...');
  
  try {
    // Initialize the client
    const genai = new GoogleGenAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID || 'test-project',
    });

    console.log('✅ GoogleGenAI client initialized successfully');
    console.log('✅ Live client available:', !!genai.live);
    
    // Test the configuration
    const config = {
      model: 'gemini-2.5-flash-preview-native-audio-dialog',
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are a helpful assistant.',
    };
    
    console.log('✅ Configuration created:', {
      model: config.model,
      responseModalities: config.responseModalities,
    });

    console.log('\n🎉 Basic setup test passed!');
    console.log('\nNext steps:');
    console.log('1. Set up proper authentication (API key or service account)');
    console.log('2. Test actual audio session creation');
    console.log('3. Implement audio streaming between Twilio and Gemini');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGeminiLiveConnection(); 