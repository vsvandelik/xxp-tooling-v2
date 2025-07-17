/**
 * Database-based workflow storage service for server-side workflow management.
 * Provides high-level storage operations, ZIP handling, conflict resolution,
 * and metadata management using database persistence instead of file-based metadata.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import {
  WorkflowContent,
  WorkflowMetadata,
  WorkflowSearchOptions,
  WorkflowTreeNode,
} from '@extremexp/workflow-repository';
import { v4 as uuidv4 } from 'uuid';

import {
  IWorkflowDatabase,
  WorkflowRecord,
  WorkflowTreeRecord,
} from '../database/IWorkflowDatabase.js';

/**
 * Interface for workflow manifest metadata from ZIP files.
 */
interface WorkflowManifest {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  mainFile: string;
}

/**
 * Service class providing database-backed storage operations for workflows on the server.
 * Replaces file-based metadata storage with database operations while maintaining
 * file-based storage for actual workflow content.
 */
export class DatabaseWorkflowStorageService {
  /** Track allowed overrides per session with workflow-request mapping */
  private uploadOverrides = new Map<string, boolean>();

  /**
   * Creates a new database workflow storage service.
   *
   * @param database - Database instance for metadata storage
   * @param basePath - Base directory path for workflow file storage
   */
  constructor(
    private database: IWorkflowDatabase,
    private basePath: string
  ) {}

  /**
   * Ensures the storage directory exists and database is initialized.
   *
   * @throws Error if directory creation or database initialization fails
   */
  async ensureInitialized(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }

