export class WebSocketManager {
    io;
    experimentService;
    connections = new Map();
    experimentSockets = new Map();
    constructor(io, experimentService) {
        this.io = io;
        this.experimentService = experimentService;
    }
    initialize() {
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
    setupSocketHandlers(socket) {
        socket.on('subscribe', (experimentId) => {
            console.log(`Client ${socket.id} subscribing to experiment: ${experimentId}`);
            const connection = this.connections.get(socket.id);
            if (connection) {
                connection.experimentIds.add(experimentId);
                if (!this.experimentSockets.has(experimentId)) {
                    this.experimentSockets.set(experimentId, new Set());
                }
                this.experimentSockets.get(experimentId).add(socket.id);
                socket.join(`experiment:${experimentId}`);
                socket.emit('subscribed', { experimentId });
                console.log(`Client ${socket.id} successfully subscribed to experiment: ${experimentId}`);
            }
        });
        socket.on('unsubscribe', (experimentId) => {
            const connection = this.connections.get(socket.id);
            if (connection) {
                connection.experimentIds.delete(experimentId);
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
        socket.on('userInput', (response) => {
            const success = this.experimentService.submitUserInput(response);
            socket.emit('userInputAck', {
                requestId: response.requestId,
                success,
            });
        });
        socket.on('requestStatus', async (experimentId) => {
            const status = await this.experimentService.getExperimentStatus(experimentId);
            socket.emit('status', { experimentId, status });
        });
        socket.on('requestHistory', async (data) => {
            const historyOptions = {};
            if (data.limit !== undefined)
                historyOptions.limit = data.limit;
            if (data.offset !== undefined)
                historyOptions.offset = data.offset;
            if (data.spaceId)
                historyOptions.spaceId = data.spaceId;
            if (data.taskId)
                historyOptions.taskId = data.taskId;
            const history = await this.experimentService.getExperimentHistory(data.experimentId, historyOptions);
            socket.emit('history', {
                experimentId: data.experimentId,
                tasks: history,
                total: history.length,
                hasMore: false,
            });
        });
    }
    handleDisconnect(socketId) {
        const connection = this.connections.get(socketId);
        if (connection) {
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
    emitProgress(experimentId, progress) {
        console.log(`Emitting progress for experiment ${experimentId}:`, progress);
        this.io.to(`experiment:${experimentId}`).emit('progress', progress);
    }
    emitUserInputRequest(experimentId, request) {
        this.io.to(`experiment:${experimentId}`).emit('inputRequired', request);
    }
    emitExperimentComplete(experimentId, result) {
        this.io.to(`experiment:${experimentId}`).emit('complete', {
            experimentId,
            result,
        });
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
    emitExperimentError(experimentId, error) {
        this.io.to(`experiment:${experimentId}`).emit('error', {
            experimentId,
            error: {
                message: error.message,
                stack: error.stack,
            },
        });
    }
    emitValidationResult(socketId, validation) {
        this.io.to(socketId).emit('validationResult', validation);
    }
    getConnectedClients() {
        return this.connections.size;
    }
    getExperimentSubscribers(experimentId) {
        return this.experimentSockets.get(experimentId)?.size || 0;
    }
}
//# sourceMappingURL=WebSocketManager.js.map