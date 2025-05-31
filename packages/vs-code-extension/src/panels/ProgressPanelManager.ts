import * as vscode from 'vscode';
import { ProgressPanel } from './ProgressPanel.js';
import { ExperimentService } from '../services/ExperimentService.js';

export class ProgressPanelManager {
  private panels: Map<string, ProgressPanel> = new Map();
  private activePanel: ProgressPanel | null = null;

  constructor(
    private context: vscode.ExtensionContext,
    private experimentService: ExperimentService
  ) {}

  async createOrShowPanel(): Promise<ProgressPanel> {
    if (this.activePanel && !this.activePanel.isDisposed()) {
      this.activePanel.show();
      return this.activePanel;
    }

    const panel = new ProgressPanel(this.context, this.experimentService);
    this.activePanel = panel;

    panel.onDidDispose(() => {
      if (this.activePanel === panel) {
        this.activePanel = null;
      }
      this.panels.delete(panel.getExperimentId() || '');
    });

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

  dispose(): void {
    this.panels.forEach(panel => panel.dispose());
    this.panels.clear();
    this.activePanel = null;
  }
}