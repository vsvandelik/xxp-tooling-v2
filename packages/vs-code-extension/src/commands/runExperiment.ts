/**
 * Run Experiment command for executing JSON artifacts.
 * Provides VS Code command integration for running experiments with artifact validation,
 * progress tracking, resume capabilities, and comprehensive result handling.
 */

import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

import { ProgressPanelManager } from '../panels/ProgressPanelManager.js';
import { ExperimentService } from '../services/ExperimentService.js';

/**
 * Command class for running experiments from JSON artifact files.
 * Handles artifact selection, validation, execution progress, and result presentation.
 */
export class RunExperimentCommand {
  /**
   * Creates a new run experiment command instance.
   *
   * @param experimentService - Service for experiment execution and management
   * @param progressPanelManager - Manager for progress panel webviews
   */
  constructor(
    private experimentService: ExperimentService,
    private progressPanelManager: ProgressPanelManager
  ) {}

  /**
   * Executes the run experiment command with full workflow handling.
   * Handles artifact selection, validation, resume detection, progress tracking,
   * and result presentation with comprehensive error handling.
   *
   * @throws Error if file operations or experiment execution fails
   */
  async execute(): Promise<void> {
    try {
      // Determine which artifact file to run
      const artifactPath = await this.selectArtifactFile();
      if (!artifactPath) {
        return;
      }

      // Validate the artifact
      const validation = await this.experimentService.validateArtifact(artifactPath);
      if (!validation.isValid) {
        const action = await vscode.window.showErrorMessage(
          'The selected artifact file contains errors and cannot be run.',
          'Show Errors'
        );

        if (action === 'Show Errors') {
          this.showValidationErrors(validation);
        }
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const action = await vscode.window.showWarningMessage(
          `The artifact contains ${validation.warnings.length} warning(s). Do you want to continue?`,
          'Continue',
          'Show Warnings',
          'Cancel'
        );

        if (action === 'Cancel' || !action) {
          return;
        } else if (action === 'Show Warnings') {
          this.showValidationErrors(validation);
          return;
        }
      }

      // Check if experiment is already running
      const artifactInfo = await this.getArtifactInfo(artifactPath);
      const existingStatus = await this.experimentService.getExperimentStatus(
        artifactInfo.experiment,
        artifactInfo.version
      );

      let resume = false;
      if (existingStatus && existingStatus === 'running') {
        vscode.window.showErrorMessage(
          'This experiment is already running. Please terminate it first.'
        );
        return;
      } else if (existingStatus && existingStatus !== 'completed') {
        const action = await vscode.window.showInformationMessage(
          'An incomplete run of this experiment was found. Do you want to resume or start fresh?',
          'Resume',
          'Start Fresh',
          'Cancel'
        );

        if (action === 'Cancel' || !action) {
          return;
        }
        resume = action === 'Resume';
      }

      // Show progress panel
      const panel = await this.progressPanelManager.createOrShowPanel();

      // Start the experiment
      const experimentId = await this.experimentService.startExperiment(artifactPath, {
        resume,
        onProgress: async progress => {
          await panel.updateProgress(progress);
        },
        onComplete: async result => {
          await panel.setCompleted();

          // Show completion notification
          const action = await vscode.window.showInformationMessage(
            `Experiment completed! ${result.summary.completedTasks} tasks completed.`,
            'View Outputs',
            'View Summary'
          );

          if (action === 'View Outputs') {
            await this.openOutputs(result.outputs);
          } else if (action === 'View Summary') {
            panel.show();
          }
        },
        onError: async error => {
          await panel.setError(error);
          vscode.window.showErrorMessage(`Experiment failed: ${error.message}`);
        },
      });

      panel.setExperimentId(experimentId);
      panel.setArtifactPath(artifactPath);
      vscode.window.showInformationMessage(
        `Experiment ${resume ? 'resumed' : 'started'}: ${artifactInfo.experiment} v${artifactInfo.version}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run experiment: ${error}`);
    }
  }

  /**
   * Prompts user to select an artifact file for experiment execution.
   * Checks active editor, searches workspace, and provides file browser fallback.
   *
   * @returns Promise resolving to selected artifact file path or undefined if cancelled
   */
  private async selectArtifactFile(): Promise<string | undefined> {
    // Check if active editor has a JSON file
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.fileName.endsWith('.json')) {
      const useActive = await vscode.window.showInformationMessage(
        `Run experiment from ${path.basename(activeEditor.document.fileName)}?`,
        'Yes',
        'Choose Different File'
      );

      if (useActive === 'Yes') {
        return activeEditor.document.fileName;
      }
    }

