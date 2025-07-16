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
  /** Debug output channel for tool execution logging */
  private debugChannel: vscode.OutputChannel;

  /**
   * Creates a new tool executor instance.
   *
   * @param toolResolver - Tool resolver for locating executable tools
   */
  constructor(private toolResolver: ToolResolver) {
    this.debugChannel = vscode.window.createOutputChannel('ExtremeXP Tools');
  }

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
    this.debugChannel.appendLine(`[ToolExecutor] Starting execution of tool: ${toolName}`);
    this.debugChannel.show(true); // Show the debug channel
    this.debugChannel.appendLine(`[ToolExecutor] Execution options: ${JSON.stringify({
      args: options.args || [],
      cwd: options.cwd || 'default',
      timeout: options.timeout || 'none',
      hasEnv: !!options.env,
      hasCancellationToken: !!options.cancellationToken
    }, null, 2)}`);

    const toolInfo = await this.toolResolver.resolveTool(toolName);
    this.debugChannel.appendLine(`[ToolExecutor] Tool resolved: ${JSON.stringify({
      name: toolInfo.name,
      path: toolInfo.path,
      type: toolInfo.type,
      cwd: toolInfo.cwd
    }, null, 2)}`);

    return new Promise(resolve => {
      const { args = [], cwd, env, timeout, cancellationToken } = options;

      let command: string;
      let commandArgs: string[];

      if (toolInfo.type === 'node' || toolInfo.path.endsWith('.js') || toolInfo.path.endsWith('.cjs') || toolInfo.path.endsWith('.mjs')) {
        // For Node.js scripts, use node executable
        command = 'node';
        commandArgs = [toolInfo.path, ...args];
      } else {
        command = toolInfo.path;
        commandArgs = args;
      }

      const workingDirectory = cwd || toolInfo.cwd || process.cwd();
      const processEnv = { ...process.env, ...env };

      this.debugChannel.appendLine(`[ToolExecutor] Preparing to spawn process: ${JSON.stringify({
        command,
        args: commandArgs,
        cwd: workingDirectory,
        shell: process.platform === 'win32',
        envKeys: Object.keys(processEnv).filter(key => !key.startsWith('npm_') && !key.startsWith('NODE_')).slice(0, 10) // Show first 10 non-npm env vars
      }, null, 2)}`);

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
        this.debugChannel.appendLine(`[ToolExecutor] Windows shell mode - quoted args: ${JSON.stringify(commandArgs)}`);
      }

      this.debugChannel.appendLine(`[ToolExecutor] Spawning process: ${command} ${commandArgs.join(' ')}`);
      
      const proc = spawn(command, commandArgs, {
        cwd: workingDirectory,
        env: processEnv,
        shell: useShell,
        stdio: ['pipe', 'pipe', 'pipe'], // Explicitly set stdio pipes
      });

      this.debugChannel.appendLine(`[ToolExecutor] Process spawned with PID: ${proc.pid}`);

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Handle cancellation
      const cancellationListener = cancellationToken?.onCancellationRequested(() => {
        this.debugChannel.appendLine(`[ToolExecutor] Cancellation requested for ${toolName}`);
        killed = true;
        proc.kill();
      });

      // Handle timeout
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (timeout) {
        this.debugChannel.appendLine(`[ToolExecutor] Setting timeout: ${timeout}ms`);
        timeoutHandle = setTimeout(() => {
          this.debugChannel.appendLine(`[ToolExecutor] Timeout reached for ${toolName}, killing process`);
          killed = true;
          proc.kill();
        }, timeout);
      }

      // Set up stdout handler
      if (proc.stdout) {
        proc.stdout.on('data', data => {
          const dataStr = data.toString();
          stdout += dataStr;
        });
        
        proc.stdout.on('error', error => {
          this.debugChannel.appendLine(`[ToolExecutor] stdout error: ${error}`);
        });
      }

      // Set up stderr handler
      if (proc.stderr) {
        proc.stderr.on('data', data => {
          const dataStr = data.toString();
          stderr += dataStr;
        });
        
        proc.stderr.on('error', error => {
          this.debugChannel.appendLine(`[ToolExecutor] stderr error: ${error}`);
        });
      }

      proc.on('close', code => {
        this.debugChannel.appendLine(`[ToolExecutor] Process ${toolName} closed with code: ${code}`);
        
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        cancellationListener?.dispose();

        const result = {
          success: !killed && code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          cancelled: killed,
        };        
        resolve(result);
      });

      proc.on('error', error => {
        this.debugChannel.appendLine(`[ToolExecutor] Process ${toolName} error: ${error.message}`);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        cancellationListener?.dispose();

        const result = {
          success: false,
          exitCode: -1,
          stdout,
          stderr: stderr + error.message,
          cancelled: killed,
        };
        
        this.debugChannel.appendLine(`[ToolExecutor] Resolving with error result: ${JSON.stringify({
          success: result.success,
          exitCode: result.exitCode,
          stdoutLength: result.stdout.length,
          stderrLength: result.stderr.length,
          cancelled: result.cancelled
        }, null, 2)}`);

        resolve(result);
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
