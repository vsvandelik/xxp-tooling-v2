import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebSocketManager } from '../../src/services/WebSocketManager.js';
import { ExperimentService } from '../../src/services/ExperimentService.js';
import { ExperimentProgress, UserInputRequest, UserInputResponse } from '../../src/types/server.types.js';

// Define types inline
interface RunResult {
  runId: string;
  status: 'completed' | 'failed' | 'terminated';
  error?: Error;
  completedSpaces: string[];
  outputs: Record<string, Record<string, string>>;
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    skippedTasks: number;
  };
}

// Mock Socket.IO
const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
};

const mockIo = {
  on: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

// Mock ExperimentService
const mockExperimentService = {
  submitUserInput: jest.fn() as jest.MockedFunction<any>,
  getExperimentStatus: jest.fn() as jest.MockedFunction<any>,
  getExperimentHistory: jest.fn() as jest.MockedFunction<any>,
};

describe('WebSocketManager', () => {
  let webSocketManager: WebSocketManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create WebSocketManager instance
    webSocketManager = new WebSocketManager(
      mockIo as any,
      mockExperimentService as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided dependencies', () => {
      expect(webSocketManager).toBeInstanceOf(WebSocketManager);
    });
  });

  describe('initialize', () => {
    it('should set up connection event handler', () => {
      webSocketManager.initialize();

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle client connection', () => {
      webSocketManager.initialize();

      // Get the connection handler
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      expect(connectionHandler).toBeDefined();

      // Simulate client connection
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('should handle client disconnection', () => {
      webSocketManager.initialize();

      // Get the connection handler and call it
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);

      // Find and call the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1] as Function;
      expect(disconnectHandler).toBeDefined();

      disconnectHandler();
      // Should not throw
    });
  });

  describe('socket event handlers', () => {
    let connectionHandler: Function;

    beforeEach(() => {
      webSocketManager.initialize();
      connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);
    });

    it('should handle subscribe event', () => {
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      expect(subscribeHandler).toBeDefined();

      subscribeHandler('test-experiment-id');

      expect(mockSocket.join).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', { experimentId: 'test-experiment-id' });
    });

    it('should handle unsubscribe event', () => {
      // First subscribe
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      subscribeHandler('test-experiment-id');

      // Then unsubscribe
      const unsubscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'unsubscribe')?.[1] as Function;
      expect(unsubscribeHandler).toBeDefined();

      unsubscribeHandler('test-experiment-id');

      expect(mockSocket.leave).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed', { experimentId: 'test-experiment-id' });
    });

    it('should handle userInput event', () => {
      const userInputHandler = mockSocket.on.mock.calls.find(call => call[0] === 'userInput')?.[1] as Function;
      expect(userInputHandler).toBeDefined();

      mockExperimentService.submitUserInput.mockReturnValue(true);

      const response: UserInputResponse = {
        requestId: 'test-request-id',
        value: 'test-value',
      };

      userInputHandler(response);

      expect(mockExperimentService.submitUserInput).toHaveBeenCalledWith(response);
      expect(mockSocket.emit).toHaveBeenCalledWith('userInputAck', {
        requestId: 'test-request-id',
        success: true,
      });
    });

    it('should handle requestStatus event', async () => {
      const requestStatusHandler = mockSocket.on.mock.calls.find(call => call[0] === 'requestStatus')?.[1] as Function;
      expect(requestStatusHandler).toBeDefined();

      const mockStatus = { status: 'running' };
      mockExperimentService.getExperimentStatus.mockResolvedValue(mockStatus);

      await requestStatusHandler('test-experiment-id');

      expect(mockExperimentService.getExperimentStatus).toHaveBeenCalledWith('test-experiment-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('status', {
        experimentId: 'test-experiment-id',
        status: mockStatus,
      });
    });

    it('should handle requestHistory event', async () => {
      const requestHistoryHandler = mockSocket.on.mock.calls.find(call => call[0] === 'requestHistory')?.[1] as Function;
      expect(requestHistoryHandler).toBeDefined();

      const mockHistory = [{ taskId: 'task1', status: 'completed' }];
      mockExperimentService.getExperimentHistory.mockResolvedValue(mockHistory);

      const requestData = {
        experimentId: 'test-experiment-id',
        limit: 10,
        offset: 0,
        spaceId: 'space1',
        taskId: 'task1',
      };

      await requestHistoryHandler(requestData);

      expect(mockExperimentService.getExperimentHistory).toHaveBeenCalledWith(
        'test-experiment-id',
        {
          limit: 10,
          offset: 0,
          spaceId: 'space1',
          taskId: 'task1',
        }
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('history', {
        experimentId: 'test-experiment-id',
        tasks: mockHistory,
        total: mockHistory.length,
        hasMore: false,
      });
    });

    it('should handle requestHistory event with minimal data', async () => {
      const requestHistoryHandler = mockSocket.on.mock.calls.find(call => call[0] === 'requestHistory')?.[1] as Function;
      
      const mockHistory: any[] = [];
      mockExperimentService.getExperimentHistory.mockResolvedValue(mockHistory);

      const requestData = {
        experimentId: 'test-experiment-id',
      };

      await requestHistoryHandler(requestData);

      expect(mockExperimentService.getExperimentHistory).toHaveBeenCalledWith(
        'test-experiment-id',
        {}
      );
    });
  });

  describe('emit methods', () => {
    it('should emit progress', () => {
      const progress: ExperimentProgress = {
        experimentId: 'test-experiment-id',
        status: 'running',
        progress: {
          percentage: 0.5,
          completedSpaces: 1,
          totalSpaces: 2,
          completedTasks: 5,
          totalTasks: 10,
        },
        timestamp: Date.now(),
      };

      webSocketManager.emitProgress('test-experiment-id', progress);

      expect(mockIo.to).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockIo.emit).toHaveBeenCalledWith('progress', progress);
    });

    it('should emit user input request', () => {
      const request: UserInputRequest = {
        requestId: 'test-request-id',
        experimentId: 'test-experiment-id',
        prompt: 'Enter value:',
        timestamp: Date.now(),
      };

      webSocketManager.emitUserInputRequest('test-experiment-id', request);

      expect(mockIo.to).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockIo.emit).toHaveBeenCalledWith('inputRequired', request);
    });

    it('should emit experiment complete', () => {
      const result: RunResult = {
        runId: 'test-run-id',
        status: 'completed',
        completedSpaces: ['space1'],
        outputs: {},
        summary: {
          totalTasks: 10,
          completedTasks: 10,
          failedTasks: 0,
          skippedTasks: 0,
        },
      };

      // Set up some subscribers first
      webSocketManager.initialize();
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      subscribeHandler('test-experiment-id');

      webSocketManager.emitExperimentComplete('test-experiment-id', result);

      expect(mockIo.to).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockIo.emit).toHaveBeenCalledWith('complete', {
        experimentId: 'test-experiment-id',
        result,
      });
    });

    it('should emit experiment error', () => {
      const error = new Error('Test error');

      webSocketManager.emitExperimentError('test-experiment-id', error);

      expect(mockIo.to).toHaveBeenCalledWith('experiment:test-experiment-id');
      expect(mockIo.emit).toHaveBeenCalledWith('error', {
        experimentId: 'test-experiment-id',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
    });

    it('should emit validation result', () => {
      const validation = {
        errors: ['Error 1'],
        warnings: ['Warning 1'],
        isValid: false,
      };

      webSocketManager.emitValidationResult('test-socket-id', validation);

      expect(mockIo.to).toHaveBeenCalledWith('test-socket-id');
      expect(mockIo.emit).toHaveBeenCalledWith('validationResult', validation);
    });
  });

  describe('connection management', () => {
    it('should get connected clients count', () => {
      // Should return 0 initially
      expect(webSocketManager.getConnectedClients()).toBe(0);

      // Add a connection
      webSocketManager.initialize();
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);

      expect(webSocketManager.getConnectedClients()).toBe(1);
    });

    it('should get experiment subscribers count', () => {
      // Should return 0 initially
      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(0);

      // Add a subscriber
      webSocketManager.initialize();
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      subscribeHandler('test-experiment-id');

      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(1);
    });

    it('should clean up on client disconnect', () => {
      webSocketManager.initialize();
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);

      // Subscribe to an experiment
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      subscribeHandler('test-experiment-id');

      expect(webSocketManager.getConnectedClients()).toBe(1);
      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(1);

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1] as Function;
      disconnectHandler();

      expect(webSocketManager.getConnectedClients()).toBe(0);
      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(0);
    });

    it('should clean up subscriptions on experiment complete', () => {
      webSocketManager.initialize();
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')?.[1] as Function;
      connectionHandler(mockSocket);

      // Subscribe to an experiment
      const subscribeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe')?.[1] as Function;
      subscribeHandler('test-experiment-id');

      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(1);

      // Complete the experiment
      const result: RunResult = {
        runId: 'test-run-id',
        status: 'completed',
        completedSpaces: ['space1'],
        outputs: {},
        summary: {
          totalTasks: 10,
          completedTasks: 10,
          failedTasks: 0,
          skippedTasks: 0,
        },
      };

      webSocketManager.emitExperimentComplete('test-experiment-id', result);

      // Subscriptions should be cleaned up
      expect(webSocketManager.getExperimentSubscribers('test-experiment-id')).toBe(0);
    });
  });
});