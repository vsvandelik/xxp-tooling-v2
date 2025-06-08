import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createExperimentRoutes } from '../../src/routes/experimentRoutes.js';
import { ExperimentService } from '../../src/services/ExperimentService.js';
import { WebSocketManager } from '../../src/services/WebSocketManager.js';
import express from 'express';
import request from 'supertest';
import { ValidationResult, GenerateArtifactResponse } from '../../src/types/server.types.js';

// Mock ExperimentService
const mockExperimentService = {
  validateArtifact: jest.fn() as jest.MockedFunction<any>,
  startExperiment: jest.fn() as jest.MockedFunction<any>,
  getExperimentStatus: jest.fn() as jest.MockedFunction<any>,
  terminateExperiment: jest.fn() as jest.MockedFunction<any>,
  getExperimentHistory: jest.fn() as jest.MockedFunction<any>,
  getActiveExperiments: jest.fn() as jest.MockedFunction<any>,
  generateArtifact: jest.fn() as jest.MockedFunction<any>,
  submitUserInput: jest.fn() as jest.MockedFunction<any>,
};

// Mock WebSocketManager
const mockWebSocketManager = {
  emitProgress: jest.fn(),
  emitUserInputRequest: jest.fn(),
  emitExperimentComplete: jest.fn(),
  emitExperimentError: jest.fn(),
};

