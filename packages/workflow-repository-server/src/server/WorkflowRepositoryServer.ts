import express, { Request } from 'express';
import cors from 'cors';
import { ApiResponse, LoginRequest, LoginResponse } from '@extremexp/workflow-repository';
import { WorkflowStorageService } from '../services/WorkflowStorageService.js';
import { UserService } from '../services/UserService.js';
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware.js';
import { WorkflowController } from '../controlers/WorkflowController.js';

export interface ServerConfig {
  port: number;
  storagePath: string;
  jwtSecret: string;
  corsOrigin?: string;
}

export class WorkflowRepositoryServer {
  private app: express.Application;
  private storageService: WorkflowStorageService;
  private userService: UserService;
  private authMiddleware: AuthenticationMiddleware;
  private workflowController: WorkflowController;

  constructor(private config: ServerConfig) {
    this.app = express();
    this.storageService = new WorkflowStorageService(config.storagePath);
    this.userService = new UserService(config.jwtSecret);
    this.authMiddleware = new AuthenticationMiddleware(this.userService);
    this.workflowController = new WorkflowController(this.storageService, this.userService);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async start(): Promise<void> {
    await this.storageService.ensureInitialized();

    return new Promise(resolve => {
      this.app.listen(this.config.port, () => {
        console.log(`Workflow Repository Server running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin: this.config.corsOrigin || '*',
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    this.app.use(this.authMiddleware.authenticate);
  }

  private setupRoutes(): void {
    this.setupAuthRoutes();
    this.setupWorkflowRoutes();
    this.setupDiscoveryRoutes();
    this.setupHealthRoute();
  }

  private setupAuthRoutes(): void {
    this.app.post('/auth/login', async (req, res) => {
      try {
        const loginRequest: LoginRequest = req.body;
        const authToken = await this.userService.authenticate({
          username: loginRequest.username,
          password: loginRequest.password,
        });

        if (!authToken) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid credentials',
          };
          res.status(401).json(response);
          return;
        }

        const response: ApiResponse<LoginResponse> = {
          success: true,
          data: {
            token: authToken.token,
            expiresAt: authToken.expiresAt.toISOString(),
            user: authToken.user,
          },
        };

        res.json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        res.status(500).json(response);
      }
    });

    this.app.post('/auth/logout', (req, res) => {
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };
      res.json(response);
    });

    this.app.get('/auth/me', this.authMiddleware.requireAuth, (req, res) => {
      const response: ApiResponse = {
        success: true,
        data: req.user,
      };
      res.json(response);
    });
  }

  private setupWorkflowRoutes(): void {
    this.app.get('/workflows', this.workflowController.listWorkflows);

    this.app.get('/workflows/:id', this.workflowController.getWorkflow);

    this.app.get('/workflows/:id/content', this.workflowController.downloadWorkflow);

    this.app.get('/workflows/:id/files/*', this.workflowController.downloadWorkflowFile);

    this.app.post(
      '/workflows',
      this.authMiddleware.requireAuth,
      this.workflowController.uploadWorkflow[0] as express.RequestHandler,
      this.workflowController.uploadWorkflow[1] as express.RequestHandler
    );

    this.app.put(
      '/workflows/:id',
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireOwnerOrAdmin((req: Request) => {
        const { id } = req.params;
        return id || null;
      }),
      this.workflowController.updateWorkflow[0] as express.RequestHandler,
      this.workflowController.updateWorkflow[1] as express.RequestHandler
    );

    this.app.delete(
      '/workflows/:id',
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireOwnerOrAdmin((req: Request) => {
        const { id } = req.params;
        return id || null;
      }),
      this.workflowController.deleteWorkflow
    );
  }

  private setupDiscoveryRoutes(): void {
    this.app.get('/tree', this.workflowController.getTree);
    this.app.get('/tree/*', this.workflowController.getTree);

    this.app.get('/search', this.workflowController.searchWorkflows);

    this.app.get('/tags', this.workflowController.getTags);

    this.app.get('/authors', this.workflowController.getAuthors);
  }

  private setupHealthRoute(): void {
    this.app.get('/health', (req, res) => {
      const response: ApiResponse = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
      res.json(response);
    });
  }

  private setupErrorHandling(): void {
    this.app.use((req, res) => {
      const response: ApiResponse = {
        success: false,
        error: 'Endpoint not found',
      };
      res.status(404).json(response);
    });

    this.app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('Unhandled error:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    );
  }
}
