import { ExperimentProgress } from '../types/experiment.types.js';

import {
  WebviewState,
  LogEntry,
  TaskHistoryItem,
  createInitialWebviewState,
} from './WebviewState.js';

export class WebviewController {
  private state: WebviewState;

  constructor() {
    this.state = createInitialWebviewState();
  }

  getState(): WebviewState {
    return { ...this.state };
  }

  setExperimentId(experimentId: string): void {
    this.state.experimentName = `Experiment: ${experimentId}`;
    this.state.status = 'running';
    this.addLog(`Experiment started: ${experimentId}`);
  }

  updateProgress(progress: ExperimentProgress): void {
    this.state.status = progress.status as WebviewState['status'];
    this.state.progress = {
      percentage: progress.progress.percentage,
      completedSpaces: progress.progress.completedSpaces,
      totalSpaces: progress.progress.totalSpaces,
      completedParameterSets: progress.progress.completedParameterSets,
      totalParameterSets: progress.progress.totalParameterSets,
      completedTasks: progress.progress.completedTasks,
      totalTasks: progress.progress.totalTasks,
    };
    this.state.currentSpace = progress.currentSpace || '-';
    this.state.currentTask = progress.currentTask || '-';

    if (progress.currentTask) {
      this.addLog(`Started task: ${progress.currentTask}`);
    }
  }

  setCompleted(): void {
    this.state.status = 'completed';
    this.addLog('Experiment completed successfully');
  }

  setError(message: string): void {
    this.state.status = 'failed';
    this.addLog(`ERROR: ${message}`);
  }

  setTerminated(): void {
    this.state.status = 'terminated';
    this.addLog('Experiment terminated by user');
  }

  addLog(message: string): void {
    const time = new Date().toLocaleTimeString();
    const logEntry: LogEntry = { time, message };
    this.state.logs.push(logEntry);
  }

  setHistory(history: TaskHistoryItem[]): void {
    this.state.history = history;
  }

  toggleLogs(): void {
    this.state.showLogs = !this.state.showLogs;
  }

  toggleHistory(): void {
    this.state.showHistory = !this.state.showHistory;
  }

  setUserInputRequest(requestId: string, prompt: string): void {
    this.state.userInputRequest = { requestId, prompt };
  }

  clearUserInputRequest(): void {
    this.state.userInputRequest = undefined;
  }

  isTerminateEnabled(): boolean {
    return this.state.status === 'running';
  }

  isResumeEnabled(): boolean {
    const status = this.state.status;
    return (
      status === 'failed' || status === 'idle' || status === 'terminated' || status === 'completed'
    );
  }
}
