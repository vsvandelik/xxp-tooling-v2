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

// Status bar item reference
let statusBarItem: vscode.StatusBarItem;

/**
 * This method is called when your extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('ExtremeXP extension is now active!');

  // Initialize tool resolution system first (required by other services)
  toolResolver = new ToolResolver(context);
  toolExecutor = new ToolExecutor(toolResolver);

  // Setup basic UI elements immediately
  setupStatusBar(context);
  setupConfigurationListener(context);

  // Initialize core services first (needed for experiment commands)
  await initializeServices(context);

  // Register experiment commands after services are ready
  registerExperimentCommands(context);

  // Initialize other features in parallel without blocking each other
  const initializationPromises = [
    initializeWorkflowRepository(context),
    initializeLanguageServer(context),
    setupWorkflowFeatures(),
  ];

  // Start all features simultaneously and handle failures gracefully
  const results = await Promise.allSettled(initializationPromises);

  // Log any failures but don't block extension activation
  results.forEach((result, index) => {
    const featureNames = [
      'Workflow Repository',
      'Language Server',
      'Workflow Features',
    ];
    if (result.status === 'rejected') {
      console.error(`Failed to initialize ${featureNames[index]}:`, result.reason);
    } else {
      console.log(`${featureNames[index]} initialized successfully`);
    }
  });

  // Register remaining commands after all dependencies are initialized
  registerUtilityCommands(context);
  
  setupWorkflowRepositoryView(context);
  console.log('ExtremeXP extension activation completed');
}

/**
 * Initialize core services
 */
async function initializeServices(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('Initializing core services...');

    // Initialize server manager with tool executor
    serverManager = new ServerManager(context, toolExecutor);

    // Update status bar listener now that server manager exists
    updateStatusBarWithServerManager();

    // Initialize experiment service (doesn't require server to be running)
    experimentService = new ExperimentService(serverManager);
    
    // Initialize progress panel manager
    progressPanelManager = new ProgressPanelManager(context, experimentService);

    console.log('Core services initialized successfully');

    // Start server in background without blocking (this can happen asynchronously)
    serverManager.ensureServerRunning().catch(error => {
      console.error('Failed to start experiment server:', error);
      vscode.window.showWarningMessage(
        'Failed to start ExtremeXP experiment server. Experiment features may not work correctly.'
      );
    });

  } catch (error) {
    console.error('Failed to initialize core services:', error);
    vscode.window.showErrorMessage(
      'Failed to initialize ExtremeXP core services. Some features may not work correctly.'
    );
    throw error;
  }
}

/**
 * Initialize workflow repository system
 */
async function initializeWorkflowRepository(context: vscode.ExtensionContext): Promise<void> {
  try {
    repositoryConfigManager = new RepositoryConfigManager(context);
    workflowRepositoryProvider = new WorkflowRepositoryProvider(repositoryConfigManager);
    workflowCommands = new WorkflowCommands(
      context,
      repositoryConfigManager,
      workflowRepositoryProvider
    );

    console.log('Workflow repository system initialized');
  } catch (error) {
    console.error('Failed to initialize workflow repository:', error);
    vscode.window.showErrorMessage(
      'Failed to initialize workflow repository. Workflow features may not work correctly.'
    );
    throw error;
  }
}

/**
 * Initialize Language Server
 */
async function initializeLanguageServer(context: vscode.ExtensionContext): Promise<void> {
  console.log('Initializing ExtremeXP Language Server...');

  try {
    languageClientManager = new LanguageClientManager(context);
    await languageClientManager.start();
    console.log('Language Server started successfully');
  } catch (error) {
    console.error('Failed to start Language Server:', error);
    vscode.window.showWarningMessage(
      'Failed to start ExtremeXP Language Server. Language features may not work correctly.'
    );
    throw error;
  }
}

/**
 * Register experiment-related commands after services are initialized
 */
function registerExperimentCommands(context: vscode.ExtensionContext): void {
  // Services should be initialized by now, but add safety checks
  if (!experimentService || !progressPanelManager) {
    console.error('Cannot register experiment commands: services not initialized');
    return;
  }

  console.log('Registering experiment commands...');

  // Initialize commands with properly initialized services
  const generateArtifactCommand = new GenerateArtifactCommand(toolExecutor);
  const runExperimentCommand = new RunExperimentCommand(experimentService, progressPanelManager);

  // Register experiment commands
  registerCommand(context, 'extremexp.generateArtifact', () => {
    return generateArtifactCommand.execute();
  });

  registerCommand(context, 'extremexp.runExperiment', () => {
    return runExperimentCommand.execute();
  });

  registerCommand(context, 'extremexp.showProgress', () => {
    progressPanelManager.showPanel();
  });

  console.log('Experiment commands registered successfully');
}

