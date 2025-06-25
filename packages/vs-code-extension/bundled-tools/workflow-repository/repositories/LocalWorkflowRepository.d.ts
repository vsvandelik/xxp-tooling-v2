import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';
export declare class LocalWorkflowRepository implements IWorkflowRepository {
    private readonly basePath;
    constructor(basePath: string);
    list(workflowPath?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
    get(id: string): Promise<WorkflowItem | null>;
    getContent(id: string): Promise<WorkflowContent | null>;
    upload(workflowPath: string, content: WorkflowContent, metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>): Promise<WorkflowMetadata>;
    update(id: string, content: WorkflowContent, metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>): Promise<WorkflowMetadata>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
    getTreeStructure(workflowPath?: string): Promise<WorkflowTreeNode>;
    private collectWorkflows;
    private loadSingleFileWorkflow;
    private extractMetadataFromContent;
    private loadMetadata;
    private saveManifest;
    private findWorkflowById;
    private loadAttachments;
    private filterWorkflows;
    private buildTreeNode;
    private generateId;
    private normalizePath;
    private sanitizeFileName;
    private getMimeType;
}
//# sourceMappingURL=LocalWorkflowRepository.d.ts.map