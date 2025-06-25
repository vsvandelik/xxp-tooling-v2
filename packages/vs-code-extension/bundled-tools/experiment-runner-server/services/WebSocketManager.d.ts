import { Server as SocketIOServer } from 'socket.io';
import { ExperimentService } from './ExperimentService.js';
import { ExperimentProgress, UserInputRequest } from '../types/server.types.js';
import { RunResult } from '@extremexp/experiment-runner';
export declare class WebSocketManager {
    private io;
    private experimentService;
    private connections;
    private experimentSockets;
    constructor(io: SocketIOServer, experimentService: ExperimentService);
    initialize(): void;
    private setupSocketHandlers;
    private handleDisconnect;
    emitProgress(experimentId: string, progress: ExperimentProgress): void;
    emitUserInputRequest(experimentId: string, request: UserInputRequest): void;
    emitExperimentComplete(experimentId: string, result: RunResult): void;
    emitExperimentError(experimentId: string, error: Error): void;
    emitValidationResult(socketId: string, validation: {
        errors: string[];
        warnings: string[];
        isValid: boolean;
    }): void;
    getConnectedClients(): number;
    getExperimentSubscribers(experimentId: string): number;
}
//# sourceMappingURL=WebSocketManager.d.ts.map