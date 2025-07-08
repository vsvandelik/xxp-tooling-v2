import * as fs from 'fs/promises';
import * as path from 'path';

import { WorkflowContent, LocalWorkflowRepository } from '@extremexp/workflow-repository';

export class WorkflowStorageService {
  private repository: LocalWorkflowRepository;
  private uploadOverrides = new Map<string, boolean>(); // Track allowed overrides per session

  constructor(private basePath: string) {
    this.repository = new LocalWorkflowRepository(basePath);
  }

  async ensureInitialized(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  async getAllTags(): Promise<string[]> {
    const workflows = await this.repository.list();
    const tagSet = new Set<string>();

    workflows.forEach(workflow => {
      workflow.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  async getAllAuthors(): Promise<string[]> {
    const workflows = await this.repository.list();
    const authorSet = new Set<string>();

    workflows.forEach(workflow => {
      authorSet.add(workflow.author);
    });

    return Array.from(authorSet).sort();
  }

  async getWorkflowOwner(workflowId: string): Promise<string | null> {
    const workflow = await this.repository.get(workflowId);
    return workflow?.metadata.author || null;
  }

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

  async canOverrideWorkflow(workflowId: string, requestId: string): Promise<boolean> {
    const key = `${workflowId}-${requestId}`;
    return this.uploadOverrides.get(key) || false;
  }

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

  async validateWorkflowPath(workflowPath: string): Promise<boolean> {
    const normalizedPath = path.normalize(workflowPath);
    return !normalizedPath.includes('..') && !path.isAbsolute(normalizedPath);
  }

  getRepository(): LocalWorkflowRepository {
    return this.repository;
  }
}
