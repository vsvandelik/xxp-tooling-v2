/**
 * Tool executor for running ExtremeXP toolchain components.
 * Provides standardized execution interface with cancellation support, timeout handling,
 * streaming output, and cross-platform compatibility for Node.js and binary tools.
 */

import { spawn, ChildProcess } from 'child_process';

import * as vscode from 'vscode';

import { ToolResolver } from './ToolResolver.js';

/**
 * Options for tool execution including environment and control settings.
 */
export interface ToolExecutionOptions {
  /** Command line arguments to pass to the tool */
  args?: string[];
  /** Working directory for tool execution */
  cwd?: string;
  /** Environment variables to set for the tool process */
  env?: Record<string, string>;
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** VS Code cancellation token for user cancellation */
  cancellationToken?: vscode.CancellationToken;
}

/**
 * Result of tool execution including output and status information.
 */
export interface ToolExecutionResult {
  /** Whether the tool executed successfully (exit code 0) */
  success: boolean;
  /** Process exit code */
  exitCode: number;
  /** Standard output from the tool */
  stdout: string;
  /** Standard error output from the tool */
  stderr: string;
  /** Whether execution was cancelled by user or timeout */
  cancelled?: boolean;
}

/**
 * Service for executing ExtremeXP tools with proper environment and error handling.
 * Provides both buffered and streaming execution modes with cancellation support.
 */
export class ToolExecutor {
  /**
   * Creates a new tool executor instance.
   *
   * @param toolResolver - Tool resolver for locating executable tools
   */
  constructor(private toolResolver: ToolResolver) {}

  /**
   * Executes a tool with buffered output and returns the complete result.
   * Supports cancellation, timeout, and cross-platform argument handling.
   *
   * @param toolName - Name of the tool to execute
   * @param options - Execution options including arguments and environment
   * @returns Promise resolving to complete execution result
   */
  async execute(
    toolName: string,
    options: ToolExecutionOptions = {}
  ): Promise<ToolExecutionResult> {
    const toolInfo = await this.toolResolver.resolveTool(toolName);

    return new Promise(resolve => {
      const { args = [], cwd, env, timeout, cancellationToken } = options;

      let command: string;
      let commandArgs: string[];

      if (toolInfo.type === 'node') {
        command = 'node';
        commandArgs = [toolInfo.path, ...args];
      } else {
        command = toolInfo.path;
        commandArgs = args;
      }

      const workingDirectory = cwd || toolInfo.cwd || process.cwd();
      const processEnv = { ...process.env, ...env };

      // On Windows, when using shell mode, we need to properly quote arguments that contain spaces
      const useShell = process.platform === 'win32';
      if (useShell) {
        // Quote arguments that contain spaces or special characters
        commandArgs = commandArgs.map(arg => {
          if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
            // Escape any existing quotes and wrap in quotes
            return `"${arg.replace(/"/g, '\\"')}"`;
          }
          return arg;
        });
      }

      const proc = spawn(command, commandArgs, {
        cwd: workingDirectory,
        env: processEnv,
        shell: useShell,
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Handle cancellation
      const cancellationListener = cancellationToken?.onCancellationRequested(() => {
        killed = true;
        proc.kill();
      });

      // Handle timeout
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          killed = true;
          proc.kill();
        }, timeout);
      }

      proc.stdout?.on('data', data => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', data => {
        stderr += data.toString();
      });

      proc.on('close', code => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        cancellationListener?.dispose();

        resolve({
          success: !killed && code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          cancelled: killed,
        });
      });

      proc.on('error', error => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        cancellationListener?.dispose();

        resolve({
          success: false,
          exitCode: -1,
          stdout,
          stderr: stderr + error.message,
          cancelled: killed,
        });
      });
    });
  }

  /**
   * Executes a tool with real-time streaming output callbacks.
   * Returns the child process for further management and monitoring.
   *
   * @param toolName - Name of the tool to execute
   * @param options - Execution options with streaming callbacks
   * @returns Promise resolving to the spawned child process
   */
  async executeStreaming(
    toolName: string,
    options: ToolExecutionOptions & {
      onStdout?: (data: string) => void;
      onStderr?: (data: string) => void;
    } = {}
  ): Promise<ChildProcess> {
    const toolInfo = await this.toolResolver.resolveTool(toolName);
    const { args = [], cwd, env, onStdout, onStderr } = options;

    let command: string;
    let commandArgs: string[];

    if (toolInfo.type === 'node') {
      command = 'node';
      commandArgs = [toolInfo.path, ...args];
    } else {
      command = toolInfo.path;
      commandArgs = args;
    }

    const workingDirectory = cwd || toolInfo.cwd || process.cwd();
    const processEnv = { ...process.env, ...env };

    const proc = spawn(command, commandArgs, {
      cwd: workingDirectory,
      env: processEnv,
      shell: process.platform === 'win32',
    });

    if (onStdout) {
      proc.stdout?.on('data', data => onStdout(data.toString()));
    }

    if (onStderr) {
      proc.stderr?.on('data', data => onStderr(data.toString()));
    }

    return proc;
  }
}
