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
    this.serverManager.onStatusChange(status => {
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
      console.log('No server URL available for WebSocket connection');
      return;
    }

    // If already connected, don't reconnect
    if (this.socket && this.socket.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    console.log(`Attempting to connect to WebSocket at: ${serverUrl}`);
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Return a promise that resolves when connected or rejects on error
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      this.socket!.on('connect', () => {
        console.log('Connected to ExtremeXP server');
        clearTimeout(timeout);
        resolve();
      });

      this.socket!.on('connect_error', error => {
        console.log('WebSocket connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });

      this.socket!.on('disconnect', () => {
        console.log('Disconnected from ExtremeXP server');
      });

      this.socket!.on('reconnect_error', error => {
        console.log('WebSocket reconnection error:', error);
      });

      this.socket!.on('subscribed', (data: { experimentId: string }) => {
        console.log(`Subscribed to experiment: ${data.experimentId}`);
      });

      this.socket!.on('unsubscribed', (data: { experimentId: string }) => {
        console.log(`Unsubscribed from experiment: ${data.experimentId}`);
      });

      // Set up event handlers
      this.socket!.on('progress', (data: ExperimentProgress) => {
        const callbacks = this.activeExperiments.get(data.experimentId);
        if (callbacks?.onProgress) {
          callbacks.onProgress(data);
        }
      });

      this.socket!.on('complete', (data: { experimentId: string; result: RunResult }) => {
        const callbacks = this.activeExperiments.get(data.experimentId);
        callbacks?.onComplete?.(data.result);
        this.activeExperiments.delete(data.experimentId);
        this.socket?.emit('unsubscribe', data.experimentId);
      });

      this.socket!.on('error', (data: { experimentId: string; error: { message?: string } }) => {
        const callbacks = this.activeExperiments.get(data.experimentId);
        callbacks?.onError?.(new Error(data.error.message || 'Unknown error'));
        this.activeExperiments.delete(data.experimentId);
        this.socket?.emit('unsubscribe', data.experimentId);
      });

      this.socket!.on('inputRequired', async (request: UserInputRequest) => {
        const inputCallback = this.userInputCallbacks.get(request.experimentId);
        if (inputCallback) {
          inputCallback(request);
        } else {
          // Handle input directly if no callback registered
          await this.handleUserInput(request);
        }
      });
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

    // Ensure WebSocket connection is established
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }

    // Generate a unique experiment ID
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Make API call to start experiment
    const response = await fetch(`${serverUrl}/api/experiments/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artifactPath,
        experimentId,
        resume: options.resume,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start experiment');
    }

    const data: StartExperimentResponse = await response.json();
    // Server should return the same experimentId we provided
    const returnedExperimentId = data.experimentId;

    console.log(
      `Generated experiment ID: ${experimentId}, Server returned: ${returnedExperimentId}`
    );

    // Use the returned experiment ID (should be the same as what we sent)
    const finalExperimentId = returnedExperimentId;

    // Register callbacks
    const callbacks: ExperimentCallbacks = {};
    if (options.onProgress) callbacks.onProgress = options.onProgress;
    if (options.onComplete) callbacks.onComplete = options.onComplete;
    if (options.onError) callbacks.onError = options.onError;
    this.activeExperiments.set(finalExperimentId, callbacks);

    // Subscribe to updates - connection should be established by now
    if (this.socket && this.socket.connected) {
      console.log(`Subscribing to experiment: ${finalExperimentId}`);
      this.socket.emit('subscribe', finalExperimentId);
    } else {
      console.log('No socket connection available for subscription');
      throw new Error('WebSocket connection not available');
    }

    // Set up user input handler
    this.userInputCallbacks.set(finalExperimentId, async (request: UserInputRequest) => {
      await this.handleUserInput(request);
    });

    return finalExperimentId;
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

  async getExperimentStatus(experimentName: string, version: string): Promise<string | null> {
    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      return null;
    }

    // First get active experiments
    const activeResponse = await fetch(`${serverUrl}/api/experiments/active`);
    if (activeResponse.ok) {
      const { experiments } = await activeResponse.json();
      const active = experiments.find(
        (exp: { experimentName: string; experimentVersion: string; status: string }) =>
          exp.experimentName === experimentName && exp.experimentVersion === version
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

    const response = await fetch(`${serverUrl}/api/experiments/${experimentId}/history?${params}`);

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
