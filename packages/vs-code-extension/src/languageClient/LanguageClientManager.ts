// packages/vs-code-extension/src/languageClient/LanguageClientManager.ts
import * as path from 'path';

import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  Trace,
} from 'vscode-languageclient/node.js';

import { ToolResolver } from '../services/ToolResolver.js';

export class LanguageClientManager {
  private client: LanguageClient | undefined;
  private context: vscode.ExtensionContext;
  private toolResolver: ToolResolver;
  private commandDisposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.toolResolver = new ToolResolver(context);
  }

  async start(): Promise<void> {
    // Use ToolResolver to find the language server
    const languageServerTool = await this.toolResolver.resolveTool('language-server');
    const serverModule = languageServerTool.path;

    // If the extension is launched in debug mode, the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
      run: {
        module: serverModule,
        transport: TransportKind.ipc,
      },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: {
          execArgv: ['--nolazy', '--inspect=6009'],
        },
      },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for xxp and espace documents
      documentSelector: [
        { scheme: 'file', language: 'xxp' },
        { scheme: 'file', language: 'espace' },
        { scheme: 'untitled', language: 'xxp' },
        { scheme: 'untitled', language: 'espace' },
      ],
      synchronize: {
        // Notify the server about file changes to .xxp and .espace files contained in the workspace
        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{xxp,espace}'),
      },
      // Initialize options
      initializationOptions: {
        configuration: vscode.workspace.getConfiguration('extremexp'),
      },
      // Configure output channel for server logs
      outputChannelName: 'ExtremeXP Language Server',
      // Enable tracing for debugging
      traceOutputChannel: vscode.window.createOutputChannel('ExtremeXP Language Server Trace'),
    };

    // Create the language client and start the client
    this.client = new LanguageClient(
      'extremexp-language-server',
      'ExtremeXP Language Server',
      serverOptions,
      clientOptions
    );

    // Register additional features
    this.registerFeatures();

    // Start the client. This will also launch the server
    await this.client.start();
    await this.client.setTrace(Trace.Verbose);

    console.log('ExtremeXP Language Server started');

    // Add logging for successful connection
    this.client.outputChannel.appendLine('ExtremeXP Language Server client connection established');
    this.client.outputChannel.show();
  }

  async stop(): Promise<void> {
    if (!this.client) {
      return;
    }

    // Dispose of registered commands
    this.commandDisposables.forEach(disposable => disposable.dispose());
    this.commandDisposables = [];

    await this.client.stop();
    this.client = undefined;
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  private registerFeatures(): void {
    if (!this.client) return;

    // Register code lens provider if needed
    // this.registerCodeLensProvider();

    // Register custom notifications handlers
    this.registerNotificationHandlers();
  }

  private registerNotificationHandlers(): void {
    if (!this.client) return;

    // Handle custom notifications from server
    this.client.onNotification(
      'extremexp/validationStatus',
      (params: { hasErrors: boolean; uri: string }) => {
        // Update status bar or show notifications based on validation status
        if (params.hasErrors) {
          vscode.window.showErrorMessage(`Validation errors found in ${params.uri}`);
        }
      }
    );

    this.client.onNotification(
      'extremexp/progressUpdate',
      (params: { title: string; percentage: number }) => {
        // Show progress for long-running operations
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: params.title,
          },
          async progress => {
            progress.report({ increment: params.percentage });
          }
        );
      }
    );
  }
}

// Extension activation update
export function activateLanguageServer(context: vscode.ExtensionContext): void {
  const languageClientManager = new LanguageClientManager(context);

  // Start the language server
  languageClientManager.start().catch(error => {
    console.error('Failed to start language server:', error);
    vscode.window.showErrorMessage('Failed to start ExtremeXP Language Server: ' + error.message);
  });

  // Register commands to control the language server
  context.subscriptions.push(
    vscode.commands.registerCommand('extremexp.restartLanguageServer', async () => {
      await languageClientManager.restart();
      vscode.window.showInformationMessage('ExtremeXP Language Server restarted');
    })
  );

  // Stop the language server when the extension is deactivated
  context.subscriptions.push({
    dispose: async () => {
      await languageClientManager.stop();
    },
  });
}
