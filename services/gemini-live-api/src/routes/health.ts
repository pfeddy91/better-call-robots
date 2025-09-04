import { Router, Request, Response } from 'express';
import { serviceConfig } from '@/config';
import { HealthCheckResponse, ApiResponse } from '@/types';
import { log } from '@/utils/logger';

const router = Router();

/**
 * Check Twilio service health
 */
async function checkTwilioHealth(): Promise<'up' | 'down'> {
  try {
    // TODO: Implement actual Twilio health check
    // For now, just return 'up' if credentials are configured
    return serviceConfig.twilio.accountSid ? 'up' : 'down';
  } catch (error) {
    log.error('Twilio health check failed', error as Error);
    return 'down';
  }
}

/**
 * Check Gemini Live API health
 */
async function checkGeminiHealth(): Promise<'up' | 'down'> {
  try {
    // TODO: Implement actual Gemini health check
    // For now, just return 'up' if credentials are configured
    return serviceConfig.google.credentials ? 'up' : 'down';
  } catch (error) {
    log.error('Gemini health check failed', error as Error);
    return 'down';
  }
}

/**
 * Check Vertex AI health
 */
async function checkVertexAiHealth(): Promise<'up' | 'down'> {
  try {
    // TODO: Implement actual Vertex AI health check
    // For now, just return 'up' if credentials are configured
    return serviceConfig.google.projectId ? 'up' : 'down';
  } catch (error) {
    log.error('Vertex AI health check failed', error as Error);
    return 'down';
  }
}

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response<ApiResponse<HealthCheckResponse>>) => {
  const startTime = Date.now();

  try {
    // Check all dependencies in parallel
    const [twilioStatus, geminiStatus, vertexaiStatus] = await Promise.all([
      checkTwilioHealth(),
      checkGeminiHealth(),
      checkVertexAiHealth(),
    ]);

    const dependencies = {
      twilio: twilioStatus,
      gemini: geminiStatus,
      vertexai: vertexaiStatus,
    };

    // Determine overall health status
    const allUp = Object.values(dependencies).every(status => status === 'up');
    const anyDown = Object.values(dependencies).some(status => status === 'down');

    const overallStatus = allUp ? 'healthy' : anyDown ? 'degraded' : 'unhealthy';

    const healthData: HealthCheckResponse = {
      status: overallStatus,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies,
    };

    const response: ApiResponse<HealthCheckResponse> = {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString(),
    };

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;

    res.status(statusCode).json(response);

    log.debug('Health check completed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      dependencies,
    });

  } catch (error) {
    log.error('Health check failed', error as Error);

    const response: ApiResponse<HealthCheckResponse> = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(response);
  }
});

export { router as healthRouter }; 