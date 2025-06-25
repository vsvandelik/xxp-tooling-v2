import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { ExperimentService } from './services/ExperimentService.js';
import { WebSocketManager } from './services/WebSocketManager.js';
import { createExperimentRoutes } from './routes/experimentRoutes.js';
import { fileURLToPath } from 'url';
import * as path from 'path';
export class ExperimentRunnerServer {
    app;
    httpServer;
    io;
    experimentService;
    wsManager;
    config;
    constructor(config) {
        this.config = config;
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new SocketIOServer(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.experimentService = new ExperimentService({
            databasePath: config.databasePath || './experiment_runs.db',
            maxConcurrent: config.maxConcurrent || 3,
        });
        this.wsManager = new WebSocketManager(this.io, this.experimentService);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        if (this.config.verbose) {
            this.app.use((req, res, next) => {
                console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
                next();
            });
        }
    }
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        this.app.use('/api/experiments', createExperimentRoutes(this.experimentService, this.wsManager));
        this.app.use((err, req, res, _next) => {
            console.error('Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message,
            });
        });
    }
    setupWebSocket() {
        this.wsManager.initialize();
    }
    async start() {
        await this.experimentService.initialize();
        return new Promise(resolve => {
            this.httpServer.listen(this.config.port, () => {
                console.log(`ExtremeXP Experiment Runner Server listening on port ${this.config.port}`);
                resolve();
            });
        });
    }
    async stop() {
        await this.experimentService.shutdown();
        this.io.close();
        return new Promise(resolve => {
            this.httpServer.close(() => {
                console.log('Server stopped');
                resolve();
            });
        });
    }
}
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMainModule) {
    const config = {
        port: parseInt(process.env['PORT'] || '3000'),
        verbose: process.env['VERBOSE'] === 'true',
        databasePath: process.env['DATABASE_PATH'] || './experiment_runs.db',
        maxConcurrent: parseInt(process.env['MAX_CONCURRENT'] || '3'),
    };
    const server = new ExperimentRunnerServer(config);
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
    process.on('SIGINT', async () => {
        console.log('\nShutting down server...');
        await server.stop();
        process.exit(0);
    });
}
//# sourceMappingURL=server.js.map