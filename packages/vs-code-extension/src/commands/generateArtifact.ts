/**
 * Generate Artifact command for converting ESPACE files to JSON artifacts.
 * Provides VS Code command integration for running the artifact generator tool
 * with progress reporting, validation feedback, and result handling.
 */

import * as path from 'path';

import * as vscode from 'vscode';

import { ToolExecutor } from '../services/ToolExecutor.js';

/**
 * Result of artifact generation validation process.
 * Contains errors and warnings extracted from tool output.
 */
interface ValidationResult {
  /** Array of error messages from validation */
  errors: string[];
  /** Array of warning messages from validation */
  warnings: string[];
}

/**
 * Command class for generating JSON artifacts from ESPACE experiment files.
 * Handles the complete workflow from file validation to result presentation.
 */
export class GenerateArtifactCommand {
  /**
   * Creates a new generate artifact command instance.
   * 
   * @param toolExecutor - Tool executor for running the artifact generator
   */
  constructor(private toolExecutor: ToolExecutor) {}

  /**
   * Executes the generate artifact command for the currently active ESPACE file.
   * Validates file type, runs artifact generation with progress reporting,
   * and handles success/failure scenarios with user feedback.
   * 
   * @throws Error if file operations or tool execution fails
   */
  async execute(): Promise<void> {
    // Check if active editor has .espace file
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('No active editor found. Please open an ESPACE file.');
      return;
    }

    const document = activeEditor.document;
    if (!document.fileName.endsWith('.espace')) {
      vscode.window.showErrorMessage(
        'Active file is not an ESPACE file. Please open an ESPACE file first.'
      );
      return;
    }

    // Save the document if it has unsaved changes
    if (document.isDirty) {
      const saved = await document.save();
      if (!saved) {
        vscode.window.showErrorMessage('Failed to save ESPACE file.');
        return;
      }
    }

    const espacePath = document.fileName;

    // Create progress notification
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Artifact',
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({ increment: 0, message: 'Starting artifact generation...' });

        try {
          const result = await this.runArtifactGenerator(espacePath, token);

          if (result.success) {
            await this.handleSuccess(result);
          } else {
            await this.handleFailure(result);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Artifact generation failed: ${error}`);
        }
      }
    );
  }

  /**
   * Runs the artifact generator tool on the specified ESPACE file.
   * 
   * @param espacePath - Absolute path to the ESPACE file
   * @param cancellationToken - VS Code cancellation token for user cancellation
   * @returns Promise resolving to generation result with validation information
   */
  private async runArtifactGenerator(
    espacePath: string,
    cancellationToken: vscode.CancellationToken
  ): Promise<{
    success: boolean;
    artifactPath?: string;
    validation: ValidationResult;
    error?: string;
  }> {
    const result = await this.toolExecutor.execute('artifact-generator', {
      args: [espacePath],
      cwd: path.dirname(espacePath),
      cancellationToken,
    });

    const validation = this.parseValidationOutput(result.stdout + result.stderr);

    if (result.success) {
      // Extract artifact path from output
      const pathMatch = result.stdout.match(/Artifact generated successfully:\s*(.+)/);
      const artifactPath = pathMatch
        ? pathMatch[1]!.trim()
        : path.join(path.dirname(espacePath), 'artifact.json');

      return {
        success: true,
        artifactPath,
        validation,
      };
    } else {
      return {
        success: false,
        validation,
        error: result.stderr || result.stdout || 'Unknown error',
      };
    }
  }

  /**
   * Parses tool output to extract validation errors and warnings.
   * 
   * @param output - Combined stdout and stderr from tool execution
   * @returns Validation result with categorized errors and warnings
   */
  private parseValidationOutput(output: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Validation error:') || line.includes('Error:')) {
        const error = line.replace(/^.*?(Validation error:|Error:)\s*/, '').trim();
        if (error) {
          errors.push(error);
        }
      } else if (line.includes('Validation warning:') || line.includes('Warning:')) {
        const warning = line.replace(/^.*?(Validation warning:|Warning:)\s*/, '').trim();
        if (warning) {
          warnings.push(warning);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Handles successful artifact generation by showing appropriate user feedback.
   * Offers options to view warnings or open the generated artifact.
   * 
   * @param result - Successful generation result with artifact path and validation
   */
  private async handleSuccess(result: {
    artifactPath?: string;
    validation: ValidationResult;
  }): Promise<void> {
    // Show validation results if any
    if (result.validation.warnings.length > 0) {
      const warningMessage = `Artifact generated with ${result.validation.warnings.length} warning(s)`;
      const action = await vscode.window.showWarningMessage(
        warningMessage,
        'Show Warnings',
        'Open Artifact'
      );

      if (action === 'Show Warnings') {
        await this.showValidationResults(result.validation);
      } else if (action === 'Open Artifact' && result.artifactPath) {
        await this.openArtifact(result.artifactPath);
      }
    } else {
      // No warnings, just show success
      const action = await vscode.window.showInformationMessage(
        'Artifact generated successfully!',
        'Open Artifact'
      );

      if (action === 'Open Artifact' && result.artifactPath) {
        await this.openArtifact(result.artifactPath);
      }
    }
  }

  /**
   * Handles failed artifact generation by showing error information.
   * Offers option to view detailed validation errors.
   * 
   * @param result - Failed generation result with validation errors
   */
  private async handleFailure(result: {
    validation: ValidationResult;
    error?: string;
  }): Promise<void> {
    if (result.validation.errors.length > 0) {
      const errorMessage = `Artifact generation failed with ${result.validation.errors.length} error(s)`;
      const action = await vscode.window.showErrorMessage(errorMessage, 'Show Details');

      if (action === 'Show Details') {
        await this.showValidationResults(result.validation);
      }
    } else {
      vscode.window.showErrorMessage(
        `Artifact generation failed: ${result.error || 'Unknown error'}`
      );
    }
  }

  /**
   * Shows detailed validation results in a VS Code output channel.
   * Displays errors and warnings in a formatted, readable manner.
   * 
   * @param validation - Validation result containing errors and warnings
   */
  private async showValidationResults(validation: ValidationResult): Promise<void> {
    // Create output channel for validation results
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
   * Opens the generated artifact JSON file in VS Code editor.
   * 
   * @param artifactPath - Absolute path to the generated artifact file
   * @throws Error if file cannot be opened
   */
  private async openArtifact(artifactPath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(artifactPath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open artifact: ${error}`);
    }
  }
}
