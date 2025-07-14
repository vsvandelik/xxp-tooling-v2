/**
 * Server manager for ExtremeXP experiment runner server lifecycle.
 * Provides comprehensive server process management including startup, shutdown,
 * port management, configuration handling, and status monitoring with VS Code integration.
 */

import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

import { ToolExecutor } from './ToolExecutor.js';

/** Server status enumeration for lifecycle tracking */
export type ServerStatus = 'running' | 'stopped' | 'starting' | 'error';

/**
 * Manages the ExtremeXP experiment runner server lifecycle and configuration.
 * Handles server process startup/shutdown, port management, configuration updates,
 * and provides status monitoring with event-driven notifications.
 */
export class ServerManager {
  /** Child process instance of the running server */
  private serverProcess: ChildProcess | null = null;
  /** Current server status for lifecycle tracking */
  private status: ServerStatus = 'stopped';
  /** Port number for server communication */
  private port: number = 3000;
  /** VS Code output channel for server logs */
  private outputChannel: vscode.OutputChannel;
  /** Array of status change event handlers */
  private statusChangeHandlers: ((status: ServerStatus) => void)[] = [];
  /** Process ID of the running server for management */
  private serverPid: number | null = null;

  /**
   * Creates a new server manager instance.
   * 
   * @param context - VS Code extension context for resource management
   * @param toolExecutor - Tool executor for running server processes
   */
  constructor(
    private context: vscode.ExtensionContext,
    private toolExecutor: ToolExecutor
  ) {
    this.outputChannel = vscode.window.createOutputChannel('ExtremeXP Server');
    this.loadConfiguration();
  }

