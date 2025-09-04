const fs = require('fs');

const filePath = 'src/routes/test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the problematic send-audio endpoint
const oldSendAudio = /router\.post\('\/send-audio', async \(req: Request, res: Response\) => \{[\s\S]*?\}\);/

const newSendAudio = `router.post('/send-audio', async (req: Request, res: Response) => {
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

// Replace the old endpoint with the new one
content = content.replace(oldSendAudio, newSendAudio);

// Remove any duplicate code that might have been created
const lines = content.split('\n');
const cleanedLines = [];
let inSendAudio = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes("router.post('/send-audio'")) {
    inSendAudio = true;
    braceCount = 0;
  }
  
  if (inSendAudio) {
    cleanedLines.push(line);
    if (line.includes('{')) braceCount++;
    if (line.includes('}')) braceCount--;
    
    if (braceCount === 0 && line.includes('});')) {
      inSendAudio = false;
    }
  } else if (!line.includes('session.ws.send') && !line.includes('session.ws.on') && !line.includes('session.ws.removeListener')) {
    cleanedLines.push(line);
  }
}

const cleanedContent = cleanedLines.join('\n');
fs.writeFileSync(filePath, cleanedContent);
console.log('Fixed test routes file');
