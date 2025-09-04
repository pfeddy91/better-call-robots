import dotenv from 'dotenv';
import { EnvironmentConfig, ServiceConfig } from '@/types';

// Load environment variables
dotenv.config();

/**
 * Validates and returns a required environment variable
 */
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Validates and returns an optional environment variable with default
 */
function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    PORT: parseInt(getOptionalEnvVar('PORT', '8082'), 10),
    NODE_ENV: (getOptionalEnvVar('NODE_ENV', 'development') as EnvironmentConfig['NODE_ENV']),
    TWILIO_ACCOUNT_SID: getRequiredEnvVar('TWILIO_ACCOUNT_SID'),
    TWILIO_AUTH_TOKEN: getRequiredEnvVar('TWILIO_AUTH_TOKEN'),
    TWILIO_PHONE_NUMBER: getRequiredEnvVar('TWILIO_PHONE_NUMBER'),
    GOOGLE_CLOUD_PROJECT_ID: getRequiredEnvVar('GOOGLE_CLOUD_PROJECT_ID'),
    GOOGLE_APPLICATION_CREDENTIALS: getRequiredEnvVar('GOOGLE_APPLICATION_CREDENTIALS'),
    // Updated to use the native audio model for audio-to-audio conversations
    GEMINI_MODEL: getOptionalEnvVar('GEMINI_MODEL', 'gemini-2.5-flash-preview-native-audio-dialog'),
    VERTEX_AI_SEARCH_DATASTORE_ID: getOptionalEnvVar('VERTEX_AI_SEARCH_DATASTORE_ID', 'your_datastore_id'),
    VERTEX_AI_SEARCH_LOCATION: getOptionalEnvVar('VERTEX_AI_SEARCH_LOCATION', 'global'),
  };
}

/**
 * Create service configuration from environment
 */
export function createServiceConfig(): ServiceConfig {
  const env = loadEnvironmentConfig();
  
  return {
    server: {
      port: env.PORT,
      cors: {
        origin: env.NODE_ENV === 'production' 
          ? ['https://your-frontend-domain.com'] 
          : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:8082'],
        credentials: true,
      },
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    },
    google: {
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: env.GOOGLE_APPLICATION_CREDENTIALS,
      geminiModel: env.GEMINI_MODEL,
      vertexAi: {
        datastoreId: env.VERTEX_AI_SEARCH_DATASTORE_ID,
        location: env.VERTEX_AI_SEARCH_LOCATION,
      },
    },
    logging: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: env.NODE_ENV === 'production' ? 'json' : 'simple',
    },
  };
}

// Export the configurations
export const envConfig = loadEnvironmentConfig();
export const serviceConfig = createServiceConfig(); 