// packages/vs-code-extension/src/languageClient/LanguageClientManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

export class LanguageClientManager {
  private client: LanguageClient | undefined;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(): Promise<void> {
    // Path to the language server
    const serverModule = this.context.asAbsolutePath(
      path.join('node_modules', '@extremexp', 'language-server', 'dist', 'server.js')
    );

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

    console.log('ExtremeXP Language Server started');
  }

  async stop(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.stop();
    this.client = undefined;
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  private registerFeatures(): void {
    if (!this.client) return;

    // Register custom commands
    this.registerCommands();

    // Register code lens provider if needed
    // this.registerCodeLensProvider();

    // Register custom notifications handlers
    this.registerNotificationHandlers();
  }

  private registerCommands(): void {
    // Register quick fix commands
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'extremexp.quickfix.addMissingParameter',
        async (uri: string, param: string, location: vscode.Range) => {
          const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
          const edit = new vscode.WorkspaceEdit();

          // Find appropriate location to add parameter
          const insertPosition = this.findParameterInsertPosition(document, location);
          if (insertPosition) {
            edit.insert(document.uri, insertPosition, `    param ${param};\n`);
            await vscode.workspace.applyEdit(edit);
          }
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'extremexp.quickfix.removeUnusedParameter',
        async (uri: string, location: vscode.Range) => {
          const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
          const edit = new vscode.WorkspaceEdit();
          edit.delete(document.uri, location);
          await vscode.workspace.applyEdit(edit);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'extremexp.quickfix.createMissingWorkflow',
        async (workflowName: string) => {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
          }

          const workspaceRoot = workspaceFolders[0]!.uri.fsPath;
          const fileName = `${workflowName.charAt(0).toLowerCase() + workflowName.slice(1)}.xxp`;
          const filePath = path.join(workspaceRoot, fileName);

          const content = `workflow ${workflowName} {\n    // TODO: Define workflow\n}\n`;

          await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            Buffer.from(content, 'utf8')
          );

          const document = await vscode.workspace.openTextDocument(filePath);
          await vscode.window.showTextDocument(document);
        }
      )
    );
  }

  private registerNotificationHandlers(): void {
    if (!this.client) return;

    // Handle custom notifications from server
    this.client.onNotification('extremexp/validationStatus', (params: any) => {
      // Update status bar or show notifications based on validation status
      if (params.hasErrors) {
        vscode.window.showErrorMessage(`Validation errors found in ${params.uri}`);
      }
    });

    this.client.onNotification('extremexp/progressUpdate', (params: any) => {
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
    });
  }

  private findParameterInsertPosition(
    document: vscode.TextDocument,
    location: vscode.Range
  ): vscode.Position | undefined {
    // Simple implementation - find the space body and insert at the beginning
    const text = document.getText();
    const lines = text.split('\n');
    for (let i = location.start.line; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('{')) {
        return new vscode.Position(i + 1, 0);
      }
    }

    return undefined;
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
