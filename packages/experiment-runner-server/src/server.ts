/**
 * @fileoverview HTTP server for ExtremeXP experiment execution.
 * Provides REST API and WebSocket interface for running and monitoring experiments remotely.
 */

import { createServer } from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

import { createExperimentRoutes } from './routes/experimentRoutes.js';
import { ExperimentService } from './services/ExperimentService.js';
import { WebSocketManager } from './services/WebSocketManager.js';
import { ServerConfig } from './types/server.types.js';

/**
 * HTTP server providing REST API and WebSocket interface for experiment execution.
 * Manages multiple concurrent experiments with real-time progress updates.
 */
export class ExperimentRunnerServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private experimentService: ExperimentService;
  private wsManager: WebSocketManager;
  private config: ServerConfig;

  /**
   * Creates a new experiment runner server.
   * 
   * @param config - Server configuration including port, database path, and options
   */
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

  /**
   * Configures Express middleware for the server.
   * Sets up CORS, body parsing, and optional request logging.
   */
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

  /**
   * Sets up Express routes and error handling middleware.
   */
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
    this.app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('Error:', err);
        res.status(500).json({
          error: 'Internal server error',
          message: err.message,
        });
      }
    );
  }

  /**
   * Initializes WebSocket communication manager.
   */
  private setupWebSocket(): void {
    this.wsManager.initialize();
  }

  /**
   * Starts the HTTP server and initializes all services.
   * 
   * @returns Promise that resolves when server is listening
   */
  async start(): Promise<void> {
    await this.experimentService.initialize();

    return new Promise(resolve => {
      this.httpServer.listen(this.config.port, () => {
        console.log(`ExtremeXP Experiment Runner Server listening on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stops the HTTP server and shuts down all services gracefully.
   * 
   * @returns Promise that resolves when server is fully stopped
   */
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
