import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/utils/logger';
import { VoiceStreamConnection, StreamMessage } from '@/types';
import { callStateService } from '@/services/callState';
import { geminiLiveService } from '@/services/geminiLive';

/**
 * WebSocket service for handling real-time voice streams from Twilio.
 * 
 * This service manages WebSocket connections for voice calls, handling
 * the bidirectional audio streaming between Twilio and our backend.
 * In Phase 3, this will be extended to integrate with Gemini Live API.
 */
export class VoiceStreamService {
  private wss: WebSocketServer;
  private connections = new Map<string, VoiceStreamConnection>();
  private static instance: VoiceStreamService;

  constructor() {
    this.wss = new WebSocketServer({ 
      noServer: true,
      perMessageDeflate: false, // Disable compression for real-time audio
    });

    this.setupEventHandlers();
    this.startCleanupTimer();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VoiceStreamService {
    if (!VoiceStreamService.instance) {
      VoiceStreamService.instance = new VoiceStreamService();
    }
    return VoiceStreamService.instance;
  }

  /**
   * Send audio data back to Twilio for a specific call
   */
  public sendAudioToTwilio(callSid: string, base64Audio: string): boolean {
    // Find the connection for this call
    for (const connection of this.connections.values()) {
      if (connection.callSid === callSid && connection.isActive) {
        try {
          const mediaMessage = {
            event: 'media',
            streamSid: connection.streamSid,
            media: {
              payload: base64Audio
            }
          };
          
          connection.ws.send(JSON.stringify(mediaMessage));
          
          log.debug('Sent audio to Twilio', {
            callSid,
            streamSid: connection.streamSid,
            payloadLength: base64Audio.length,
          });
          
          return true;
        } catch (error) {
          log.error('Failed to send audio to Twilio', error as Error, {
            callSid,
            streamSid: connection.streamSid,
          });
          return false;
        }
      }
    }
    
    log.warn('No active connection found for call', { callSid });
    return false;
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupEventHandlers(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  /**
   * Start periodic cleanup of stale connections and call states
   */
  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      const staleConnections: string[] = [];
      const now = Date.now();

      // Find stale connections (inactive for more than 10 minutes)
      for (const [connectionId, connection] of this.connections) {
        const connectionAge = now - connection.startTime.getTime();
        if (!connection.isActive && connectionAge > 10 * 60 * 1000) {
          staleConnections.push(connectionId);
        }
      }

      // Clean up stale connections
      for (const connectionId of staleConnections) {
        const connection = this.connections.get(connectionId);
        if (connection) {
          log.warn('Cleaning up stale connection', {
            connectionId,
            callSid: connection.callSid,
            age: Math.floor((now - connection.startTime.getTime()) / 1000),
          });
          connection.ws.close(1000, 'Stale connection cleanup');
          this.connections.delete(connectionId);
        }
      }

      // Clean up old call states
      const cleaned = callStateService.cleanupOldCalls(60); // 1 hour
      if (cleaned > 0) {
        log.info('Cleaned up old call states', { count: cleaned });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const callSid = url.searchParams.get('callSid');
    const agentId = (url.searchParams.get('agentId') || url.searchParams.get('agent')) || 'default';

    const logContext: any = {
      url: req.url,
      searchParams: Object.fromEntries(url.searchParams.entries()),
    };
    if (callSid) logContext.callSid = callSid;
    if (agentId) logContext.agentId = agentId;
    
    log.debug('WebSocket connection attempt', logContext);

    // If callSid is provided in URL parameters, proceed normally
    if (callSid) {
      const callState = callStateService.getCall(callSid);
      this.acceptConnection(ws, req, callSid as string, agentId, callState);
      return;
    }

    // If no callSid in URL (Twilio's case), accept connection temporarily
    // and wait for the 'start' message which contains the callSid
    log.info('Accepting WebSocket connection without callSid - waiting for start message');
    this.acceptTemporaryConnection(ws, req, agentId);
  }

  /**
   * Accept WebSocket connection and set up handlers
   */
  private acceptConnection(
    ws: WebSocket,
    req: IncomingMessage,
    callSid: string,
    agentId?: string,
    callState?: any
  ): void {
    const connectionId = uuidv4();
    const remoteAddress = req.socket.remoteAddress || 'unknown';

    const connection: VoiceStreamConnection = {
      ws,
      callSid,
      agentId: agentId || 'default',
      isActive: false,
      startTime: new Date(),
    };

    this.connections.set(connectionId, connection);

    // If we already have a callState record, tag it with the WebSocket
    // connection information.  If not, we'll enrich it later when the first
    // Stream "start" event is received.
    if (callState) {
      callStateService.updateCall(callSid, {
        metadata: { wsConnectionId: connectionId },
      });
    }

    // Set up WebSocket event handlers
    ws.on('message', (data) => this.handleMessage(connectionId, data as Buffer));
    ws.on('close', (code, reason) => this.handleDisconnect(connectionId, code, reason));
    ws.on('error', (error) => this.handleError(connectionId, error));
    ws.on('ping', () => ws.pong());

    // Do NOT send any messages back to Twilio - this violates Stream protocol
    // Twilio Stream is one-way: we receive, we don't send

    log.logCallEvent('stream_connected', callSid, {
      connectionId,
      agentId: agentId || 'default',
      remoteAddress,
    });

    // Create Gemini Live session immediately when connection is established
    // (Don't wait for 'start' event which may not be sent by Twilio)
    log.info('Attempting to create Gemini Live session', {
      callSid,
      agentId: agentId || 'default',
      connectionId,
    });
    
    // Add more detailed error handling
    try {
      geminiLiveService.createSession(
        callSid,
        agentId || 'default',
        {
          callType: 'inbound',
        }
      ).then(sessionId => {
        connection.geminiSessionId = sessionId;
        connection.isActive = true; // Mark as active since we have a session
        log.info('Gemini Live session initialized', {
          callSid,
          sessionId,
          connectionId,
        });
      }).catch(error => {
        log.error('Failed to initialize Gemini Live session', error as Error, {
          callSid,
          connectionId,
          errorMessage: error.message,
          errorStack: error.stack,
        });
      });
    } catch (error) {
      log.error('Exception during Gemini Live session creation', error as Error, {
        callSid,
        connectionId,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
      });
    }
  }

  /**
   * Accept temporary WebSocket connection without callSid (for Twilio)
   */
  private acceptTemporaryConnection(
    ws: WebSocket,
    req: IncomingMessage,
    agentId: string
  ): void {
    const connectionId = uuidv4();
    const remoteAddress = req.socket.remoteAddress || 'unknown';

    // Create temporary connection - callSid will be updated from start message
    const connection: VoiceStreamConnection = {
      ws,
      callSid: 'PENDING', // Temporary placeholder
      agentId,
      isActive: false,
      startTime: new Date(),
    };

    this.connections.set(connectionId, connection);

    // Set up WebSocket event handlers
    ws.on('message', (data) => this.handleMessage(connectionId, data as Buffer));
    ws.on('close', (code, reason) => this.handleDisconnect(connectionId, code, reason));
    ws.on('error', (error) => this.handleError(connectionId, error));
    ws.on('ping', () => ws.pong());

    // Do NOT send any messages back to Twilio - this violates Stream protocol
    // Twilio Stream is one-way: we receive, we don't send

    log.info('Temporary WebSocket connection accepted', {
      connectionId,
      agentId,
      remoteAddress,
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(connectionId: string, data: Buffer | string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      log.warn('Received message for unknown connection', { connectionId });
      return;
    }

    try {
      const message = JSON.parse(data.toString()) as StreamMessage;
      
      log.debug('Received stream message', {
        connectionId,
        callSid: connection.callSid,
        event: message.event,
      });

      switch (message.event) {
        case 'start':
          this.handleStreamStart(connection, message);
          break;
        case 'media':
          this.handleMediaMessage(connection, message);
          break;
        case 'stop':
          this.handleStreamStop(connection, message);
          break;
        default:
          log.warn('Unknown stream event received', {
            connectionId,
            event: message.event,
          });
      }
    } catch (error) {
      log.error('Failed to parse stream message', error as Error, {
        connectionId,
        callSid: connection.callSid,
      });
    }
  }

  /**
   * Handle stream start event
   */
  private handleStreamStart(connection: VoiceStreamConnection, message: StreamMessage): void {
    if (message.start) {
      // If this was a temporary connection (callSid = 'PENDING'), update it with real callSid
      if (connection.callSid === 'PENDING') {
        connection.callSid = message.start.callSid;
        log.info('Updated temporary connection with callSid', {
          callSid: message.start.callSid,
          streamSid: message.start.streamSid,
        });
      }

      connection.streamSid = message.start.streamSid;
      connection.isActive = true;

      // Update call state with stream information
      callStateService.updateCall(connection.callSid, {
        status: 'in-progress',
        streamSid: message.start.streamSid,
      });

      log.logCallEvent('call_started', connection.callSid, {
        streamSid: message.start.streamSid,
        tracks: message.start.tracks,
        mediaFormat: message.start.mediaFormat,
      });

      // Start Gemini Live session for this connection
      geminiLiveService.createSession(
        connection.callSid,
        connection.agentId || 'default',
        {
          callType: 'inbound',
        }
      ).then(sessionId => {
        connection.geminiSessionId = sessionId;
        log.info('Gemini Live session initialized', {
          callSid: connection.callSid,
          sessionId,
          streamSid: connection.streamSid,
        });
      }).catch(error => {
        log.error('Failed to initialize Gemini Live session', error as Error, {
          callSid: connection.callSid,
        });
      });
    }
  }

  /**
   * Handle media message (audio data)
   */
  private handleMediaMessage(connection: VoiceStreamConnection, message: StreamMessage): void {
    if (!message.media) {
      return;
    }

    // Only process inbound audio (from caller)
    if (message.media.track !== 'inbound') {
      return;
    }

    // Send audio to Gemini Live if session is active
    if (connection.geminiSessionId) {
      geminiLiveService.sendAudioToGemini(
        connection.geminiSessionId,
        message.media.payload
      ).catch(error => {
        log.error('Failed to send audio to Gemini', error as Error, {
          callSid: connection.callSid,
          sessionId: connection.geminiSessionId,
        });
      });
    } else {
      // Log when we receive audio but don't have a Gemini session yet
      log.debug('Received audio but no Gemini session yet', {
        callSid: connection.callSid,
        track: message.media.track,
        timestamp: message.media.timestamp,
        payloadLength: message.media.payload.length,
      });
    }

    // Track metrics (1% sampling to avoid spam)
    if (Math.random() < 0.01) {
      log.debug('Processing audio data', {
        callSid: connection.callSid,
        track: message.media.track,
        timestamp: message.media.timestamp,
        payloadLength: message.media.payload.length,
        hasGeminiSession: !!connection.geminiSessionId,
      });
    }
  }

  /**
   * Handle stream stop event
   */
  private handleStreamStop(connection: VoiceStreamConnection, message: StreamMessage): void {
    connection.isActive = false;

    const duration = Date.now() - connection.startTime.getTime();

    // Update call state
    callStateService.updateCall(connection.callSid, {
      status: 'completed',
      endTime: new Date(),
      duration: Math.floor(duration / 1000), // Convert to seconds
    });

    log.logCallEvent('call_ended', connection.callSid, {
      streamSid: connection.streamSid,
      duration,
    });

    // Clean up Gemini Live session
    if (connection.geminiSessionId) {
      geminiLiveService.endSession(connection.geminiSessionId);
      log.info('Gemini Live session ended', {
        callSid: connection.callSid,
        sessionId: connection.geminiSessionId,
        streamSid: connection.streamSid,
        duration,
      });
    }
  }

  /**
   * Handle WebSocket disconnect
   */
  private handleDisconnect(connectionId: string, code: number, reason: Buffer): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const duration = Date.now() - connection.startTime.getTime();

      log.logCallEvent('stream_disconnected', connection.callSid, {
        connectionId,
        code,
        reason: reason.toString(),
        duration,
      });

      // Update call state if still active
      if (connection.isActive) {
        callStateService.updateCall(connection.callSid, {
          status: 'completed',
          endTime: new Date(),
          duration: Math.floor(duration / 1000),
        });
      }

      // TODO: Clean up any active Gemini sessions
      this.connections.delete(connectionId);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(connectionId: string, error: Error): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      log.error('WebSocket connection error', error, {
        connectionId,
        callSid: connection.callSid,
      });

      // Update call state with error
      callStateService.updateCall(connection.callSid, {
        status: 'failed',
        errorMessage: error.message,
        endTime: new Date(),
      });

      // Close the connection on error
      connection.ws.close(1011, 'Server error');
      this.connections.delete(connectionId);
    }
  }

  /**
   * Handle HTTP upgrade for WebSocket
   */
  handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { total: number; active: number } {
    const total = this.connections.size;
    const active = Array.from(this.connections.values()).filter(conn => conn.isActive).length;
    
    return { total, active };
  }

  /**
   * Get connection by call SID
   */
  getConnectionByCallSid(callSid: string): VoiceStreamConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.callSid === callSid) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Cleanup - close all connections
   */
  cleanup(): void {
    log.info('Cleaning up WebSocket service');
    
    for (const [connectionId, connection] of this.connections) {
      connection.ws.close(1001, 'Server shutting down');
      this.connections.delete(connectionId);
    }

    this.wss.close();
  }
} 