const fs = require('fs');

const filePath = 'src/routes/test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the send-audio endpoint to use the correct session structure
const oldSendAudio = /\/\*\*\n \* Test endpoint to send audio data to a session\n \* POST \/api\/test\/send-audio\n \*\/\nrouter\.post\('\/send-audio', async \(req: Request, res: Response\) => \{[\s\S]*?\}\);/

const newSendAudio = `/**
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
});`;

content = content.replace(oldSendAudio, newSendAudio);

fs.writeFileSync(filePath, content);
console.log('Fixed send-audio endpoint to use proper Gemini Live API');
