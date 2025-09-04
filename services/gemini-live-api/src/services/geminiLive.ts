import { GoogleGenAI, Modality } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/utils/logger';
import { serviceConfig } from '@/config';
import { audioConverter } from '@/services/audioConverter';
import { getAgentConfig, createSystemPrompt } from '@/config/prompts';
import { VoiceStreamService } from './websocket';
import { GeminiAudioSession, GeminiAudioConfig, AudioChunk } from '@/types';

/**
 * @interface GeminiAudioSession
 * Represents a single, active audio conversation session with Gemini Live.
 * This session manages the native audio streaming between Twilio and Gemini
 * without requiring STT/TTS conversion.
 */
interface GeminiAudioSessionInternal extends GeminiAudioSession {
  // Native audio session from genai client
  audioSession?: any; // Live.Session
  // Audio processing state
  isProcessing: boolean;
  audioSequenceNumber: number;
  // Performance tracking
  lastAudioTimestamp: Date;
  totalAudioChunksProcessed: number;
  totalProcessingTime: number;
  // Test response storage (only for test sessions)
  testResponses?: {
    audioResponses: Array<{
      timestamp: Date;
      audioData: string; // base64 encoded
      mimeType?: string;
    }>;
    textResponses: Array<{
      timestamp: Date;
      text: string;
    }>;
  };
}

/**
 * @class GeminiLiveService
 *
 * Manages all real-time audio-to-audio conversations using the Google Gemini Live API.
 * This service implements the native audio streaming architecture:
 * Twilio Audio (μ-law) → Convert to PCM → Gemini Live → PCM Audio → Convert to μ-law → Twilio
 * 
 * Key Features:
 * - Direct audio streaming without STT/TTS conversion
 * - Real-time audio processing with minimal latency
 * - Automatic audio format conversion
 * - Session management and cleanup
 * - Performance monitoring and metrics
 */
export class GeminiLiveService {
  private static instance: GeminiLiveService;
  private readonly genaiClient: GoogleGenAI;
  private readonly audioConfig: GeminiAudioConfig;
  private sessions = new Map<string, GeminiAudioSessionInternal>();
  private serviceStartTime: number;

  private constructor() {
    this.serviceStartTime = Date.now();
    
    // Initialize the GoogleGenAI client
    // Note: For production, you'll need to set up proper authentication
    // This is a simplified implementation for testing
    this.genaiClient = new GoogleGenAI({
      project: serviceConfig.google.projectId,
      // TODO: Add proper authentication for production use
      // For now, this will use default authentication
    });

    // Configure the audio-to-audio model and settings
    this.audioConfig = {
      model: serviceConfig.google.geminiModel,
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are a helpful assistant and answer in a friendly tone.',
      audioSettings: {
        inputFormat: 'PCM_16_16K',
        outputFormat: 'PCM_16_24K',
        enableEchoCancellation: true,
        enableNoiseSuppression: true,
      },
    };

    log.info('GeminiLiveService initialized for audio-to-audio streaming', {
      model: this.audioConfig.model,
      projectId: serviceConfig.google.projectId,
      audioFormats: this.audioConfig.audioSettings,
    });

    this.startCleanupTimer();
  }

  /**
   * Retrieves the singleton instance of the GeminiLiveService.
   */
  public static getInstance(): GeminiLiveService {
    if (!GeminiLiveService.instance) {
      GeminiLiveService.instance = new GeminiLiveService();
    }
    return GeminiLiveService.instance;
  }

