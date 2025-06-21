import * as vscode from 'vscode';
import { ServerManager } from './services/ServerManager.js';
import { ExperimentService } from './services/ExperimentService.js';
import { ProgressPanelManager } from './panels/ProgressPanelManager.js';
import { GenerateArtifactCommand } from './commands/generateArtifact.js';
import { RunExperimentCommand } from './commands/runExperiment.js';
import { ToolResolver } from './services/ToolResolver.js';
import { ToolExecutor } from './services/ToolExecutor.js';

// Language Client imports
import { LanguageClientManager } from './languageClient/LanguageClientManager.js';

// Workflow repository imports
import { RepositoryConfigManager } from './repository/RepositoryConfigManager.js';
import { WorkflowRepositoryProvider } from './repository/WorkflowRepositoryProvider.js';
import { WorkflowCommands } from './repository/WorkflowCommands.js';

// Global service instances
let serverManager: ServerManager;
let experimentService: ExperimentService;
let progressPanelManager: ProgressPanelManager;
let toolResolver: ToolResolver;
let toolExecutor: ToolExecutor;
let languageClientManager: LanguageClientManager;

// Workflow repository instances
let repositoryConfigManager: RepositoryConfigManager;
let workflowRepositoryProvider: WorkflowRepositoryProvider;
let workflowCommands: WorkflowCommands;

/**
 * This method is called when your extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('ExtremeXP extension is now active!');

  await initializeServices(context);
  await initializeWorkflowRepository(context);
  await initializeLanguageServer(context);
  await setupWorkflowFeatures();
  registerCommands(context);
  setupStatusBar(context);
  setupConfigurationListener(context);
  setupWorkflowRepositoryView(context);
}

/**
 * Initialize core services
 */
async function initializeServices(context: vscode.ExtensionContext): Promise<void> {
  // Initialize tool resolution system
  toolResolver = new ToolResolver(context);
  toolExecutor = new ToolExecutor(toolResolver);

  // Initialize server manager with tool executor
  serverManager = new ServerManager(context, toolExecutor);
  await serverManager.ensureServerRunning();

  // Initialize other services
  experimentService = new ExperimentService(serverManager);
  progressPanelManager = new ProgressPanelManager(context, experimentService);
}

/**
 * Initialize workflow repository system
 */
async function initializeWorkflowRepository(context: vscode.ExtensionContext): Promise<void> {
  repositoryConfigManager = new RepositoryConfigManager(context);
  workflowRepositoryProvider = new WorkflowRepositoryProvider(repositoryConfigManager);
  workflowCommands = new WorkflowCommands(
    context,
    repositoryConfigManager,
    workflowRepositoryProvider
  );
}

/**
 * Initialize Language Server
 */
async function initializeLanguageServer(context: vscode.ExtensionContext): Promise<void> {
  console.log('Initializing ExtremeXP Language Server...');
  
  languageClientManager = new LanguageClientManager(context);
  
  try {
    await languageClientManager.start();
    console.log('Language Server started successfully');
  } catch (error) {
    console.error('Failed to start Language Server:', error);
    vscode.window.showErrorMessage(
      'Failed to start ExtremeXP Language Server. Some features may not work correctly.'
    );
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Existing commands
  const generateArtifactCommand = new GenerateArtifactCommand(toolExecutor);
  const runExperimentCommand = new RunExperimentCommand(experimentService, progressPanelManager);

  registerCommand(context, 'extremexp.generateArtifact', () => generateArtifactCommand.execute());
  registerCommand(context, 'extremexp.runExperiment', () => runExperimentCommand.execute());
  registerCommand(context, 'extremexp.showProgress', () => progressPanelManager.showPanel());
  registerCommand(context, 'extremexp.stopServer', handleStopServer);
  registerCommand(context, 'extremexp.restartServer', handleRestartServer);

  registerCommand(context, 'extremexp.clearToolCache', () => {
    toolResolver.clearCache();
    vscode.window.showInformationMessage('Tool cache cleared');
  });

  // Language Server commands
  registerCommand(context, 'extremexp.restartLanguageServer', async () => {
    await languageClientManager.restart();
    vscode.window.showInformationMessage('ExtremeXP Language Server restarted');
  });

  // Register workflow repository commands
  workflowCommands.registerCommands();
}

/**
 * Setup workflow repository tree view
 */
function setupWorkflowRepositoryView(context: vscode.ExtensionContext): void {
  // Register tree data provider
  const treeView = vscode.window.createTreeView('extremexp.workflows.repositories', {
    treeDataProvider: workflowRepositoryProvider,
    showCollapseAll: true,
    canSelectMany: false,
  });

  context.subscriptions.push(treeView);
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
    vscode.workspace.onDidChangeConfiguration(async e => {
      if (e.affectsConfiguration('extremexp')) {
        // Only reload server configuration if server-related settings changed
        if (e.affectsConfiguration('extremexp.server')) {
          serverManager.reloadConfiguration();
        }

        // Clear cache when tool-related configuration changes
        if (e.affectsConfiguration('extremexp.tools')) {
          toolResolver.clearCache();
        }

        // Update workflow enabled context if that setting changed
        if (e.affectsConfiguration('extremexp.workflows.enabled')) {
          await setupWorkflowFeatures();
        }

        // Restart language server if language-related settings changed
        if (e.affectsConfiguration('extremexp.language')) {
          await languageClientManager.restart();
        }
      }
    })
  );
}

/**
 * Setup workflow repository features and context
 */
async function setupWorkflowFeatures(): Promise<void> {
  // Get the workflow enabled setting
  const config = vscode.workspace.getConfiguration('extremexp.workflows');
  const workflowsEnabled = config.get<boolean>('enabled', true);

  // Set the context variable for VS Code's when clauses
  await vscode.commands.executeCommand(
    'setContext',
    'extremexp.workflows.enabled',
    workflowsEnabled
  );
}

/**
 * This method is called when your extension is deactivated
 */
export async function deactivate() {
  console.log('ExtremeXP extension is being deactivated');

  try {
    await cleanupServices();
    console.log('ExtremeXP extension cleanup completed');
  } catch (error) {
    console.error('Error during extension deactivation:', error);
    // Don't throw the error to avoid blocking VS Code shutdown
  }
}

/**
 * Clean up all services
 */
async function cleanupServices(): Promise<void> {
  const cleanupPromises: Promise<void>[] = [];

  if (languageClientManager) {
    cleanupPromises.push(languageClientManager.stop());
  }
  if (repositoryConfigManager) {
    cleanupPromises.push(Promise.resolve(repositoryConfigManager.dispose()));
  }
  if (progressPanelManager) {
    cleanupPromises.push(Promise.resolve(progressPanelManager.dispose()));
  }
  if (serverManager) {
    cleanupPromises.push(serverManager.dispose());
  }

  // Wait for all cleanup operations to complete, but with a timeout
  await Promise.race([
    Promise.all(cleanupPromises),
    new Promise<void>(resolve => {
      setTimeout(() => {
        console.warn('Cleanup timed out after 10 seconds');
        resolve();
      }, 10000);
    }),
  ]);
}