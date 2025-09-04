import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';

/**
 * Add request ID and logging context to requests
 */
export function requestContext(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Add context to request
  req.context = {
    requestId,
    ...(req.context || {}),
  };

  // Log incoming request
  log.logApiRequest(req.method, req.path, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    log.logApiResponse(req.method, req.path, res.statusCode, duration, {
      requestId,
      ...(req.callSid && { callSid: req.callSid }),
    });
  });

  next();
}

/**
 * Error logging middleware
 */
export function errorLogger(error: Error, req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  log.error('Request error', error, {
    ...(req.context?.requestId && { requestId: req.context.requestId }),
    method: req.method,
    path: req.path,
    ...(req.callSid && { callSid: req.callSid }),
  });

  next(error);
}

/**
 * Detailed request logger for debugging
 */
export function fullRequestLogger(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    log.debug('Full request details:', {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: req.ip,
    });
  }
  next();
} 