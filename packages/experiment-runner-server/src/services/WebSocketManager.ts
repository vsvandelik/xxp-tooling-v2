import { Server as SocketIOServer, Socket } from 'socket.io';
import { ExperimentService } from './ExperimentService.js';
import { ExperimentProgress, UserInputRequest, UserInputResponse } from '../types/server.types.js';
import { RunResult } from '@extremexp/experiment-runner';

interface ClientConnection {
  socketId: string;
  experimentIds: Set<string>;
}

export class WebSocketManager {
  private connections: Map<string, ClientConnection> = new Map();
  private experimentSockets: Map<string, Set<string>> = new Map();

  constructor(
    private io: SocketIOServer,
    private experimentService: ExperimentService
  ) {}

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

  emitProgress(experimentId: string, progress: ExperimentProgress): void {
    console.log(`Emitting progress for experiment ${experimentId}:`, progress);
    this.io.to(`experiment:${experimentId}`).emit('progress', progress);
  }

  emitUserInputRequest(experimentId: string, request: UserInputRequest): void {
    this.io.to(`experiment:${experimentId}`).emit('inputRequired', request);
  }

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

  emitExperimentError(experimentId: string, error: Error): void {
    this.io.to(`experiment:${experimentId}`).emit('error', {
      experimentId,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

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

  getConnectedClients(): number {
    return this.connections.size;
  }

  getExperimentSubscribers(experimentId: string): number {
    return this.experimentSockets.get(experimentId)?.size || 0;
  }
}
