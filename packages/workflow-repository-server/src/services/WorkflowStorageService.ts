import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowContent, LocalWorkflowRepository } from '@extremexp/workflow-repository';

export class WorkflowStorageService {
  private repository: LocalWorkflowRepository;

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
          version: metadata.metadata.version,
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

      const manifestFile = zip.file('workflow.json');
      if (!manifestFile) {
        return null;
      }

      const manifestContent = await manifestFile.async('string');
      const metadata = JSON.parse(manifestContent);

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
