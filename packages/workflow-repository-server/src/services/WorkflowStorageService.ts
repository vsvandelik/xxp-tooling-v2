/**
 * Workflow storage service for server-side workflow management.
 * Provides high-level storage operations, ZIP handling, conflict resolution,
 * and metadata aggregation for the workflow repository server.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import { WorkflowContent, LocalWorkflowRepository } from '@extremexp/workflow-repository';

/**
 * Service class providing storage operations for workflows on the server.
 * Wraps LocalWorkflowRepository with additional server-specific functionality
 * including conflict resolution, ZIP handling, and override permissions.
 */
export class WorkflowStorageService {
  /** Underlying local workflow repository instance */
  private repository: LocalWorkflowRepository;
  /** Track allowed overrides per session with workflow-request mapping */
  private uploadOverrides = new Map<string, boolean>();

  /**
   * Creates a new workflow storage service.
   *
   * @param basePath - Base directory path for workflow storage
   */
  constructor(private basePath: string) {
    this.repository = new LocalWorkflowRepository(basePath);
  }

  /**
   * Ensures the storage directory exists and is accessible.
   *
   * @throws Error if directory creation fails
   */
  async ensureInitialized(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  /**
   * Retrieves all unique tags from workflows in the repository.
   *
   * @returns Promise resolving to sorted array of tag strings
   * @throws Error if repository access fails
   */
  async getAllTags(): Promise<string[]> {
    const workflows = await this.repository.list();
    const tagSet = new Set<string>();

    workflows.forEach(workflow => {
      workflow.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  /**
   * Retrieves all unique authors from workflows in the repository.
   *
   * @returns Promise resolving to sorted array of author names
   * @throws Error if repository access fails
   */
  async getAllAuthors(): Promise<string[]> {
    const workflows = await this.repository.list();
    const authorSet = new Set<string>();

    workflows.forEach(workflow => {
      authorSet.add(workflow.author);
    });

    return Array.from(authorSet).sort();
  }

  /**
   * Gets the owner/author of a specific workflow.
   *
   * @param workflowId - Unique workflow identifier
   * @returns Promise resolving to author name or null if not found
   */
  async getWorkflowOwner(workflowId: string): Promise<string | null> {
    const workflow = await this.repository.get(workflowId);
    return workflow?.metadata.author || null;
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
    const workflows = await this.repository.list(workflowPath);
    const existing = workflows.find(w => w.name === workflowName);

    if (existing) {
      return { exists: true, id: existing.id };
    }

    return { exists: false };
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
    const content = await this.repository.getContent(workflowId);
    if (!content) {
      return null;
    }

    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    const metadata = await this.repository.get(workflowId);
    if (!metadata) {
      return null;
    }

    zip.file(metadata.metadata.mainFile, content.mainFile);

    for (const [fileName, fileContent] of content.attachments) {
      zip.file(fileName, fileContent);
    }

    zip.file(
      'workflow.json',
      JSON.stringify(
        {
          name: metadata.metadata.name,
          description: metadata.metadata.description,
          author: metadata.metadata.author,
          tags: metadata.metadata.tags,
          mainFile: metadata.metadata.mainFile,
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
  ): Promise<{ content: WorkflowContent; metadata: any } | null> {
    try {
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(zipBuffer);

      // First, try to find workflow.json
      const manifestFile = zip.file('workflow.json');
      let metadata: any;

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
   * Gets the underlying local workflow repository instance.
   *
   * @returns LocalWorkflowRepository instance
   */
  getRepository(): LocalWorkflowRepository {
    return this.repository;
  }
}
