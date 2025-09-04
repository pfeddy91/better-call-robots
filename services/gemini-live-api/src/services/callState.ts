import { 
  CallState, 
  CallStateUpdate, 
  CallStatus, 
  CallDirection, 
  OutboundCallRequest 
} from '@/types';
import { log } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing call state throughout the call lifecycle.
 * 
 * This service provides a centralized location for tracking call state,
 * which is essential for debugging, analytics, and maintaining context
 * across different parts of the application.
 * 
 * Currently uses in-memory storage but designed to be easily replaceable
 * with a distributed cache like Redis for horizontal scaling.
 */
export class CallStateService {
  private calls: Map<string, CallState> = new Map();
  private static instance: CallStateService;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize any required resources
    log.info('CallStateService initialized');
  }

  /**
   * Get singleton instance of CallStateService
   */
  public static getInstance(): CallStateService {
    if (!CallStateService.instance) {
      CallStateService.instance = new CallStateService();
    }
    return CallStateService.instance;
  }

  /**
   * Create a new call state entry for an inbound call
   */
  public createInboundCall(params: {
    callSid: string;
    accountSid: string;
    from: string;
    to: string;
    agentId: string;
  }): CallState {
    const callState: CallState = {
      callSid: params.callSid,
      accountSid: params.accountSid,
      from: params.from,
      to: params.to,
      direction: 'inbound',
      status: 'initiated',
      agentId: params.agentId,
      startTime: new Date(),
      metadata: {
        lastUpdated: new Date(),
      },
    };

    this.calls.set(params.callSid, callState);

    log.info('Created inbound call state', {
      callSid: params.callSid,
      from: params.from,
      to: params.to,
      agentId: params.agentId,
    });

    return callState;
  }

  /**
   * Create a new call state entry for an outbound call
   */
  public createOutboundCall(params: {
    callSid: string;
    accountSid: string;
    request: OutboundCallRequest;
    fromNumber: string;
  }): CallState {
    const callState: CallState = {
      callSid: params.callSid,
      accountSid: params.accountSid,
      from: params.fromNumber,
      to: params.request.to_number,
      direction: 'outbound',
      status: 'queued',
      agentId: params.request.agent_id,
      ...(params.request.campaign_id && { campaignId: params.request.campaign_id }),
      ...(params.request.custom_context && { customContext: params.request.custom_context }),
      startTime: new Date(),
      metadata: {
        lastUpdated: new Date(),
      },
    };

    this.calls.set(params.callSid, callState);

    log.info('Created outbound call state', {
      callSid: params.callSid,
      to: params.request.to_number,
      agentId: params.request.agent_id,
      campaignId: params.request.campaign_id,
    });

    return callState;
  }

  /**
   * Update call state with new information
   */
  public updateCall(callSid: string, update: CallStateUpdate): CallState | null {
    const callState = this.calls.get(callSid);
    
    if (!callState) {
      log.warn('Attempted to update non-existent call', { callSid });
      return null;
    }

    // Apply updates
    if (update.status !== undefined) {
      callState.status = update.status;
    }
    if (update.streamSid !== undefined) {
      callState.streamSid = update.streamSid;
    }
    if (update.endTime !== undefined) {
      callState.endTime = update.endTime;
    }
    if (update.duration !== undefined) {
      callState.duration = update.duration;
    }
    if (update.recordingUrl !== undefined) {
      callState.recordingUrl = update.recordingUrl;
    }
    if (update.errorMessage !== undefined) {
      callState.errorMessage = update.errorMessage;
    }
    if (update.metadata) {
      callState.metadata = {
        ...callState.metadata,
        ...update.metadata,
        lastUpdated: new Date(),
      };
    } else {
      callState.metadata.lastUpdated = new Date();
    }

    this.calls.set(callSid, callState);

    log.debug('Updated call state', {
      callSid,
      status: callState.status,
      updates: Object.keys(update),
    });

    return callState;
  }

  /**
   * Get call state by call SID
   */
  public getCall(callSid: string): CallState | null {
    return this.calls.get(callSid) || null;
  }

  /**
   * Get all calls with optional filtering
   */
  public getCalls(filter?: {
    status?: CallStatus;
    direction?: CallDirection;
    agentId?: string;
    campaignId?: string;
  }): CallState[] {
    let calls = Array.from(this.calls.values());

    if (filter) {
      if (filter.status) {
        calls = calls.filter(call => call.status === filter.status);
      }
      if (filter.direction) {
        calls = calls.filter(call => call.direction === filter.direction);
      }
      if (filter.agentId) {
        calls = calls.filter(call => call.agentId === filter.agentId);
      }
      if (filter.campaignId) {
        calls = calls.filter(call => call.campaignId === filter.campaignId);
      }
    }

    return calls;
  }

  /**
   * Get active calls (in-progress status)
   */
  public getActiveCalls(): CallState[] {
    return this.getCalls({ status: 'in-progress' });
  }

  /**
   * Remove call state (for cleanup)
   */
  public removeCall(callSid: string): boolean {
    const existed = this.calls.has(callSid);
    this.calls.delete(callSid);
    
    if (existed) {
      log.debug('Removed call state', { callSid });
    }
    
    return existed;
  }

  /**
   * Clean up old completed calls to prevent memory leaks
   * 
   * @param olderThanMinutes Remove calls completed more than X minutes ago
   */
  public cleanupOldCalls(olderThanMinutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const callsToRemove: string[] = [];

    for (const [callSid, callState] of this.calls.entries()) {
      if (
        callState.endTime && 
        callState.endTime < cutoffTime &&
        ['completed', 'failed', 'canceled'].includes(callState.status)
      ) {
        callsToRemove.push(callSid);
      }
    }

    for (const callSid of callsToRemove) {
      this.calls.delete(callSid);
    }

    if (callsToRemove.length > 0) {
      log.info('Cleaned up old call states', {
        count: callsToRemove.length,
        olderThanMinutes,
      });
    }

    return callsToRemove.length;
  }

  /**
   * Get statistics about current call states
   */
  public getStatistics(): {
    total: number;
    byStatus: Record<CallStatus, number>;
    byDirection: Record<CallDirection, number>;
    active: number;
  } {
    const stats = {
      total: this.calls.size,
      byStatus: {} as Record<CallStatus, number>,
      byDirection: { inbound: 0, outbound: 0 },
      active: 0,
    };

    for (const call of this.calls.values()) {
      // Count by status
      stats.byStatus[call.status] = (stats.byStatus[call.status] || 0) + 1;
      
      // Count by direction
      stats.byDirection[call.direction]++;
      
      // Count active calls
      if (call.status === 'in-progress') {
        stats.active++;
      }
    }

    return stats;
  }

  /**
   * Export all call states (for debugging or persistence)
   */
  public exportAllCalls(): CallState[] {
    return Array.from(this.calls.values());
  }

  /**
   * Clear all call states (use with caution)
   */
  public clearAll(): void {
    const count = this.calls.size;
    this.calls.clear();
    log.warn('Cleared all call states', { count });
  }
}

// Export singleton instance
export const callStateService = CallStateService.getInstance(); 