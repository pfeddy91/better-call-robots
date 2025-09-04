import { CallStateService } from '../callState';
import { CallStatus, OutboundCallRequest } from '@/types';

describe('CallStateService', () => {
  let service: CallStateService;

  beforeEach(() => {
    // Get a fresh instance and clear any existing state
    service = CallStateService.getInstance();
    service.clearAll();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CallStateService.getInstance();
      const instance2 = CallStateService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Inbound Call Management', () => {
    it('should create an inbound call state', () => {
      const params = {
        callSid: 'CA123456',
        accountSid: 'AC123456',
        from: '+1234567890',
        to: '+0987654321',
        agentId: 'agent_001',
      };

      const callState = service.createInboundCall(params);

      expect(callState).toMatchObject({
        callSid: params.callSid,
        accountSid: params.accountSid,
        from: params.from,
        to: params.to,
        direction: 'inbound',
        status: 'initiated',
        agentId: params.agentId,
      });
      expect(callState.startTime).toBeInstanceOf(Date);
      expect(callState.metadata.lastUpdated).toBeInstanceOf(Date);
    });

    it('should retrieve created inbound call', () => {
      const params = {
        callSid: 'CA123456',
        accountSid: 'AC123456',
        from: '+1234567890',
        to: '+0987654321',
        agentId: 'agent_001',
      };

      service.createInboundCall(params);
      const retrieved = service.getCall(params.callSid);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.callSid).toBe(params.callSid);
    });
  });

  describe('Outbound Call Management', () => {
    it('should create an outbound call state with all fields', () => {
      const request: OutboundCallRequest = {
        to_number: '+1234567890',
        agent_id: 'agent_001',
        campaign_id: 'campaign_001',
        custom_context: { customer_name: 'John Doe' },
      };

      const params = {
        callSid: 'CA123456',
        accountSid: 'AC123456',
        request,
        fromNumber: '+0987654321',
      };

      const callState = service.createOutboundCall(params);

      expect(callState).toMatchObject({
        callSid: params.callSid,
        accountSid: params.accountSid,
        from: params.fromNumber,
        to: request.to_number,
        direction: 'outbound',
        status: 'queued',
        agentId: request.agent_id,
        campaignId: request.campaign_id,
        customContext: request.custom_context,
      });
    });

    it('should create an outbound call state without optional fields', () => {
      const request: OutboundCallRequest = {
        to_number: '+1234567890',
        agent_id: 'agent_001',
      };

      const params = {
        callSid: 'CA123456',
        accountSid: 'AC123456',
        request,
        fromNumber: '+0987654321',
      };

      const callState = service.createOutboundCall(params);

      expect(callState.campaignId).toBeUndefined();
      expect(callState.customContext).toBeUndefined();
    });
  });

  describe('Call State Updates', () => {
    beforeEach(() => {
      const params = {
        callSid: 'CA123456',
        accountSid: 'AC123456',
        from: '+1234567890',
        to: '+0987654321',
        agentId: 'agent_001',
      };
      service.createInboundCall(params);
    });

    it('should update call status', () => {
      const updated = service.updateCall('CA123456', {
        status: 'in-progress',
      });

      expect(updated?.status).toBe('in-progress');
    });

    it('should update multiple fields', () => {
      const endTime = new Date();
      const updated = service.updateCall('CA123456', {
        status: 'completed',
        endTime,
        duration: 120,
        streamSid: 'MZ123456',
      });

      expect(updated).toMatchObject({
        status: 'completed',
        endTime,
        duration: 120,
        streamSid: 'MZ123456',
      });
    });

    it('should update metadata correctly', () => {
      const updated = service.updateCall('CA123456', {
        metadata: {
          wsConnectionId: 'ws_123',
          twilioCallbackUrl: 'https://example.com/callback',
        },
      });

      expect(updated?.metadata.wsConnectionId).toBe('ws_123');
      expect(updated?.metadata.twilioCallbackUrl).toBe('https://example.com/callback');
      expect(updated?.metadata.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return null for non-existent call', () => {
      const updated = service.updateCall('NONEXISTENT', {
        status: 'completed',
      });

      expect(updated).toBeNull();
    });
  });

  describe('Call Filtering and Queries', () => {
    beforeEach(() => {
      // Create multiple calls for testing
      service.createInboundCall({
        callSid: 'CA1',
        accountSid: 'AC1',
        from: '+1111111111',
        to: '+2222222222',
        agentId: 'agent_001',
      });

      service.createOutboundCall({
        callSid: 'CA2',
        accountSid: 'AC1',
        request: {
          to_number: '+3333333333',
          agent_id: 'agent_002',
          campaign_id: 'campaign_001',
        },
        fromNumber: '+4444444444',
      });

      service.createInboundCall({
        callSid: 'CA3',
        accountSid: 'AC1',
        from: '+5555555555',
        to: '+6666666666',
        agentId: 'agent_001',
      });

      // Update one to in-progress
      service.updateCall('CA1', { status: 'in-progress' });
    });

    it('should get all calls', () => {
      const calls = service.getCalls();
      expect(calls).toHaveLength(3);
    });

    it('should filter by status', () => {
      const calls = service.getCalls({ status: 'in-progress' });
      expect(calls).toHaveLength(1);
      expect(calls[0].callSid).toBe('CA1');
    });

    it('should filter by direction', () => {
      const inboundCalls = service.getCalls({ direction: 'inbound' });
      expect(inboundCalls).toHaveLength(2);

      const outboundCalls = service.getCalls({ direction: 'outbound' });
      expect(outboundCalls).toHaveLength(1);
    });

    it('should filter by agentId', () => {
      const calls = service.getCalls({ agentId: 'agent_001' });
      expect(calls).toHaveLength(2);
    });

    it('should filter by campaignId', () => {
      const calls = service.getCalls({ campaignId: 'campaign_001' });
      expect(calls).toHaveLength(1);
      expect(calls[0].callSid).toBe('CA2');
    });

    it('should get active calls', () => {
      const activeCalls = service.getActiveCalls();
      expect(activeCalls).toHaveLength(1);
      expect(activeCalls[0].callSid).toBe('CA1');
    });
  });

  describe('Call Cleanup', () => {
    it('should remove old completed calls', () => {
      const oldEndTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Create an old completed call
      service.createInboundCall({
        callSid: 'CA_OLD',
        accountSid: 'AC1',
        from: '+1111111111',
        to: '+2222222222',
        agentId: 'agent_001',
      });

      service.updateCall('CA_OLD', {
        status: 'completed',
        endTime: oldEndTime,
      });

      // Create a recent completed call
      service.createInboundCall({
        callSid: 'CA_RECENT',
        accountSid: 'AC1',
        from: '+3333333333',
        to: '+4444444444',
        agentId: 'agent_001',
      });

      service.updateCall('CA_RECENT', {
        status: 'completed',
        endTime: new Date(),
      });

      // Clean up calls older than 60 minutes
      const cleaned = service.cleanupOldCalls(60);

      expect(cleaned).toBe(1);
      expect(service.getCall('CA_OLD')).toBeNull();
      expect(service.getCall('CA_RECENT')).toBeTruthy();
    });

    it('should not remove active calls during cleanup', () => {
      const oldStartTime = new Date(Date.now() - 2 * 60 * 60 * 1000);

      service.createInboundCall({
        callSid: 'CA_ACTIVE',
        accountSid: 'AC1',
        from: '+1111111111',
        to: '+2222222222',
        agentId: 'agent_001',
      });

      // Manually set old start time
      const call = service.getCall('CA_ACTIVE');
      if (call) {
        call.startTime = oldStartTime;
      }

      service.updateCall('CA_ACTIVE', { status: 'in-progress' });

      const cleaned = service.cleanupOldCalls(60);

      expect(cleaned).toBe(0);
      expect(service.getCall('CA_ACTIVE')).toBeTruthy();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Create calls with various statuses
      const calls = [
        { sid: 'CA1', status: 'in-progress' as CallStatus, direction: 'inbound' },
        { sid: 'CA2', status: 'in-progress' as CallStatus, direction: 'outbound' },
        { sid: 'CA3', status: 'completed' as CallStatus, direction: 'inbound' },
        { sid: 'CA4', status: 'failed' as CallStatus, direction: 'inbound' },
        { sid: 'CA5', status: 'queued' as CallStatus, direction: 'outbound' },
      ];

      calls.forEach((call, index) => {
        if (call.direction === 'inbound') {
          service.createInboundCall({
            callSid: call.sid,
            accountSid: 'AC1',
            from: `+111111111${index}`,
            to: `+222222222${index}`,
            agentId: 'agent_001',
          });
        } else {
          service.createOutboundCall({
            callSid: call.sid,
            accountSid: 'AC1',
            request: {
              to_number: `+333333333${index}`,
              agent_id: 'agent_001',
            },
            fromNumber: '+4444444444',
          });
        }
        service.updateCall(call.sid, { status: call.status });
      });
    });

    it('should return correct statistics', () => {
      const stats = service.getStatistics();

      expect(stats.total).toBe(5);
      expect(stats.active).toBe(2);
      expect(stats.byStatus['in-progress']).toBe(2);
      expect(stats.byStatus['completed']).toBe(1);
      expect(stats.byStatus['failed']).toBe(1);
      expect(stats.byStatus['queued']).toBe(1);
      expect(stats.byDirection.inbound).toBe(3);
      expect(stats.byDirection.outbound).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle removal of non-existent call', () => {
      const removed = service.removeCall('NONEXISTENT');
      expect(removed).toBe(false);
    });

    it('should export all calls', () => {
      service.createInboundCall({
        callSid: 'CA1',
        accountSid: 'AC1',
        from: '+1111111111',
        to: '+2222222222',
        agentId: 'agent_001',
      });

      service.createInboundCall({
        callSid: 'CA2',
        accountSid: 'AC1',
        from: '+3333333333',
        to: '+4444444444',
        agentId: 'agent_002',
      });

      const exported = service.exportAllCalls();
      expect(exported).toHaveLength(2);
      expect(exported.map(c => c.callSid).sort()).toEqual(['CA1', 'CA2']);
    });
  });
}); 