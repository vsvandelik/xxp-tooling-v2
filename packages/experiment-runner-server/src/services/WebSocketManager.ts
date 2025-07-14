/**
 * @fileoverview WebSocket manager for real-time experiment communication.
 * Handles client subscriptions, progress updates, and user input requests via Socket.IO.
 */

import { RunResult } from '@extremexp/experiment-runner';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { ExperimentProgress, UserInputRequest, UserInputResponse } from '../types/server.types.js';

import { ExperimentService } from './ExperimentService.js';

/**
 * Represents a connected WebSocket client and their experiment subscriptions.
 */
interface ClientConnection {
  /** Unique socket identifier */
  socketId: string;
  /** Set of experiment IDs this client is subscribed to */
  experimentIds: Set<string>;
}

/**
 * Manages WebSocket connections for real-time experiment monitoring.
 * Handles client subscriptions, broadcasts progress updates, and manages user input requests.
 */
export class WebSocketManager {
  private connections: Map<string, ClientConnection> = new Map();
  private experimentSockets: Map<string, Set<string>> = new Map();

  /**
   * Creates a new WebSocket manager.
   * 
   * @param io - Socket.IO server instance
   * @param experimentService - Experiment service for handling requests
   */
  constructor(
    private io: SocketIOServer,
    private experimentService: ExperimentService
  ) {}

  /**
   * Initializes WebSocket event handlers and starts listening for connections.
   */
  initialize(): void {
    this.io.on('connection', socket => {
      console.log(`Client connected: ${socket.id}`);

      this.connections.set(socket.id, {
        socketId: socket.id,
        experimentIds: new Set(),
      });

      this.setupSocketHandlers(socket);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket.id);
      });
    });
  }

  /**
   * Sets up event handlers for a new socket connection.
   * 
   * @param socket - The socket connection to configure
   */
  private setupSocketHandlers(socket: Socket): void {
    // Subscribe to experiment updates
    socket.on('subscribe', (experimentId: string) => {
      console.log(`Client ${socket.id} subscribing to experiment: ${experimentId}`);
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.experimentIds.add(experimentId);

        // Add socket to experiment's socket set
        if (!this.experimentSockets.has(experimentId)) {
          this.experimentSockets.set(experimentId, new Set());
        }
        this.experimentSockets.get(experimentId)!.add(socket.id);

        socket.join(`experiment:${experimentId}`);
        socket.emit('subscribed', { experimentId });
        console.log(`Client ${socket.id} successfully subscribed to experiment: ${experimentId}`);
      }
    });

    // Unsubscribe from experiment updates
    socket.on('unsubscribe', (experimentId: string) => {
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.experimentIds.delete(experimentId);

        // Remove socket from experiment's socket set
        const sockets = this.experimentSockets.get(experimentId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.experimentSockets.delete(experimentId);
          }
        }

        socket.leave(`experiment:${experimentId}`);
        socket.emit('unsubscribed', { experimentId });
      }
    });

    // Handle user input responses
    socket.on('userInput', (response: UserInputResponse) => {
      const success = this.experimentService.submitUserInput(response);
      socket.emit('userInputAck', {
        requestId: response.requestId,
        success,
      });
    });

    // Request experiment status
    socket.on('requestStatus', async (experimentId: string) => {
      const status = await this.experimentService.getExperimentStatus(experimentId);
      socket.emit('status', { experimentId, status });
    });

    // Request task history
    socket.on(
      'requestHistory',
      async (data: {
        experimentId: string;
        limit?: number;
        offset?: number;
        spaceId?: string;
        taskId?: string;
      }) => {
        const historyOptions: {
          limit?: number;
          offset?: number;
          spaceId?: string;
          taskId?: string;
        } = {};

        if (data.limit !== undefined) historyOptions.limit = data.limit;
        if (data.offset !== undefined) historyOptions.offset = data.offset;
        if (data.spaceId) historyOptions.spaceId = data.spaceId;
        if (data.taskId) historyOptions.taskId = data.taskId;

        const history = await this.experimentService.getExperimentHistory(
          data.experimentId,
          historyOptions
        );

        socket.emit('history', {
          experimentId: data.experimentId,
          tasks: history,
          total: history.length,
          hasMore: false, // Would be determined by actual implementation
        });
      }
    );
  }

  /**
   * Handles client disconnection and cleanup.
   * 
   * @param socketId - ID of the disconnected socket
   */
  private handleDisconnect(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      // Clean up experiment subscriptions
      for (const experimentId of connection.experimentIds) {
        const sockets = this.experimentSockets.get(experimentId);
        if (sockets) {
          sockets.delete(socketId);
          if (sockets.size === 0) {
            this.experimentSockets.delete(experimentId);
          }
        }
      }

      this.connections.delete(socketId);
    }
  }

  // Methods called by ExperimentService

  /**
   * Broadcasts progress updates to all subscribers of an experiment.
   * 
   * @param experimentId - ID of the experiment
   * @param progress - Progress data to broadcast
   */
  emitProgress(experimentId: string, progress: ExperimentProgress): void {
    console.log(`Emitting progress for experiment ${experimentId}:`, progress);
    this.io.to(`experiment:${experimentId}`).emit('progress', progress);
  }

  /**
   * Broadcasts user input request to all subscribers of an experiment.
   * 
   * @param experimentId - ID of the experiment
   * @param request - User input request to broadcast
   */
  emitUserInputRequest(experimentId: string, request: UserInputRequest): void {
    this.io.to(`experiment:${experimentId}`).emit('inputRequired', request);
  }

  /**
   * Broadcasts experiment completion to all subscribers.
   * Automatically cleans up subscriptions for the completed experiment.
   * 
   * @param experimentId - ID of the completed experiment
   * @param result - Experiment execution result
   */
  emitExperimentComplete(experimentId: string, result: RunResult): void {
    this.io.to(`experiment:${experimentId}`).emit('complete', {
      experimentId,
      result,
    });

    // Clean up subscriptions
    const sockets = this.experimentSockets.get(experimentId);
    if (sockets) {
      for (const socketId of sockets) {
        const connection = this.connections.get(socketId);
        if (connection) {
          connection.experimentIds.delete(experimentId);
        }
      }
      this.experimentSockets.delete(experimentId);
    }
  }

  /**
   * Broadcasts experiment error to all subscribers.
   * 
   * @param experimentId - ID of the failed experiment
   * @param error - Error that occurred during execution
   */
  emitExperimentError(experimentId: string, error: Error): void {
    this.io.to(`experiment:${experimentId}`).emit('error', {
      experimentId,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * Sends validation result to a specific client.
   * 
   * @param socketId - ID of the target socket
   * @param validation - Validation result with errors and warnings
   * @param validation.errors - Array of validation errors
   * @param validation.warnings - Array of validation warnings
   * @param validation.isValid - Whether validation passed
   */
  emitValidationResult(
    socketId: string,
    validation: {
      errors: string[];
      warnings: string[];
      isValid: boolean;
    }
  ): void {
    this.io.to(socketId).emit('validationResult', validation);
  }

  /**
   * Gets the number of currently connected clients.
   * 
   * @returns Number of connected WebSocket clients
   */
  getConnectedClients(): number {
    return this.connections.size;
  }

  /**
   * Gets the number of clients subscribed to a specific experiment.
   * 
   * @param experimentId - ID of the experiment
   * @returns Number of subscribers for the experiment
   */
  getExperimentSubscribers(experimentId: string): number {
    return this.experimentSockets.get(experimentId)?.size || 0;
  }
}
