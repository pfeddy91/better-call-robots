import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { serviceConfig } from '@/config';
import { log } from '@/utils/logger';
import { requestContext, errorLogger, fullRequestLogger } from '@/middleware/logging';
import { errorHandler } from '@/middleware/validation';
import { VoiceStreamService } from '@/services/websocket';
import { healthRouter } from '@/routes/health';
import { callsRouter } from '@/routes/calls';
import testRouter from '@/routes/test';
import { audioConverter } from '@/services/audioConverter';
import { geminiLiveService } from '@/services/geminiLive';
import path from 'path';

/**
 * Gemini Live API Server
 */
class GeminiLiveApiServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private voiceStreamService: VoiceStreamService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    // Initialize services - use singleton for VoiceStreamService
    this.voiceStreamService = VoiceStreamService.getInstance();
    
    // Force initialization of other singletons
    audioConverter;
    geminiLiveService;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for WebSocket compatibility
    }));

    // CORS configuration
    this.app.use(cors(serviceConfig.server.cors));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Request context and logging
    this.app.use(requestContext);

    // Add detailed request logging for development
    if (process.env.NODE_ENV === 'development') {
      this.app.use(fullRequestLogger);
    }

    // Add static file server for temporary audio files
    const tempDir = path.join(__dirname, '..', 'temp_audio');
    this.app.use('/audio', express.static(tempDir));
    
    // Serve test interface HTML files
    this.app.use(express.static(path.join(__dirname, '..')));

    log.info('Middleware configured successfully');
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.use('/health', healthRouter);

    // API routes
    this.app.use('/api', callsRouter);
    
    // Test routes (development only)
    if (process.env.NODE_ENV !== 'production') {
      this.app.use('/api/test', testRouter);
      log.info('Test routes enabled for development');
    }

    // Twilio webhook compatibility - redirect /inbound-call to /api/inbound-call
    this.app.post('/inbound-call', (req, res) => {
      // Forward the request to the API route
      req.url = '/api/inbound-call';
      this.app._router.handle(req, res);
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Gemini Live API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString(),
      });
    });

    log.info('Routes configured successfully');
  }

  /**
   * Setup WebSocket handling
   */
  private setupWebSocket(): void {
    // Handle WebSocket upgrade requests
    this.server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      
      if (pathname === '/voice-stream') {
        this.voiceStreamService.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });

    log.info('WebSocket server configured successfully');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Error logging middleware
    this.app.use(errorLogger);

    // Global error handler
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception', error);
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled rejection', reason as Error, {
        promise: promise.toString(),
      });
      this.shutdown(1);
    });

    // Handle process termination signals
    process.on('SIGTERM', () => {
      log.info('Received SIGTERM signal');
      this.shutdown(0);
    });

    process.on('SIGINT', () => {
      log.info('Received SIGINT signal');
      this.shutdown(0);
    });

    log.info('Error handling configured successfully');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(serviceConfig.server.port, () => {
          log.info('Gemini Live API server started', {
            port: serviceConfig.server.port,
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
          });

          // Log configuration (without sensitive data)
          log.info('Server configuration', {
            port: serviceConfig.server.port,
            corsOrigin: serviceConfig.server.cors.origin,
            geminiModel: serviceConfig.google.geminiModel,
            vertexAiLocation: serviceConfig.google.vertexAi.location,
          });

          resolve();
        });

        this.server.on('error', (error) => {
          log.error('Server startup error', error);
          reject(error);
        });

      } catch (error) {
        log.error('Failed to start server', error as Error);
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  private shutdown(exitCode: number): void {
    log.info('Initiating graceful shutdown');

    // Close HTTP server
    this.server.close((error) => {
      if (error) {
        log.error('Error during server shutdown', error);
      } else {
        log.info('HTTP server closed');
      }

      // Cleanup WebSocket connections
      this.voiceStreamService.cleanup();

      log.info('Shutdown complete');
      process.exit(exitCode);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      log.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  }

  /**
   * Get server instance for testing
   */
  public getServer(): ReturnType<typeof createServer> {
    return this.server;
  }

  /**
   * Get WebSocket service for testing
   */
  public getVoiceStreamService(): VoiceStreamService {
    return this.voiceStreamService;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new GeminiLiveApiServer();
  
  server.start().catch((error) => {
    log.error('Failed to start server', error);
    process.exit(1);
  });
}

export { GeminiLiveApiServer }; 