    await this.database.initialize();
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    await this.database.close();
  }

  /**
   * Retrieves all unique tags from workflows in the database.
   *
   * @returns Promise resolving to sorted array of tag strings
   * @throws Error if database access fails
   */
  async getAllTags(): Promise<string[]> {
    return await this.database.getAllTags();
  }

  /**
   * Retrieves all unique authors from workflows in the database.
   *
   * @returns Promise resolving to sorted array of author names
   * @throws Error if database access fails
   */
  async getAllAuthors(): Promise<string[]> {
    return await this.database.getAllAuthors();
  }

  /**
   * Gets the owner/author of a specific workflow from the database.
   *
   * @param workflowId - Unique workflow identifier
   * @returns Promise resolving to author name or null if not found
   */
  async getWorkflowOwner(workflowId: string): Promise<string | null> {
    return await this.database.getWorkflowOwner(workflowId);
  }

  /**
   * Checks if a workflow with the same name exists at the specified path.
   *
   * @param workflowPath - Target path to check
   * @param workflowName - Workflow name to search for
   * @returns Promise resolving to existence check result with optional ID
   */
  async checkForExistingWorkflow(
    workflowPath: string,
    workflowName: string
  ): Promise<{ exists: boolean; id?: string }> {
    return await this.database.findWorkflowByPathAndName(workflowPath, workflowName);
  }

  /**
   * Checks if override permission has been granted for a workflow.
   *
   * @param workflowId - Unique workflow identifier
   * @param requestId - Request session identifier
   * @returns Promise resolving to true if override is allowed
   */
  async canOverrideWorkflow(workflowId: string, requestId: string): Promise<boolean> {
    const key = `${workflowId}-${requestId}`;
    return this.uploadOverrides.get(key) || false;
  }

  /**
   * Sets override permission for a workflow upload request.
   *
   * @param workflowId - Unique workflow identifier
   * @param requestId - Request session identifier
   * @param allowed - Whether to allow the override
   */
  setOverridePermission(workflowId: string, requestId: string, allowed: boolean): void {
    const key = `${workflowId}-${requestId}`;
    if (allowed) {
      this.uploadOverrides.set(key, true);
      // Clear permission after 5 minutes
      setTimeout(
        () => {
          this.uploadOverrides.delete(key);
        },
        5 * 60 * 1000
      );
    } else {
      this.uploadOverrides.delete(key);
    }
  }

  /**
   * Creates a downloadable ZIP archive for a workflow.
   *
   * @param workflowId - Unique workflow identifier
   * @returns Promise resolving to ZIP buffer or null if workflow not found
   * @throws Error if ZIP creation fails
   */
  async createWorkflowZip(workflowId: string): Promise<Buffer | null> {
    const workflow = await this.database.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    const content = await this.getWorkflowContent(workflow);
    if (!content) {
      return null;
    }

    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    zip.file(workflow.mainFile, content.mainFile);

    for (const [fileName, fileContent] of content.attachments) {
      zip.file(fileName, fileContent);
    }

    zip.file(
      'workflow.json',
      JSON.stringify(
        {
          name: workflow.name,
          description: workflow.description,
          author: workflow.author,
          tags: (() => {
            try {
              const parsed = JSON.parse(workflow.tags);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })(),
          mainFile: workflow.mainFile,
        },
        null,
        2
      )
    );

    return await zip.generateAsync({ type: 'nodebuffer' });
  }

  /**
   * Extracts workflow content and metadata from a ZIP archive.
   *
   * @param zipBuffer - ZIP file buffer to extract
   * @returns Promise resolving to extracted content and metadata or null if invalid
   * @throws Error if extraction fails
   */
  async extractWorkflowFromZip(
    zipBuffer: Buffer
  ): Promise<{ content: WorkflowContent; metadata: WorkflowManifest } | null> {
    try {
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(zipBuffer);

      // First, try to find workflow.json
      const manifestFile = zip.file('workflow.json');
      let metadata: WorkflowManifest;

      if (!manifestFile) {
        // No manifest file, check if it's a single workflow file
        const files = Object.keys(zip.files).filter(f => !zip.files[f]!.dir);
        const workflowFiles = files.filter(f => f.endsWith('.xxp') || f.endsWith('.espace'));

        if (workflowFiles.length === 0) {
          return null; // No workflow files found
        }

        // Use the first workflow file as main file
        const mainFile = workflowFiles[0]!;
        const mainFileContent = await zip.file(mainFile)!.async('string');

        // Create metadata from file
        metadata = {
          name: path.basename(mainFile, path.extname(mainFile)),
          description: 'Imported workflow',
          author: 'Unknown',
          version: '1.0.0',
          tags: [],
          mainFile: mainFile,
        };

        // Collect other files as attachments
        const attachments = new Map<string, Buffer>();
        for (const fileName of files) {
          if (fileName !== mainFile) {
            const content = await zip.file(fileName)!.async('nodebuffer');
            attachments.set(fileName, content);
          }
        }

        return {
          content: {
            mainFile: mainFileContent,
            attachments,
          },
          metadata,
        };
      }

      // Standard workflow with manifest
      const manifestContent = await manifestFile.async('string');
      metadata = JSON.parse(manifestContent);

      const mainFileContent = await zip.file(metadata.mainFile)?.async('string');
      if (!mainFileContent) {
        return null;
      }

      const attachments = new Map<string, Buffer>();

      for (const [fileName, file] of Object.entries(zip.files)) {
        if (fileName !== 'workflow.json' && fileName !== metadata.mainFile && !file.dir) {
          const content = await file.async('nodebuffer');
          attachments.set(fileName, content);
        }
      }

      return {
        content: {
          mainFile: mainFileContent,
          attachments,
        },
        metadata,
      };
    } catch {
      return null;
    }
  }

  /**
   * Validates that a workflow path is safe and allowed.
   *
   * @param workflowPath - Path to validate
   * @returns Promise resolving to true if path is valid
   */
  async validateWorkflowPath(workflowPath: string): Promise<boolean> {
    const normalizedPath = path.normalize(workflowPath);
    return !normalizedPath.includes('..') && !path.isAbsolute(normalizedPath);
  }

  /**
   * Stores a workflow in the database and filesystem.
   *
   * @param workflowPath - Path where workflow should be stored
   * @param content - Workflow content including main file and attachments
   * @param metadata - Workflow metadata
   * @returns Promise resolving to complete workflow metadata
   */
  async storeWorkflow(
    workflowPath: string,
    content: WorkflowContent,
    metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>
  ): Promise<WorkflowMetadata> {
    const workflowId = uuidv4();
    const now = new Date().toISOString();
    const hasAttachments = content.attachments.size > 0;

    // Create directory structure
    const workflowDir = path.join(this.basePath, workflowPath, metadata.name);
    await fs.mkdir(workflowDir, { recursive: true });

    // Store main file
    const mainFilePath = path.join(workflowDir, metadata.mainFile);
    await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');

    // Store attachments
    for (const [fileName, fileContent] of content.attachments) {
      const attachmentPath = path.join(workflowDir, fileName);
      await fs.writeFile(attachmentPath, fileContent);
    }

    // Create database record
    const workflowRecord: WorkflowRecord = {
      id: workflowId,
      name: metadata.name,
      description: metadata.description,
      author: metadata.author,
      tags: JSON.stringify(metadata.tags),
      path: workflowPath,
      mainFile: metadata.mainFile,
      version: '1.0.0',
      createdAt: now,
      modifiedAt: now,
      hasAttachments,
      filePath: workflowDir,
    };

    await this.database.storeWorkflow(workflowRecord);

    // Update tree structure
    await this.updateTreeStructure(workflowPath, metadata.name, workflowId);

    return this.recordToMetadata(workflowRecord);
  }

  /**
   * Updates an existing workflow in the database and filesystem.
   *
   * @param workflowId - Unique workflow identifier
   * @param content - Updated workflow content
   * @param metadata - Partial metadata updates
   * @returns Promise resolving to updated workflow metadata
   */
  async updateWorkflow(
    workflowId: string,
    content: WorkflowContent,
    metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>
  ): Promise<WorkflowMetadata> {
    const existing = await this.database.getWorkflow(workflowId);
    if (!existing) {
      throw new Error(`Workflow with id ${workflowId} not found`);
    }

    const now = new Date().toISOString();
    const hasAttachments = content.attachments.size > 0;

    // Update files
    const workflowDir = existing.filePath;

    // Update main file
    const mainFilePath = path.join(workflowDir, existing.mainFile);
    await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');

    // Remove old attachments and add new ones
    const files = await fs.readdir(workflowDir);
    for (const file of files) {
      if (file !== existing.mainFile) {
        await fs.unlink(path.join(workflowDir, file));
      }
    }

    // Store new attachments
    for (const [fileName, fileContent] of content.attachments) {
      const attachmentPath = path.join(workflowDir, fileName);
      await fs.writeFile(attachmentPath, fileContent);
    }

    // Update database record
    const updates: Partial<WorkflowRecord> = {
      modifiedAt: now,
      hasAttachments,
    };

    if (metadata.name !== undefined) updates.name = metadata.name;
    if (metadata.description !== undefined) updates.description = metadata.description;
    if (metadata.author !== undefined) updates.author = metadata.author;
    if (metadata.tags !== undefined) updates.tags = JSON.stringify(metadata.tags);
    // Version updates not supported in this interface

    await this.database.updateWorkflow(workflowId, updates);

    const updated = await this.database.getWorkflow(workflowId);
    return this.recordToMetadata(updated!);
  }

  /**
   * Deletes a workflow from the database and filesystem.
   *
   * @param workflowId - Unique workflow identifier
   * @returns Promise resolving to true if deletion succeeded
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const existing = await this.database.getWorkflow(workflowId);
    if (!existing) {
      return false;
    }

    // Remove from filesystem
    try {
      await fs.rm(existing.filePath, { recursive: true, force: true });
    } catch {
      // Continue even if filesystem deletion fails
    }

    // Remove from database
    const deleted = await this.database.deleteWorkflow(workflowId);

    if (deleted) {
      // Remove from tree structure - use same path construction as when adding
      const fullPath = existing.path ? `${existing.path}/${existing.name}` : existing.name;
      await this.database.removeTreeStructure(fullPath);

      // Clean up empty parent directories
      await this.cleanupEmptyParentDirectories(existing.path);
    }

    return deleted;
  }

  /**
   * Retrieves workflow metadata by ID.
   *
   * @param workflowId - Unique workflow identifier
   * @returns Promise resolving to workflow metadata or null if not found
   */
  async getWorkflowMetadata(workflowId: string): Promise<WorkflowMetadata | null> {
    const record = await this.database.getWorkflow(workflowId);
    return record ? this.recordToMetadata(record) : null;
  }

  /**
   * Lists workflows with optional filtering.
   *
   * @param options - Optional search and filtering options
   * @returns Promise resolving to array of workflow metadata
   */
  async listWorkflows(options?: WorkflowSearchOptions): Promise<WorkflowMetadata[]> {
    const records = options
      ? await this.database.searchWorkflows(options)
      : await this.database.listWorkflows();

    return records.map(record => this.recordToMetadata(record));
  }

  /**
   * Searches workflows based on criteria.
   *
   * @param options - Search criteria
   * @returns Promise resolving to array of matching workflow metadata
   */
  async searchWorkflows(options: WorkflowSearchOptions): Promise<WorkflowMetadata[]> {
    const records = await this.database.searchWorkflows(options);
    return records.map(record => this.recordToMetadata(record));
  }

  /**
   * Gets the tree structure of workflows.
   *
   * @param path - Optional path to get tree structure from
   * @returns Promise resolving to tree structure
   */
  async getTreeStructure(path?: string): Promise<WorkflowTreeNode> {
    const records = await this.database.getTreeStructure(path);
    return await this.buildTreeFromRecords(records, path);
  }

  /**
   * Gets workflow content from filesystem.
   *
   * @param workflow - Workflow record
   * @returns Promise resolving to workflow content or null if not found
   */
  private async getWorkflowContent(workflow: WorkflowRecord): Promise<WorkflowContent | null> {
    try {
      const workflowDir = workflow.filePath;
      const mainFilePath = path.join(workflowDir, workflow.mainFile);

      const mainFile = await fs.readFile(mainFilePath, 'utf-8');
      const attachments = new Map<string, Buffer>();

      const files = await fs.readdir(workflowDir);
      for (const file of files) {
        if (file !== workflow.mainFile) {
          const filePath = path.join(workflowDir, file);
          const fileContent = await fs.readFile(filePath);
          attachments.set(file, fileContent);
        }
      }

      return { mainFile, attachments };
    } catch {
      return null;
    }
  }

  /**
   * Converts a database record to WorkflowMetadata.
   */
  private recordToMetadata(record: WorkflowRecord): WorkflowMetadata {
    let tags: string[];
    try {
      const parsed = JSON.parse(record.tags);
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      // If parsing fails, treat as empty array
      tags = [];
    }

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      author: record.author,
      tags: tags,
      path: record.path + record.name,
      mainFile: record.mainFile,
      createdAt: new Date(record.createdAt),
      modifiedAt: new Date(record.modifiedAt),
      hasAttachments: record.hasAttachments,
    };
  }

  /**
   * Updates the tree structure for a workflow.
   */
  private async updateTreeStructure(
    workflowPath: string,
    workflowName: string,
    workflowId: string
  ): Promise<void> {
    // Update parent directories
    const pathParts = workflowPath.split('/').filter(part => part);
    let currentPath = '';

    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      await this.database.updateTreeStructure(currentPath, true);
    }

    // Update workflow entry
    const fullPath = workflowPath ? `${workflowPath}/${workflowName}` : workflowName;
    await this.database.updateTreeStructure(fullPath, false, workflowId);
  }

  /**
   * Cleans up empty parent directories after a workflow is deleted.
   * Recursively removes parent directories that have no children left.
   */
  private async cleanupEmptyParentDirectories(workflowPath: string | null): Promise<void> {
    if (!workflowPath || workflowPath.trim() === '') {
      return;
    }

    // Get all paths from most specific to least specific
    const pathParts = workflowPath.split('/').filter(part => part);

    // Check each parent path from most specific to least specific
    for (let i = pathParts.length; i > 0; i--) {
      const currentPath = pathParts.slice(0, i).join('/');

      // Get tree records for this specific path and its immediate children
      const parentPath = i > 1 ? pathParts.slice(0, i - 1).join('/') : '';
      const allRecords = await this.database.getTreeStructure(parentPath || undefined);

      // Find records that are direct children of the current path
      const childRecords = allRecords.filter(record => {
        // Skip the directory itself
        if (record.path === currentPath) return false;

        // Find direct children (path starts with currentPath/ but doesn't have more slashes after that)
        if (!record.path.startsWith(`${currentPath}/`)) return false;

        const remainingPath = record.path.substring(`${currentPath}/`.length);
        return !remainingPath.includes('/'); // Direct child, not grandchild
      });

      // If this directory has no children, remove it
      if (childRecords.length === 0) {
        await this.database.removeTreeStructure(currentPath);
      } else {
        // If this directory has children, stop cleanup (don't remove parent directories)
        break;
      }
    }
  }

  /**
   * Builds tree structure from database records.
   */
  private async buildTreeFromRecords(
    records: WorkflowTreeRecord[],
    rootPath?: string
  ): Promise<WorkflowTreeNode> {
    // Use mutable interfaces during construction
    interface MutableTreeNode {
      name: string;
      path: string;
      type: 'folder' | 'workflow';
      children?: MutableTreeNode[];
      metadata?: WorkflowMetadata;
    }

    const nodeMap = new Map<string, MutableTreeNode>();
    const rootNodes: MutableTreeNode[] = [];

    // Create nodes
    for (const record of records) {
      const node: MutableTreeNode = {
        name: record.name,
        path: record.path,
        type: record.isDirectory ? 'folder' : 'workflow',
      };

      if (record.isDirectory) {
        node.children = [];
      }

      // If this is a workflow node, populate metadata
      if (record.workflowId) {
        const workflowRecord = await this.database.getWorkflow(record.workflowId);
        if (workflowRecord) {
          node.metadata = this.recordToMetadata(workflowRecord);
        }
      }

      nodeMap.set(record.path, node);
    }

    // Build tree structure
    for (const record of records) {
      const node = nodeMap.get(record.path);
      if (node && record.parentPath && nodeMap.has(record.parentPath)) {
        const parent = nodeMap.get(record.parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else if (node) {
        rootNodes.push(node);
      }
    }

    // Convert to readonly structure
    const convertToReadonly = (node: MutableTreeNode): WorkflowTreeNode => {
      const result: WorkflowTreeNode = {
        name: node.name,
        path: node.path,
        type: node.type,
      };

      if (node.children !== undefined) {
        (result as { children?: readonly WorkflowTreeNode[] }).children =
          node.children.map(convertToReadonly);
      }

      if (node.metadata !== undefined) {
        (result as { metadata?: WorkflowMetadata }).metadata = node.metadata;
      }

      return result;
    };

    // If a specific path is provided, find and return that node as root
    if (rootPath && rootPath.trim() !== '') {
      const targetNode = nodeMap.get(rootPath);
      if (targetNode) {
        return convertToReadonly(targetNode);
      }
      // If the target path doesn't exist in records, return empty structure
      return {
        name: rootPath.split('/').pop() || rootPath,
        path: rootPath,
        type: 'folder',
        children: [],
      };
    }

    // Default: return full repository structure
    return {
      name: 'Repository',
      path: '',
      type: 'folder',
      children: rootNodes.map(convertToReadonly),
    };
  }
}
