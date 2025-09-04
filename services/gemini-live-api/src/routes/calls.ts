import { Router, Request, Response } from 'express';
import { Twilio } from 'twilio';
import { twiml } from 'twilio';
import { serviceConfig } from '@/config';
import { 
  TwilioInboundRequest, 
  OutboundCallRequest, 
  TwilioEventWebhook,
  ApiResponse,
  AuthenticatedRequest,
  CallStatus 
} from '@/types';
import { log } from '@/utils/logger';
import { 
  validateTwilioSignature, 
  validateInboundCall, 
  validateOutboundCall 
} from '@/middleware/validation';
import { callStateService } from '@/services/callState';

const router = Router();

// Initialize Twilio client
const twilioClient = new Twilio(
  serviceConfig.twilio.accountSid,
  serviceConfig.twilio.authToken
);

/**
 * Handle inbound calls from Twilio
 * POST /api/inbound-call
 * 
 * This endpoint receives webhooks from Twilio when a call comes in.
 * It creates a TwiML response that instructs Twilio to stream the
 * call audio to our WebSocket endpoint.
 */
router.post('/inbound-call', 
  validateTwilioSignature,
  validateInboundCall,
  async (req: AuthenticatedRequest, res: Response) => {
    const callData = req.body as TwilioInboundRequest;
    
    // Extract agent ID from query params or use default
    const agentId = req.query.agentId as string || 'default';
    const campaignId = req.query.campaignId as string;

    try {
      // Create call state entry
      const callState = callStateService.createInboundCall({
        callSid: callData.CallSid,
        accountSid: callData.AccountSid,
        from: callData.From,
        to: callData.To,
        agentId,
      });

      // Update with campaign ID if provided
      if (campaignId) {
        callStateService.updateCall(callData.CallSid, { 
          metadata: { twilioCallbackUrl: req.originalUrl }
        });
      }

      log.logCallEvent('call_started', callData.CallSid, {
        from: callData.From,
        to: callData.To,
        direction: 'inbound',
        agentId,
        campaignId,
      });

      // Build WebSocket URL with proper parameters
      const protocol = req.secure ? 'wss' : 'ws';
      const host = req.get('host') || `localhost:${serviceConfig.server.port}`;
      const wsUrl = `${protocol}://${host}/voice-stream?callSid=${encodeURIComponent(callData.CallSid)}&agentId=${encodeURIComponent(agentId)}`;

      // Create TwiML response using Twilio's TwiML library for proper XML generation
      const response = new twiml.VoiceResponse();
      const connect = response.connect();
      const stream = connect.stream({
        url: wsUrl
      });
      
      // Add parameters with proper XML escaping
      stream.parameter({
        name: 'callSid',
        value: callData.CallSid
      });
      
      stream.parameter({
        name: 'agent',
        value: agentId
      });
      
      if (campaignId) {
        stream.parameter({
          name: 'campaign',
          value: campaignId
        });
      }

      res.set('Content-Type', 'text/xml');
      res.send(response.toString());

      log.info('Inbound call connected to stream', {
        callSid: callData.CallSid,
        from: callData.From,
        to: callData.To,
        agentId,
        wsUrl,
      });

    } catch (error) {
      log.error('Failed to handle inbound call', error as Error, {
        callSid: callData.CallSid,
      });

      // Update call state with error
      callStateService.updateCall(callData.CallSid, {
        status: 'failed',
        errorMessage: (error as Error).message,
      });

      // Return TwiML error response using proper TwiML library
      const errorResponse = new twiml.VoiceResponse();
      errorResponse.say({
        voice: 'alice'
      }, "I'm sorry, there was an error connecting your call. Please try again later.");
      errorResponse.hangup();

      res.set('Content-Type', 'text/xml');
      res.status(500).send(errorResponse.toString());
    }
  }
);

/**
 * Initiate outbound calls
 * POST /api/outbound-call
 * 
 * This endpoint allows the frontend or other services to initiate
 * outbound calls through Twilio.
 */