  /**
   * Creates and initiates a new audio-to-audio session for a given call.
   * This establishes a native audio streaming connection with Gemini Live.
   * 
   * @param {string} callSid - The unique identifier for the Twilio call.
   * @param {string} agentId - The ID of the agent configuration to use.
   * @param {object} [callContext] - Optional context about the call for personalization.
   * @returns {Promise<string>} The generated unique session ID.
   */
  public async createSession(callSid: string, agentId: string, callContext?: object): Promise<string> {
    const sessionId = uuidv4();
    log.info('Creating new Gemini Live audio-to-audio session', { sessionId, callSid, agentId });

    try {
      // Get agent configuration for system prompt
      const agentConfig = getAgentConfig(agentId);
      const systemPrompt = createSystemPrompt(agentConfig, callContext);
      
      // Update audio config with agent-specific system instruction
      const sessionAudioConfig = {
        ...this.audioConfig,
        systemInstruction: systemPrompt,
      };

      // Create the native audio session with Gemini Live
      const audioSession = await this.createGeminiAudioSession(sessionId, sessionAudioConfig);

      const session: GeminiAudioSessionInternal = {
        sessionId,
        callSid,
        agentId,
        isActive: true,
        startTime: new Date(),
        audioSession,
        audioConfig: {
          inputSampleRate: 16000, // 16kHz for Gemini input
          outputSampleRate: 24000, // 24kHz for Gemini output
          inputChannels: 1,
          outputChannels: 1,
          inputBitDepth: 16,
          outputBitDepth: 16,
        },
        conversationHistory: [],
        metrics: {
          totalAudioChunks: 0,
          totalProcessingTime: 0,
          averageLatency: 0,
          lastActivity: new Date(),
        },
        isProcessing: false,
        audioSequenceNumber: 0,
        lastAudioTimestamp: new Date(),
        totalAudioChunksProcessed: 0,
        totalProcessingTime: 0,
      };

      // Initialize test response storage for test sessions
      if (callSid.startsWith('AUDIO_TEST_') || callSid.startsWith('TEST_')) {
        session.testResponses = {
          audioResponses: [],
          textResponses: []
        };
      }

      this.sessions.set(sessionId, session);
      log.info('Audio-to-audio session created and ready', { sessionId });

      // Start listening for Gemini audio responses
      this.startAudioResponseListener(session);

      return sessionId;

    } catch (error) {
      log.error('Failed to create Gemini Live audio session', error as Error, { callSid, agentId });
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Creates a native audio session with Gemini Live using the genai client.
   * 
   * @param {GeminiAudioConfig} config - Audio configuration for the session
   * @returns {Promise<any>} The Gemini Live audio session
   */
  private async createGeminiAudioSession(sessionId: string, config: GeminiAudioConfig): Promise<any> {
    try {
      // Create the live session with audio configuration
      const session = await this.genaiClient.live.connect({
        model: config.model,
        config: {
          responseModalities: config.responseModalities,
          systemInstruction: config.systemInstruction,
          // Note: audioSettings is not supported in the current LiveConnectConfig
          // Audio format is handled automatically by the model
        },
        callbacks: {
          onopen: () => {
            log.info('Gemini Live WebSocket connection opened', { sessionId });
          },
          onmessage: (event: any) => {
            this.handleGeminiMessage(sessionId, event);
          },
          onerror: (error: any) => {
            log.error('Gemini Live WebSocket error', error, { sessionId });
          },
          onclose: (event: any) => {
            log.info('Gemini Live WebSocket connection closed', {
              code: event.code,
              reason: event.reason,
              sessionId,
            });
          },
        },
      });

      log.info('Gemini Live audio session established', {
        model: config.model,
        responseModalities: config.responseModalities,
        sessionId,
      });

      return session;

    } catch (error) {
      log.error('Failed to create Gemini Live audio session', error as Error, { sessionId });
      throw new Error(`Audio session creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Handles incoming messages from the Gemini Live WebSocket connection.
   * This can include text transcripts, audio, or other events.
   * 
   * @param {string} sessionId - The session ID for the message
   * @param {any} message - The message data from Gemini
   */
  private handleGeminiMessage(sessionId: string, message: any): void {
    try {
      const activeSession = this.sessions.get(sessionId);
      if (!activeSession) {
        log.warn('Received message for unknown session', { sessionId });
        return;
      }

      // Log all incoming messages for debugging
      log.debug('Received message from Gemini Live', { 
        sessionId, 
        messageType: typeof message,
        messageKeys: Object.keys(message || {}),
        message: JSON.stringify(message, null, 2)
      });

      // Handle different types of Gemini Live responses
      if (message.serverContent) {
        log.info('Received serverContent from Gemini Live', { sessionId, serverContent: message.serverContent });
        
        // Handle model turn with parts (audio or text)
        if (message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
          const parts = message.serverContent.modelTurn.parts;
          
          for (const part of parts) {
            // Handle audio parts
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
              log.info('Received audio response from Gemini Live', { 
                sessionId, 
                mimeType: part.inlineData.mimeType,
                dataSize: part.inlineData.data.length 
              });
              
              // Store audio response for test sessions
              if (activeSession.testResponses) {
                activeSession.testResponses.audioResponses.push({
                  timestamp: new Date(),
                  audioData: part.inlineData.data,
                  mimeType: part.inlineData.mimeType
                });
              }
              
              // Convert base64 audio data to buffer and process
              const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
              this.handleGeminiAudioResponse(activeSession, audioBuffer);
            }
            
            // Handle text parts
            if (part.text) {
              log.info('Received text response from Gemini Live', { sessionId, text: part.text });
              
              // Store text response for test sessions
              if (activeSession.testResponses) {
                activeSession.testResponses.textResponses.push({
                  timestamp: new Date(),
                  text: part.text
                });
              }
              
              activeSession.conversationHistory.push({
                role: 'assistant',
                timestamp: new Date(),
                textChunk: part.text,
              });
            }
          }
        }
      }

      // Handle legacy speech-to-text format (if still used)
      if (message.results && message.results[0] && message.results[0].alternatives[0]) {
        const transcript = message.results[0].alternatives[0].transcript;
        
        activeSession.conversationHistory.push({
          role: 'assistant',
          timestamp: new Date(),
          textChunk: transcript,
        });

        log.info('Received text transcript from Gemini (legacy format)', { sessionId, transcript });
      }

      // Handle any error responses
      if (message.error) {
        log.error('Received error from Gemini Live', message.error, { sessionId });
      }

    } catch (err) {
      log.error('Failed to process Gemini message', err as Error, { 
        error: (err as Error).message, 
        sessionId,
        stack: (err as Error).stack 
      });
    }
  }

  /**
   * Receives audio from Twilio, converts it to PCM format, and sends it to Gemini Live.
   * This is the main entry point for processing incoming audio from phone calls.
   * 
   * @param {string} sessionId - The session to send audio to.
   * @param {string} twilioAudio - Base64 encoded μ-law audio from Twilio.
   */
  public async sendAudioToGemini(sessionId: string, twilioAudio: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      log.warn('Attempted to send audio to inactive session', { sessionId });
      return;
    }

    if (session.isProcessing) {
      log.debug('Session is currently processing audio, skipping chunk', { sessionId });
      return;
    }

    try {
      session.isProcessing = true;
      const startTime = Date.now();

      // Convert Twilio μ-law audio to PCM format for Gemini
      const conversionResult = audioConverter.convertTwilioToGeminiInput(twilioAudio);
      
      if (!conversionResult.success || !conversionResult.convertedAudio) {
        log.error('Audio conversion failed', undefined, { sessionId, error: conversionResult.error });
        return;
      }

      // Create audio chunk for tracking
      const audioChunk = audioConverter.createAudioChunk(
        conversionResult.convertedAudio,
        16000, // 16kHz for Gemini input
        session.audioSequenceNumber++
      );

      // Send audio to Gemini Live
      await this.sendAudioToGeminiSession(session, audioChunk);

      // Update session metrics
      const processingTime = Date.now() - startTime;
      session.totalProcessingTime += processingTime;
      session.totalAudioChunksProcessed++;
      session.lastAudioTimestamp = new Date();
      session.metrics.lastActivity = new Date();

      // Update average latency
      session.metrics.averageLatency = session.totalProcessingTime / session.totalAudioChunksProcessed;

      // Log performance metrics (sample 5% to avoid spam)
      if (Math.random() < 0.05) {
        log.debug('Audio processing completed', {
          sessionId,
          processingTime,
          averageLatency: session.metrics.averageLatency,
          totalChunks: session.totalAudioChunksProcessed,
        });
      }

    } catch (error) {
      log.error('Failed to process incoming audio', error as Error, { sessionId });
    } finally {
      session.isProcessing = false;
    }
  }

  /**
   * Sends audio data to the Gemini Live session.
   * 
   * @param {GeminiAudioSessionInternal} session - The active session
   * @param {AudioChunk} audioChunk - The audio chunk to send
   */
  private async sendAudioToGeminiSession(session: GeminiAudioSessionInternal, audioChunk: AudioChunk): Promise<void> {
    if (!session.audioSession) {
      log.error('Cannot send audio, session not found', undefined, { sessionId: session.sessionId });
      return;
    }

    try {
      // Send audio to Gemini Live using the native audio streaming API
      await session.audioSession.send({
        audio: audioChunk.data,
      });

      // Add to conversation history
      session.conversationHistory.push({
        role: 'user',
        timestamp: audioChunk.timestamp,
        audioChunk: audioChunk.data.toString('base64'),
      });

      log.debug('Audio sent to Gemini Live', {
        sessionId: session.sessionId,
        sequenceNumber: audioChunk.sequenceNumber,
        dataSize: audioChunk.data.length,
      });

    } catch (error) {
      log.error('Failed to send audio to Gemini Live', error as Error, { sessionId: session.sessionId });
      throw error;
    }
  }

  /**
   * Starts listening for audio responses from Gemini Live.
   * This method sets up the audio response stream and processes incoming audio.
   * 
   * @param {GeminiAudioSessionInternal} session - The session to listen to
   */
  private async startAudioResponseListener(session: GeminiAudioSessionInternal): Promise<void> {
    if (!session.audioSession) {
      log.error('Cannot start audio listener, session not found', undefined, { sessionId: session.sessionId });
      return;
    }

    try {
      log.info('Starting audio response listener for Gemini Live session', { sessionId: session.sessionId });
      
      // The audio responses are handled through the onmessage callback
      // which calls handleGeminiMessage. The Gemini Live API sends
      // responses via WebSocket messages, not a separate audio stream.
      // So we don't need to actively listen here - just log that the listener is active.
      
      log.info('Audio response listener active - responses will be handled via WebSocket callbacks', { 
        sessionId: session.sessionId 
      });
      
    } catch (error) {
      log.error('Audio response listener error', error as Error, { sessionId: session.sessionId });
    }
  }

  /**
   * Handles audio responses from Gemini Live, converts them to Twilio format,
   * and sends them back to the caller.
   * 
   * @param {GeminiAudioSessionInternal} session - The active session
   * @param {Buffer} geminiAudio - Raw PCM audio from Gemini (24kHz, 16-bit)
   */
  private async handleGeminiAudioResponse(session: GeminiAudioSessionInternal, geminiAudio: Buffer): Promise<void> {
    try {
      // Convert Gemini PCM audio to Twilio μ-law format
      const conversionResult = audioConverter.convertGeminiOutputToTwilio(geminiAudio);
      
      if (!conversionResult.success || !conversionResult.convertedAudio) {
        log.error('Failed to convert Gemini audio response', undefined, { 
          sessionId: session.sessionId, 
          error: conversionResult.error 
        });
        return;
      }

      // Send the converted audio back to Twilio
      const voiceStreamService = VoiceStreamService.getInstance();
      const success = voiceStreamService.sendAudioToTwilio(
        session.callSid, 
        conversionResult.convertedAudio.toString('base64')
      );

      if (success) {
        // Add to conversation history
        session.conversationHistory.push({
          role: 'assistant',
          timestamp: new Date(),
          audioChunk: geminiAudio.toString('base64'),
        });

        // Update metrics
        session.metrics.totalAudioChunks++;
        session.metrics.lastActivity = new Date();

        log.debug('Audio response sent to Twilio', {
          sessionId: session.sessionId,
          dataSize: geminiAudio.length,
          processingTime: conversionResult.processingTime,
        });
      } else {
        log.warn('Failed to send audio response to Twilio', { sessionId: session.sessionId });
      }

    } catch (error) {
      log.error('Failed to handle Gemini audio response', error as Error, { sessionId: session.sessionId });
    }
  }

  /**
   * Gracefully ends an audio session and cleans up resources.
   * 
   * @param {string} sessionId - The ID of the session to end.
   */
  public async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return; // Already ended.

    log.info('Ending Gemini Live audio session', { sessionId });

    try {
      // Close the Gemini Live session
      if (session.audioSession) {
        await session.audioSession.close();
      }

      session.isActive = false;
      this.sessions.delete(sessionId);
      
      log.info('Audio session resources cleaned up', { sessionId });

    } catch (error) {
      log.error('Error ending audio session', error as Error, { sessionId });
    }
  }

  /**
   * Retrieves an active session using the Twilio Call SID.
   */
  public getSessionByCallSid(callSid: string): GeminiAudioSessionInternal | null {
    for (const session of this.sessions.values()) {
      if (session.callSid === callSid) {
        return session;
      }
    }
    return null;
  }

  /**
   * Returns comprehensive statistics about the service and active sessions.
   */
  public getStatistics() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
    const totalSessions = this.sessions.size;
    
    const totalAudioChunks = activeSessions.reduce((sum, session) => 
      sum + session.totalAudioChunksProcessed, 0);
    
    const totalProcessingTime = activeSessions.reduce((sum, session) => 
      sum + session.totalProcessingTime, 0);
    
    const averageLatency = totalAudioChunks > 0 ? totalProcessingTime / totalAudioChunks : 0;
    
    return {
      totalSessions,
      activeSessions: activeSessions.length,
      inactiveSessions: totalSessions - activeSessions.length,
      totalAudioChunksProcessed: totalAudioChunks,
      averageLatency: averageLatency,
      averageSessionDuration: activeSessions.length > 0 
        ? activeSessions.reduce((acc, session) => {
            return acc + (Date.now() - session.startTime.getTime());
          }, 0) / activeSessions.length / 1000 // in seconds
        : 0,
      oldestActiveSession: activeSessions.length > 0 
        ? Math.min(...activeSessions.map(s => s.startTime.getTime()))
        : null,
      serviceUptime: Date.now() - (this.serviceStartTime || Date.now()),
      audioFormatInfo: audioConverter.getAudioFormatConstants(),
    };
  }

  /**
   * Starts a timer that runs periodically to clean up stale sessions.
   * @private
   */
  private startCleanupTimer(): void {
    setInterval(async () => {
      const now = Date.now();
      const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.startTime.getTime() > STALE_THRESHOLD) {
          log.warn('Cleaning up stale audio session', { sessionId });
          await this.endSession(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Export the singleton instance for use throughout the application
export const geminiLiveService = GeminiLiveService.getInstance();