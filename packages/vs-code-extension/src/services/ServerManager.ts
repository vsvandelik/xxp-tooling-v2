import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';
import { ToolExecutor } from './ToolExecutor';

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'error';

export class ServerManager {
  private serverProcess: ChildProcess | null = null;
  private status: ServerStatus = 'stopped';
  private port: number = 3000;
  private outputChannel: vscode.OutputChannel;
  private statusChangeHandlers: ((status: ServerStatus) => void)[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private toolExecutor: ToolExecutor
  ) {
    this.outputChannel = vscode.window.createOutputChannel('ExtremeXP Server');
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('extremexp');
    this.port = config.get<number>('server.port', 3000);
  }

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
      
      this.serverProcess = await this.toolExecutor.executeStreaming('experiment-runner-server', options);

      this.serverProcess.on('close', code => {
        this.outputChannel.appendLine(`Server process exited with code ${code}`);
        this.serverProcess = null;
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

  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      this.outputChannel.appendLine('Stopping ExtremeXP server...');

      // Send graceful shutdown signal
      this.serverProcess.kill('SIGINT');

      // Wait for process to exit
      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          // Force kill if not stopped after 5 seconds
          this.serverProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.serverProcess?.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.serverProcess = null;
      this.setStatus('stopped');
      this.outputChannel.appendLine('Server stopped');
    }
  }

  async restartServer(): Promise<void> {
    await this.stopServer();
    await this.startServer();
  }

  async getServerUrl(): Promise<string | null> {
    if (this.status !== 'running') {
      return null;
    }
    return `http://localhost:${this.port}`;
  }

  getStatus(): ServerStatus {
    return this.status;
  }

  onStatusChange(handler: (status: ServerStatus) => void): vscode.Disposable {
    this.statusChangeHandlers.push(handler);
    return new vscode.Disposable(() => {
      const index = this.statusChangeHandlers.indexOf(handler);
      if (index >= 0) {
        this.statusChangeHandlers.splice(index, 1);
      }
    });
  }

  reloadConfiguration(): void {
    const oldPort = this.port;
    this.loadConfiguration();

    if (oldPort !== this.port && this.status === 'running') {
      vscode.window
        .showInformationMessage(
          'Server port changed. Restart the server for changes to take effect.',
          'Restart Now'
        )
        .then(action => {
          if (action === 'Restart Now') {
            this.restartServer();
          }
        });
    }
  }

  async dispose(): Promise<void> {
    await this.stopServer();
    this.outputChannel.dispose();
  }

  private setStatus(status: ServerStatus): void {
    this.status = status;
    this.statusChangeHandlers.forEach(handler => handler(status));
  }

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

  private getDatabasePath(): string {
    const config = vscode.workspace.getConfiguration('extremexp');
    const dbPath = config.get<string>('experiments.defaultDatabase');

    if (dbPath) {
      return dbPath;
    }

    // Default to workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return path.join(workspaceFolder.uri.fsPath, 'experiment_runs.db');
    }

    return './experiment_runs.db';
  }

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

  private async findAvailablePort(startPort: number = 3001): Promise<number | null> {
    for (let port = startPort; port < startPort + 10; port++) {
      if (await this.checkPortAvailable(port)) {
        return port;
      }
    }
    return null;
  }

  private async killProcessOnPort(): Promise<void> {
    try {
      // This is a cross-platform approach
      const { spawn } = await import('child_process');

      if (process.platform === 'win32') {
        // Windows
        const netstat = spawn('netstat', ['-ano']);
        const findstr = spawn('findstr', [`:${this.port}`]);

        netstat.stdout.pipe(findstr.stdin);

        let output = '';
        findstr.stdout.on('data', data => {
          output += data.toString();
        });

        findstr.on('close', () => {
          const lines = output.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[1]?.includes(`:${this.port}`)) {
              const pid = parts[4];
              if (pid && pid !== '0') {
                spawn('taskkill', ['/PID', pid, '/F']);
                this.outputChannel.appendLine(`Killed process ${pid} using port ${this.port}`);
                break;
              }
            }
          }
        });
      } else {
        // Unix-like systems
        spawn('lsof', ['-ti', `tcp:${this.port}`]).stdout.on('data', data => {
          const pid = data.toString().trim();
          if (pid) {
            spawn('kill', ['-9', pid]);
            this.outputChannel.appendLine(`Killed process ${pid} using port ${this.port}`);
          }
        });
      }

      // Wait a bit and try to start server again
      setTimeout(() => {
        this.startServer().catch(console.error);
      }, 1000);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to kill process on port ${this.port}: ${error}`);
    }
  }
}
