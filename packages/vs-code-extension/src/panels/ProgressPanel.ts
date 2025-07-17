import * as vscode from 'vscode';

import { ExperimentService } from '../services/ExperimentService.js';
import { ExperimentProgress, UserInputRequest } from '../types/experiment.types.js';

import { WebviewController } from './WebviewController.js';
import { WebviewRenderer } from './WebviewRenderer.js';
import { TaskHistoryItem } from './WebviewState.js';

export class ProgressPanel {
  private panel: vscode.WebviewPanel;
  private experimentId: string | null = null;
  private artifactPath: string | null = null;
  private disposed = false;
  private webviewController: WebviewController;

  constructor(
    private context: vscode.ExtensionContext,
    private experimentService: ExperimentService,
    private onExperimentStopped?: (experimentId: string) => void
  ) {
    this.webviewController = new WebviewController();

    this.panel = vscode.window.createWebviewPanel(
      'extremexpProgress',
      'ExtremeXP Progress',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.updateContent();
    this.setupMessageHandlers();

    this.panel.onDidDispose(() => {
      this.disposed = true;
    });
  }

  setExperimentId(experimentId: string): void {
    this.experimentId = experimentId;
    this.webviewController.setExperimentId(experimentId);
    this.updateContent();

    // Register user input handler
    this.experimentService.registerUserInputHandler(experimentId, request => {
      this.handleUserInputRequest(request);
    });
  }

  setArtifactPath(artifactPath: string): void {
    this.artifactPath = artifactPath;
  }

  async updateProgress(progress: ExperimentProgress): Promise<void> {
    this.webviewController.updateProgress(progress);
    await this.updateHistoryIfVisible();
    this.updateContent();
  }

  async setCompleted(): Promise<void> {
    this.webviewController.setCompleted();
    await this.updateHistoryIfVisible();
    this.updateContent();
    // Notify parent manager that experiment completed
    if (this.onExperimentStopped && this.experimentId) {
      this.onExperimentStopped(this.experimentId);
    }
  }

  async setError(error: Error): Promise<void> {
    this.webviewController.setError(error.message);
    await this.updateHistoryIfVisible();
    this.updateContent();
    // Notify parent manager that experiment failed
    if (this.onExperimentStopped && this.experimentId) {
      this.onExperimentStopped(this.experimentId);
    }
  }

  private updateContent(): void {
    // Don't update content if webview is disposed
    if (this.disposed) {
      return;
    }

    const state = this.webviewController.getState();
    this.panel.webview.html = WebviewRenderer.renderContent(state);
  }

  show(): void {
    this.panel.reveal();
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  getExperimentId(): string | null {
    return this.experimentId;
  }

  dispose(): void {
    if (this.experimentId) {
      this.experimentService.unregisterUserInputHandler(this.experimentId);
    }
    this.panel.dispose();
  }

  onDidDispose(callback: () => void): vscode.Disposable {
    return this.panel.onDidDispose(callback);
  }

  private setupMessageHandlers(): void {
    this.panel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'terminate':
          await this.handleTerminate();
          break;
        case 'resume':
          await this.handleResume();
          break;
        case 'toggleHistory':
          await this.handleToggleHistory();
          break;
        case 'toggleLogs':
          this.handleToggleLogs();
          break;
        case 'userInputResponse':
          await this.handleUserInputResponse(message.data);
          break;
        case 'cancelUserInput':
          this.handleCancelUserInput();
          break;
        case 'openOutput':
          await this.handleOpenOutput(message.path);
          break;
      }
    });
  }

  private async handleTerminate(): Promise<void> {
    if (!this.experimentId) return;

    const confirmed = await vscode.window.showWarningMessage(
      'Are you sure you want to terminate this experiment?',
      'Yes',
      'No'
    );

    if (confirmed === 'Yes') {
      const terminated = await this.experimentService.terminateExperiment(this.experimentId);
      if (terminated) {
        this.webviewController.setTerminated();
        this.updateContent();
        // Notify parent manager that experiment was stopped
        if (this.onExperimentStopped) {
          this.onExperimentStopped(this.experimentId);
        }
      }
    }
  }

  private async handleResume(): Promise<void> {
    if (!this.experimentId) return;

    try {
      let artifactFilePath: string;

      // Use stored artifact path if available, otherwise ask user to select
      if (this.artifactPath) {
        artifactFilePath = this.artifactPath;
        vscode.window.showInformationMessage(`Resuming experiment with ${this.artifactPath}`);
      } else {
        // Ask the user to select the artifact file
        const artifactPath = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectMany: false,
          filters: {
            'Artifact Files': ['json'],
          },
          title: 'Select the artifact file to resume',
        });

        if (!artifactPath || artifactPath.length === 0) {
          return;
        }

        artifactFilePath = artifactPath[0]!.fsPath;
        // Store the path for future resumes
        this.artifactPath = artifactFilePath;
      }

      // Start the experiment with resume flag
      const newExperimentId = await this.experimentService.startExperiment(artifactFilePath, {
        resume: true,
        onProgress: async progress => {
          await this.updateProgress(progress);
        },
        onComplete: async () => {
          await this.setCompleted();
        },
        onError: async error => {
          await this.setError(error);
        },
      });

      // Unregister old experiment ID handler if it exists
      if (this.experimentId) {
        this.experimentService.unregisterUserInputHandler(this.experimentId);
      }

      // Update the experiment ID and controller
      this.experimentId = newExperimentId;
      this.webviewController.setExperimentId(newExperimentId);
      this.updateContent();

      // Register user input handler for the new experiment ID
      this.experimentService.registerUserInputHandler(newExperimentId, request => {
        this.handleUserInputRequest(request);
      });

      vscode.window.showInformationMessage('Experiment resumed successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to resume experiment: ${error}`);
    }
  }

  private async fetchAndSetHistory(): Promise<void> {
    if (!this.experimentId) return;

    const history = await this.experimentService.getExperimentHistory(this.experimentId, {
      limit: 100,
    });

    // Convert to TaskHistoryItem format
    const taskHistory: TaskHistoryItem[] = history.map(item => ({
      taskId: item.taskId || 'unknown',
      spaceId: item.spaceId || 'unknown',
      status: (item.status as 'completed' | 'failed' | 'running') || 'completed',
      parameters: Object.fromEntries(
        Object.entries(item.parameters || {}).map(([k, v]) => [k, String(v)])
      ),
      outputs: item.outputs || {},
    }));

    this.webviewController.setHistory(taskHistory);
  }

  private async updateHistoryIfVisible(): Promise<void> {
    if (!this.experimentId) return;

    // Only update history if it's currently being shown
    const state = this.webviewController.getState();
    if (!state.showHistory) return;

    try {
      await this.fetchAndSetHistory();
    } catch (error) {
      // Silent failure to avoid spamming the user with error messages
      // History will be updated on next manual toggle
      console.error('Failed to update history:', error);
    }
  }

  private async handleToggleHistory(): Promise<void> {
    if (!this.experimentId) return;

    this.webviewController.toggleHistory();

    // If we're now showing history, fetch the latest data
    const state = this.webviewController.getState();
    if (state.showHistory) {
      try {
        await this.fetchAndSetHistory();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to load history: ${error}`);
      }
    }

    this.updateContent();
  }

  private handleToggleLogs(): void {
    this.webviewController.toggleLogs();
    this.updateContent();
  }

  public handleUserInputRequest(request: UserInputRequest): void {
    // If panel is disposed, fall back to native VS Code input
    if (this.disposed) {
      this.handleUserInputViaNativeDialog(request);
      return;
    }

    this.webviewController.setUserInputRequest(request.requestId, request.prompt);
    this.updateContent();
  }

  private async handleUserInputResponse(data: { value: string }): Promise<void> {
    if (!this.experimentId) return;

    const state = this.webviewController.getState();
    if (!state.userInputRequest) return;

    const serverUrl = await this.experimentService['serverManager'].getServerUrl();
    if (!serverUrl) return;

    await fetch(`${serverUrl}/api/experiments/${this.experimentId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: state.userInputRequest.requestId,
        value: data.value,
      }),
    });

    this.webviewController.clearUserInputRequest();
    this.updateContent();
  }

  private handleCancelUserInput(): void {
    this.webviewController.clearUserInputRequest();
    this.updateContent();
  }

  private async handleOpenOutput(path: string): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(path);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open output: ${error}`);
    }
  }

  private async handleUserInputViaNativeDialog(request: UserInputRequest): Promise<void> {
    const value = await vscode.window.showInputBox({
      prompt: request.prompt,
      placeHolder: 'Enter value...',
      ignoreFocusOut: true,
    });

    if (value === undefined) {
      // User cancelled
      return;
    }

    // Submit the input
    const serverUrl = await this.experimentService['serverManager'].getServerUrl();
    if (!serverUrl) {
      return;
    }

    await fetch(`${serverUrl}/api/experiments/${request.experimentId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: request.requestId,
        value,
      }),
    });
  }
}
