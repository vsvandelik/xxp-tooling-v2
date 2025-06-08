import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExperimentService } from '../../src/services/ExperimentService.js';
import { ValidationResult, GenerateArtifactResponse, UserInputResponse } from '../../src/types/server.types.js';
import * as fs from 'fs';
import { spawn } from 'child_process';

// Define types inline to avoid import issues
interface RunStatus {
  runId: string;
  experimentName: string;
  experimentVersion: string;
  status: 'running' | 'completed' | 'failed' | 'terminated';
  currentSpace?: string;
  currentParameterSet?: number;
  progress: {
    completedSpaces: number;
    totalSpaces: number;
    completedParameterSets: number;
    totalParameterSets: number;
  };
}

// Mock the ExperimentExecutor and related types
const mockExperimentExecutor = {
  run: jest.fn() as jest.MockedFunction<any>,
  getStatus: jest.fn() as jest.MockedFunction<any>,
  terminate: jest.fn() as jest.MockedFunction<any>,
  getRepository: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@extremexp/experiment-runner', () => ({
  ExperimentExecutor: jest.fn().mockImplementation(() => mockExperimentExecutor),
}));

// Mock fs module 
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Get the mocked functions
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('ExperimentService', () => {
  let experimentService: ExperimentService;
  let mockRepository: any;
  const config = {
    databasePath: './test.db',
    maxConcurrent: 3,
  };

  const mockRunResult = {
    runId: 'test-run',
    status: 'completed' as const,
    completedSpaces: ['space1'],
    outputs: {},
    summary: {
      totalTasks: 1,
      completedTasks: 1,
      failedTasks: 0,
      skippedTasks: 0,
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      initialize: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
      getRun: jest.fn(),
      getTaskExecutionHistory: jest.fn(() => Promise.resolve([])),
      getDataMapping: jest.fn(),
    };

    // Setup executor mocks
    mockExperimentExecutor.getRepository.mockReturnValue(mockRepository);
    mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
    mockExperimentExecutor.getStatus.mockResolvedValue(null);
    mockExperimentExecutor.terminate.mockResolvedValue(true);

    experimentService = new ExperimentService(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with correct configuration', () => {
      expect(experimentService).toBeInstanceOf(ExperimentService);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await experimentService.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('ExperimentService initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('shutdown', () => {
    it('should shutdown without active experiments', async () => {
      await experimentService.shutdown();
      // Should complete without error
    });

    it('should terminate active experiments on shutdown', async () => {
      // Setup an active experiment first
      const artifactPath = '/path/to/artifact.json';
      const mockArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        spaces: [{ spaceId: 'space1', parameters: [{}] }],
        tasks: [],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact) as any);
      mockExperimentExecutor.getStatus.mockResolvedValue({
        runId: 'test-exp-id',
        experimentName: 'test-exp',
        experimentVersion: '1.0.0',
        status: 'running',
        progress: {
          completedSpaces: 0,
          totalSpaces: 1,
          completedParameterSets: 0,
          totalParameterSets: 1,
        },
      });

      // Make the executor.run never complete to keep experiment running
      mockExperimentExecutor.run.mockImplementation(() => new Promise(() => {}));

      // Start an experiment to create active state
      await experimentService.startExperiment(artifactPath);

      // Wait for experiment to be set up
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify we have an active experiment in running state
      const activeExperiments = experimentService.getActiveExperiments();
      expect(activeExperiments).toHaveLength(1);
      expect(activeExperiments[0]?.status.status).toBe('running');

      // Now shutdown should terminate the active experiment
      await experimentService.shutdown();

      // Verify termination was called
      expect(mockExperimentExecutor.terminate).toHaveBeenCalledWith('test-exp', '1.0.0');

      // Reset mock for other tests
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
    });
  });

  describe('validateArtifact', () => {
    it('should validate a correct artifact', async () => {
      const artifactPath = '/path/to/artifact.json';
      const validArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        tasks: [{ taskId: 'task1' }],
        spaces: [{ spaceId: 'space1' }],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(validArtifact));

      const result = await experimentService.validateArtifact(artifactPath);

      expect(result).toEqual({
        errors: [],
        warnings: [],
        isValid: true,
      });
    });

    it('should detect missing required fields', async () => {
      const artifactPath = '/path/to/artifact.json';
      const invalidArtifact = {
        // Missing experiment, version, tasks, spaces, control
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      const result = await experimentService.validateArtifact(artifactPath);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing experiment name');
      expect(result.errors).toContain('Missing experiment version');
      expect(result.errors).toContain('Missing or invalid tasks array');
      expect(result.errors).toContain('Missing or invalid spaces array');
      expect(result.errors).toContain('Missing control flow START');
    });

    it('should handle file read errors', async () => {
      const artifactPath = '/path/to/nonexistent.json';
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await experimentService.validateArtifact(artifactPath);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to load artifact: File not found');
    });

    it('should handle JSON parse errors', async () => {
      const artifactPath = '/path/to/invalid.json';
      mockReadFileSync.mockReturnValue('invalid json');

      const result = await experimentService.validateArtifact(artifactPath);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Failed to load artifact:/);
    });

    it('should generate warnings for empty arrays', async () => {
      const artifactPath = '/path/to/artifact.json';
      const artifactWithEmptyArrays = {
        experiment: 'test-exp',
        version: '1.0.0',
        tasks: [],
        spaces: [],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(artifactWithEmptyArrays));

      const result = await experimentService.validateArtifact(artifactPath);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No spaces defined in artifact');
      expect(result.warnings).toContain('No tasks defined in artifact');
    });
  });

  describe('startExperiment', () => {
    const artifactPath = '/path/to/artifact.json';
    const mockArtifact = {
      experiment: 'test-exp',
      version: '1.0.0',
      spaces: [{ spaceId: 'space1', parameters: [{}] }],
      tasks: [],
      control: { START: 'task1' },
    };

    beforeEach(() => {
      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact) as any);
      mockExperimentExecutor.getStatus.mockResolvedValue(null);
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
    });

    it('should start experiment successfully', async () => {
      const experimentId = await experimentService.startExperiment(artifactPath);

      expect(experimentId).toMatch(/^exp_/);
      
      // Wait for the async runExperiment to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockExperimentExecutor.run).toHaveBeenCalledWith(
        artifactPath,
        expect.objectContaining({
          resume: false,
          progressCallback: expect.any(Object),
          userInputProvider: expect.any(Object),
        })
      );
    });

    it('should accept custom experiment ID', async () => {
      const customId = 'custom-experiment-id';
      const experimentId = await experimentService.startExperiment(artifactPath, {
        experimentId: customId,
      });

      expect(experimentId).toBe(customId);
    });

    it('should respect maxConcurrent limit', async () => {
      // Make the executor.run never resolve to simulate running experiments
      mockExperimentExecutor.run.mockImplementation(() => new Promise(() => {}));
      
      // Start 3 experiments (up to the limit)
      const exp1 = await experimentService.startExperiment(artifactPath);
      const exp2 = await experimentService.startExperiment(artifactPath);  
      const exp3 = await experimentService.startExperiment(artifactPath);

      // Wait for experiments to start  
      await new Promise(resolve => setTimeout(resolve, 10));

      // Fourth should throw error
      await expect(experimentService.startExperiment(artifactPath)).rejects.toThrow(
        'Maximum concurrent experiments (3) reached'
      );

      // Reset the mock for other tests
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
    });

    it('should handle progress callbacks', async () => {
      const onProgress = jest.fn();
      
      await experimentService.startExperiment(artifactPath, { onProgress });

      // Wait for the async runExperiment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate progress callback
      const activeExperiments = experimentService.getActiveExperiments();
      expect(activeExperiments).toHaveLength(1);
    });

    it('should handle user input requests', async () => {
      const onInputRequired = jest.fn();
      
      await experimentService.startExperiment(artifactPath, { onInputRequired });

      // Wait for the async runExperiment to start 
      await new Promise(resolve => setTimeout(resolve, 10));

      // The user input provider should be set up correctly
      expect(mockExperimentExecutor.run).toHaveBeenCalledWith(
        artifactPath,
        expect.objectContaining({
          userInputProvider: expect.objectContaining({
            getInput: expect.any(Function),
          }),
        })
      );
    });

    it('should handle experiment completion callback', async () => {
      const onComplete = jest.fn();
      
      await experimentService.startExperiment(artifactPath, { onComplete });

      // Wait for the async runExperiment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockExperimentExecutor.run).toHaveBeenCalled();
    });

    it('should handle experiment error callback', async () => {
      const onError = jest.fn();
      mockExperimentExecutor.run.mockRejectedValue(new Error('Test error'));
      
      await experimentService.startExperiment(artifactPath, { onError });

      // Wait a bit for the async error handling
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe('terminateExperiment', () => {
    it('should return false for non-existent experiment', async () => {
      const result = await experimentService.terminateExperiment('non-existent');
      expect(result).toBe(false);
    });

    it('should terminate existing experiment', async () => {
      // Setup an experiment first
      const artifactPath = '/path/to/artifact.json';
      const mockArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        spaces: [{ spaceId: 'space1', parameters: [{}] }],
        tasks: [],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact));
      mockExperimentExecutor.getStatus.mockResolvedValue(null);
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
      mockExperimentExecutor.terminate.mockResolvedValue(true);

      const experimentId = await experimentService.startExperiment(artifactPath);
      
      // Wait for experiment to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await experimentService.terminateExperiment(experimentId);

      expect(result).toBe(true);
      expect(mockExperimentExecutor.terminate).toHaveBeenCalledWith('test-exp', '1.0.0');
    });
  });

  describe('getExperimentStatus', () => {
    it('should return null for non-existent experiment', async () => {
      const status = await experimentService.getExperimentStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should return status for existing experiment', async () => {
      // Setup an experiment first
      const artifactPath = '/path/to/artifact.json';
      const mockArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        spaces: [{ spaceId: 'space1', parameters: [{}] }],
        tasks: [],
        control: { START: 'task1' },
      };

      const mockStatus: RunStatus = {
        runId: 'test-run',
        experimentName: 'test-exp',
        experimentVersion: '1.0.0',
        status: 'running',
        progress: {
          completedSpaces: 0,
          totalSpaces: 1,
          completedParameterSets: 0,
          totalParameterSets: 1,
        },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact));
      mockExperimentExecutor.getStatus.mockResolvedValue(mockStatus);
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);

      const experimentId = await experimentService.startExperiment(artifactPath);
      
      // Wait for experiment to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status = await experimentService.getExperimentStatus(experimentId);

      expect(status).toEqual(mockStatus);
    });
  });

  describe('submitUserInput', () => {
    it('should return false for non-existent request', () => {
      const response: UserInputResponse = {
        requestId: 'non-existent',
        value: 'test-value',
      };

      const result = experimentService.submitUserInput(response);
      expect(result).toBe(false);
    });

    it('should handle valid user input submission', async () => {
      // This test is more complex as it requires setting up user input request
      // We'll test the basic functionality here
      const response: UserInputResponse = {
        requestId: 'test-request',
        value: 'test-value',
      };

      const result = experimentService.submitUserInput(response);
      expect(result).toBe(false); // No pending input set up
    });
  });

  describe('getActiveExperiments', () => {
    it('should return empty array when no experiments are active', () => {
      const experiments = experimentService.getActiveExperiments();
      expect(experiments).toEqual([]);
    });

    it('should return active experiments', async () => {
      // Setup an experiment
      const artifactPath = '/path/to/artifact.json';
      const mockArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        spaces: [{ spaceId: 'space1', parameters: [{}] }],
        tasks: [],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact) as any);
      mockExperimentExecutor.getStatus.mockResolvedValue(null);
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);

      await experimentService.startExperiment(artifactPath);
      
      // Wait for the async experiment setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const experiments = experimentService.getActiveExperiments();

      expect(experiments).toHaveLength(1);
      expect(experiments[0]).toMatchObject({
        experimentName: 'test-exp',
        experimentVersion: '1.0.0',
        artifactPath,
      });
    });
  });

  describe('getExperimentHistory', () => {
    it('should throw error for non-existent experiment', async () => {
      await expect(
        experimentService.getExperimentHistory('non-existent')
      ).rejects.toThrow('Experiment non-existent not found');
    });

    it('should return empty history when no run exists', async () => {
      // Setup an experiment first
      const artifactPath = '/path/to/artifact.json';
      const mockArtifact = {
        experiment: 'test-exp',
        version: '1.0.0',
        spaces: [{ spaceId: 'space1', parameters: [{}] }],
        tasks: [],
        control: { START: 'task1' },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockArtifact));
      mockExperimentExecutor.getStatus.mockResolvedValue(null);
      mockExperimentExecutor.run.mockResolvedValue(mockRunResult);
      mockRepository.getRun.mockResolvedValue(null);

      const experimentId = await experimentService.startExperiment(artifactPath);
      
      // Wait for experiment to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const history = await experimentService.getExperimentHistory(experimentId);

      expect(history).toEqual([]);
    });
  });

  describe('generateArtifact', () => {
    it('should generate artifact successfully', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const promise = experimentService.generateArtifact('/path/to/espace.espace');

      // Simulate successful process completion immediately
      const stdout = 'Artifact generated successfully: /path/to/artifact.json';
      
      // Trigger callbacks immediately  
      setTimeout(() => {
        // Simulate data events
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')?.[1] as Function;
        if (stdoutCallback) stdoutCallback(stdout);
        
        const stderrCallback = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1] as Function;
        if (stderrCallback) stderrCallback('');
        
        // Simulate close event
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1] as Function;
        if (closeCallback) closeCallback(0);
      }, 0);

      const result = await promise;

      expect(result).toEqual({
        success: true,
        validation: {
          errors: [],
          warnings: [],
          isValid: true,
        },
        artifactPath: '/path/to/artifact.json',
      });
    });

    it('should handle generation failure', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const promise = experimentService.generateArtifact('/path/to/espace.espace');

      // Simulate process failure immediately
      const stderr = 'Generation failed: Invalid ESPACE file';
      
      setTimeout(() => {
        // Simulate data events
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')?.[1] as Function;
        if (stdoutCallback) stdoutCallback('');
        
        const stderrCallback = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1] as Function;
        if (stderrCallback) stderrCallback(stderr);
        
        // Simulate close event with failure
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1] as Function;
        if (closeCallback) closeCallback(1);
      }, 0);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe(stderr);
    });

    it('should handle spawn errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const promise = experimentService.generateArtifact('/path/to/espace.espace');

      // Simulate spawn error immediately
      setTimeout(() => {
        const errorCallback = mockProcess.on.mock.calls.find(call => call[0] === 'error')?.[1] as Function;
        if (errorCallback) errorCallback(new Error('Command not found'));
      }, 0);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command not found');
    });
  });
});