  /**
   * Loads server configuration from VS Code settings.
   */
  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('extremexp');
    this.port = config.get<number>('server.port', 3000);
  }

  /**
   * Ensures the experiment runner server is running.
   * Attempts auto-start if configured and handles port conflicts gracefully.
   * 
   * @throws Error if server cannot be started and auto-start fails
   */
  async ensureServerRunning(): Promise<void> {
    if (this.status === 'running') {
      return;
    }

    const config = vscode.workspace.getConfiguration('extremexp');
    const autoStart = config.get<boolean>('server.autoStart', true);

    if (autoStart) {
      try {
        await this.startServer();
      } catch (error) {
        // If auto-start fails, show error but don't fail extension activation
        this.outputChannel.appendLine(`Failed to auto-start server: ${error}`);
        this.setStatus('error');

        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already in use')) {
          vscode.window
            .showWarningMessage(
              `ExtremeXP server could not start: Port ${this.port} is already in use. ` +
                'You can either kill the existing process or change the port in settings.',
              'Change Port',
              'Kill Process',
              'Manual Start'
            )
            .then(async action => {
              if (action === 'Change Port') {
                await vscode.commands.executeCommand(
                  'workbench.action.openSettings',
                  'extremexp.server.port'
                );
              } else if (action === 'Kill Process') {
                await this.killProcessOnPort();
              } else if (action === 'Manual Start') {
                await vscode.commands.executeCommand('extremexp.restartServer');
              }
            });
        } else {
          vscode.window.showErrorMessage(`Failed to start ExtremeXP server: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Starts the experiment runner server process.
   * Handles port availability checking, process spawning, and readiness verification.
   * 
   * @throws Error if server startup fails or port is unavailable
   */
  async startServer(): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      return;
    }

    this.setStatus('starting');
    this.outputChannel.show();
    this.outputChannel.appendLine('Starting ExtremeXP server...');

    try {
      // Check if port is available
      const isPortAvailable = await this.checkPortAvailable(this.port);
      if (!isPortAvailable) {
        // Try to find an alternative port
        const alternativePort = await this.findAvailablePort();
        if (alternativePort) {
          const useAlternative = await vscode.window.showWarningMessage(
            `Port ${this.port} is in use. Use port ${alternativePort} instead?`,
            'Yes',
            'No'
          );
          if (useAlternative === 'Yes') {
            this.port = alternativePort;
          } else {
            throw new Error(`Port ${this.port} is already in use`);
          }
        } else {
          throw new Error(`Port ${this.port} is already in use and no alternative ports available`);
        }
      }

      // Find server module
      const serverPath = await this.findServerModule();
      if (!serverPath) {
        throw new Error('Could not find experiment-runner-server module');
      }

      // Start server process using toolExecutor
      const env = {
        PORT: this.port.toString(),
        DATABASE_PATH: this.getDatabasePath(),
        VERBOSE: 'true',
      };

      const options: Parameters<typeof this.toolExecutor.executeStreaming>[1] = {
        env,
        onStdout: data => this.outputChannel.append(data),
        onStderr: data => this.outputChannel.append(`[ERROR] ${data}`),
      };

      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspacePath) {
        options.cwd = workspacePath;
      }

      this.serverProcess = await this.toolExecutor.executeStreaming(
        'experiment-runner-server',
        options
      );

      // Store the PID for better process management
      this.serverPid = this.serverProcess.pid || null;

      this.serverProcess.on('close', code => {
        this.outputChannel.appendLine(`Server process exited with code ${code}`);
        this.serverProcess = null;
        this.serverPid = null;
        this.setStatus('stopped');
      });

      this.serverProcess.on('error', error => {
        this.outputChannel.appendLine(`Server process error: ${error.message}`);
        this.setStatus('error');
      });

      // Wait for server to be ready
      await this.waitForServer();

      this.setStatus('running');
      this.outputChannel.appendLine(`ExtremeXP server running on port ${this.port}`);
    } catch (error) {
      this.outputChannel.appendLine(`Failed to start server: ${error}`);
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Stops the running experiment runner server.
   * Attempts graceful shutdown before forcing termination if necessary.
   */
  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      this.outputChannel.appendLine('Stopping ExtremeXP server...');


      try {
        // Try graceful shutdown first
        await this.attemptGracefulShutdown();
      } catch (error) {
        this.outputChannel.appendLine(`Graceful shutdown failed: ${error}`);
        // Force kill if graceful shutdown fails
        await this.forceKillServer();
      }

      this.serverProcess = null;
      this.serverPid = null;
      this.setStatus('stopped');
      this.outputChannel.appendLine('Server stopped');
    }
  }

  /**
   * Attempts graceful server shutdown using appropriate signals.
   * 
   * @throws Error if graceful shutdown times out
   */
  private async attemptGracefulShutdown(): Promise<void> {
    if (!this.serverProcess) return;

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Graceful shutdown timed out'));
      }, 8000); // Increased timeout to 8 seconds

      this.serverProcess!.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });

      // On Windows, try to send a proper shutdown signal
      if (process.platform === 'win32') {
        // For Windows, try to terminate the process tree
        this.terminateProcessTree();
      } else {
        // On Unix-like systems, send SIGTERM first, then SIGINT
        this.serverProcess!.kill('SIGTERM');
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGINT');
          }
        }, 2000);
      }
    });
  }

  /**
   * Forces immediate server termination using platform-specific kill commands.
   */
  private async forceKillServer(): Promise<void> {
    if (this.serverProcess) {
      this.outputChannel.appendLine('Force killing server process...');

      if (process.platform === 'win32' && this.serverPid) {
        // On Windows, use taskkill to ensure the process tree is terminated
        try {
          const { spawn } = await import('child_process');
          const killProcess = spawn('taskkill', ['/PID', this.serverPid.toString(), '/T', '/F'], {
            windowsHide: true,
          });

          await new Promise<void>(resolve => {
            killProcess.on('close', () => resolve());
            setTimeout(resolve, 2000); // Don't wait too long
          });
        } catch (error) {
          this.outputChannel.appendLine(`Failed to force kill with taskkill: ${error}`);
        }
      } else {
        this.serverProcess.kill('SIGKILL');
      }
    }
  }

  /**
   * Terminates the entire process tree on Windows using taskkill.
   */
  private terminateProcessTree(): void {
    if (!this.serverPid) return;

    // Use taskkill with /T flag to terminate the entire process tree
    import('child_process').then(({ spawn }) => {
      const killProcess = spawn('taskkill', ['/PID', this.serverPid!.toString(), '/T'], {
        windowsHide: true,
      });

      killProcess.on('error', error => {
        this.outputChannel.appendLine(`Failed to terminate process tree: ${error}`);
        // Fallback to direct process kill
        if (this.serverProcess) {
          this.serverProcess.kill('SIGINT');
        }
      });
    });
  }

  /**
   * Restarts the server by stopping and starting it.
   * 
   * @throws Error if restart process fails
   */
  async restartServer(): Promise<void> {
    await this.stopServer();
    await this.startServer();
  }

  /**
   * Gets the server URL if the server is running.
   * 
   * @returns Server URL or null if server is not running
   */
  async getServerUrl(): Promise<string | null> {
    if (this.status !== 'running') {
      return null;
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Gets the current server status.
   * 
   * @returns Current server status
   */
  getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Registers a status change event handler.
   * 
   * @param handler - Function to call when server status changes
   * @returns Disposable to unregister the handler
   */
  onStatusChange(handler: (status: ServerStatus) => void): vscode.Disposable {
    this.statusChangeHandlers.push(handler);
    return new vscode.Disposable(() => {
      const index = this.statusChangeHandlers.indexOf(handler);
      if (index >= 0) {
        this.statusChangeHandlers.splice(index, 1);
      }
    });
  }

  /**
   * Reloads server configuration from VS Code settings.
   * Automatically restarts server if port changes while running.
   */
  reloadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('extremexp');
    const oldPort = this.port;
    const newPort = config.get<number>('server.port', 3000);

    this.port = newPort;

    // Only restart server if the port actually changed and server is running
    if (oldPort !== newPort && this.status === 'running') {
      this.outputChannel.appendLine(`Port changed from ${oldPort} to ${newPort}`);
      vscode.window
        .showInformationMessage(
          `Server port changed from ${oldPort} to ${newPort}. Restart the server for changes to take effect.`,
          'Restart Now',
          'Restart Later'
        )
        .then(action => {
          if (action === 'Restart Now') {
            this.restartServer().catch(error => {
              this.outputChannel.appendLine(`Failed to restart server: ${error}`);
              vscode.window.showErrorMessage(`Failed to restart server: ${error}`);
            });
          }
        });
    } else {
      // Just reload other settings without restarting
      this.outputChannel.appendLine('Configuration reloaded (no restart required)');
    }
  }

  /**
   * Disposes of the server manager and cleans up resources.
   * Stops the server and clears all event handlers.
   */
  async dispose(): Promise<void> {
    this.outputChannel.appendLine('Disposing ServerManager...');

    try {
      await this.stopServer();
    } catch (error) {
      this.outputChannel.appendLine(`Error during server disposal: ${error}`);
    }

    // Clear all status change handlers
    this.statusChangeHandlers = [];

    this.outputChannel.dispose();
  }

  /**
   * Sets the server status and notifies all registered handlers.
   * 
   * @param status - New server status
   */
  private setStatus(status: ServerStatus): void {
    this.status = status;
    this.statusChangeHandlers.forEach(handler => handler(status));
  }

  /**
   * Checks if a port is available for server binding.
   * 
   * @param port - Port number to check
   * @returns Promise resolving to true if port is available
   */
  private async checkPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const server = net.createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port);
    });
  }

  /**
   * Locates the experiment runner server module using tool resolver.
   * 
   * @returns Promise resolving to server module path or null if not found
   */
  private async findServerModule(): Promise<string | null> {
    try {
      const toolInfo = await this.toolExecutor['toolResolver'].resolveTool(
        'experiment-runner-server'
      );
      this.outputChannel.appendLine(`Found server at: ${toolInfo.path}`);
      return toolInfo.path;
    } catch (error) {
      this.outputChannel.appendLine(`Failed to find server module: ${error}`);
      return null;
    }
  }

  /**
   * Gets the platform-specific default database directory.
   * 
   * @returns Platform-appropriate database directory path
   */
  private getDefaultDatabaseDirectory(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows: Use local app data directory
      return path.join(os.homedir(), 'AppData', 'Local', 'ExtremeXP');
    } else if (platform === 'darwin') {
      // macOS: Use application support directory
      return path.join(os.homedir(), 'Library', 'Application Support', 'ExtremeXP');
    } else {
      // Linux/Unix: Use XDG data directory or .local/share
      const xdgDataHome = process.env['XDG_DATA_HOME'];
      if (xdgDataHome) {
        return path.join(xdgDataHome, 'extremexp');
      }
      return path.join(os.homedir(), '.local', 'share', 'extremexp');
    }
  }

  /**
   * Gets the database path from configuration or default location.
   * Creates the directory if it doesn't exist.
   * 
   * @returns Absolute path to the experiment database file
   */
  private getDatabasePath(): string {
    const config = vscode.workspace.getConfiguration('extremexp');
    const dbPath = config.get<string>('experiments.defaultDatabase');

    if (dbPath) {
      return dbPath;
    }

    // Default to platform-specific application data directory
    const defaultDir = this.getDefaultDatabaseDirectory();
    
    // Ensure the directory exists
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
    } catch (error) {
      // If we can't create the directory, fall back to workspace or current directory
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        return path.join(workspaceFolder.uri.fsPath, 'experiment_runs.db');
      }
      return './experiment_runs.db';
    }
    
    return path.join(defaultDir, 'experiment_runs.db');
  }

  /**
   * Waits for the server to become ready by polling the health endpoint.
   * 
   * @param timeout - Maximum time to wait in milliseconds
   * @throws Error if server doesn't become ready within timeout
   */
  private async waitForServer(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${this.port}/health`);
        if (response.ok) {
          return;
        }
      } catch {
        // Server not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Server failed to start within timeout');
  }

  /**
   * Finds an available port starting from the specified port.
   * 
   * @param startPort - Starting port number to check
   * @returns Promise resolving to available port or null if none found
   */
  private async findAvailablePort(startPort: number = 3001): Promise<number | null> {
    for (let port = startPort; port < startPort + 10; port++) {
      if (await this.checkPortAvailable(port)) {
        return port;
      }
    }
    return null;
  }

  /**
   * Kills processes using the configured port using platform-specific commands.
   * Attempts to restart the server after killing conflicting processes.
   */
  private async killProcessOnPort(): Promise<void> {
    try {
      this.outputChannel.appendLine(`Attempting to kill process on port ${this.port}...`);

      if (process.platform === 'win32') {
        // Windows approach
        const { spawn } = await import('child_process');

        // Find processes using the port
        const netstat = spawn('netstat', ['-ano'], { windowsHide: true });
        const findstr = spawn('findstr', [`:${this.port}`], { windowsHide: true });

        netstat.stdout?.pipe(findstr.stdin);

        let output = '';
        findstr.stdout?.on('data', data => {
          output += data.toString();
        });

        await new Promise<void>(resolve => {
          findstr.on('close', () => {
            const lines = output.split('\n');
            let killedAny = false;

            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 5 && parts[1]?.includes(`:${this.port}`)) {
                const pid = parts[4];
                if (pid && pid !== '0' && !isNaN(Number(pid))) {
                  try {
                    // Use taskkill with /T to kill the entire process tree
                    spawn('taskkill', ['/PID', pid, '/T', '/F'], { windowsHide: true });
                    this.outputChannel.appendLine(
                      `Killed process tree ${pid} using port ${this.port}`
                    );
                    killedAny = true;
                  } catch (error) {
                    this.outputChannel.appendLine(`Failed to kill process ${pid}: ${error}`);
                  }
                }
              }
            }

            if (!killedAny) {
              this.outputChannel.appendLine(`No processes found using port ${this.port}`);
            }

            resolve();
          });

          // Timeout fallback
          setTimeout(resolve, 5000);
        });
      } else {
        // Unix-like systems
        const { spawn } = await import('child_process');
        const lsof = spawn('lsof', ['-ti', `tcp:${this.port}`]);

        let output = '';
        lsof.stdout?.on('data', data => {
          output += data.toString();
        });

        await new Promise<void>(resolve => {
          lsof.on('close', () => {
            const pids = output
              .trim()
              .split('\n')
              .filter(pid => pid && !isNaN(Number(pid)));

            for (const pid of pids) {
              try {
                spawn('kill', ['-9', pid]);
                this.outputChannel.appendLine(`Killed process ${pid} using port ${this.port}`);
              } catch (error) {
                this.outputChannel.appendLine(`Failed to kill process ${pid}: ${error}`);
              }
            }

            resolve();
          });

          // Timeout fallback
          setTimeout(resolve, 5000);
        });
      }

      // Wait a bit before trying to start server again
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to start server again
      try {
        await this.startServer();
      } catch (error) {
        this.outputChannel.appendLine(
          `Failed to restart server after killing port process: ${error}`
        );
        vscode.window.showErrorMessage(`Failed to restart server: ${error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Failed to kill process on port ${this.port}: ${errorMessage}`);
      vscode.window.showErrorMessage(
        `Failed to kill process on port ${this.port}: ${errorMessage}`
      );
    }
  }
}
