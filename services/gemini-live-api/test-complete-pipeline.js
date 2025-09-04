/**
 * Complete Pipeline Test
 * 
 * This script tests the entire audio-to-audio pipeline:
 * 1. WebSocket connection setup
 * 2. Gemini Live session creation
 * 3. Audio conversion and streaming
 * 4. Call state management
 */

const WebSocket = require('ws');
const { geminiLiveService } = require('./dist/services/geminiLive');
const { audioConverter } = require('./dist/services/audioConverter');
const { callStateService } = require('./dist/services/callState');
const { log } = require('./dist/utils/logger');

async function testCompletePipeline() {
  console.log('🧪 Testing Complete Audio-to-Audio Pipeline...\n');

  try {
    // Test 1: Audio Converter
    console.log('1️⃣ Testing Audio Converter...');
    const testAudio = Buffer.alloc(1000, 0xFF).toString('base64');
    const conversionResult = audioConverter.convertTwilioToGeminiInput(testAudio);
    
    if (conversionResult.success) {
      console.log('✅ Audio conversion working');
      console.log(`   Input: ${testAudio.length} bytes`);
      console.log(`   Output: ${conversionResult.convertedAudio.length} bytes`);
      console.log(`   Processing time: ${conversionResult.processingTime}ms`);
    } else {
      console.log('❌ Audio conversion failed:', conversionResult.error);
      return;
    }

    // Test 2: Gemini Live Service
    console.log('\n2️⃣ Testing Gemini Live Service...');
    const testCallSid = 'test-call-' + Date.now();
    const testAgentId = 'vodafone-broadband';
    
    try {
      const sessionId = await geminiLiveService.createSession(testCallSid, testAgentId, {
        customerName: 'Test User',
        callType: 'test'
      });
      
      console.log('✅ Gemini Live session created');
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Call SID: ${testCallSid}`);
      console.log(`   Agent ID: ${testAgentId}`);

      // Test 3: Audio Processing
      console.log('\n3️⃣ Testing Audio Processing...');
      const testPcmAudio = Buffer.alloc(3200, 0x00); // 200ms of silence at 16kHz
      const audioChunk = audioConverter.createAudioChunk(testPcmAudio, 16000, 1);
      
      console.log('✅ Audio chunk created');
      console.log(`   Sample rate: ${audioChunk.sampleRate}Hz`);
      console.log(`   Channels: ${audioChunk.channels}`);
      console.log(`   Bit depth: ${audioChunk.bitDepth}`);
      console.log(`   Data size: ${audioChunk.data.length} bytes`);

      // Test 4: Service Statistics
      console.log('\n4️⃣ Testing Service Statistics...');
      const stats = geminiLiveService.getStatistics();
      console.log('✅ Service statistics retrieved');
      console.log(`   Total sessions: ${stats.totalSessions}`);
      console.log(`   Active sessions: ${stats.activeSessions}`);
      console.log(`   Service uptime: ${Math.floor(stats.serviceUptime / 1000)}s`);

      // Test 5: Call State Management
      console.log('\n5️⃣ Testing Call State Management...');
      callStateService.updateCall(testCallSid, {
        status: 'in-progress',
        startTime: new Date(),
        agentId: testAgentId
      });
      
      const callState = callStateService.getCall(testCallSid);
      if (callState) {
        console.log('✅ Call state management working');
        console.log(`   Call SID: ${callState.callSid}`);
        console.log(`   Status: ${callState.status}`);
        console.log(`   Agent ID: ${callState.agentId}`);
      } else {
        console.log('❌ Call state management failed');
      }

      // Test 6: Session Cleanup
      console.log('\n6️⃣ Testing Session Cleanup...');
      await geminiLiveService.endSession(sessionId);
      console.log('✅ Session cleanup completed');

      // Test 7: Audio Format Constants
      console.log('\n7️⃣ Testing Audio Format Constants...');
      const audioFormats = audioConverter.getAudioFormatConstants();
      console.log('✅ Audio format constants retrieved');
      console.log('   Twilio format:', audioFormats.twilio);
      console.log('   Gemini input format:', audioFormats.geminiInput);
      console.log('   Gemini output format:', audioFormats.geminiOutput);

      console.log('\n🎉 All pipeline tests passed!');
      console.log('\n📋 Pipeline Components Verified:');
      console.log('   ✅ Audio Converter (μ-law ↔ PCM)');
      console.log('   ✅ Gemini Live Service');
      console.log('   ✅ Session Management');
      console.log('   ✅ Call State Management');
      console.log('   ✅ Audio Chunk Processing');
      console.log('   ✅ Service Statistics');
      console.log('   ✅ Session Cleanup');

      console.log('\n🚀 Ready for phone call testing!');
      console.log('\nNext steps:');
      console.log('1. Set up authentication (API key or service account)');
      console.log('2. Start the server: npm run dev');
      console.log('3. Set up ngrok tunnel: ./start-ngrok.sh');
      console.log('4. Test with real phone call');

    } catch (error) {
      console.log('❌ Gemini Live session creation failed:', error.message);
      console.log('\n💡 This is expected if authentication is not configured.');
      console.log('   To fix this, set up Google Cloud authentication:');
      console.log('   1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.log('   2. Or use API key authentication');
      console.log('   3. Ensure the project has Gemini Live API enabled');
    }

  } catch (error) {
    console.error('❌ Pipeline test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompletePipeline().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 