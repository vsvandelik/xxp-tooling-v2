/**
 * Experiment service for managing experiment execution and communication.
 * Provides WebSocket-based real-time communication with the experiment runner server,
 * handles experiment lifecycle, progress tracking, and user input management.
 */

import { RunResult } from '@extremexp/experiment-runner';
import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';

import {
  ExperimentProgress,
  StartExperimentResponse,
  UserInputRequest,
  ValidationResult,
  TaskHistoryItem,
} from '../types/experiment.types.js';

import { ServerManager } from './ServerManager.js';

/**
 * Callback functions for experiment lifecycle events.
 * Provides hooks for progress updates, completion, and error handling.
 */
export interface ExperimentCallbacks {
  /** Called when experiment progress updates are received */
  onProgress?: (progress: ExperimentProgress) => void;
  /** Called when experiment completes successfully */
  onComplete?: (result: RunResult) => void;
  /** Called when experiment encounters an error */
  onError?: (error: Error) => void;
}

/**
 * Service for managing experiment execution and real-time communication.
 * Handles WebSocket connections, experiment lifecycle, and user interaction.
 */
export class ExperimentService {
  /** WebSocket connection to the experiment runner server */
  private socket: Socket | null = null;
  /** Map of active experiments and their callback handlers */
  private activeExperiments: Map<string, ExperimentCallbacks> = new Map();
  /** Map of user input callbacks for interactive experiments */
  private userInputCallbacks: Map<string, (request: UserInputRequest) => void> = new Map();

  /**
   * Creates a new experiment service instance.
   * Sets up automatic WebSocket connection management based on server status.
   * 
   * @param serverManager - Server manager for experiment runner server lifecycle
   */
  constructor(private serverManager: ServerManager) {
    this.serverManager.onStatusChange(status => {
      if (status === 'running') {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  /**
   * Establishes WebSocket connection to the experiment runner server.
   * Sets up event handlers for real-time communication and error handling.
   * 
   * @throws Error if connection fails or times out
   */
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

  /**
   * Disconnects from the experiment runner server and cleans up resources.
   * Clears all active experiment tracking and closes WebSocket connection.
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeExperiments.clear();
  }

  /**
   * Starts a new experiment or resumes an existing one.
   * Ensures server is running, establishes WebSocket connection, and sets up callbacks.
   * 
   * @param artifactPath - Absolute path to the experiment artifact JSON file
   * @param options - Experiment options including resume flag and callback handlers
   * @returns Promise resolving to unique experiment identifier
   * @throws Error if server is not available or experiment start fails
   */
  async startExperiment(
    artifactPath: string,
    options: {
      resume?: boolean;
      onProgress?: (progress: ExperimentProgress) => void;
      onComplete?: (result: RunResult) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<string> {
    // Ensure server is running
    await this.serverManager.ensureServerRunning();

    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('ExtremeXP server is not running. Please start the server first.');
    }

    // Ensure WebSocket connection is established
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }

    // Generate a unique experiment ID
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || 'Failed to start experiment');
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
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Cannot connect to ExtremeXP server. Please check if the server is running.'
        );
      }
      throw error;
    }
  }

  /**
   * Terminates a running experiment and cleans up resources.
   * 
   * @param experimentId - Unique identifier of the experiment to terminate
   * @returns Promise resolving to true if termination succeeded
   * @throws Error if server is not available
   */
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

  /**
   * Gets the current status of an experiment by name and version.
   * 
   * @param experimentName - Name of the experiment
   * @param version - Version of the experiment
   * @returns Promise resolving to experiment status or null if not found
   */
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

  /**
   * Retrieves the execution history for a specific experiment.
   * 
   * @param experimentId - Unique identifier of the experiment
   * @param options - Query options for filtering and pagination
   * @returns Promise resolving to array of task history items
   * @throws Error if server is not available or request fails
   */
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

  /**
   * Validates an artifact file for experiment execution.
   * 
   * @param artifactPath - Absolute path to the artifact JSON file
   * @returns Promise resolving to validation result with errors and warnings
   * @throws Error if server is not available or validation fails
   */
  async validateArtifact(artifactPath: string): Promise<ValidationResult> {
    // Ensure server is running
    await this.serverManager.ensureServerRunning();

    const serverUrl = await this.serverManager.getServerUrl();
    if (!serverUrl) {
      throw new Error('ExtremeXP server is not running. Please start the server first.');
    }

    try {
      const response = await fetch(`${serverUrl}/api/experiments/validate-artifact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifactPath }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to validate artifact: ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Cannot connect to ExtremeXP server. Please check if the server is running.'
        );
      }
      throw error;
    }
  }

  /**
   * Handles user input requests from running experiments.
   * Shows VS Code input dialog and submits response to server.
   * 
   * @param request - User input request from the experiment
   */
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

  /**
   * Registers a custom user input handler for an experiment.
   * 
   * @param experimentId - Unique identifier of the experiment
   * @param handler - Custom handler function for user input requests
   */
  registerUserInputHandler(
    experimentId: string,
    handler: (request: UserInputRequest) => void
  ): void {
    this.userInputCallbacks.set(experimentId, handler);
  }

  /**
   * Unregisters the user input handler for an experiment.
   * 
   * @param experimentId - Unique identifier of the experiment
   */
  unregisterUserInputHandler(experimentId: string): void {
    this.userInputCallbacks.delete(experimentId);
  }
}
