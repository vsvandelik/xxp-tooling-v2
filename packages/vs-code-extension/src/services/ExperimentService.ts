import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { ServerManager } from './ServerManager.js';
import {
  ExperimentProgress,
  StartExperimentResponse,
  UserInputRequest,
  ValidationResult,
  TaskHistoryItem,
} from '../types/experiment.types.js';
import { RunResult } from '@extremexp/experiment-runner';

export interface ExperimentCallbacks {
  onProgress?: (progress: ExperimentProgress) => void;
  onComplete?: (result: RunResult) => void;
  onError?: (error: Error) => void;
}

export class ExperimentService {
  private socket: Socket | null = null;
  private activeExperiments: Map<string, ExperimentCallbacks> = new Map();
  private userInputCallbacks: Map<string, (request: UserInputRequest) => void> = new Map();

  constructor(private serverManager: ServerManager) {
    this.serverManager.onStatusChange((status) => {
      if (status === 'running') {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private async connect(): Promise<void> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      return;
    }

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to ExtremeXP server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from ExtremeXP server');
    });

    // Set up event handlers
    this.socket.on('progress', (data: ExperimentProgress) => {
      const callbacks = this.activeExperiments.get(data.experimentId);
      callbacks?.onProgress?.(data);
    });

    this.socket.on('complete', (data: { experimentId: string; result: any }) => {
      const callbacks = this.activeExperiments.get(data.experimentId);
      callbacks?.onComplete?.(data.result);
      this.activeExperiments.delete(data.experimentId);
      this.socket?.emit('unsubscribe', data.experimentId);
    });

    this.socket.on('error', (data: { experimentId: string; error: any }) => {
      const callbacks = this.activeExperiments.get(data.experimentId);
      callbacks?.onError?.(new Error(data.error.message || 'Unknown error'));
      this.activeExperiments.delete(data.experimentId);
      this.socket?.emit('unsubscribe', data.experimentId);
    });

    this.socket.on('inputRequired', async (request: UserInputRequest) => {
      const inputCallback = this.userInputCallbacks.get(request.experimentId);
      if (inputCallback) {
        inputCallback(request);
      } else {
        // Handle input directly if no callback registered
        await this.handleUserInput(request);
      }
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeExperiments.clear();
  }

  async startExperiment(
    artifactPath: string,
    options: {
      resume?: boolean;
      onProgress?: (progress: ExperimentProgress) => void;
      onComplete?: (result: RunResult) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<string> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('Server not running');
    }

    // Make API call to start experiment
    const response = await fetch(`${serverUrl}/api/experiments/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artifactPath,
        resume: options.resume,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start experiment');
    }

    const data: StartExperimentResponse = await response.json();
    const experimentId = data.experimentId;

    // Register callbacks
    const callbacks: ExperimentCallbacks = {};
    if (options.onProgress) callbacks.onProgress = options.onProgress;
    if (options.onComplete) callbacks.onComplete = options.onComplete;
    if (options.onError) callbacks.onError = options.onError;
    this.activeExperiments.set(experimentId, callbacks);

    // Subscribe to updates
    if (this.socket) {
      this.socket.emit('subscribe', experimentId);
    }

    // Set up user input handler
    this.userInputCallbacks.set(experimentId, async (request) => {
      await this.handleUserInput(request);
    });

    return experimentId;
  }

  async terminateExperiment(experimentId: string): Promise<boolean> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('Server not running');
    }

    const response = await fetch(`${serverUrl}/api/experiments/${experimentId}/terminate`, {
      method: 'POST',
    });

    if (!response.ok) {
      return false;
    }

    // Clean up
    this.activeExperiments.delete(experimentId);
    this.userInputCallbacks.delete(experimentId);
    if (this.socket) {
      this.socket.emit('unsubscribe', experimentId);
    }

    return true;
  }

  async getExperimentStatus(
    experimentName: string,
    version: string
  ): Promise<any> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      return null;
    }

    // First get active experiments
    const activeResponse = await fetch(`${serverUrl}/api/experiments/active`);
    if (activeResponse.ok) {
      const { experiments } = await activeResponse.json();
      const active = experiments.find(
        (exp: any) => exp.experimentName === experimentName && exp.experimentVersion === version
      );
      if (active) {
        return active.status;
      }
    }

    return null;
  }

  async getExperimentHistory(
    experimentId: string,
    options: {
      limit?: number;
      offset?: number;
      spaceId?: string;
      taskId?: string;
    } = {}
  ): Promise<TaskHistoryItem[]> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('Server not running');
    }

    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.spaceId) params.set('spaceId', options.spaceId);
    if (options.taskId) params.set('taskId', options.taskId);

    const response = await fetch(
      `${serverUrl}/api/experiments/${experimentId}/history?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch experiment history');
    }

    const data = await response.json();
    return data.tasks;
  }

  async validateArtifact(artifactPath: string): Promise<ValidationResult> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('Server not running');
    }

    const response = await fetch(`${serverUrl}/api/experiments/validate-artifact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ artifactPath }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate artifact');
    }

    return await response.json();
  }

  private async handleUserInput(request: UserInputRequest): Promise<void> {
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
    const serverUrl = await this.serverManager.getServerUrl();
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

  registerUserInputHandler(
    experimentId: string,
    handler: (request: UserInputRequest) => void
  ): void {
    this.userInputCallbacks.set(experimentId, handler);
  }

  unregisterUserInputHandler(experimentId: string): void {
    this.userInputCallbacks.delete(experimentId);
  }
}