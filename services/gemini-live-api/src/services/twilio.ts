import twilio from 'twilio';
import { serviceConfig as config } from '../config';
import { log } from '../utils/logger';

class TwilioService {
  private static instance: TwilioService;
  private client: twilio.Twilio;

  private constructor() {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      log.error('Twilio credentials are not configured. Please check your .env file.');
      throw new Error('Twilio credentials are not configured.');
    }
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    log.info('TwilioService initialized');
  }

  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Plays an audio file into a live call.
   * @param callSid The SID of the call to play the audio into.
   * @param audioUrl The publicly accessible URL of the audio file to play.
   */
  public async playAudioInCall(callSid: string, audioUrl: string): Promise<void> {
    try {
      const twiml = `<Response><Play>${audioUrl}</Play></Response>`;
      await this.client.calls(callSid).update({ twiml });
      log.info('Successfully sent <Play> TwiML to update call', { callSid, audioUrl });
    } catch (error) {
      log.error('Failed to update call with <Play> TwiML', error as Error, { callSid });
      // We don't re-throw the error to avoid crashing the main call handling logic.
    }
  }
}

export const twilioService = TwilioService.getInstance(); 