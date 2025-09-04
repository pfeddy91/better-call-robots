import { WaveFile } from 'wavefile';
import { log } from '@/utils/logger';
import { AudioConversionResult, AudioChunk } from '@/types';

/**
 * Audio Converter Service
 * 
 * Handles conversion between Twilio's μ-law (G.711) audio format at 8kHz
 * and Google Gemini Live's native audio streaming format.
 * 
 * This service is critical for real-time audio processing and ensures
 * minimal latency in the audio-to-audio conversion pipeline.
 * 
 * Audio Format Requirements:
 * - Twilio Input: μ-law (G.711) at 8kHz, 8-bit, mono
 * - Gemini Input: PCM 16-bit at 16kHz, mono
 * - Gemini Output: PCM 16-bit at 24kHz, mono
 * - Twilio Output: μ-law (G.711) at 8kHz, 8-bit, mono
 */
export class AudioConverterService {
  private static instance: AudioConverterService;
  
  // Audio format constants for the new audio-to-audio pipeline
  private readonly TWILIO_SAMPLE_RATE = 8000; // 8kHz for Twilio
  private readonly GEMINI_INPUT_SAMPLE_RATE = 16000; // 16kHz for Gemini input
  private readonly GEMINI_OUTPUT_SAMPLE_RATE = 24000; // 24kHz for Gemini output
  private readonly TWILIO_BIT_DEPTH = '8'; // μ-law is 8-bit
  private readonly GEMINI_BIT_DEPTH = '16'; // PCM 16-bit
  private readonly CHANNELS = 1; // Mono for all formats
  
