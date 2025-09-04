import winston from 'winston';
import { serviceConfig } from '@/config';
import { LogContext } from '@/types';

/**
 * Custom log format for development
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${stack || ''} ${metaString}`;
  })
);

/**
 * Custom log format for production
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: serviceConfig.logging.level,
  format: serviceConfig.logging.format === 'json' ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'gemini-live-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

/**
 * Enhanced logger with context support
 */
export class Logger {
  private baseLogger: winston.Logger;

  constructor(baseLogger: winston.Logger) {
    this.baseLogger = baseLogger;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger(this.baseLogger.child(context));
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: LogContext): void {
    this.baseLogger.debug(message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogContext): void {
    this.baseLogger.info(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogContext): void {
    this.baseLogger.warn(message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: LogContext): void {
    this.baseLogger.error(message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log call event with structured data
   */
  logCallEvent(
    event: 'call_started' | 'call_ended' | 'call_failed' | 'stream_connected' | 'stream_disconnected',
    callSid: string,
    meta?: LogContext
  ): void {
    this.info(`Call event: ${event}`, {
      event,
      callSid,
      ...meta,
    });
  }

  /**
   * Log API request
   */
  logApiRequest(method: string, path: string, meta?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      ...meta,
    });
  }

  /**
   * Log API response
   */
  logApiResponse(method: string, path: string, statusCode: number, duration: number, meta?: LogContext): void {
    this.info(`API Response: ${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      ...meta,
    });
  }
}

// Export the enhanced logger instance
export const log = new Logger(logger);

// Export the base winston logger for advanced use cases
export { logger as winstonLogger }; 