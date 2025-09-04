import { Router, Request, Response } from 'express';
import { log } from '@/utils/logger';
import { serviceConfig } from '@/config';
import { GeminiLiveService } from '@/services/geminiLive';
import { CallStateService } from '@/services/callState';

const router = Router();
const geminiLiveService = GeminiLiveService.getInstance();
const callStateService = CallStateService.getInstance();

/**
 * Test endpoint to check Gemini Live API connection
 * GET /api/test/gemini-connection
 */
router.get('/gemini-connection', async (req: Request, res: Response) => {
  try {
    log.info('Testing Gemini Live API connection');
    
    // Test credentials
    const credentialsTest = {
      projectId: serviceConfig.google.projectId,
      model: serviceConfig.google.geminiModel,
      location: serviceConfig.google.vertexAi.location,
    };
    
    // Test session creation
    const testCallSid = `TEST_${Date.now()}`;
    const sessionId = await geminiLiveService.createSession(
      testCallSid,
      'test-agent',
      { test: true }
    );
    
    // Clean up test session
    await geminiLiveService.endSession(sessionId!);
    
    return res.json({
      success: true,
      tests: {
        credentials: 'PASSED',
        vertexAiConnection: 'PASSED',
        sessionCreation: 'PASSED'
      },
      configuration: credentialsTest
    });
    
  } catch (error) {
    log.error('Gemini Live API connection test failed', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
});

/**
 * Test endpoint to create an audio session for testing
 * POST /api/test/create-audio-session
 */
router.post('/create-audio-session', async (req: Request, res: Response) => {
  try {
    const { agentId = 'default', customerName = 'Test User', audioQuality = 'high' } = req.body;
    
    log.info('Creating audio test session', { agentId, customerName, audioQuality });
    
    // Create a test call SID
    const testCallSid = `AUDIO_TEST_${Date.now()}`;
    
    // Create session with audio-specific configuration
    const sessionId = await geminiLiveService.createSession(
      testCallSid,
      agentId,
      {
        customerName,
        callType: 'audio_test',
        audioQuality,
        enableRealTimeAudio: true
      }
    );
    
    return res.json({
      success: true,
      sessionId,
      callSid: testCallSid,
      message: 'Audio test session created successfully. Use the sessionId to send audio data.'
    });
    
  } catch (error) {
    log.error('Failed to create audio test session', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
});

/**
 * Test endpoint to send audio data to a session
 * POST /api/test/send-audio
 */
router.post('/send-audio', async (req: Request, res: Response) => {
  try {
    const { sessionId, audioData, timestamp } = req.body;
    
    if (!sessionId || !audioData) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and audioData are required'
      });
    }
    
    // Get session
    const session = (geminiLiveService as any).sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or inactive'
      });
    }
    
    log.info('Sending audio data to session', { 
      sessionId, 
      audioDataLength: audioData.length,
      timestamp 
    });
    
    // Send audio data to Gemini Live using the proper service method
    await geminiLiveService.sendAudioToGemini(sessionId, audioData);
    
    return res.json({
      success: true,
      sessionId,
      audioDataLength: audioData.length,
      message: 'Audio data sent to Gemini Live successfully'
    });
    
  } catch (error) {
    log.error('Failed to send audio to session', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Test endpoint to end a session
 * DELETE /api/test/end-session/:sessionId
 */
router.delete('/end-session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    log.info('Ending test session', { sessionId });
    
    await geminiLiveService.endSession(sessionId!);
    
    return res.json({
      success: true,
      sessionId,
      message: 'Session ended successfully'
    });
    
  } catch (error) {
    log.error('Failed to end session', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Test endpoint to get responses from a session
 * GET /api/test/get-responses/:sessionId
 */
router.get('/get-responses/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Get session
    const session = (geminiLiveService as any).sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or inactive'
      });
    }
    
    // Check if this is a test session
    if (!session.testResponses) {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only available for test sessions'
      });
    }
    
    return res.json({
      success: true,
      sessionId,
      hasAudioResponse: session.testResponses.audioResponses.length > 0,
      hasTextResponse: session.testResponses.textResponses.length > 0,
      audioResponses: session.testResponses.audioResponses,
      textResponses: session.testResponses.textResponses,
      totalAudioResponses: session.testResponses.audioResponses.length,
      totalTextResponses: session.testResponses.textResponses.length
    });
    
  } catch (error) {
    log.error('Failed to get session responses', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Test endpoint to get statistics
 * GET /api/test/statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = geminiLiveService.getStatistics();
    
    return res.json({
      success: true,
      statistics: stats,
      configuration: {
        projectId: serviceConfig.google.projectId,
        model: serviceConfig.google.geminiModel,
        location: serviceConfig.google.vertexAi.location,
      }
    });
  } catch (error) {
    log.error('Failed to get statistics', error as Error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
