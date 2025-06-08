import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock child_process module
const mockSpawn = jest.fn();
jest.mock('child_process', () => ({
  spawn: mockSpawn,
}), { virtual: true });

// Mock vscode module
const mockCancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: jest.fn(),
};

jest.mock('vscode', () => ({
  CancellationToken: mockCancellationToken,
}), { virtual: true });

import { ToolExecutor, ToolExecutionOptions, ToolExecutionResult } from '../../src/services/ToolExecutor.js';
import { ToolResolver } from '../../src/services/ToolResolver.js';

// Mock ToolResolver
const mockToolResolver = {
  resolveTool: jest.fn(),
  clearCache: jest.fn(),
} as any;

// Mock child process
class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = { write: jest.fn(), end: jest.fn() };
  kill = jest.fn();
  pid = 12345;
}

describe('ToolExecutor', () => {
  let toolExecutor: ToolExecutor;
  let mockProcess: MockChildProcess;

  beforeEach(() => {
    toolExecutor = new ToolExecutor(mockToolResolver);
    mockProcess = new MockChildProcess();
    jest.clearAllMocks();
    
    // Default mock tool resolution
    mockToolResolver.resolveTool.mockResolvedValue({
      name: 'test-tool',
      path: '/mock/path/to/tool',
      type: 'node',
      cwd: '/mock/working/dir',
    });
    
    // Default mock spawn
    mockSpawn.mockReturnValue(mockProcess);
  });

  afterEach(() => {
    mockProcess.removeAllListeners();
  });

  describe('constructor', () => {
    it('should initialize with tool resolver', () => {
      expect(toolExecutor).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute node tool successfully', async () => {
      // Setup: Mock successful execution
      const executePromise = toolExecutor.execute('test-tool', {
        args: ['--version'],
        cwd: '/custom/dir',
      });

      // Simulate process output and exit
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'v1.0.0\n');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('v1.0.0\n');
      expect(result.stderr).toBe('');
      expect(result.cancelled).toBe(false);

      expect(mockSpawn).toHaveBeenCalledWith('node', ['/mock/path/to/tool', '--version'], {
        cwd: '/custom/dir',
        env: process.env,
        shell: false,
      });
    });

    it('should execute binary tool successfully', async () => {
      // Mock binary tool
      mockToolResolver.resolveTool.mockResolvedValue({
        name: 'binary-tool',
        path: '/usr/bin/binary-tool',
        type: 'binary',
        cwd: '/usr/bin',
      });

      const executePromise = toolExecutor.execute('binary-tool', {
        args: ['--help'],
      });

      // Simulate process output and exit
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Usage: binary-tool [options]\n');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Usage: binary-tool [options]\n');

      expect(mockSpawn).toHaveBeenCalledWith('/usr/bin/binary-tool', ['--help'], {
        cwd: '/usr/bin',
        env: process.env,
        shell: false,
      });
    });

    it('should handle tool execution failure', async () => {
      const executePromise = toolExecutor.execute('test-tool');

      // Simulate process error and exit with non-zero code
      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Error: Command failed\n');
        mockProcess.emit('close', 1);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('Error: Command failed\n');
      expect(result.cancelled).toBe(false);
    });

    it('should handle process spawn error', async () => {
      const executePromise = toolExecutor.execute('test-tool');

      // Simulate spawn error
      setTimeout(() => {
        mockProcess.emit('error', new Error('ENOENT: no such file or directory'));
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('ENOENT: no such file or directory');
      expect(result.cancelled).toBe(false);
    });

    it('should handle process timeout', async () => {
      // Override kill to simulate process being killed and then emit close
      mockProcess.kill.mockImplementation(() => {
        setTimeout(() => {
          mockProcess.emit('close', 1); // Simulate process being killed
        }, 10);
        return true;
      });

      const executePromise = toolExecutor.execute('test-tool', {
        timeout: 100, // 100ms timeout
      });

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
    }, 10000); // 10 second timeout for the test itself

    it('should handle cancellation token', async () => {
      const mockToken = {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      };

      // Override kill to simulate process being killed and then emit close
      mockProcess.kill.mockImplementation(() => {
        setTimeout(() => {
          mockProcess.emit('close', 1); // Simulate process being killed
        }, 10);
        return true;
      });

      const executePromise = toolExecutor.execute('test-tool', {
        cancellationToken: mockToken as any,
      });

      // Simulate cancellation after a short delay
      setTimeout(() => {
        mockToken.isCancellationRequested = true;
        const cancelCallback = mockToken.onCancellationRequested.mock.calls[0]?.[0] as () => void;
        if (cancelCallback) {
          cancelCallback();
        }
      }, 50);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
    }, 10000); // 10 second timeout for the test itself

    it('should use custom environment variables', async () => {
      const customEnv = { CUSTOM_VAR: 'custom_value' };

      const executePromise = toolExecutor.execute('test-tool', {
        env: customEnv,
      });

      // Simulate process completion
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      await executePromise;

      expect(mockSpawn).toHaveBeenCalledWith('node', ['/mock/path/to/tool'], {
        cwd: '/mock/working/dir',
        env: { ...process.env, ...customEnv },
        shell: false,
      });
    });

    it('should handle tool resolution failure', async () => {
      mockToolResolver.resolveTool.mockRejectedValue(new Error('Tool not found'));

      await expect(toolExecutor.execute('non-existent-tool')).rejects.toThrow('Tool not found');
    });

    it('should collect mixed stdout and stderr output', async () => {
      const executePromise = toolExecutor.execute('test-tool');

      // Simulate mixed output
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Line 1\n');
        mockProcess.stderr.emit('data', 'Warning: deprecated\n');
        mockProcess.stdout.emit('data', 'Line 2\n');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Line 1\nLine 2\n');
      expect(result.stderr).toBe('Warning: deprecated\n');
    });
  });

  describe('executeStreaming', () => {
    it('should return child process for streaming execution', async () => {
      const onStdout = jest.fn();
      const onStderr = jest.fn();

      const childProcess = await toolExecutor.executeStreaming('test-tool', {
        args: ['--watch'],
        onStdout,
        onStderr,
      });

      expect(childProcess).toBe(mockProcess);
      expect(mockSpawn).toHaveBeenCalledWith('node', ['/mock/path/to/tool', '--watch'], {
        cwd: '/mock/working/dir',
        env: process.env,
        shell: false,
      });

      // Simulate streaming data
      mockProcess.stdout.emit('data', 'streaming data');
      mockProcess.stderr.emit('data', 'streaming error');

      expect(onStdout).toHaveBeenCalledWith('streaming data');
      expect(onStderr).toHaveBeenCalledWith('streaming error');
    });

    it('should handle streaming execution without callbacks', async () => {
      const childProcess = await toolExecutor.executeStreaming('test-tool');

      expect(childProcess).toBe(mockProcess);
      
      // Should not throw when emitting data without callbacks
      expect(() => {
        mockProcess.stdout.emit('data', 'data');
        mockProcess.stderr.emit('data', 'error');
      }).not.toThrow();
    });

    it('should handle tool resolution failure in streaming mode', async () => {
      mockToolResolver.resolveTool.mockRejectedValue(new Error('Tool not found'));

      await expect(toolExecutor.executeStreaming('non-existent-tool')).rejects.toThrow('Tool not found');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null stdout/stderr streams', async () => {
      // Mock process with null streams
      const processWithNullStreams = new MockChildProcess();
      (processWithNullStreams as any).stdout = null;
      (processWithNullStreams as any).stderr = null;
      mockSpawn.mockReturnValue(processWithNullStreams);

      const executePromise = toolExecutor.execute('test-tool');

      // Simulate process completion
      setTimeout(() => {
        processWithNullStreams.emit('close', 0);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });

    it('should handle rapid successive executions', async () => {
      const promises = [
        toolExecutor.execute('test-tool', { args: ['1'] }),
        toolExecutor.execute('test-tool', { args: ['2'] }),
        toolExecutor.execute('test-tool', { args: ['3'] }),
      ];

      // Simulate all processes completing
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(mockSpawn).toHaveBeenCalledTimes(3);
    });

    it('should handle process kill after timeout', async () => {
      // Mock kill to fail initially, then simulate process eventually dying
      mockProcess.kill.mockImplementation(() => {
        setTimeout(() => {
          mockProcess.emit('close', 1); // Simulate process eventually being killed
        }, 10);
        return false; // Return false to indicate kill failed initially
      });

      const executePromise = toolExecutor.execute('test-tool', {
        timeout: 50,
      });

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
    }, 10000); // 10 second timeout for the test itself

    it('should handle large output streams', async () => {
      const executePromise = toolExecutor.execute('test-tool');

      // Simulate large output
      setTimeout(() => {
        const largeOutput = 'x'.repeat(10000);
        mockProcess.stdout.emit('data', largeOutput);
        mockProcess.emit('close', 0);
      }, 10);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.stdout.length).toBe(10000);
    });
  });
});