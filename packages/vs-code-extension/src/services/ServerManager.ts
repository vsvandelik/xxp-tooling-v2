import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'error';

export class ServerManager {
  private serverProcess: ChildProcess | null = null;
  private status: ServerStatus = 'stopped';
  private port: number = 3000;
  private outputChannel: vscode.OutputChannel;
  private statusChangeHandlers: ((status: ServerStatus) => void)[] = [];

  constructor(private context: vscode.ExtensionContext) {
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
      await this.startServer();
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
        throw new Error(`Port ${this.port} is already in use`);
      }

      // Find server module
      const serverPath = await this.findServerModule();
      if (!serverPath) {
        throw new Error('Could not find experiment-runner-server module');
      }

      // Start server process
      const env = {
        ...process.env,
        PORT: this.port.toString(),
        DATABASE_PATH: this.getDatabasePath(),
        VERBOSE: 'true',
      };

      this.serverProcess = spawn('node', [serverPath], {
        env,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      });

      this.serverProcess.stdout?.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });

      this.serverProcess.stderr?.on('data', (data) => {
        this.outputChannel.append(`[ERROR] ${data.toString()}`);
      });

      this.serverProcess.on('close', (code) => {
        this.outputChannel.appendLine(`Server process exited with code ${code}`);
        this.serverProcess = null;
        this.setStatus('stopped');
      });

      this.serverProcess.on('error', (error) => {
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
      await new Promise<void>((resolve) => {
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
      vscode.window.showInformationMessage(
        'Server port changed. Restart the server for changes to take effect.',
        'Restart Now'
      ).then((action) => {
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
    return new Promise((resolve) => {
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
    // Try different possible locations
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const extensionPath = this.context.extensionPath;
    
    const possiblePaths = [
      // In development (workspace)
      path.join(workspacePath, 'packages/experiment-runner-server/dist/server.js'),
      path.join(workspacePath, 'packages/experiment-runner-server/src/server.ts'),
      
      // In development (relative to extension path - for monorepo development)
      path.join(extensionPath, '../experiment-runner-server/dist/server.js'),
      path.join(extensionPath, '../experiment-runner-server/src/server.ts'),
      
      // Go up two levels from extension to find packages folder
      path.join(extensionPath, '../../packages/experiment-runner-server/dist/server.js'),
      path.join(extensionPath, '../../packages/experiment-runner-server/src/server.ts'),
      
      // In extension installation (bundled with extension)
      path.join(extensionPath, 'node_modules/@extremexp/experiment-runner-server/dist/server.js'),
      path.join(extensionPath, 'dist/server.js'),
    ];

    this.outputChannel.appendLine(`Workspace path: ${workspacePath}`);
    this.outputChannel.appendLine(`Extension path: ${extensionPath}`);
    this.outputChannel.appendLine('Checking server paths:');

    for (const serverPath of possiblePaths) {
      this.outputChannel.appendLine(`  Checking: ${serverPath}`);
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(serverPath));
        this.outputChannel.appendLine(`  ✓ Found: ${serverPath}`);
        return serverPath;
      } catch (error) {
        this.outputChannel.appendLine(`  ✗ Not found: ${error}`);
      }
    }

    return null;
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
}