import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { 
  validateTwilioSignature, 
  validateInboundCall, 
  validateOutboundCall,
  errorHandler 
} from '../validation';
import { serviceConfig } from '@/config';

// Mock dependencies
jest.mock('twilio');
jest.mock('@/config', () => ({
  serviceConfig: {
    server: { port: 8081 },
    twilio: {
      authToken: 'test_auth_token',
    },
  },
}));
jest.mock('@/utils/logger');

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
      query: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'POST',
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:8081'),
      originalUrl: '/api/test',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateTwilioSignature', () => {
    it('should skip validation in development', () => {
      process.env.NODE_ENV = 'development';

      validateTwilioSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should reject requests without signature header', () => {
      process.env.NODE_ENV = 'production';
      mockReq.headers = {};

      validateTwilioSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_SIGNATURE',
          statusCode: 401,
        })
      );
    });

    it('should validate signature successfully', () => {
      process.env.NODE_ENV = 'production';
      mockReq.headers = {
        'x-twilio-signature': 'valid_signature',
        'host': 'example.com',
      };

      // Mock successful validation
      (twilio.validateRequest as jest.Mock).mockReturnValue(true);

      validateTwilioSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(twilio.validateRequest).toHaveBeenCalledWith(
        'test_auth_token',
        'valid_signature',
        'http://example.com/api/test',
        mockReq.body
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid signature', () => {
      process.env.NODE_ENV = 'production';
      mockReq.headers = {
        'x-twilio-signature': 'invalid_signature',
        'host': 'example.com',
      };

      // Mock failed validation
      (twilio.validateRequest as jest.Mock).mockReturnValue(false);

      validateTwilioSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_SIGNATURE',
          statusCode: 401,
        })
      );
    });

    it('should handle validation errors', () => {
      process.env.NODE_ENV = 'production';
      mockReq.headers = {
        'x-twilio-signature': 'signature',
        'host': 'example.com',
      };

      // Mock validation error
      (twilio.validateRequest as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      validateTwilioSignature(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          statusCode: 500,
        })
      );
    });
  });

  describe('validateInboundCall', () => {
    it('should validate valid inbound call', () => {
      mockReq.body = {
        CallSid: 'CA123456',
        From: '+1234567890',
        To: '+0987654321',
      };

      validateInboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).callSid).toBe('CA123456');
    });

    it('should reject missing required fields', () => {
      mockReq.body = {
        CallSid: 'CA123456',
        From: '+1234567890',
        // Missing 'To' field
      };

      validateInboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_REQUEST',
          statusCode: 400,
        })
      );
    });

    it('should reject invalid phone numbers', () => {
      mockReq.body = {
        CallSid: 'CA123456',
        From: 'invalid_phone',
        To: '+0987654321',
      };

      validateInboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_PHONE_NUMBER',
          statusCode: 400,
        })
      );
    });

    it('should extract agentId from query params', () => {
      mockReq.body = {
        CallSid: 'CA123456',
        From: '+1234567890',
        To: '+0987654321',
      };
      mockReq.query = { agentId: 'agent_001' };

      validateInboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).agentId).toBe('agent_001');
    });
  });

  describe('validateOutboundCall', () => {
    it('should validate valid outbound call request', () => {
      mockReq.body = {
        to_number: '+1234567890',
        agent_id: 'agent_001',
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate with optional fields', () => {
      mockReq.body = {
        to_number: '+1234567890',
        agent_id: 'agent_001',
        campaign_id: 'campaign_001',
        custom_context: { test: 'data' },
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject missing required fields', () => {
      mockReq.body = {
        to_number: '+1234567890',
        // Missing agent_id
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_REQUEST',
          statusCode: 400,
        })
      );
    });

    it('should reject invalid phone number format', () => {
      mockReq.body = {
        to_number: '1234567890', // Missing + prefix
        agent_id: 'agent_001',
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_PHONE_NUMBER',
          statusCode: 400,
        })
      );
    });

    it('should reject invalid agent_id format', () => {
      mockReq.body = {
        to_number: '+1234567890',
        agent_id: 'agent@001', // Invalid character
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_AGENT_ID',
          statusCode: 400,
        })
      );
    });

    it('should reject invalid campaign_id format', () => {
      mockReq.body = {
        to_number: '+1234567890',
        agent_id: 'agent_001',
        campaign_id: 'campaign!001', // Invalid character
      };

      validateOutboundCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_CAMPAIGN_ID',
          statusCode: 400,
        })
      );
    });
  });

  describe('errorHandler', () => {
    it('should handle errors with status code', () => {
      const error: any = new Error('Test error');
      error.code = 'TEST_ERROR';
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: expect.any(String),
      });
    });

    it('should default to 500 for errors without status code', () => {
      const error: any = new Error('Internal error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal error',
        code: 'INTERNAL_ERROR',
        timestamp: expect.any(String),
      });
    });
  });
}); 