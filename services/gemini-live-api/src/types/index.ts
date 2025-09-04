import { Request } from 'express';
import { Modality } from '@google/genai';

// Environment Configuration
export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  GOOGLE_CLOUD_PROJECT_ID: string;
  GOOGLE_APPLICATION_CREDENTIALS: string;
  GEMINI_MODEL: string;
  VERTEX_AI_SEARCH_DATASTORE_ID: string;
  VERTEX_AI_SEARCH_LOCATION: string;
}

// Twilio Types
export interface TwilioInboundRequest {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  [key: string]: string;
}

export interface OutboundCallRequest {
  to_number: string;
  agent_id: string;
  campaign_id?: string;
  custom_context?: Record<string, unknown>;
}

export interface TwilioEventWebhook {
  CallSid: string;
  CallStatus: string;
  AccountSid: string;
  From: string;
  To: string;
  CallDuration?: string;
  Timestamp: string;
  [key: string]: string | undefined;
}

// Call State Types
export type CallStatus = 
  | 'queued'
  | 'initiated' 
  | 'ringing' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'busy' 
  | 'no-answer' 
  | 'canceled';

export type CallDirection = 'inbound' | 'outbound';

export interface CallState {
  callSid: string;
  accountSid: string;
  from: string;
  to: string;
  direction: CallDirection;
  status: CallStatus;
  agentId: string;
  campaignId?: string;
  customContext?: Record<string, unknown>;
  streamSid?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  errorMessage?: string;
  metadata: {
    twilioCallbackUrl?: string;
    wsConnectionId?: string;
    lastUpdated: Date;
  };
}

export interface CallStateUpdate {
  status?: CallStatus;
  streamSid?: string;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  errorMessage?: string;
  metadata?: Partial<CallState['metadata']>;
}

// WebSocket Stream Types
export interface StreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'error';
  sequenceNumber?: string;
  streamSid?: string;
  media?: {
    track: 'inbound' | 'outbound';
    chunk: string;
    timestamp: string;
    payload: string;
  };
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
  error?: string;
}

export interface VoiceStreamConnection {
  ws: any; // WebSocket connection
  callSid: string;
  agentId?: string;
  streamSid?: string;
  isActive: boolean;
  startTime: Date;
  geminiSessionId?: string; // Gemini Live session ID
}

// Gemini Live Audio-to-Audio Types
export interface GeminiAudioSession {
  sessionId: string;
  callSid: string;
  agentId: string;
  isActive: boolean;
  startTime: Date;
  // Native audio session from genai client
  audioSession?: any; // Will be typed as genai.LiveSession when available
  // Audio format configuration
  audioConfig: {
    inputSampleRate: number; // 16000 Hz for Gemini input
    outputSampleRate: number; // 24000 Hz for Gemini output
    inputChannels: number; // 1 (mono)
    outputChannels: number; // 1 (mono)
    inputBitDepth: number; // 16-bit
    outputBitDepth: number; // 16-bit
  };
  // Conversation context
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    timestamp: Date;
    audioChunk?: string; // Base64 encoded audio for audio messages
    textChunk?: string; // Text for text messages (if any)
  }>;
  // Performance metrics
  metrics: {
    totalAudioChunks: number;
    totalProcessingTime: number;
    averageLatency: number;
    lastActivity: Date;
  };
}

export interface GeminiAudioConfig {
  model: string; // e.g., 'gemini-2.5-flash-preview-native-audio-dialog'
  responseModalities: Modality[]; // [Modality.AUDIO]
  systemInstruction: string;
  // Audio format settings
  audioSettings?: {
    inputFormat: 'PCM_16_16K' | 'PCM_16_8K';
    outputFormat: 'PCM_16_24K';
    enableEchoCancellation?: boolean;
    enableNoiseSuppression?: boolean;
  };
}

export interface AudioChunk {
  data: Buffer; // Raw PCM audio data
  sampleRate: number;
  channels: number;
  bitDepth: number;
  timestamp: Date;
  sequenceNumber: number;
}

export interface AudioConversionResult {
  success: boolean;
  convertedAudio?: Buffer;
  error?: string;
  processingTime: number;
  inputFormat: string;
  outputFormat: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  dependencies: {
    twilio: 'up' | 'down';
    gemini: 'up' | 'down';
    vertexai: 'up' | 'down';
  };
}

// Logger Types
export interface LogContext {
  callSid?: string;
  agentId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

// Express Request Extensions
export interface AuthenticatedRequest extends Request {
  callSid?: string;
  agentId?: string;
  context?: LogContext;
}

// Error Types
export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  context?: LogContext;
}

// Service Configuration
export interface ServiceConfig {
  server: {
    port: number;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  google: {
    projectId: string;
    credentials: string;
    geminiModel: string;
    vertexAi: {
      datastoreId: string;
      location: string;
    };
  };
  logging: {
    level: string;
    format: 'json' | 'simple';
  };
} 