router.post('/outbound-call',
  validateOutboundCall,
  async (req: Request, res: Response<ApiResponse<{ callSid: string; status: string }>>) => {
    const callRequest = req.body as OutboundCallRequest;

    try {
      log.info('Initiating outbound call', {
        to: callRequest.to_number,
        agentId: callRequest.agent_id,
        campaignId: callRequest.campaign_id,
      });

      // Build the URL for Twilio to call back to, including context
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host') || `localhost:${serviceConfig.server.port}`;
      const callbackUrl = new URL(`${protocol}://${host}/api/inbound-call`);
      
      // Add context as query parameters
      callbackUrl.searchParams.append('agentId', callRequest.agent_id);
      if (callRequest.campaign_id) {
        callbackUrl.searchParams.append('campaignId', callRequest.campaign_id);
      }

      // Create the call using Twilio
      const call = await twilioClient.calls.create({
        from: serviceConfig.twilio.phoneNumber,
        to: callRequest.to_number,
        url: callbackUrl.toString(),
        method: 'POST',
        statusCallback: `${protocol}://${host}/api/twilio-events`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        timeout: 60, // 60 second timeout for call to be answered
        record: false, // Set to true if you want to record calls
      });

      // Create call state entry
      const callState = callStateService.createOutboundCall({
        callSid: call.sid,
        accountSid: call.accountSid,
        request: callRequest,
        fromNumber: serviceConfig.twilio.phoneNumber,
      });

      log.logCallEvent('call_started', call.sid, {
        to: callRequest.to_number,
        agentId: callRequest.agent_id,
        campaignId: callRequest.campaign_id,
        direction: 'outbound',
      });

      const response: ApiResponse<{ callSid: string; status: string }> = {
        success: true,
        data: { 
          callSid: call.sid,
          status: callState.status,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);

    } catch (error) {
      log.error('Failed to initiate outbound call', error as Error, {
        to: callRequest.to_number,
        agentId: callRequest.agent_id,
      });

      const response: ApiResponse<never> = {
        success: false,
        error: 'Failed to initiate call: ' + (error as Error).message,
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * Handle Twilio status events
 * POST /api/twilio-events
 * 
 * This endpoint receives status updates from Twilio about call progress.
 * It updates our internal call state tracking accordingly.
 */
router.post('/twilio-events',
  validateTwilioSignature,
  async (req: Request, res: Response) => {
    const eventData = req.body as TwilioEventWebhook;

    log.info('Received Twilio event', {
      callSid: eventData.CallSid,
      status: eventData.CallStatus,
      from: eventData.From,
      to: eventData.To,
      duration: eventData.CallDuration,
    });

    try {
      // Map Twilio status to our CallStatus type
      const status = eventData.CallStatus as CallStatus;
      
      // Update call state based on the event
      const updateData: any = {
        status,
      };

      // Add duration if call has ended
      if (eventData.CallDuration) {
        updateData.duration = parseInt(eventData.CallDuration, 10);
      }

      // Mark end time for terminal statuses
      if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
        updateData.endTime = new Date();
      }

      // Update the call state
      const updatedCall = callStateService.updateCall(eventData.CallSid, updateData);

      if (!updatedCall) {
        log.warn('Received event for unknown call', {
          callSid: eventData.CallSid,
          status: eventData.CallStatus,
        });
      }

      // Handle different call statuses
      switch (eventData.CallStatus) {
        case 'initiated':
          log.logCallEvent('call_started', eventData.CallSid, {
            status: 'initiated',
          });
          break;

        case 'ringing':
          log.info('Call is ringing', {
            callSid: eventData.CallSid,
          });
          break;

        case 'in-progress':
          log.info('Call answered', {
            callSid: eventData.CallSid,
          });
          break;

        case 'completed':
        case 'failed':
        case 'busy':
        case 'no-answer':
        case 'canceled':
          log.logCallEvent('call_ended', eventData.CallSid, {
            status: eventData.CallStatus,
            duration: eventData.CallDuration,
          });
          break;

        default:
          log.debug('Unknown call status received', {
            callSid: eventData.CallSid,
            status: eventData.CallStatus,
          });
      }

      // TODO: Trigger any necessary post-call processing
      // e.g., save call recording, update analytics, etc.

      res.status(200).send('OK');

    } catch (error) {
      log.error('Failed to process Twilio event', error as Error, {
        callSid: eventData.CallSid,
        status: eventData.CallStatus,
      });

      res.status(500).send('Error processing event');
    }
  }
);

/**
 * Get call state
 * GET /api/calls/:callSid
 * 
 * This endpoint allows querying the current state of a call.
 */
router.get('/calls/:callSid', async (req: Request, res: Response<ApiResponse<any>>): Promise<any> => {
  const { callSid } = req.params;
  
  if (!callSid) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Call SID is required',
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  try {
    const callState = callStateService.getCall(callSid);

    if (!callState) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Call not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: callState,
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    log.error('Failed to get call state', error as Error, { 
      ...(callSid && { callSid }) 
    });

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to get call state',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
});

/**
 * Get call statistics
 * GET /api/calls/stats
 * 
 * This endpoint provides statistics about current calls.
 */
router.get('/calls/stats', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const stats = callStateService.getStatistics();

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    log.error('Failed to get call statistics', error as Error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to get call statistics',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
});

export { router as callsRouter }; 