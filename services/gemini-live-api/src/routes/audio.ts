import { Router } from 'express';
import { twilioService } from '../services/twilio';
import { callStateService } from '../services/callState';
import { log } from '../utils/logger';

const router = Router();

// This endpoint will be called by the AI service to play audio into the call
router.post('/play-audio/:callSid', (req, res) => {
  const { callSid } = req.params;
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).send({ error: 'audioUrl is required' });
  }

  log.info('Received request to play audio in call', { callSid, audioUrl });
  twilioService.playAudioInCall(callSid, audioUrl);

  return res.status(202).send({ message: 'Audio playback initiated' });
});

export default router; 