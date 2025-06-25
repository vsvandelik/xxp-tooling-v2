import { Connection } from 'vscode-languageserver';
import { DocumentManager } from './DocumentsManager.js';
export declare class ProvidersManager {
    private readonly connection;
    private readonly documentsManager;
    private readonly logger;
    private readonly providers;
    constructor(connection: Connection, documentsManager: DocumentManager);
    registerProviders(): void;
    private registerProvider;
}
//# sourceMappingURL=ProvidersManager.d.ts.map