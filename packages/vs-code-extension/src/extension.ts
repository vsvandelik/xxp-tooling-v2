/**
 * @fileoverview Main VS Code extension entry point for ExtremeXP workflows and experiments.
 * Provides comprehensive support for XXP and ESPACE languages including syntax highlighting,
 * language server integration, workflow repository management, and experiment execution.
 */

import * as vscode from 'vscode';

import { GenerateArtifactCommand } from './commands/generateArtifact.js';
import { RunExperimentCommand } from './commands/runExperiment.js';
import { LanguageClientManager } from './languageClient/LanguageClientManager.js';
import { ProgressPanelManager } from './panels/ProgressPanelManager.js';
import { RepositoryConfigManager } from './repository/RepositoryConfigManager.js';
import { WorkflowCommands } from './repository/WorkflowCommands.js';
import { WorkflowRepositoryProvider } from './repository/WorkflowRepositoryProvider.js';
import { ExperimentService } from './services/ExperimentService.js';
import { ServerManager } from './services/ServerManager.js';
import { ToolExecutor } from './services/ToolExecutor.js';
import { ToolResolver } from './services/ToolResolver.js';

/** Global service instances for core functionality */
/** Server manager for experiment execution server lifecycle */
let serverManager: ServerManager;
/** Service for managing experiment execution and communication */
let experimentService: ExperimentService;
/** Manager for progress panel webviews and state */
let progressPanelManager: ProgressPanelManager;
/** Tool resolver for locating ExtremeXP toolchain executables */
let toolResolver: ToolResolver;
/** Tool executor for running ExtremeXP tools with proper arguments */
let toolExecutor: ToolExecutor;
/** Language client manager for ExtremeXP language server integration */
let languageClientManager: LanguageClientManager;

/** Workflow repository system instances */
/** Configuration manager for workflow repository settings */
let repositoryConfigManager: RepositoryConfigManager;
/** Tree data provider for workflow repository browser */
let workflowRepositoryProvider: WorkflowRepositoryProvider;
/** Command handlers for workflow repository operations */
let workflowCommands: WorkflowCommands;

/** VS Code UI element references */
/** Status bar item showing ExtremeXP server status */
let statusBarItem: vscode.StatusBarItem;

/**
 * Main extension activation function called when VS Code loads the extension.
 * Initializes all services, registers commands, sets up UI elements, and configures
 * language support for XXP and ESPACE files.
 * 
 * @param context - VS Code extension context for registrations and state management
 * @throws Error if critical services fail to initialize
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
    const featureNames = ['Workflow Repository', 'Language Server', 'Workflow Features'];
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
 * Initializes core services required for experiment execution.
 * Sets up server manager, experiment service, and progress panel management.
 * 
 * @param context - VS Code extension context
 * @throws Error if any core service fails to initialize
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
 * Initializes the workflow repository system for browsing and managing workflows.
 * Sets up configuration management, tree data provider, and command handlers.
 * 
 * @param context - VS Code extension context
 * @throws Error if workflow repository system fails to initialize
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
 * Initializes the ExtremeXP Language Server for XXP and ESPACE language support.
 * Provides syntax highlighting, code completion, diagnostics, and other language features.
 * 
 * @param context - VS Code extension context
 * @throws Error if language server fails to start
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
 * Registers experiment-related commands after core services are initialized.
 * Includes generate artifact, run experiment, and show progress commands.
 * 
 * @param context - VS Code extension context for command registration
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
 * Registers utility and server management commands.
 * Includes server control, tool cache management, and language server restart commands.
 * 
 * @param context - VS Code extension context for command registration
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
 * Sets up the workflow repository tree view in VS Code's explorer sidebar.
 * Creates and registers the tree data provider for browsing workflow repositories.
 * 
 * @param context - VS Code extension context
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
 * Utility function to register a command with proper subscription management.
 * 
 * @param context - VS Code extension context
 * @param command - Command identifier string
 * @param handler - Command handler function
 */
function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  handler: (...args: unknown[]) => unknown
): void {
  context.subscriptions.push(vscode.commands.registerCommand(command, handler));
}

/**
 * Handles the stop server command by stopping the experiment runner server.
 * 
 * @throws Error if server manager is not available
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
 * Handles the restart server command by restarting the experiment runner server.
 * 
 * @throws Error if server manager is not available
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
 * Sets up the status bar item showing ExtremeXP server status.
 * 
 * @param context - VS Code extension context for subscription management
 */
function setupStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  // Set initial status - will be updated when server manager is available
  updateStatusBarItem(statusBarItem, 'stopped');
}

/**
 * Creates and configures the ExtremeXP status bar item.
 * 
 * @returns Configured status bar item with icon, tooltip, and command
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
 * Updates the status bar with server manager when it becomes available.
 * Sets up the status change listener after server manager initialization.
 */
function updateStatusBarWithServerManager(): void {
  if (statusBarItem && serverManager) {
    setupStatusBarListener();
  }
}

/**
 * Sets up the status bar change listener to reflect server status changes.
 * Updates the status bar item appearance based on server state.
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
 * Updates the status bar item appearance based on server status.
 * 
 * @param statusBarItem - VS Code status bar item to update
 * @param status - Server status ('running', 'stopped', 'error')
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
 * Sets up configuration change listener for ExtremeXP settings.
 * Handles dynamic updates to server, tool, workflow, and language settings.
 * 
 * @param context - VS Code extension context for subscription management
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
 * Sets up workflow repository features and VS Code context variables.
 * Updates the workflow enabled context for command visibility control.
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
 * Extension deactivation function called when VS Code unloads the extension.
 * Cleans up all services, stops servers, and disposes of resources.
 * 
 * @throws Error if cleanup operations fail (errors are logged but not thrown)
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
 * Cleans up all services during extension deactivation.
 * Stops servers, disposes managers, and releases resources with timeout protection.
 * 
 * @throws Error if any cleanup operation fails
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
