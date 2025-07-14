/**
 * Core workflow repository interface.
 * Defines the contract for workflow storage and retrieval operations
 * across different repository implementations (local, remote).
 */

import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';

/**
 * Interface defining the contract for workflow repository implementations.
 * Provides methods for storing, retrieving, and managing workflows
 * across different storage backends (filesystem, remote API).
 */
export interface IWorkflowRepository {
  /**
   * Lists workflows in the repository.
   * 
   * @param path - Optional path to list workflows from (default: root)
   * @param options - Optional search and filtering options
   * @returns Promise resolving to array of workflow metadata
   */
  list(path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;

  /**
   * Gets a complete workflow by ID including content and attachments.
   * 
   * @param id - Unique workflow identifier
   * @returns Promise resolving to workflow item or null if not found
   */
  get(id: string): Promise<WorkflowItem | null>;

  /**
   * Gets only the content of a workflow (main file and attachments).
   * 
   * @param id - Unique workflow identifier
   * @returns Promise resolving to workflow content or null if not found
   */
  getContent(id: string): Promise<WorkflowContent | null>;

  /**
   * Uploads a new workflow to the repository.
   * 
   * @param path - Target path for the workflow
   * @param content - Workflow content including main file and attachments
   * @param metadata - Workflow metadata (excluding auto-generated fields)
   * @returns Promise resolving to complete workflow metadata with generated fields
   * @throws Error if workflow already exists or upload fails
   */
  upload(
    path: string,
    content: WorkflowContent,
    metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>
  ): Promise<WorkflowMetadata>;

  /**
   * Updates an existing workflow in the repository.
   * 
   * @param id - Unique workflow identifier
   * @param content - Updated workflow content
   * @param metadata - Partial metadata updates (excluding auto-generated fields)
   * @returns Promise resolving to updated workflow metadata
   * @throws Error if workflow not found or update fails
   */
  update(
    id: string,
    content: WorkflowContent,
    metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>
  ): Promise<WorkflowMetadata>;

  /**
   * Deletes a workflow from the repository.
   * 
   * @param id - Unique workflow identifier
   * @returns Promise resolving to true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Checks if a workflow exists in the repository.
   * 
   * @param id - Unique workflow identifier
   * @returns Promise resolving to true if workflow exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Searches workflows based on criteria.
   * 
   * @param options - Search criteria including query, tags, author, pagination
   * @returns Promise resolving to array of matching workflow metadata
   */
  search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]>;

  /**
   * Gets the hierarchical tree structure of the repository.
   * 
   * @param path - Optional path to get tree structure from (default: root)
   * @returns Promise resolving to tree node representing the structure
   */
  getTreeStructure(path?: string): Promise<WorkflowTreeNode>;
}

/**
 * Represents a node in the workflow repository tree structure.
 * Used for hierarchical browsing of workflows and folders.
 */
export interface WorkflowTreeNode {
  /** Display name of the node */
  readonly name: string;
  /** Full path to the node in the repository */
  readonly path: string;
  /** Type of the node - either a folder or workflow */
  readonly type: 'folder' | 'workflow';
  /** Child nodes (for folders) */
  readonly children?: readonly WorkflowTreeNode[];
  /** Workflow metadata (for workflow nodes) */
  readonly metadata?: WorkflowMetadata;
}
