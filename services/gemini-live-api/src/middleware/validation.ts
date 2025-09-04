import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { serviceConfig } from '@/config';
import { TwilioInboundRequest, OutboundCallRequest, ServiceError } from '@/types';
import { log } from '@/utils/logger';

/**
 * Create a service error with proper typing
 */
function createServiceError(message: string, code: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

/**
 * Validate Twilio webhook signature for security
 * 
 * This middleware ensures that incoming webhooks are genuinely from Twilio
 * by validating the X-Twilio-Signature header against the request body
 * and URL using Twilio's auth token.
 * 
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(req: Request, res: Response, next: NextFunction): void {
  // Skip validation in development/test environments for easier testing
  if (serviceConfig.server.port === 8081 && process.env.NODE_ENV !== 'production') {
    log.debug('Skipping Twilio signature validation in development');
    return next();
  }

  const signature = req.headers['x-twilio-signature'] as string;
  
  if (!signature) {
    log.warn('Missing Twilio signature header', {
      ip: req.ip,
      path: req.path,
    });
    const error = createServiceError('Missing Twilio signature', 'MISSING_SIGNATURE', 401);
    return next(error);
  }

  try {
    // Construct the full URL for validation
    // In production, ensure your proxy passes the correct protocol and host
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'];
    const url = `${protocol}://${host}${req.originalUrl}`;

    // Validate the signature
    const isValid = twilio.validateRequest(
      serviceConfig.twilio.authToken,
      signature,
      url,
      req.body
    );

    if (!isValid) {
      log.warn('Invalid Twilio signature', {
        ip: req.ip,
        path: req.path,
        url,
      });
      const error = createServiceError('Invalid Twilio signature', 'INVALID_SIGNATURE', 401);
      return next(error);
    }

    log.debug('Twilio signature validated successfully', {
      path: req.path,
    });
    
    next();
  } catch (error) {
    log.error('Error validating Twilio signature', error as Error, {
      path: req.path,
    });
    const serviceError = createServiceError('Error validating signature', 'VALIDATION_ERROR', 500);
    next(serviceError);
  }
}

/**
 * Validate inbound call request
 */
export function validateInboundCall(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Partial<TwilioInboundRequest>;

  if (!body.CallSid || !body.From || !body.To) {
    const error = createServiceError(
      'Missing required fields: CallSid, From, or To',
      'INVALID_REQUEST',
      400
    );
    return next(error);
  }

  // Validate phone number formats
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(body.From) || !phoneRegex.test(body.To)) {
    const error = createServiceError(
      'Invalid phone number format in From or To field',
      'INVALID_PHONE_NUMBER',
      400
    );
    return next(error);
  }

  // Add callSid to request for logging context
  (req as any).callSid = body.CallSid;
  
  // Extract agentId from query parameters if provided
  const agentId = req.query.agentId as string;
  if (agentId) {
    (req as any).agentId = agentId;
  }

  next();
}

/**
 * Validate outbound call request
 */
export function validateOutboundCall(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Partial<OutboundCallRequest>;

  if (!body.to_number || !body.agent_id) {
    const error = createServiceError(
      'Missing required fields: to_number or agent_id',
      'INVALID_REQUEST',
      400
    );
    return next(error);
  }

  // Validate phone number format (E.164)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(body.to_number)) {
    const error = createServiceError(
      'Invalid phone number format. Must be E.164 format (e.g., +1234567890)',
      'INVALID_PHONE_NUMBER',
      400
    );
    return next(error);
  }

  // Validate agent_id format (alphanumeric with underscores/hyphens)
  const agentIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!agentIdRegex.test(body.agent_id)) {
    const error = createServiceError(
      'Invalid agent_id format. Must be alphanumeric with optional underscores or hyphens',
      'INVALID_AGENT_ID',
      400
    );
    return next(error);
  }

  // Validate campaign_id if provided
  if (body.campaign_id && !agentIdRegex.test(body.campaign_id)) {
    const error = createServiceError(
      'Invalid campaign_id format. Must be alphanumeric with optional underscores or hyphens',
      'INVALID_CAMPAIGN_ID',
      400
    );
    return next(error);
  }

  next();
}

/**
 * Global error handler
 */
export function errorHandler(error: ServiceError, req: Request, res: Response, next: NextFunction): void {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  // Log error with context
  if (statusCode >= 500) {
    log.error('Server error in request', error, {
      statusCode,
      code,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: error.message,
    code,
    timestamp: new Date().toISOString(),
  });
} 