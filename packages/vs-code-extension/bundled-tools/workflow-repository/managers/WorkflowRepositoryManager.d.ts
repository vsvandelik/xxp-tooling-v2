import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { RepositoryConfig, WorkflowSearchOptions } from '../models/RepositoryConfig.js';
export declare class WorkflowRepositoryManager {
    private repositories;
    private configs;
    private defaultRepositoryName?;
    addRepository(config: RepositoryConfig): void;
    removeRepository(name: string): boolean;
    getRepository(name?: string): IWorkflowRepository | null;
    getRepositoryConfig(name: string): RepositoryConfig | null;
    listRepositories(): readonly RepositoryConfig[];
    listWorkflows(repositoryName?: string, path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
    getWorkflow(workflowId: string, repositoryName?: string): Promise<WorkflowItem | null>;
    uploadWorkflow(path: string, content: WorkflowContent, metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>, repositoryName?: string): Promise<WorkflowMetadata>;
    updateWorkflow(workflowId: string, content: WorkflowContent, metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>, repositoryName?: string): Promise<WorkflowMetadata>;
    deleteWorkflow(workflowId: string, repositoryName?: string): Promise<boolean>;
    searchWorkflows(options: WorkflowSearchOptions, repositoryName?: string): Promise<readonly WorkflowMetadata[]>;
    getTreeStructure(repositoryName?: string, path?: string): Promise<WorkflowTreeNode>;
    searchAllRepositories(options: WorkflowSearchOptions): Promise<Map<string, readonly WorkflowMetadata[]>>;
}
//# sourceMappingURL=WorkflowRepositoryManager.d.ts.map