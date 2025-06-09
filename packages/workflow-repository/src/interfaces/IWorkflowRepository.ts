import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowItem } from '../models/WorkflowItem.js';
import { WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';

export interface IWorkflowRepository {
  list(path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
  
  get(id: string): Promise<WorkflowItem | null>;
  
  getContent(id: string): Promise<WorkflowContent | null>;
  
  upload(path: string, content: WorkflowContent, metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>): Promise<WorkflowMetadata>;
  
  update(id: string, content: WorkflowContent, metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>): Promise<WorkflowMetadata>;
  
  delete(id: string): Promise<boolean>;
  
  exists(id: string): Promise<boolean>;
  
  search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;
  
  getTreeStructure(path?: string): Promise<WorkflowTreeNode>;
}

export interface WorkflowTreeNode {
  readonly name: string;
  readonly path: string;
  readonly type: 'folder' | 'workflow';
  readonly children?: readonly WorkflowTreeNode[];
  readonly metadata?: WorkflowMetadata;
}