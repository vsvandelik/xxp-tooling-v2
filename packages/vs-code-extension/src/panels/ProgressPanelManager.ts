import * as vscode from 'vscode';

import { ExperimentService } from '../services/ExperimentService.js';

import { ProgressPanel } from './ProgressPanel.js';

export class ProgressPanelManager {
  private panels: Map<string, ProgressPanel> = new Map();
  private activePanel: ProgressPanel | null = null;
  private runningExperiments: Map<string, { experimentId: string; artifactPath: string }> =
    new Map();

  constructor(
    private context: vscode.ExtensionContext,
    private experimentService: ExperimentService
  ) {}

  async createOrShowPanel(): Promise<ProgressPanel> {
    if (this.activePanel && !this.activePanel.isDisposed()) {
      this.activePanel.show();
      return this.activePanel;
    }

    const panel = new ProgressPanel(this.context, this.experimentService, experimentId => {
      this.stopTrackingExperiment(experimentId);
    });
    this.activePanel = panel;

    panel.onDidDispose(() => {
      if (this.activePanel === panel) {
        this.activePanel = null;
      }
      const experimentId = panel.getExperimentId();
      if (experimentId) {
        this.panels.delete(experimentId);
        // Keep track of running experiments even when panel is closed
        const runningExperiment = this.runningExperiments.get(experimentId);
        if (runningExperiment) {
          // Experiment is still running, just panel was closed
          console.log(
            `Panel for experiment ${experimentId} was closed, but experiment continues running`
          );
        }
      }
    });

    // If there's a running experiment, restore its state
    const runningExperimentIds = Array.from(this.runningExperiments.keys());
    if (runningExperimentIds.length > 0) {
      // For now, restore the first running experiment
      // In the future, we could show a picker if multiple experiments are running
      const experimentId = runningExperimentIds[0]!;
      const experimentInfo = this.runningExperiments.get(experimentId)!;
      panel.setExperimentId(experimentId);
      panel.setArtifactPath(experimentInfo.artifactPath);
      this.panels.set(experimentId, panel);

      // Reconnect callbacks for the restored experiment
      await this.reconnectExperimentCallbacks(experimentId, panel);
    }

    return panel;
  }

  async showPanel(): Promise<void> {
    if (this.activePanel && !this.activePanel.isDisposed()) {
      this.activePanel.show();
    } else {
      await this.createOrShowPanel();
    }
  }

  getPanel(experimentId: string): ProgressPanel | undefined {
    return this.panels.get(experimentId);
  }

  trackRunningExperiment(experimentId: string, artifactPath: string): void {
    this.runningExperiments.set(experimentId, { experimentId, artifactPath });
  }

  stopTrackingExperiment(experimentId: string): void {
    this.runningExperiments.delete(experimentId);
  }

  hasRunningExperiments(): boolean {
    return this.runningExperiments.size > 0;
  }

  getRunningExperiments(): Array<{ experimentId: string; artifactPath: string }> {
    return Array.from(this.runningExperiments.values());
  }

  private async reconnectExperimentCallbacks(
    experimentId: string,
    panel: ProgressPanel
  ): Promise<void> {
    // Set up callbacks for the restored experiment
    this.experimentService.updateExperimentCallbacks(experimentId, {
      onProgress: async progress => {
        await panel.updateProgress(progress);
      },
      onComplete: async () => {
        await panel.setCompleted();
        // Note: The panel will call onExperimentStopped callback which removes it from tracking
      },
      onError: async error => {
        await panel.setError(error);
        // Note: The panel will call onExperimentStopped callback which removes it from tracking
      },
    });

    // Also re-register the user input handler
    this.experimentService.registerUserInputHandler(experimentId, request => {
      panel.handleUserInputRequest(request);
    });

    // Fetch and display current state
    try {
      const currentState = await this.experimentService.getExperimentState(experimentId);
      if (currentState) {
        await panel.updateProgress(currentState);
      }
    } catch (error) {
      console.error('Failed to fetch current experiment state:', error);
    }
  }

  dispose(): void {
    this.panels.forEach(panel => panel.dispose());
    this.panels.clear();
    this.runningExperiments.clear();
    this.activePanel = null;
  }
}
