import * as vscode from 'vscode';
import { ServerManager } from './services/ServerManager.js';
import { ExperimentService } from './services/ExperimentService.js';
import { ProgressPanelManager } from './panels/ProgressPanelManager.js';
import { GenerateArtifactCommand } from './commands/generateArtifact.js';
import { RunExperimentCommand } from './commands/runExperiment.js';
import { ToolResolver } from './services/ToolResolver.js';
import { ToolExecutor } from './services/ToolExecutor.js';

let serverManager: ServerManager;
let toolExecutor: ToolExecutor;
let experimentService: ExperimentService;
let progressPanelManager: ProgressPanelManager;

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('ExtremeXP extension is now active!');

  await initializeServices(context);
  registerCommands(context);
  setupStatusBar(context);
  setupConfigurationListener(context);
  registerLanguageFeatures(context);
}

/**
 * Initialize core services
 */
async function initializeServices(context: vscode.ExtensionContext): Promise<void> {
  const toolResolver = new ToolResolver(context);
  toolExecutor = new ToolExecutor(toolResolver);

  serverManager = new ServerManager(context, toolExecutor);
  await serverManager.ensureServerRunning();

  experimentService = new ExperimentService(serverManager);
  progressPanelManager = new ProgressPanelManager(context, experimentService);
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const generateArtifactCommand = new GenerateArtifactCommand(toolExecutor);
  const runExperimentCommand = new RunExperimentCommand(experimentService, progressPanelManager);

  registerCommand(context, 'extremexp.generateArtifact', () => generateArtifactCommand.execute());
  registerCommand(context, 'extremexp.runExperiment', () => runExperimentCommand.execute());
  registerCommand(context, 'extremexp.showProgress', () => progressPanelManager.showPanel());
  registerCommand(context, 'extremexp.stopServer', handleStopServer);
  registerCommand(context, 'extremexp.restartServer', handleRestartServer);
}

/**
 * Register a command with the extension context
 */
function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  handler: (...args: unknown[]) => unknown
): void {
  context.subscriptions.push(vscode.commands.registerCommand(command, handler));
}

/**
 * Handle stop server command
 */
async function handleStopServer(): Promise<void> {
  await serverManager.stopServer();
  vscode.window.showInformationMessage('ExtremeXP server stopped');
}

/**
 * Handle restart server command
 */
async function handleRestartServer(): Promise<void> {
  await serverManager.restartServer();
  vscode.window.showInformationMessage('ExtremeXP server restarted');
}

/**
 * Setup status bar item
 */
function setupStatusBar(context: vscode.ExtensionContext): void {
  const statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  updateStatusBarItem(statusBarItem, 'running');
  setupStatusBarListener(statusBarItem);
}

/**
 * Create status bar item
 */
function createStatusBarItem(): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(beaker) ExtremeXP';
  statusBarItem.tooltip = 'ExtremeXP Experiment Runner';
  statusBarItem.command = 'extremexp.showProgress';
  statusBarItem.show();
  return statusBarItem;
}

/**
 * Setup status bar change listener
 */
function setupStatusBarListener(statusBarItem: vscode.StatusBarItem): void {
  serverManager.onStatusChange(status => {
    updateStatusBarItem(statusBarItem, status);
  });
}

/**
 * Update status bar item based on server status
 */
function updateStatusBarItem(statusBarItem: vscode.StatusBarItem, status: string): void {
  switch (status) {
    case 'running':
      statusBarItem.text = '$(beaker) ExtremeXP';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'stopped':
      statusBarItem.text = '$(beaker) ExtremeXP (Stopped)';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      break;
    case 'error':
      statusBarItem.text = '$(beaker) ExtremeXP (Error)';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      break;
  }
}

/**
 * Setup configuration change listener
 */
function setupConfigurationListener(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('extremexp')) {
        serverManager.reloadConfiguration();
      }
    })
  );
}

/**
 * Register language features for XXP and ESPACE languages
 */
function registerLanguageFeatures(context: vscode.ExtensionContext): void {
  registerXXPLanguageFeatures(context);
  registerESPACELanguageFeatures(context);
}

/**
 * Register language features for XXP language
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registerXXPLanguageFeatures(_context: vscode.ExtensionContext): void {
  // You can add language features here such as:
  // - Code completion providers
  // - Hover providers
  // - Definition providers
  // - Symbol providers
  // etc.

  console.log('XXP language features registered');
}

/**
 * Register language features for ESPACE language
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registerESPACELanguageFeatures(_context: vscode.ExtensionContext): void {
  // You can add language features here such as:
  // - Code completion providers
  // - Hover providers
  // - Definition providers
  // - Symbol providers
  // etc.

  console.log('ESPACE language features registered');
}

/**
 * This method is called when your extension is deactivated
 */
export async function deactivate() {
  console.log('ExtremeXP extension is being deactivated');

  await cleanupServices();
}

/**
 * Clean up all services
 */
async function cleanupServices(): Promise<void> {
  if (progressPanelManager) {
    progressPanelManager.dispose();
  }
  if (serverManager) {
    await serverManager.dispose();
  }
}