describe('experimentRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/experiments', createExperimentRoutes(
      mockExperimentService as any,
      mockWebSocketManager as any
    ));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/experiments/run', () => {
    it('should start experiment successfully', async () => {
      const mockValidation: ValidationResult = {
        errors: [],
        warnings: [],
        isValid: true,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);
      mockExperimentService.startExperiment.mockResolvedValue('test-experiment-id');

      const response = await request(app)
        .post('/api/experiments/run')
        .send({
          artifactPath: '/path/to/artifact.json',
          experimentId: 'test-experiment-id',
          resume: false,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        experimentId: 'test-experiment-id',
        status: 'started',
      });

      expect(mockExperimentService.validateArtifact).toHaveBeenCalledWith('/path/to/artifact.json');
      expect(mockExperimentService.startExperiment).toHaveBeenCalledWith(
        '/path/to/artifact.json',
        expect.objectContaining({
          experimentId: 'test-experiment-id',
          resume: false,
          onProgress: expect.any(Function),
          onInputRequired: expect.any(Function),
          onComplete: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should return 400 when artifactPath is missing', async () => {
      const response = await request(app)
        .post('/api/experiments/run')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required field: artifactPath',
      });
    });

    it('should return 400 when artifact validation fails', async () => {
      const mockValidation: ValidationResult = {
        errors: ['Invalid format'],
        warnings: [],
        isValid: false,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/experiments/run')
        .send({
          artifactPath: '/path/to/invalid.json',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid artifact',
        validation: mockValidation,
      });
    });

    it('should handle startExperiment errors', async () => {
      const mockValidation: ValidationResult = {
        errors: [],
        warnings: [],
        isValid: true,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);
      mockExperimentService.startExperiment.mockRejectedValue(new Error('Start failed'));

      const response = await request(app)
        .post('/api/experiments/run')
        .send({
          artifactPath: '/path/to/artifact.json',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to start experiment',
        message: 'Start failed',
      });
    });

    it('should use resume flag when provided', async () => {
      const mockValidation: ValidationResult = {
        errors: [],
        warnings: [],
        isValid: true,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);
      mockExperimentService.startExperiment.mockResolvedValue('test-experiment-id');

      const response = await request(app)
        .post('/api/experiments/run')
        .send({
          artifactPath: '/path/to/artifact.json',
          resume: true,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        experimentId: 'test-experiment-id',
        status: 'resumed',
      });
    });
  });

  describe('GET /api/experiments/:experimentId/status', () => {
    it('should return experiment status', async () => {
      const mockStatus = {
        runId: 'test-run',
        status: 'running',
        progress: { percentage: 0.5 },
      };

      mockExperimentService.getExperimentStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/experiments/test-experiment-id/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mockExperimentService.getExperimentStatus).toHaveBeenCalledWith('test-experiment-id');
    });

    it('should return 404 when experiment not found', async () => {
      mockExperimentService.getExperimentStatus.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/experiments/non-existent/status');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Experiment not found',
      });
    });

    it('should handle service errors', async () => {
      mockExperimentService.getExperimentStatus.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/experiments/test-experiment-id/status');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get experiment status',
        message: 'Service error',
      });
    });
  });

  describe('POST /api/experiments/:experimentId/terminate', () => {
    it('should terminate experiment successfully', async () => {
      mockExperimentService.terminateExperiment.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/experiments/test-experiment-id/terminate');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockExperimentService.terminateExperiment).toHaveBeenCalledWith('test-experiment-id');
    });

    it('should return 404 when experiment not found', async () => {
      mockExperimentService.terminateExperiment.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/experiments/non-existent/terminate');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Experiment not found or not running',
      });
    });

    it('should handle service errors', async () => {
      mockExperimentService.terminateExperiment.mockRejectedValue(new Error('Terminate failed'));

      const response = await request(app)
        .post('/api/experiments/test-experiment-id/terminate');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to terminate experiment',
        message: 'Terminate failed',
      });
    });
  });

  describe('POST /api/experiments/:experimentId/input', () => {
    it('should submit user input successfully', async () => {
      mockExperimentService.submitUserInput.mockReturnValue(true);

      const response = await request(app)
        .post('/api/experiments/test-experiment-id/input')
        .send({
          requestId: 'test-request-id',
          value: 'test-value',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockExperimentService.submitUserInput).toHaveBeenCalledWith({
        requestId: 'test-request-id',
        value: 'test-value',
      });
    });

    it('should return 400 when requestId is missing', async () => {
      const response = await request(app)
        .post('/api/experiments/test-experiment-id/input')
        .send({
          value: 'test-value',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required fields: requestId, value',
      });
    });

    it('should return 400 when value is missing', async () => {
      const response = await request(app)
        .post('/api/experiments/test-experiment-id/input')
        .send({
          requestId: 'test-request-id',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required fields: requestId, value',
      });
    });

    it('should return 404 when input request not found', async () => {
      mockExperimentService.submitUserInput.mockReturnValue(false);

      const response = await request(app)
        .post('/api/experiments/test-experiment-id/input')
        .send({
          requestId: 'non-existent-request',
          value: 'test-value',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Input request not found or expired',
      });
    });

    it('should handle service errors', async () => {
      mockExperimentService.submitUserInput.mockImplementation(() => {
        throw new Error('Submit failed');
      });

      const response = await request(app)
        .post('/api/experiments/test-experiment-id/input')
        .send({
          requestId: 'test-request-id',
          value: 'test-value',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to submit user input',
        message: 'Submit failed',
      });
    });
  });

  describe('GET /api/experiments/:experimentId/history', () => {
    it('should return experiment history', async () => {
      const mockHistory = [
        { taskId: 'task1', status: 'completed' },
        { taskId: 'task2', status: 'running' },
      ];

      mockExperimentService.getExperimentHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/experiments/test-experiment-id/history')
        .query({
          limit: '10',
          offset: '0',
          spaceId: 'space1',
          taskId: 'task1',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        experimentId: 'test-experiment-id',
        tasks: mockHistory,
        total: mockHistory.length,
        hasMore: false,
      });

      expect(mockExperimentService.getExperimentHistory).toHaveBeenCalledWith(
        'test-experiment-id',
        {
          limit: 10,
          offset: 0,
          spaceId: 'space1',
          taskId: 'task1',
        }
      );
    });

    it('should handle query parameters gracefully', async () => {
      const mockHistory: any[] = [];
      mockExperimentService.getExperimentHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/experiments/test-experiment-id/history');

      expect(response.status).toBe(200);
      expect(mockExperimentService.getExperimentHistory).toHaveBeenCalledWith(
        'test-experiment-id',
        {}
      );
    });

    it('should handle service errors', async () => {
      mockExperimentService.getExperimentHistory.mockRejectedValue(new Error('History failed'));

      const response = await request(app)
        .get('/api/experiments/test-experiment-id/history');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get experiment history',
        message: 'History failed',
      });
    });
  });

  describe('GET /api/experiments/active', () => {
    it('should return active experiments', async () => {
      const mockExperiments = [
        { id: 'exp1', status: 'running' },
        { id: 'exp2', status: 'completed' },
      ];

      mockExperimentService.getActiveExperiments.mockReturnValue(mockExperiments);

      const response = await request(app)
        .get('/api/experiments/active');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ experiments: mockExperiments });
      expect(mockExperimentService.getActiveExperiments).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockExperimentService.getActiveExperiments.mockImplementation(() => {
        throw new Error('Active failed');
      });

      const response = await request(app)
        .get('/api/experiments/active');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get active experiments',
        message: 'Active failed',
      });
    });
  });

  describe('POST /api/experiments/generate-artifact', () => {
    it('should generate artifact successfully', async () => {
      const mockResponse: GenerateArtifactResponse = {
        success: true,
        validation: {
          errors: [],
          warnings: [],
          isValid: true,
        },
        artifactPath: '/path/to/output.json',
      };

      mockExperimentService.generateArtifact.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/experiments/generate-artifact')
        .send({
          espacePath: '/path/to/espace.espace',
          outputPath: '/path/to/output.json',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockExperimentService.generateArtifact).toHaveBeenCalledWith(
        '/path/to/espace.espace',
        '/path/to/output.json'
      );
    });

    it('should return 400 when espacePath is missing', async () => {
      const response = await request(app)
        .post('/api/experiments/generate-artifact')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required field: espacePath',
      });
    });

    it('should handle validateOnly flag', async () => {
      const mockValidation: ValidationResult = {
        errors: [],
        warnings: ['Warning message'],
        isValid: true,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/experiments/generate-artifact')
        .send({
          espacePath: '/path/to/espace.espace',
          validateOnly: true,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        validation: mockValidation,
      });
      expect(mockExperimentService.validateArtifact).toHaveBeenCalledWith('/path/to/espace.espace');
    });

    it('should handle service errors', async () => {
      mockExperimentService.generateArtifact.mockRejectedValue(new Error('Generate failed'));

      const response = await request(app)
        .post('/api/experiments/generate-artifact')
        .send({
          espacePath: '/path/to/espace.espace',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate artifact',
        message: 'Generate failed',
      });
    });
  });

  describe('POST /api/experiments/validate-artifact', () => {
    it('should validate artifact successfully', async () => {
      const mockValidation: ValidationResult = {
        errors: [],
        warnings: ['Warning message'],
        isValid: true,
      };

      mockExperimentService.validateArtifact.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/experiments/validate-artifact')
        .send({
          artifactPath: '/path/to/artifact.json',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockValidation);
      expect(mockExperimentService.validateArtifact).toHaveBeenCalledWith('/path/to/artifact.json');
    });

    it('should return 400 when artifactPath is missing', async () => {
      const response = await request(app)
        .post('/api/experiments/validate-artifact')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required field: artifactPath',
      });
    });

    it('should handle service errors', async () => {
      mockExperimentService.validateArtifact.mockRejectedValue(new Error('Validate failed'));

      const response = await request(app)
        .post('/api/experiments/validate-artifact')
        .send({
          artifactPath: '/path/to/artifact.json',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to validate artifact',
        message: 'Validate failed',
      });
    });
  });
});