    // Look for artifact.json files in workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open');
      return undefined;
    }

    const artifactFiles = await this.findArtifactFiles();

    if (artifactFiles.length === 0) {
      const action = await vscode.window.showErrorMessage(
        'No artifact.json files found in workspace',
        'Browse...'
      );

      if (action === 'Browse...') {
        return this.browseForArtifact();
      }
      return undefined;
    } else if (artifactFiles.length === 1) {
      // Single artifact.json found - confirm with user
      const relativePath = vscode.workspace.asRelativePath(artifactFiles[0]!);
      const useDefault = await vscode.window.showInformationMessage(
        `Run experiment from ${relativePath}?`,
        'Yes',
        'Browse...'
      );

      if (useDefault === 'Yes') {
        return artifactFiles[0];
      } else if (useDefault === 'Browse...') {
        return this.browseForArtifact();
      }
      return undefined;
    } else {
      // Multiple artifact files - let user choose
      const items = artifactFiles.map(file => ({
        label: path.basename(file),
        description: vscode.workspace.asRelativePath(path.dirname(file)),
        path: file,
      }));

      items.push({
        label: '$(folder) Browse...',
        description: 'Select a different file',
        path: 'browse',
      });

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an artifact file to run',
      });

      if (selected) {
        if (selected.path === 'browse') {
          return this.browseForArtifact();
        }
        return selected.path;
      }
      return undefined;
    }
  }

  /**
   * Searches the workspace for artifact.json files.
   *
   * @returns Promise resolving to array of artifact file paths
   */
  private async findArtifactFiles(): Promise<string[]> {
    const pattern = new vscode.RelativePattern(
      vscode.workspace.workspaceFolders![0]!,
      '**/artifact.json'
    );

    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
    return files.map(uri => uri.fsPath);
  }

  /**
   * Opens file browser dialog for manual artifact file selection.
   *
   * @returns Promise resolving to selected file path or undefined if cancelled
   */
  private async browseForArtifact(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Artifact Files': ['json'],
        'All Files': ['*'],
      },
      title: 'Select Artifact File',
    });

    return result?.[0]?.fsPath;
  }

  /**
   * Extracts experiment metadata from artifact JSON file.
   *
   * @param artifactPath - Absolute path to the artifact file
   * @returns Promise resolving to experiment name and version
   * @throws Error if file cannot be read or parsed
   */
  private async getArtifactInfo(artifactPath: string): Promise<{
    experiment: string;
    version: string;
  }> {
    const content = await fs.promises.readFile(artifactPath, 'utf-8');
    const artifact = JSON.parse(content);
    return {
      experiment: artifact.experiment,
      version: artifact.version,
    };
  }

  /**
   * Displays validation errors and warnings in a VS Code output channel.
   *
   * @param validation - Validation result containing errors and warnings
   */
  private showValidationErrors(validation: { errors: string[]; warnings: string[] }): void {
    const outputChannel = vscode.window.createOutputChannel('ExtremeXP Artifact Validation');

    if (validation.errors.length > 0) {
      outputChannel.appendLine('ERRORS:');
      outputChannel.appendLine('=======');
      validation.errors.forEach((error, index) => {
        outputChannel.appendLine(`${index + 1}. ${error}`);
      });
      outputChannel.appendLine('');
    }

    if (validation.warnings.length > 0) {
      outputChannel.appendLine('WARNINGS:');
      outputChannel.appendLine('=========');
      validation.warnings.forEach((warning, index) => {
        outputChannel.appendLine(`${index + 1}. ${warning}`);
      });
    }

    outputChannel.show();
  }

  /**
   * Presents experiment outputs to the user with selection interface.
   * Attempts to open file outputs in editor or displays in output channel.
   *
   * @param outputs - Nested object containing space outputs with values
   */
  private async openOutputs(outputs: Record<string, Record<string, string>>): Promise<void> {
    // Create a quick pick to select which output to view
    const items: vscode.QuickPickItem[] = [];

    for (const [spaceId, spaceOutputs] of Object.entries(outputs)) {
      for (const [outputName, outputValue] of Object.entries(spaceOutputs)) {
        items.push({
          label: outputName,
          description: `Space: ${spaceId}`,
          detail: outputValue,
        });
      }
    }

    if (items.length === 0) {
      vscode.window.showInformationMessage('No outputs to display');
      return;
    }

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select output to view',
      canPickMany: false,
    });

    if (selected && selected.detail) {
      // If the output is a file path, try to open it
      if (
        selected.detail.endsWith('.json') ||
        selected.detail.endsWith('.txt') ||
        selected.detail.endsWith('.csv')
      ) {
        try {
          const doc = await vscode.workspace.openTextDocument(selected.detail);
          await vscode.window.showTextDocument(doc);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // If can't open as file, show in output channel
          const outputChannel = vscode.window.createOutputChannel('ExtremeXP Output');
          outputChannel.appendLine(`${selected.label}:`);
          outputChannel.appendLine(selected.detail);
          outputChannel.show();
        }
      } else {
        // Show in output channel
        const outputChannel = vscode.window.createOutputChannel('ExtremeXP Output');
        outputChannel.appendLine(`${selected.label}:`);
        outputChannel.appendLine(selected.detail);
        outputChannel.show();
      }
    }
  }
}
