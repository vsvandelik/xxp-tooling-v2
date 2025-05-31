import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { ExperimentService } from './services/ExperimentService.js';
import { WebSocketManager } from './services/WebSocketManager.js';
import { ServerConfig } from './types/server.types.js';
import { createExperimentRoutes } from './routes/experimentRoutes.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

export class ExperimentRunnerServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private experimentService: ExperimentService;
  private wsManager: WebSocketManager;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
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

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    if (this.config.verbose) {
      this.app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Experiment routes
    this.app.use(
      '/api/experiments',
      createExperimentRoutes(this.experimentService, this.wsManager)
    );

    // Error handling middleware
    this.app.use((err: Error, req: express.Request, res: express.Response) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  private setupWebSocket(): void {
    this.wsManager.initialize();
  }

  async start(): Promise<void> {
    await this.experimentService.initialize();

    return new Promise(resolve => {
      this.httpServer.listen(this.config.port, () => {
        console.log(`ExtremeXP Experiment Runner Server listening on port ${this.config.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
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

// CLI entry point
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const config: ServerConfig = {
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

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    process.exit(0);
  });
}