  private constructor() {
    log.info('AudioConverterService initialized for audio-to-audio pipeline', {
      twilioFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz ${this.TWILIO_BIT_DEPTH}-bit mono`,
      geminiInputFormat: `PCM ${this.GEMINI_INPUT_SAMPLE_RATE}Hz ${this.GEMINI_BIT_DEPTH}-bit mono`,
      geminiOutputFormat: `PCM ${this.GEMINI_OUTPUT_SAMPLE_RATE}Hz ${this.GEMINI_BIT_DEPTH}-bit mono`,
    });
  }

  /**
   * Retrieves the singleton instance of the AudioConverterService.
   */
  public static getInstance(): AudioConverterService {
    if (!AudioConverterService.instance) {
      AudioConverterService.instance = new AudioConverterService();
    }
    return AudioConverterService.instance;
  }

  /**
   * Convert Twilio μ-law audio to Gemini PCM input format
   * 
   * This method converts Twilio's μ-law audio to the PCM format required
   * by Gemini Live for native audio input processing.
   * 
   * @param base64Audio Base64 encoded μ-law audio from Twilio
   * @returns AudioConversionResult with converted PCM audio for Gemini
   */
  public convertTwilioToGeminiInput(base64Audio: string): AudioConversionResult {
    const startTime = Date.now();
    
    try {
      // Validate input
      this.validateAudioData(base64Audio, 'mulaw');
      
      // Decode base64 to buffer
      const mulawBuffer = Buffer.from(base64Audio, 'base64');
      
      // Create WaveFile instance with μ-law audio
      const wav = new WaveFile();
      wav.fromScratch(
        this.CHANNELS, // mono
        this.TWILIO_SAMPLE_RATE,
        this.TWILIO_BIT_DEPTH,
        mulawBuffer,
        { 
          container: 'RIFF',
          chunkSize: 'auto',
          bitDepth: this.TWILIO_BIT_DEPTH,
          sampleRate: this.TWILIO_SAMPLE_RATE,
          numChannels: this.CHANNELS,
          audioFormat: 7 // μ-law format code
        }
      );
      
      // Convert to 16-bit PCM
      wav.toBitDepth(this.GEMINI_BIT_DEPTH);
      
      // Resample to 16kHz for Gemini input
      wav.toSampleRate(this.GEMINI_INPUT_SAMPLE_RATE);
      
      // Get PCM data - wavefile returns Float64Array by default, convert to Int16Array
      const floatSamples = wav.getSamples(false) as Float64Array;
      const pcmData = new Int16Array(floatSamples.length);
      
      // Convert float samples to 16-bit integers
      for (let i = 0; i < floatSamples.length; i++) {
        const floatValue = floatSamples[i];
        if (floatValue !== undefined) {
          const sample = Math.max(-1, Math.min(1, floatValue));
          pcmData[i] = Math.round(sample * 32767);
        }
      }
      
      // Convert to buffer
      const pcmBuffer = Buffer.from(pcmData.buffer);
      
      const processingTime = Date.now() - startTime;
      
      // Log performance metrics (sample 1% to avoid spam)
      if (Math.random() < 0.01) {
        log.debug('Audio conversion: Twilio → Gemini Input', {
          inputSize: mulawBuffer.length,
          outputSize: pcmBuffer.length,
          processingTime,
          compressionRatio: (pcmBuffer.length / mulawBuffer.length).toFixed(2),
          inputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
          outputFormat: `PCM ${this.GEMINI_INPUT_SAMPLE_RATE}Hz`,
        });
      }
      
      return {
        success: true,
        convertedAudio: pcmBuffer,
        processingTime,
        inputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
        outputFormat: `PCM ${this.GEMINI_INPUT_SAMPLE_RATE}Hz`,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      log.error('Failed to convert Twilio audio to Gemini input format', error as Error);
      
      return {
        success: false,
        error: `Audio conversion failed: ${(error as Error).message}`,
        processingTime,
        inputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
        outputFormat: `PCM ${this.GEMINI_INPUT_SAMPLE_RATE}Hz`,
      };
    }
  }

  /**
   * Convert Gemini PCM output to Twilio μ-law format
   * 
   * This method converts Gemini's PCM output audio to the μ-law format
   * required by Twilio for real-time voice communication.
   * 
   * @param pcmBuffer Raw PCM audio buffer from Gemini (24kHz, 16-bit)
   * @returns AudioConversionResult with converted μ-law audio for Twilio
   */
  public convertGeminiOutputToTwilio(pcmBuffer: Buffer): AudioConversionResult {
    const startTime = Date.now();
    
    try {
      // Validate input buffer
      if (!pcmBuffer || pcmBuffer.length === 0) {
        throw new Error('Invalid PCM buffer: empty or null');
      }
      
      // Create Int16Array view of the PCM data (assuming 16-bit)
      const pcmData = new Int16Array(
        pcmBuffer.buffer,
        pcmBuffer.byteOffset,
        pcmBuffer.length / 2
      );
      
      // Create WaveFile instance with PCM audio
      const wav = new WaveFile();
      wav.fromScratch(
        this.CHANNELS, // mono
        this.GEMINI_OUTPUT_SAMPLE_RATE, // 24kHz from Gemini
        this.GEMINI_BIT_DEPTH,
        pcmData,
        {
          container: 'RIFF',
          chunkSize: 'auto',
          bitDepth: this.GEMINI_BIT_DEPTH,
          sampleRate: this.GEMINI_OUTPUT_SAMPLE_RATE,
          numChannels: this.CHANNELS,
          audioFormat: 1 // PCM format code
        }
      );
      
      // Resample to 8kHz for Twilio
      wav.toSampleRate(this.TWILIO_SAMPLE_RATE);
      
      // Convert to μ-law
      wav.toMuLaw();
      
      // Get μ-law data
      const mulawData = (wav.data as any).samples as Uint8Array;
      
      // Convert to buffer
      const mulawBuffer = Buffer.from(mulawData);
      
      const processingTime = Date.now() - startTime;
      
      // Log performance metrics (sample 1% to avoid spam)
      if (Math.random() < 0.01) {
        log.debug('Audio conversion: Gemini Output → Twilio', {
          inputSize: pcmBuffer.length,
          outputSize: mulawBuffer.length,
          processingTime,
          compressionRatio: (mulawBuffer.length / pcmBuffer.length).toFixed(2),
          inputFormat: `PCM ${this.GEMINI_OUTPUT_SAMPLE_RATE}Hz`,
          outputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
        });
      }
      
      return {
        success: true,
        convertedAudio: mulawBuffer,
        processingTime,
        inputFormat: `PCM ${this.GEMINI_OUTPUT_SAMPLE_RATE}Hz`,
        outputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      log.error('Failed to convert Gemini output to Twilio format', error as Error);
      
      return {
        success: false,
        error: `Audio conversion failed: ${(error as Error).message}`,
        processingTime,
        inputFormat: `PCM ${this.GEMINI_OUTPUT_SAMPLE_RATE}Hz`,
        outputFormat: `μ-law ${this.TWILIO_SAMPLE_RATE}Hz`,
      };
    }
  }

  /**
   * Create an AudioChunk object from raw PCM data
   * 
   * @param pcmBuffer Raw PCM audio buffer
   * @param sampleRate Sample rate of the audio
   * @param sequenceNumber Sequential number for ordering
   * @returns AudioChunk object
   */
  public createAudioChunk(
    pcmBuffer: Buffer, 
    sampleRate: number, 
    sequenceNumber: number
  ): AudioChunk {
    return {
      data: pcmBuffer,
      sampleRate,
      channels: this.CHANNELS,
      bitDepth: 16, // Always 16-bit for Gemini
      timestamp: new Date(),
      sequenceNumber,
    };
  }

  /**
   * Validate audio data before conversion
   * 
   * @param base64Audio Base64 encoded audio data
   * @param expectedFormat Expected audio format
   * @returns true if valid, throws error if invalid
   */
  private validateAudioData(base64Audio: string, expectedFormat: 'mulaw' | 'pcm'): boolean {
    if (!base64Audio || typeof base64Audio !== 'string') {
      throw new Error('Invalid audio data: must be a non-empty base64 string');
    }

    // Check if it's valid base64
    try {
      Buffer.from(base64Audio, 'base64');
    } catch {
      throw new Error('Invalid base64 encoding');
    }

    // Additional format-specific validation could be added here
    
    return true;
  }

  /**
   * Get audio format information from buffer
   * Useful for debugging and validation
   * 
   * @param audioBuffer Audio buffer to analyze
   * @returns Format information
   */
  public analyzeAudioFormat(audioBuffer: Buffer): {
    format: string;
    sampleRate: number;
    bitDepth: number;
    channels: number;
    duration: number;
  } {
    try {
      const wav = new WaveFile();
      wav.fromBuffer(audioBuffer);
      
      const fmt = wav.fmt as any;
      const data = wav.data as any;
      
      const format = fmt.audioFormat === 1 ? 'PCM' : 
                     fmt.audioFormat === 7 ? 'μ-law' : 
                     `Unknown (${fmt.audioFormat})`;
      
      const sampleRate = fmt.sampleRate;
      const bitDepth = fmt.bitsPerSample;
      const channels = fmt.numChannels;
      const duration = (data.samples.length / sampleRate / channels) * 1000; // ms
      
      return {
        format,
        sampleRate,
        bitDepth,
        channels,
        duration,
      };
      
    } catch (error) {
      log.error('Failed to analyze audio format', error as Error);
      throw new Error(`Audio analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create silence buffer for specific duration
   * Useful for padding or gap filling
   * 
   * @param durationMs Duration in milliseconds
   * @param format Target format ('mulaw' or 'pcm')
   * @param sampleRate Sample rate for the silence
   * @returns Buffer containing silence
   */
  public createSilence(durationMs: number, format: 'mulaw' | 'pcm', sampleRate: number): Buffer {
    try {
      const numSamples = Math.floor((sampleRate * durationMs) / 1000);
      
      if (format === 'mulaw') {
        // μ-law silence is 0xFF (255)
        return Buffer.alloc(numSamples, 0xFF);
      } else {
        // PCM silence is 0 (16-bit = 2 bytes per sample)
        return Buffer.alloc(numSamples * 2, 0);
      }
      
    } catch (error) {
      log.error('Failed to create silence buffer', error as Error);
      throw new Error(`Silence generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get the audio format constants for external reference
   */
  public getAudioFormatConstants() {
    return {
      twilio: {
        sampleRate: this.TWILIO_SAMPLE_RATE,
        bitDepth: this.TWILIO_BIT_DEPTH,
        channels: this.CHANNELS,
        format: 'μ-law',
      },
      geminiInput: {
        sampleRate: this.GEMINI_INPUT_SAMPLE_RATE,
        bitDepth: this.GEMINI_BIT_DEPTH,
        channels: this.CHANNELS,
        format: 'PCM',
      },
      geminiOutput: {
        sampleRate: this.GEMINI_OUTPUT_SAMPLE_RATE,
        bitDepth: this.GEMINI_BIT_DEPTH,
        channels: this.CHANNELS,
        format: 'PCM',
      },
    };
  }
}

// Export the singleton instance for use throughout the application
export const audioConverter = AudioConverterService.getInstance(); 