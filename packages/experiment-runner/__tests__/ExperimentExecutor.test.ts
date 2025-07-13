import { ExperimentExecutor } from '../src/executors/ExperimentExecutor.js';
import { RunResult, RunStatus } from '../src/types/run.types.js';
import { ExperimentRunnerOptions } from '../src/types/runner.types.js';
import { Artifact } from '../src/types/artifact.types.js';
import fs from 'fs';

// Mock fs
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock dependencies
jest.mock('../src/database/SqliteRepository.js', () => ({
  SqliteRepository: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    close: jest.fn(),
    createRun: jest.fn(),
    updateRunStatus: jest.fn(),
    getRun: jest.fn(),
    getRunById: jest.fn(),
    deleteRun: jest.fn(),
    getSpaceStats: jest.fn(),
    getParamSetStats: jest.fn(),
    getTaskStats: jest.fn(),
  })),
}));

jest.mock('../src/progress/ProgressEmitter.js', () => ({
  ProgressEmitter: jest.fn().mockImplementation(() => ({
    emitProgress: jest.fn(),
    emitSpaceStart: jest.fn(),
    emitSpaceComplete: jest.fn(),
    emitParameterSetStart: jest.fn(),
    emitParameterSetComplete: jest.fn(),
    emitTaskStart: jest.fn(),
    emitTaskComplete: jest.fn(),
    emitError: jest.fn(),
  })),
}));

jest.mock('../src/executors/TaskExecutor.js', () => ({
  TaskExecutor: jest.fn().mockImplementation(() => ({
    setArtifact: jest.fn(),
    execute: jest.fn(),
  })),
}));

jest.mock('../src/executors/SpaceExecutor.js', () => ({
  SpaceExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
}));

jest.mock('../src/managers/ControlFlowManager.js', () => ({
  ControlFlowManager: jest.fn().mockImplementation(() => ({
    getState: jest.fn().mockResolvedValue(null), // Don't override currentSpace
    getNextSpace: jest.fn().mockResolvedValue('END'), // End the loop
    saveState: jest.fn(),
  })),
}));

