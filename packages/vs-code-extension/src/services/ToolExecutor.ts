import { spawn, ChildProcess } from 'child_process';

import * as vscode from 'vscode';

import { ToolResolver } from './ToolResolver.js';

export interface ToolExecutionOptions {
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  cancellationToken?: vscode.CancellationToken;
}

export interface ToolExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  cancelled?: boolean;
}

export class ToolExecutor {
  constructor(private toolResolver: ToolResolver) {}

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
