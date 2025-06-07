import { TaskExecutor } from '../src/executors/TaskExecutor.js';
import { Task, ParameterSet } from '../src/types/artifact.types.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Mock dependencies
jest.mock('../src/database/DatabaseRepository.js', () => ({
  DatabaseRepository: jest.fn().mockImplementation(() => ({
    getTaskExecution: jest.fn(),
    createTaskExecution: jest.fn(),
    updateTaskExecution: jest.fn(),
    createDataMapping: jest.fn(),
    getDataMapping: jest.fn(),
  })),
}));

jest.mock('../src/progress/ProgressEmitter.js', () => ({
  ProgressEmitter: jest.fn().mockImplementation(() => ({
    emitTaskStart: jest.fn(),
    emitTaskComplete: jest.fn(),
    emitError: jest.fn(),
  })),
}));

describe('TaskExecutor', () => {
  let taskExecutor: TaskExecutor;
  let mockRepository: any;
  let mockProgress: any;
  let mockProcess: any;

  beforeEach(() => {
    mockRepository = {
      getTaskExecution: jest.fn(),
      createTaskExecution: jest.fn(),
      updateTaskExecution: jest.fn(),
      createDataMapping: jest.fn(),
      getDataMapping: jest.fn(),
    };
    mockProgress = {
      emitTaskStart: jest.fn(),
      emitTaskComplete: jest.fn(),
      emitError: jest.fn(),
    };
    taskExecutor = new TaskExecutor(mockRepository, '/mock/artifact/folder', mockProgress);

    // Create a mock process
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.pid = 12345;

    mockSpawn.mockReturnValue(mockProcess as any);

    // Mock repository methods
    mockRepository.getTaskExecution.mockResolvedValue(null);
    mockRepository.createTaskExecution.mockResolvedValue();
    mockRepository.updateTaskExecution.mockResolvedValue();
    mockRepository.createDataMapping.mockResolvedValue();
    mockRepository.getDataMapping.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockTask: Task = {
      taskId: 'test-task',
      workflow: 'test-workflow',
      implementation: 'test_script.py',
      staticParameters: { param1: 'value1' },
      dynamicParameters: ['param2'],
      inputData: ['input1', 'input2'],
      outputData: ['output1', 'output2'],
    };

    const mockParamSet: ParameterSet = {
      param2: 'value2',
    };

    it('should execute a task successfully and return outputs', async () => {
      // Mock data mapping for inputs
      mockRepository.getDataMapping
        .mockResolvedValueOnce('input_value_1') // for input1
        .mockResolvedValueOnce('input_value_2'); // for input2

      // Execute the task
      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      // Simulate Python script execution
      setTimeout(() => {
        // Simulate stdout with comma-separated output
        mockProcess.stdout.emit('data', '"output_value_1","output_value_2"\n');
        mockProcess.stdout.emit('data', 'Additional debug output\n');

        // Simulate successful completion
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      // Verify the result
      expect(result).toEqual({
        output1: 'output_value_1',
        output2: 'output_value_2',
      });

      // Verify spawn was called with correct arguments
      expect(mockSpawn).toHaveBeenCalledWith('python', [
        'test_script.py',
        '--param1',
        'value1',
        '--param2',
        'value2',
        '"input_value_1","input_value_2"',
      ]);

      // Verify database operations
      expect(mockRepository.createTaskExecution).toHaveBeenCalledWith({
        run_id: 'run1',
        space_id: 'space1',
        param_set_index: 0,
        task_id: 'test-task',
        status: 'running',
        start_time: expect.any(Number),
      });

      expect(mockRepository.createDataMapping).toHaveBeenCalledTimes(2);
      expect(mockRepository.createDataMapping).toHaveBeenNthCalledWith(1, {
        run_id: 'run1',
        space_id: 'space1',
        param_set_index: 0,
        data_name: 'output1',
        data_value: 'output_value_1',
      });
      expect(mockRepository.createDataMapping).toHaveBeenNthCalledWith(2, {
        run_id: 'run1',
        space_id: 'space1',
        param_set_index: 0,
        data_name: 'output2',
        data_value: 'output_value_2',
      });

      expect(mockRepository.updateTaskExecution).toHaveBeenCalledWith(
        'run1',
        'space1',
        0,
        'test-task',
        {
          status: 'completed',
          end_time: expect.any(Number),
        }
      );
    });

    it('should handle inputs that fallback to input names when no data mapping exists', async () => {
      // Mock repository to return null for data mappings (no existing data)
      mockRepository.getDataMapping.mockResolvedValue(null);

      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      setTimeout(() => {
        mockProcess.stdout.emit('data', '"output_value_1","output_value_2"\n');
        mockProcess.emit('close', 0);
      }, 10);

      await executePromise;

      // Verify spawn was called with input names as fallback values
      expect(mockSpawn).toHaveBeenCalledWith('python', [
        'test_script.py',
        '--param1',
        'value1',
        '--param2',
        'value2',
        '"input1","input2"',
      ]);
    });

    it('should handle tasks with no inputs', async () => {
      const taskWithNoInputs = { ...mockTask, inputData: [] };

      const executePromise = taskExecutor.execute(
        'run1',
        'space1',
        0,
        taskWithNoInputs,
        mockParamSet
      );

      setTimeout(() => {
        mockProcess.stdout.emit('data', '"output_value_1","output_value_2"\n');
        mockProcess.emit('close', 0);
      }, 10);

      await executePromise;

      // Verify spawn was called without input arguments
      expect(mockSpawn).toHaveBeenCalledWith('python', [
        'test_script.py',
        '--param1',
        'value1',
        '--param2',
        'value2',
      ]);
    });

    it('should handle script failure with non-zero exit code', async () => {
      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Error: Something went wrong\n');
        mockProcess.emit('close', 1);
      }, 10);

      await expect(executePromise).rejects.toThrow(
        'Task failed with exit code 1: Error: Something went wrong\n'
      );

      // Verify task execution was marked as failed
      expect(mockRepository.updateTaskExecution).toHaveBeenCalledWith(
        'run1',
        'space1',
        0,
        'test-task',
        {
          status: 'failed',
          end_time: expect.any(Number),
          error_message: 'Task failed with exit code 1: Error: Something went wrong\n',
        }
      );
    });

    it('should handle missing output from script', async () => {
      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      setTimeout(() => {
        // No stdout output
        mockProcess.emit('close', 0);
      }, 10);

      await expect(executePromise).rejects.toThrow('No output received from Python script');
    });

    it('should handle insufficient outputs from script', async () => {
      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      setTimeout(() => {
        // Only one output value when two are expected
        mockProcess.stdout.emit('data', '"output_value_1"\n');
        mockProcess.emit('close', 0);
      }, 10);

      await expect(executePromise).rejects.toThrow(
        "Missing output for 'output2' or insufficient outputs returned"
      );
    });

    it('should handle malformed output from script', async () => {
      const executePromise = taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      setTimeout(() => {
        // Invalid JSON-like output
        mockProcess.stdout.emit('data', 'invalid,output,format\n');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      // Should still work with basic comma parsing
      expect(result).toEqual({
        output1: 'invalid',
        output2: 'output',
      });
    });

    it('should return cached results for completed tasks', async () => {
      // Mock existing completed task execution
      mockRepository.getTaskExecution.mockResolvedValue({
        run_id: 'run1',
        space_id: 'space1',
        param_set_index: 0,
        task_id: 'test-task',
        status: 'completed',
        start_time: Date.now() - 1000,
        end_time: Date.now(),
      });

      // Mock existing data mappings
      mockRepository.getDataMapping
        .mockResolvedValueOnce('cached_output_1') // for output1
        .mockResolvedValueOnce('cached_output_2'); // for output2

      const result = await taskExecutor.execute('run1', 'space1', 0, mockTask, mockParamSet);

      expect(result).toEqual({
        output1: 'cached_output_1',
        output2: 'cached_output_2',
      });

      // Verify no new execution was triggered
      expect(mockSpawn).not.toHaveBeenCalled();
      expect(mockRepository.createTaskExecution).not.toHaveBeenCalled();
    });
  });
});
