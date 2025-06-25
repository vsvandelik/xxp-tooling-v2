import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';
export declare class RemoteWorkflowRepository implements IWorkflowRepository {
    private baseUrl;
    private username?;
    private password?;
    private authToken?;
    constructor(baseUrl: string, username?: string | undefined, password?: string | undefined);
    authenticate(): Promise<boolean>;
    list(path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
    get(id: string): Promise<WorkflowItem | null>;
    getContent(id: string): Promise<WorkflowContent | null>;
    upload(path: string, content: WorkflowContent, metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>): Promise<WorkflowMetadata>;
    update(id: string, content: WorkflowContent, metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>): Promise<WorkflowMetadata>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
    getTreeStructure(path?: string): Promise<WorkflowTreeNode>;
    getTags(): Promise<string[]>;
    getAuthors(): Promise<string[]>;
    private makeRequest;
    private ensureAuthenticated;
    private createWorkflowZip;
    private loadAttachments;
    private getMimeType;
}
//# sourceMappingURL=RemoteWorkflowRepository.d.ts.map