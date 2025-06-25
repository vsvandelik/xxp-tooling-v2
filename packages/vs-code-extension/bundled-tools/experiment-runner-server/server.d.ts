import { ServerConfig } from './types/server.types.js';
export declare class ExperimentRunnerServer {
    private app;
    private httpServer;
    private io;
    private experimentService;
    private wsManager;
    private config;
    constructor(config: ServerConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupWebSocket;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map