/**
 * Register utility and server management commands
 */
function registerUtilityCommands(context: vscode.ExtensionContext): void {
  console.log('Registering utility commands...');

  // Server management commands
  registerCommand(context, 'extremexp.stopServer', handleStopServer);
  registerCommand(context, 'extremexp.restartServer', handleRestartServer);

  // Tool management commands
  registerCommand(context, 'extremexp.clearToolCache', () => {
    if (toolResolver) {
      toolResolver.clearCache();
      vscode.window.showInformationMessage('Tool cache cleared');
    } else {
      vscode.window.showErrorMessage('Tool resolver not available. Please restart the extension.');
    }
  });

  // Language Server commands
  registerCommand(context, 'extremexp.restartLanguageServer', async () => {
    if (languageClientManager) {
      await languageClientManager.restart();
      vscode.window.showInformationMessage('ExtremeXP Language Server restarted');
    } else {
      vscode.window.showErrorMessage(
        'Language server not available. Please restart the extension.'
      );
    }
  });

  // Register workflow repository commands (with delayed registration)
  // This will be called after workflow repository is initialized
  setTimeout(() => {
    if (workflowCommands) {
      workflowCommands.registerCommands();
    }
  }, 100);

  console.log('Utility commands registered successfully');
}

/**
 * Setup workflow repository tree view
 */
function setupWorkflowRepositoryView(context: vscode.ExtensionContext): void {
  // Only setup if workflow repository is initialized
  if (workflowRepositoryProvider) {
    // Register tree data provider
    const treeView = vscode.window.createTreeView('extremexp.workflows.repositories', {
      treeDataProvider: workflowRepositoryProvider,
      showCollapseAll: true,
      canSelectMany: false,
    });

    context.subscriptions.push(treeView);
  }
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
  if (serverManager) {
    await serverManager.stopServer();
    vscode.window.showInformationMessage('ExtremeXP server stopped');
  } else {
    vscode.window.showWarningMessage('Server manager not available');
  }
}

/**
 * Handle restart server command
 */
async function handleRestartServer(): Promise<void> {
  if (serverManager) {
    await serverManager.restartServer();
    vscode.window.showInformationMessage('ExtremeXP server restarted');
  } else {
    vscode.window.showWarningMessage('Server manager not available');
  }
}

/**
 * Setup status bar item
 */
function setupStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  // Set initial status - will be updated when server manager is available
  updateStatusBarItem(statusBarItem, 'stopped');
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
 * Update status bar with server manager when it becomes available
 */
function updateStatusBarWithServerManager(): void {
  if (statusBarItem && serverManager) {
    setupStatusBarListener();
  }
}

/**
 * Setup status bar change listener
 */
function setupStatusBarListener(): void {
  if (serverManager && statusBarItem) {
    // Set up the status change listener
    serverManager.onStatusChange(status => {
      updateStatusBarItem(statusBarItem, status);
    });

    // Get current status and update immediately
    const currentStatus = serverManager.getStatus();
    updateStatusBarItem(statusBarItem, currentStatus);
  } else {
    // Set error status if server manager is not available
    if (statusBarItem) {
      updateStatusBarItem(statusBarItem, 'error');
    }
  }
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
        // Only reload server configuration if server-related settings changed and server manager exists
        if (e.affectsConfiguration('extremexp.server') && serverManager) {
          serverManager.reloadConfiguration();
        }

        // Clear cache when tool-related configuration changes and tool resolver exists
        if (e.affectsConfiguration('extremexp.tools') && toolResolver) {
          toolResolver.clearCache();
        }

        // Update workflow enabled context if that setting changed
        if (e.affectsConfiguration('extremexp.workflows.enabled')) {
          await setupWorkflowFeatures();
        }

        // Restart language server if language-related settings changed and language client manager exists
        if (e.affectsConfiguration('extremexp.language') && languageClientManager) {
          try {
            await languageClientManager.restart();
          } catch (error) {
            console.error('Failed to restart language server after configuration change:', error);
          }
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
