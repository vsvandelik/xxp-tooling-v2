import { SpaceExecutor } from '../src/executors/SpaceExecutor.js';
import { Space, Task, ParameterSet } from '../src/types/artifact.types.js';

// Mock dependencies
jest.mock('../src/executors/TaskExecutor.js', () => ({
  TaskExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
}));

describe('SpaceExecutor', () => {
  let spaceExecutor: SpaceExecutor;
  let mockRepository: any;
  let mockTaskExecutor: any;
  let mockProgress: any;

  const mockSpace: Space = {
    spaceId: 'test-space',
    tasksOrder: ['task1', 'task2'],
    parameters: [
      { param1: 'value1', param2: 10 },
      { param1: 'value2', param2: 20 }
    ]
  };

  const mockTask1: Task = {
    taskId: 'task1',
    workflow: 'workflow1',
    implementation: 'script1.py',
    dynamicParameters: ['param1'],
    staticParameters: { static1: 'value' },
    inputData: [],
    outputData: ['output1']
  };

  const mockTask2: Task = {
    taskId: 'task2',
    workflow: 'workflow2',
    implementation: 'script2.py',
    dynamicParameters: ['param2'],
    staticParameters: { static2: 42 },
    inputData: ['output1'],
    outputData: ['output2']
  };

  const mockTaskMap = new Map([
    ['task1', mockTask1],
    ['task2', mockTask2]
  ]);

  beforeEach(() => {
    mockRepository = {
      getSpaceExecution: jest.fn(),
      createSpaceExecution: jest.fn(),
      updateSpaceExecution: jest.fn(),
      getParamSetExecution: jest.fn(),
      createParamSetExecution: jest.fn(),
      updateParamSetExecution: jest.fn(),
      getRunById: jest.fn(),
      updateRunProgress: jest.fn(),
    };

    mockTaskExecutor = {
      execute: jest.fn(),
    };

    mockProgress = {
      emitProgress: jest.fn(),
      emitParameterSetStart: jest.fn(),
      emitParameterSetComplete: jest.fn(),
    };

    spaceExecutor = new SpaceExecutor(mockRepository, mockTaskExecutor, mockProgress);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    beforeEach(() => {
      // Default mock return values
      mockRepository.getSpaceExecution.mockResolvedValue(null);
      mockRepository.getParamSetExecution.mockResolvedValue(null);
      mockRepository.getRunById.mockResolvedValue({ status: 'running' });
      mockRepository.createSpaceExecution.mockResolvedValue(undefined);
      mockRepository.createParamSetExecution.mockResolvedValue(undefined);
      mockRepository.updateParamSetExecution.mockResolvedValue(undefined);
      mockRepository.updateSpaceExecution.mockResolvedValue(undefined);
      mockTaskExecutor.execute.mockResolvedValue({ output1: 'result1', output2: 'result2' });
    });

    it('should execute space successfully', async () => {
      await spaceExecutor.execute('run-id', mockSpace, mockTaskMap);

      // Verify space execution creation
      expect(mockRepository.createSpaceExecution).toHaveBeenCalledWith({
        run_id: 'run-id',
        space_id: 'test-space',
        status: 'running',
        start_time: expect.any(Number),
        total_param_sets: 2,
        total_tasks: 2,
      });

      // Verify parameter set executions
      expect(mockRepository.createParamSetExecution).toHaveBeenCalledTimes(2);
      expect(mockRepository.createParamSetExecution).toHaveBeenNthCalledWith(1, {
        run_id: 'run-id',
        space_id: 'test-space',
        param_set_index: 0,
        params_hash: expect.any(String),
        status: 'running',
        start_time: expect.any(Number),
      });

      // Verify task executions
      expect(mockTaskExecutor.execute).toHaveBeenCalledTimes(4); // 2 tasks × 2 parameter sets
      expect(mockTaskExecutor.execute).toHaveBeenNthCalledWith(
        1,
        'run-id',
        'test-space',
        0,
        mockTask1,
        { param1: 'value1', param2: 10 }
      );

      // Verify parameter set completion
      expect(mockRepository.updateParamSetExecution).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateParamSetExecution).toHaveBeenNthCalledWith(
        1,
        'run-id',
        'test-space',
        0,
        'completed',
        expect.any(Number)
      );

      // Verify space completion
      expect(mockRepository.updateSpaceExecution).toHaveBeenCalledWith(
        'run-id',
        'test-space',
        'completed',
        expect.any(Number)
      );

      // Verify progress emissions
      expect(mockProgress.emitParameterSetStart).toHaveBeenCalledTimes(2);
      expect(mockProgress.emitParameterSetComplete).toHaveBeenCalledTimes(2);
      expect(mockProgress.emitProgress).toHaveBeenCalled();
    });

    it('should skip space execution creation if already exists', async () => {
      const existingSpaceExec = {
        run_id: 'run-id',
        space_id: 'test-space',
        status: 'running',
        start_time: Date.now(),
      };
      mockRepository.getSpaceExecution.mockResolvedValue(existingSpaceExec);

      await spaceExecutor.execute('run-id', mockSpace, mockTaskMap);

      expect(mockRepository.createSpaceExecution).not.toHaveBeenCalled();
    });

    it('should skip completed parameter sets', async () => {
      const completedParamExec = {
        run_id: 'run-id',
        space_id: 'test-space',
        param_set_index: 0,
        status: 'completed',
      };
      
      mockRepository.getParamSetExecution
        .mockResolvedValueOnce(completedParamExec) // First param set is completed
        .mockResolvedValueOnce(null); // Second param set is not executed

      await spaceExecutor.execute('run-id', mockSpace, mockTaskMap);

      // Should only execute tasks for second parameter set
      expect(mockTaskExecutor.execute).toHaveBeenCalledTimes(2); // 2 tasks × 1 parameter set
      expect(mockTaskExecutor.execute).toHaveBeenNthCalledWith(
        1,
        'run-id',
        'test-space',
        1, // Second parameter set (index 1)
        mockTask1,
        { param1: 'value2', param2: 20 }
      );
    });

    it('should handle missing parameter set', async () => {
      const spaceWithMissingParam: Space = {
        spaceId: 'test-space',
        tasksOrder: ['task1'],
        parameters: [undefined as any] // Missing parameter set
      };

      await expect(spaceExecutor.execute('run-id', spaceWithMissingParam, mockTaskMap))
        .rejects.toThrow('Parameter set 0 not found');
    });

    it('should handle missing task in task map', async () => {
      const spaceWithMissingTask: Space = {
        spaceId: 'test-space',
        tasksOrder: ['missing-task'],
        parameters: [{ param1: 'value1' }]
      };

      await expect(spaceExecutor.execute('run-id', spaceWithMissingTask, mockTaskMap))
        .rejects.toThrow('Task missing-task not found');
    });

    it('should handle task execution failure', async () => {
      mockTaskExecutor.execute.mockRejectedValueOnce(new Error('Task execution failed'));

      await expect(spaceExecutor.execute('run-id', mockSpace, mockTaskMap))
        .rejects.toThrow('Task execution failed');

      // Verify parameter set marked as failed
      expect(mockRepository.updateParamSetExecution).toHaveBeenCalledWith(
        'run-id',
        'test-space',
        0,
        'failed',
        expect.any(Number)
      );

      // Space should not be marked as completed
      expect(mockRepository.updateSpaceExecution).not.toHaveBeenCalled();
    });

    it('should handle empty task order', async () => {
      const spaceWithNoTasks: Space = {
        spaceId: 'test-space',
        tasksOrder: [],
        parameters: [{ param1: 'value1' }]
      };

      await spaceExecutor.execute('run-id', spaceWithNoTasks, mockTaskMap);

      // No task executions should happen
      expect(mockTaskExecutor.execute).not.toHaveBeenCalled();

      // But parameter set and space should still be marked as completed
      expect(mockRepository.updateParamSetExecution).toHaveBeenCalledWith(
        'run-id',
        'test-space',
        0,
        'completed',
        expect.any(Number)
      );
      expect(mockRepository.updateSpaceExecution).toHaveBeenCalledWith(
        'run-id',
        'test-space',
        'completed',
        expect.any(Number)
      );
    });

    it('should handle empty parameter sets', async () => {
      const spaceWithNoParams: Space = {
        spaceId: 'test-space',
        tasksOrder: ['task1'],
        parameters: []
      };

      await spaceExecutor.execute('run-id', spaceWithNoParams, mockTaskMap);

      // No parameter set executions should happen
      expect(mockRepository.createParamSetExecution).not.toHaveBeenCalled();
      expect(mockTaskExecutor.execute).not.toHaveBeenCalled();

      // But space should still be marked as completed
      expect(mockRepository.updateSpaceExecution).toHaveBeenCalledWith(
        'run-id',
        'test-space',
        'completed',
        expect.any(Number)
      );
    });

    it('should emit correct progress for single parameter set', async () => {
      const singleParamSpace: Space = {
        spaceId: 'test-space',
        tasksOrder: ['task1', 'task2'],
        parameters: [{ param1: 'value1' }]
      };

      await spaceExecutor.execute('run-id', singleParamSpace, mockTaskMap);

      // Progress should be emitted after each task
      expect(mockProgress.emitProgress).toHaveBeenCalledWith(
        0.5, // 1/2 tasks completed
        'Completed task task1 (1/2) in parameter set 1/1 of space test-space'
      );
      expect(mockProgress.emitProgress).toHaveBeenCalledWith(
        1.0, // 2/2 tasks completed
        'Completed task task2 (2/2) in parameter set 1/1 of space test-space'
      );
      expect(mockProgress.emitProgress).toHaveBeenCalledWith(
        1.0, // 1/1 parameter sets completed
        'Completed parameter set 1/1 in space test-space'
      );
    });

    it('should generate consistent hash for same parameters', async () => {
      const space1: Space = {
        spaceId: 'space1',
        tasksOrder: ['task1'],
        parameters: [{ param1: 'value1', param2: 10 }]
      };
      
      const space2: Space = {
        spaceId: 'space2',
        tasksOrder: ['task1'],
        parameters: [{ param2: 10, param1: 'value1' }] // Same params, different order
      };

      await spaceExecutor.execute('run-id', space1, mockTaskMap);
      await spaceExecutor.execute('run-id2', space2, mockTaskMap);

      // Both calls should have the same params_hash
      const firstCallHash = mockRepository.createParamSetExecution.mock.calls[0][0].params_hash;
      const secondCallHash = mockRepository.createParamSetExecution.mock.calls[1][0].params_hash;
      
      expect(firstCallHash).toBe(secondCallHash);
    });

    it('should generate different hash for different parameters', async () => {
      const space1: Space = {
        spaceId: 'space1',
        tasksOrder: ['task1'],
        parameters: [{ param1: 'value1', param2: 10 }]
      };
      
      const space2: Space = {
        spaceId: 'space2',
        tasksOrder: ['task1'],
        parameters: [{ param1: 'value1', param2: 20 }] // Different param2 value
      };

      await spaceExecutor.execute('run-id', space1, mockTaskMap);
      await spaceExecutor.execute('run-id2', space2, mockTaskMap);

      const firstCallHash = mockRepository.createParamSetExecution.mock.calls[0][0].params_hash;
      const secondCallHash = mockRepository.createParamSetExecution.mock.calls[1][0].params_hash;
      
      expect(firstCallHash).not.toBe(secondCallHash);
    });
  });
});