jest.mock('../src/managers/DataManager.js', () => ({
  DataManager: jest.fn().mockImplementation(() => ({
    collectFinalOutputs: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../src/userInput/ConsoleInputProvider.js', () => ({
  ConsoleInputProvider: jest.fn().mockImplementation(() => ({})),
}));

describe('ExperimentExecutor', () => {
  let experimentExecutor: ExperimentExecutor;
  let mockRepository: any;

  const mockArtifact: Artifact = {
    experiment: 'test-experiment',
    version: '1.0.0',
    tasks: [[{
      taskId: 'task1',
      workflow: 'test-workflow',
      implementation: 'test_script.py',
      dynamicParameters: [],
      staticParameters: { param1: 'value1' },
      inputData: [],
      outputData: []
    }]],
    spaces: [
      {
        spaceId: 'space1',
        tasksOrder: ['task1'],
        parameters: [{ param1: 'value1' }],
      }
    ],
    control: {
      START: 'space1',
      transitions: [
        {
          from: 'space1',
          to: 'END',
          condition: 'true'
        }
      ]
    }
  };

  beforeEach(() => {
    mockRepository = {
      initialize: jest.fn(),
      close: jest.fn(),
      createRun: jest.fn(),
      updateRunStatus: jest.fn(),
      getRun: jest.fn(),
      getRunById: jest.fn(),
      deleteRun: jest.fn(),
      getSpaceStats: jest.fn(),
      getParamSetStats: jest.fn(),
      getTaskStats: jest.fn(),
    };

    experimentExecutor = new ExperimentExecutor(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided DatabaseRepository', () => {
      const executor = new ExperimentExecutor(mockRepository);
      expect(executor.getRepository()).toBe(mockRepository);
    });

    it('should create instance with SqliteRepository when path string provided', () => {
      const executor = new ExperimentExecutor('./test.db');
      expect(executor.getRepository()).toBeDefined();
    });

    it('should create instance with default SqliteRepository when no parameter provided', () => {
      const executor = new ExperimentExecutor();
      expect(executor.getRepository()).toBeDefined();
    });
  });

  describe('getRepository', () => {
    it('should return the repository instance', () => {
      const result = experimentExecutor.getRepository();
      expect(result).toBe(mockRepository);
    });
  });

  describe('run', () => {
    beforeEach(() => {
      // Mock fs.readFileSync to return valid artifact JSON
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockArtifact));
      
      // Mock repository methods
      mockRepository.getRun.mockResolvedValue(null);
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 1 },
        { status: 'failed', count: 0 },
        { status: 'skipped', count: 0 }
      ]);
    });

    it('should run experiment successfully', async () => {
      const options: ExperimentRunnerOptions = {
        progressCallback: {
          onProgress: jest.fn(),
          onSpaceStart: jest.fn(),
          onSpaceComplete: jest.fn(),
        }
      };

      const result = await experimentExecutor.run('/path/to/artifact.json', options);

      expect(result).toEqual({
        runId: expect.any(String),
        status: 'completed',
        completedSpaces: ['space1'],
        outputs: {},
        summary: {
          totalTasks: 1,
          completedTasks: 1,
          failedTasks: 0,
          skippedTasks: 0,
        },
      });

      expect(mockRepository.initialize).toHaveBeenCalled();
      expect(mockRepository.createRun).toHaveBeenCalled();
      expect(mockRepository.updateRunStatus).toHaveBeenCalledWith(
        expect.any(String),
        'completed',
        expect.any(Number)
      );
      expect(mockRepository.close).toHaveBeenCalled();
    });

    it('should run experiment with default options', async () => {
      const result = await experimentExecutor.run('/path/to/artifact.json');

      expect(result.status).toBe('completed');
      expect(mockRepository.initialize).toHaveBeenCalled();
      expect(mockRepository.close).toHaveBeenCalled();
    });

    it('should handle resume mode with existing run', async () => {
      const existingRun = {
        id: 'existing-run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running'
      };
      
      mockRepository.getRun.mockResolvedValue(existingRun);

      const result = await experimentExecutor.run('/path/to/artifact.json', { resume: true });

      expect(result.runId).toBe('existing-run-id');
      expect(mockRepository.createRun).not.toHaveBeenCalled();
    });

    it('should create new run when resuming but no existing run found', async () => {
      mockRepository.getRun.mockResolvedValue(null);

      const result = await experimentExecutor.run('/path/to/artifact.json', { resume: true });

      expect(result.runId).toMatch(/^run_\d+_[a-z0-9]+$/);
      expect(mockRepository.createRun).toHaveBeenCalled();
    });

    it('should create new run when resuming but existing run is completed', async () => {
      const existingRun = {
        id: 'completed-run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'completed'
      };
      
      mockRepository.getRun.mockResolvedValue(existingRun);

      const result = await experimentExecutor.run('/path/to/artifact.json', { resume: true });

      expect(result.runId).not.toBe('completed-run-id');
      expect(mockRepository.createRun).toHaveBeenCalled();
    });

    it('should delete existing completed run when not resuming', async () => {
      const existingRun = {
        id: 'old-run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'completed'
      };
      
      mockRepository.getRun.mockResolvedValue(existingRun);

      await experimentExecutor.run('/path/to/artifact.json');

      expect(mockRepository.deleteRun).toHaveBeenCalledWith('old-run-id');
      expect(mockRepository.createRun).toHaveBeenCalled();
    });

    it('should reject invalid artifact file extension', async () => {
      await expect(experimentExecutor.run('/path/to/artifact.txt'))
        .rejects.toThrow('Invalid artifact file type. Please provide a .json file.');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Error reading artifact file: File not found');
    });

    it('should handle JSON parse errors', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Error parsing artifact JSON:');
    });

    it('should validate artifact structure - missing experiment', async () => {
      const invalidArtifact = { version: '1.0.0' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing version', async () => {
      const invalidArtifact = { experiment: 'test' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing tasks array', async () => {
      const invalidArtifact = { experiment: 'test', version: '1.0.0' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing spaces array', async () => {
      const invalidArtifact = { experiment: 'test', version: '1.0.0', tasks: [] };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing control object', async () => {
      const invalidArtifact = { experiment: 'test', version: '1.0.0', tasks: [], spaces: [] };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing control.START', async () => {
      const invalidArtifact = { 
        experiment: 'test', 
        version: '1.0.0', 
        tasks: [], 
        spaces: [], 
        control: { transitions: [] }
      };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - missing control.transitions', async () => {
      const invalidArtifact = { 
        experiment: 'test', 
        version: '1.0.0', 
        tasks: [], 
        spaces: [], 
        control: { START: 'space1' }
      };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidArtifact));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should validate artifact structure - null artifact', async () => {
      mockFs.readFileSync.mockReturnValue('null');

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Invalid artifact structure. Missing required fields.');
    });

    it('should handle runtime errors and update status to failed', async () => {
      mockRepository.getRunById.mockResolvedValue({ id: 'test-run' });
      // Simulate error in space execution by making getRun throw
      mockRepository.getRun.mockRejectedValue(new Error('Database error'));

      await expect(experimentExecutor.run('/path/to/artifact.json'))
        .rejects.toThrow('Database error');

      expect(mockRepository.close).toHaveBeenCalled();
    });

    it('should handle complex artifact with multiple spaces and task stats', async () => {
      const complexArtifact = {
        ...mockArtifact,
        spaces: [
          {
            spaceId: 'space1',
            tasksOrder: ['task1', 'task2'],
            parameters: [{ param1: 'value1' }, { param1: 'value2' }],
          },
          {
            spaceId: 'space2',
            tasksOrder: ['task3'],
            parameters: [{ param2: 'value3' }],
          }
        ]
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(complexArtifact));
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 4 },
        { status: 'failed', count: 1 },
        { status: 'skipped', count: 0 }
      ]);

      const result = await experimentExecutor.run('/path/to/artifact.json');

      expect(result.summary).toEqual({
        totalTasks: 5, // (2 tasks * 2 params) + (1 task * 1 param)
        completedTasks: 4,
        failedTasks: 1,
        skippedTasks: 0,
      });
    });

    it('should handle artifact with input data', async () => {
      const artifactWithInputData = {
        ...mockArtifact,
        inputData: { globalInput: 'globalValue' }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(artifactWithInputData));

      const result = await experimentExecutor.run('/path/to/artifact.json');

      expect(result.status).toBe('completed');
    });

    it('should generate unique run IDs', async () => {
      const result1 = await experimentExecutor.run('/path/to/artifact.json');
      
      // Reset mocks for second run
      jest.clearAllMocks();
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockArtifact));
      mockRepository.getRun.mockResolvedValue(null);
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 1 },
        { status: 'failed', count: 0 },
        { status: 'skipped', count: 0 }
      ]);
      
      const result2 = await experimentExecutor.run('/path/to/artifact.json');

      expect(result1.runId).not.toBe(result2.runId);
      expect(result1.runId).toMatch(/^run_\d+_[a-z0-9]+$/);
      expect(result2.runId).toMatch(/^run_\d+_[a-z0-9]+$/);
    });
  });

  describe('getStatus', () => {
    beforeEach(() => {
      mockRepository.getSpaceStats.mockResolvedValue({ completed: 1, total: 2 });
      mockRepository.getParamSetStats.mockResolvedValue({ completed: 5, total: 10 });
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 8 },
        { status: 'failed', count: 2 }
      ]);
    });

    it('should return status for existing run', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running',
        current_space: 'space1',
        current_param_set: 2,
        total_spaces: 3,
        total_parameter_sets: 15,
        total_tasks: 45
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.getStatus('test-experiment', '1.0.0');

      expect(result).toEqual({
        runId: 'run-id',
        experimentName: 'test-experiment',
        experimentVersion: '1.0.0',
        status: 'running',
        currentSpace: 'space1',
        currentParameterSet: 2,
        progress: {
          completedSpaces: 1,
          totalSpaces: 3,
          completedParameterSets: 5,
          totalParameterSets: 15,
          completedTasks: 8,
          totalTasks: 45,
        },
      });

      expect(mockRepository.getRun).toHaveBeenCalledWith('test-experiment', '1.0.0');
      expect(mockRepository.getSpaceStats).toHaveBeenCalledWith('run-id');
      expect(mockRepository.getParamSetStats).toHaveBeenCalledWith('run-id');
      expect(mockRepository.getTaskStats).toHaveBeenCalledWith('run-id');
    });

    it('should return null for non-existing run', async () => {
      mockRepository.getRun.mockResolvedValue(null);

      const result = await experimentExecutor.getStatus('non-existing', '1.0.0');

      expect(result).toBeNull();
      expect(mockRepository.getRun).toHaveBeenCalledWith('non-existing', '1.0.0');
    });

    it('should handle run without current space and param set', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'completed',
        current_space: undefined,
        current_param_set: undefined,
        total_spaces: 2,
        total_parameter_sets: 10,
        total_tasks: 30
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.getStatus('test-experiment', '1.0.0');

      expect(result).toEqual({
        runId: 'run-id',
        experimentName: 'test-experiment',
        experimentVersion: '1.0.0',
        status: 'completed',
        progress: {
          completedSpaces: 1,
          totalSpaces: 2,
          completedParameterSets: 5,
          totalParameterSets: 10,
          completedTasks: 8,
          totalTasks: 30,
        },
      });
      expect(result!.currentSpace).toBeUndefined();
      expect(result!.currentParameterSet).toBeUndefined();
    });

    it('should handle different status types', async () => {
      const statuses = ['running', 'completed', 'failed', 'terminated'] as const;
      
      for (const status of statuses) {
        const mockRun = {
          id: 'run-id',
          experiment_name: 'test-experiment',
          experiment_version: '1.0.0',
          status: status,
          total_spaces: 3,
          total_parameter_sets: 12,
          total_tasks: 36,
        };

        mockRepository.getRun.mockResolvedValue(mockRun);

        const result = await experimentExecutor.getStatus('test-experiment', '1.0.0');

        expect(result!.status).toBe(status);
      }
    });

    it('should handle zero progress stats', async () => {
      mockRepository.getSpaceStats.mockResolvedValue({ completed: 0, total: 0 });
      mockRepository.getParamSetStats.mockResolvedValue({ completed: 0, total: 0 });
      mockRepository.getTaskStats.mockResolvedValue([]);

      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running',
        total_spaces: 5,
        total_parameter_sets: 20,
        total_tasks: 60,
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.getStatus('test-experiment', '1.0.0');

      expect(result!.progress).toEqual({
        completedSpaces: 0,
        totalSpaces: 5,
        completedParameterSets: 0,
        totalParameterSets: 20,
        completedTasks: 0,
        totalTasks: 60,
      });
    });

    it('should ensure repository is closed even on error', async () => {
      mockRepository.getRun.mockRejectedValue(new Error('Database error'));

      await expect(experimentExecutor.getStatus('test-experiment', '1.0.0'))
        .rejects.toThrow('Database error');
    });

    it('should handle database stats retrieval errors', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running',
        total_spaces: 4,
        total_parameter_sets: 16,
        total_tasks: 48,
      };

      mockRepository.getRun.mockResolvedValue(mockRun);
      mockRepository.getSpaceStats.mockRejectedValue(new Error('Stats error'));

      await expect(experimentExecutor.getStatus('test-experiment', '1.0.0'))
        .rejects.toThrow('Stats error');
    });
  });

  describe('terminate', () => {
    it('should terminate running experiment', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running'
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.terminate('test-experiment', '1.0.0');

      expect(result).toBe(true);
      expect(mockRepository.updateRunStatus).toHaveBeenCalledWith(
        'run-id',
        'terminated',
        expect.any(Number)
      );
    });

    it('should not terminate non-existing experiment', async () => {
      mockRepository.getRun.mockResolvedValue(null);

      const result = await experimentExecutor.terminate('non-existing', '1.0.0');

      expect(result).toBe(false);
      expect(mockRepository.updateRunStatus).not.toHaveBeenCalled();
    });

    it('should not terminate completed experiment', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'completed'
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.terminate('test-experiment', '1.0.0');

      expect(result).toBe(false);
      expect(mockRepository.updateRunStatus).not.toHaveBeenCalled();
    });

    it('should not terminate failed experiment', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'failed'
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.terminate('test-experiment', '1.0.0');

      expect(result).toBe(false);
      expect(mockRepository.updateRunStatus).not.toHaveBeenCalled();
    });

    it('should not terminate already terminated experiment', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'terminated'
      };

      mockRepository.getRun.mockResolvedValue(mockRun);

      const result = await experimentExecutor.terminate('test-experiment', '1.0.0');

      expect(result).toBe(false);
      expect(mockRepository.updateRunStatus).not.toHaveBeenCalled();
    });

    it('should ensure repository is closed even on error', async () => {
      mockRepository.getRun.mockRejectedValue(new Error('Database error'));

      await expect(experimentExecutor.terminate('test-experiment', '1.0.0'))
        .rejects.toThrow('Database error');
    });

    it('should handle update status errors', async () => {
      const mockRun = {
        id: 'run-id',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running'
      };

      mockRepository.getRun.mockResolvedValue(mockRun);
      mockRepository.updateRunStatus.mockRejectedValue(new Error('Update error'));

      await expect(experimentExecutor.terminate('test-experiment', '1.0.0'))
        .rejects.toThrow('Update error');
    });
  });

  describe('Progress Reporting with Stored Totals', () => {
    beforeEach(() => {
      // Setup mocks for the new test cases
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 5 },
        { status: 'failed', count: 1 }
      ]);
    });

    it('should store calculated totals when creating run', async () => {
      const complexArtifact = {
        experiment: 'multi-space-test',
        version: '2.0.0',
        spaces: [
          {
            spaceId: 'space1',
            parameters: [{ param1: 'value1' }, { param1: 'value2' }],
            tasksOrder: ['task1', 'task2']
          },
          {
            spaceId: 'space2', 
            parameters: [{ param2: 'valueA' }, { param2: 'valueB' }, { param2: 'valueC' }],
            tasksOrder: ['task3']
          }
        ],
        tasks: [[]],
        control: { START: 'space1', transitions: [] }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(complexArtifact));

      await experimentExecutor.run('/path/to/complex-artifact.json');

      // Verify that createRun was called with correct totals
      expect(mockRepository.createRun).toHaveBeenCalledWith({
        id: expect.any(String),
        experiment_name: 'multi-space-test',
        experiment_version: '2.0.0',
        artifact_path: '/path/to/complex-artifact.json',
        artifact_hash: expect.any(String),
        start_time: expect.any(Number),
        status: 'running',
        total_spaces: 2,  // 2 spaces
        total_parameter_sets: 5,  // 2 + 3 parameter sets
        total_tasks: 7,  // (2 * 2) + (3 * 1) = 4 + 3 = 7 tasks
      });
    });

    it('should use stored totals in getStatus instead of calculating from database records', async () => {
      const mockRun = {
        id: 'stored-totals-run',
        experiment_name: 'test-experiment',
        experiment_version: '1.0.0',
        status: 'running',
        total_spaces: 3,
        total_parameter_sets: 12,
        total_tasks: 36,
      };

      // Mock the database to return different totals (simulating dynamic database records)
      mockRepository.getRun.mockResolvedValue(mockRun);
      mockRepository.getSpaceStats.mockResolvedValue({ completed: 1, total: 1 }); // Wrong total
      mockRepository.getParamSetStats.mockResolvedValue({ completed: 4, total: 6 }); // Wrong total
      mockRepository.getTaskStats.mockResolvedValue([
        { status: 'completed', count: 10 },
        { status: 'failed', count: 2 }
      ]);

      const result = await experimentExecutor.getStatus('test-experiment', '1.0.0');

      // Should use stored totals from run record, not database stats
      expect(result!.progress).toEqual({
        completedSpaces: 1,
        totalSpaces: 3,  // From stored total, not database total (1)
        completedParameterSets: 4,
        totalParameterSets: 12,  // From stored total, not database total (6)
        completedTasks: 10,
        totalTasks: 36,  // From stored total, not calculated (12)
      });
    });

    it('should calculate correct hierarchy totals for complex experiments', async () => {
      const hierarchyArtifact = {
        experiment: 'hierarchy-test',
        version: '1.0.0',
        spaces: [
          {
            spaceId: 'space1',
            parameters: [
              { param1: 'a', param2: 1 },
              { param1: 'b', param2: 2 },
              { param1: 'c', param2: 3 },
              { param1: 'd', param2: 4 },
              { param1: 'e', param2: 5 }
            ],
            tasksOrder: ['preprocess', 'analyze', 'postprocess']
          },
          {
            spaceId: 'space2',
            parameters: [
              { strategy: 'fast' },
              { strategy: 'accurate' }
            ],
            tasksOrder: ['validate', 'report']
          }
        ],
        tasks: [[]],
        control: { START: 'space1', transitions: [] }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(hierarchyArtifact));

      await experimentExecutor.run('/path/to/hierarchy-artifact.json');

      expect(mockRepository.createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          total_spaces: 2,
          total_parameter_sets: 7,  // 5 + 2
          total_tasks: 19,  // (5 * 3) + (2 * 2) = 15 + 4 = 19
        })
      );
    });
  });
});