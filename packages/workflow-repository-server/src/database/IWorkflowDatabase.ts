/**
 * Generic database interface for workflow repository operations.
 * This interface allows for different database implementations (SQLite, PostgreSQL, etc.)
 * while maintaining a consistent API for workflow storage and retrieval.
 */

import { WorkflowSearchOptions } from '@extremexp/workflow-repository';

/**
 * Database record structure for workflow metadata.
 * Represents a workflow as stored in the database.
 */
export interface WorkflowRecord {
  /** Unique workflow identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Author/owner of the workflow */
  author: string;
  /** JSON string of tags array */
  tags: string;
  /** Path to the workflow directory or file */
  path: string;
  /** Name of the main workflow file */
  mainFile: string;
  /** Version of the workflow */
  version: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  modifiedAt: string;
  /** Whether the workflow has attachments */
  hasAttachments: boolean;
  /** File path on server filesystem */
  filePath: string;
}

/**
 * Database record for workflow tree structure.
 * Used for efficient tree traversal and display.
 */
export interface WorkflowTreeRecord {
  /** Full path of the node */
  path: string;
  /** Name of the node */
  name: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Parent path (null for root) */
  parentPath: string | null;
  /** Associated workflow ID if this is a workflow file */
  workflowId: string | null;
}

/**
 * Generic database interface for workflow repository operations.
 * Provides methods for storing, retrieving, and querying workflow metadata.
 */
export interface IWorkflowDatabase {
  /**
   * Initializes the database connection and creates tables if necessary.
   * @throws Error if initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Closes the database connection.
   * @throws Error if closing fails
   */
  close(): Promise<void>;

  /**
   * Stores a workflow record in the database.
   * @param record - The workflow record to store
   * @throws Error if storage fails
   */
  storeWorkflow(record: WorkflowRecord): Promise<void>;

  /**
   * Retrieves a workflow record by ID.
   * @param id - The workflow ID
   * @returns The workflow record or null if not found
   * @throws Error if query fails
   */
  getWorkflow(id: string): Promise<WorkflowRecord | null>;

  /**
   * Updates an existing workflow record.
   * @param id - The workflow ID
   * @param updates - Partial workflow record with fields to update
   * @throws Error if update fails
   */
  updateWorkflow(id: string, updates: Partial<WorkflowRecord>): Promise<void>;

  /**
   * Deletes a workflow record by ID.
   * @param id - The workflow ID
   * @returns True if deleted, false if not found
   * @throws Error if deletion fails
   */
  deleteWorkflow(id: string): Promise<boolean>;

  /**
   * Checks if a workflow exists by ID.
   * @param id - The workflow ID
   * @returns True if exists, false otherwise
   * @throws Error if query fails
   */
  workflowExists(id: string): Promise<boolean>;

  /**
   * Lists all workflows or workflows in a specific path.
   * @param path - Optional path to filter workflows
   * @returns Array of workflow records
   * @throws Error if query fails
   */
  listWorkflows(path?: string): Promise<WorkflowRecord[]>;

  /**
   * Searches workflows based on criteria.
   * @param options - Search options including query, tags, author, etc.
   * @returns Array of matching workflow records
   * @throws Error if query fails
   */
  searchWorkflows(options: WorkflowSearchOptions): Promise<WorkflowRecord[]>;

  /**
   * Gets all unique tags from workflows.
   * @returns Array of unique tag strings
   * @throws Error if query fails
   */
  getAllTags(): Promise<string[]>;

  /**
   * Gets all unique authors from workflows.
   * @returns Array of unique author strings
   * @throws Error if query fails
   */
  getAllAuthors(): Promise<string[]>;

  /**
   * Gets the owner/author of a specific workflow.
   * @param id - The workflow ID
   * @returns Author string or null if not found
   * @throws Error if query fails
   */
  getWorkflowOwner(id: string): Promise<string | null>;

  /**
   * Checks if a workflow with the same name exists at the specified path.
   * @param path - The path to check
   * @param name - The workflow name to search for
   * @returns Object with existence check and optional ID
   * @throws Error if query fails
   */
  findWorkflowByPathAndName(path: string, name: string): Promise<{ exists: boolean; id?: string }>;

  /**
   * Gets hierarchical tree structure of workflows.
   * @param path - Optional path to get tree structure from
   * @returns Array of tree records representing the structure
   * @throws Error if query fails
   */
  getTreeStructure(path?: string): Promise<WorkflowTreeRecord[]>;

  /**
   * Updates the tree structure for a workflow path.
   * Called when workflows are added/removed/moved.
   * @param path - The path to update
   * @param isDirectory - Whether this is a directory
   * @param workflowId - Optional workflow ID if this is a workflow file
   * @throws Error if update fails
   */
  updateTreeStructure(path: string, isDirectory: boolean, workflowId?: string): Promise<void>;

  /**
   * Removes tree structure entries for a path.
   * Called when workflows are deleted.
   * @param path - The path to remove
   * @throws Error if removal fails
   */
  removeTreeStructure(path: string): Promise<void>;
}
