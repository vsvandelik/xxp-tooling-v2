import * as vscode from 'vscode';
import * as path from 'path';
import { ToolExecutor } from '../services/ToolExecutor.js';

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export class GenerateArtifactCommand {
  constructor(private toolExecutor: ToolExecutor) {}

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
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

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
            await this.handleSuccess(result, workspaceFolder);
          } else {
            await this.handleFailure(result);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Artifact generation failed: ${error}`);
        }
      }
    );
  }

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

  private async handleSuccess(
    result: { artifactPath?: string; validation: ValidationResult },
    workspaceFolder?: vscode.WorkspaceFolder
  ): Promise<void> {
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

  private async openArtifact(artifactPath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(artifactPath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open artifact: ${error}`);
    }
  }
}
