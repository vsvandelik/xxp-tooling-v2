import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowAttachment } from '../models/WorkflowAttachment.js';
import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';

interface WorkflowManifest {
  name: string;
  description: string;
  author: string;
  tags: string[];
  mainFile: string;
}

export class LocalWorkflowRepository implements IWorkflowRepository {
  constructor(private readonly basePath: string) {}

  async list(
    workflowPath?: string,
    options?: WorkflowSearchOptions
  ): Promise<readonly WorkflowMetadata[]> {
    const searchPath = workflowPath ? path.join(this.basePath, workflowPath) : this.basePath;
    const workflows: WorkflowMetadata[] = [];

    await this.collectWorkflows(searchPath, workflows, workflowPath || '');

    if (options) {
      return this.filterWorkflows(workflows, options);
    }

    return workflows;
  }

  async get(id: string): Promise<WorkflowItem | null> {
    const metadata = await this.findWorkflowById(id);
    if (!metadata) {
      return null;
    }

    const content = await this.getContent(id);
    if (!content) {
      return null;
    }

    const attachments = await this.loadAttachments(metadata.path);

    return {
      metadata,
      mainFileContent: content.mainFile,
      attachments,
    };
  }

  async getContent(id: string): Promise<WorkflowContent | null> {
    const metadata = await this.findWorkflowById(id);
    if (!metadata) {
      return null;
    }

    const workflowDir = path.join(this.basePath, metadata.path);

    // Check if it's a single-file workflow
    if (metadata.path.endsWith('.xxp') || metadata.path.endsWith('.espace')) {
      const filePath = path.join(this.basePath, metadata.path);
      try {
        const mainFile = await fs.readFile(filePath, 'utf-8');
        return { mainFile, attachments: new Map() };
      } catch {
        return null;
      }
    }

    // Multi-file workflow
    const mainFilePath = path.join(workflowDir, metadata.mainFile);

    try {
      const mainFile = await fs.readFile(mainFilePath, 'utf-8');
      const attachments = new Map<string, Buffer>();

      const files = await fs.readdir(workflowDir);
      for (const file of files) {
        if (file !== metadata.mainFile && file !== 'workflow.json') {
          const filePath = path.join(workflowDir, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            const content = await fs.readFile(filePath);
            attachments.set(file, content);
          }
        }
      }

      return { mainFile, attachments };
    } catch {
      return null;
    }
  }

  async upload(
    workflowPath: string,
    content: WorkflowContent,
    metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>
  ): Promise<WorkflowMetadata> {
    // Generate unique workflow folder name
    const workflowFolderName = this.sanitizeFileName(metadata.name);
    const fullWorkflowPath = path.join(workflowPath, workflowFolderName);
    const id = this.generateId(fullWorkflowPath, metadata.name);

    // Check if workflow already exists
    const existing = await this.findWorkflowById(id);
    if (existing) {
      throw new Error(
        `Workflow "${metadata.name}" already exists at path "${workflowPath}". ` +
          `Use delete and upload to modify it or choose a different name.`
      );
    }

    const workflowDir = path.join(this.basePath, fullWorkflowPath);

    // Check if directory already exists
    try {
      await fs.access(workflowDir);
      throw new Error(
        `Directory "${workflowFolderName}" already exists at path "${workflowPath}". ` +
          `Please choose a different workflow name.`
      );
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.mkdir(workflowDir, { recursive: true });

    const mainFilePath = path.join(workflowDir, metadata.mainFile);
    await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');

    for (const [fileName, fileContent] of content.attachments) {
      const filePath = path.join(workflowDir, fileName);
      await fs.writeFile(filePath, fileContent);
    }

    const now = new Date();
    const fullMetadata: WorkflowMetadata = {
      ...metadata,
      id,
      createdAt: now,
      modifiedAt: now,
      path: fullWorkflowPath,
      hasAttachments: content.attachments.size > 0,
    };

    await this.saveManifest(workflowDir, fullMetadata);

    return fullMetadata;
  }

  async update(
    id: string,
    content: WorkflowContent,
    metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>
  ): Promise<WorkflowMetadata> {
    const existingMetadata = await this.findWorkflowById(id);
    if (!existingMetadata) {
      throw new Error(`Workflow with id ${id} not found`);
    }

    const workflowDir = path.join(this.basePath, existingMetadata.path);

    if (content.mainFile) {
      const mainFilePath = path.join(workflowDir, existingMetadata.mainFile);
      await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');
    }

    // Remove old attachments
    const files = await fs.readdir(workflowDir);
    for (const file of files) {
      if (file !== existingMetadata.mainFile && file !== 'workflow.json') {
        await fs.unlink(path.join(workflowDir, file));
      }
    }

    // Add new attachments
    for (const [fileName, fileContent] of content.attachments) {
      const filePath = path.join(workflowDir, fileName);
      await fs.writeFile(filePath, fileContent);
    }

    const updatedMetadata: WorkflowMetadata = {
      ...existingMetadata,
      ...metadata,
      modifiedAt: new Date(),
      hasAttachments: content.attachments.size > 0,
    };

    await this.saveManifest(workflowDir, updatedMetadata);

    return updatedMetadata;
  }

  async delete(id: string): Promise<boolean> {
    const metadata = await this.findWorkflowById(id);
    if (!metadata) {
      return false;
    }

    const workflowDir = path.join(this.basePath, metadata.path);

    try {
      await fs.rm(workflowDir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const metadata = await this.findWorkflowById(id);
    return metadata !== null;
  }

  async search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]> {
    const allWorkflows = await this.list();
    return this.filterWorkflows(allWorkflows, options);
  }

  async getTreeStructure(workflowPath?: string): Promise<WorkflowTreeNode> {
    const searchPath = workflowPath ? path.join(this.basePath, workflowPath) : this.basePath;
    return await this.buildTreeNode(searchPath, workflowPath || '');
  }

  private async collectWorkflows(
    searchPath: string,
    workflows: WorkflowMetadata[],
    relativePath: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });

      // First, check for single-file workflows in current directory
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.xxp') || entry.name.endsWith('.espace'))) {
          const metadata = await this.loadSingleFileWorkflow(
            path.join(searchPath, entry.name),
            path.join(relativePath, entry.name)
          );
          if (metadata) {
            workflows.push(metadata);
          }
        }
      }

      // Then check subdirectories
      for (const entry of entries) {
        const fullPath = path.join(searchPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          const manifestPath = path.join(fullPath, 'workflow.json');

          try {
            await fs.access(manifestPath);
            const metadata = await this.loadMetadata(fullPath);
            if (metadata) {
              workflows.push(metadata);
            }
          } catch {
            // No workflow.json, check subdirectories
            await this.collectWorkflows(fullPath, workflows, relPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  private async loadSingleFileWorkflow(
    filePath: string,
    relativePath: string
  ): Promise<WorkflowMetadata | null> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const nameWithoutExt = path.parse(fileName).name;

      // Try to extract metadata from file content
      const content = await fs.readFile(filePath, 'utf-8');
      const metadata = this.extractMetadataFromContent(content, nameWithoutExt);

      const id = this.generateId(relativePath, nameWithoutExt);

      return {
        id,
        name: metadata.name || nameWithoutExt,
        description: metadata.description || `Single-file workflow: ${fileName}`,
        author: metadata.author || 'Unknown',
        tags: metadata.tags || [],
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        path: relativePath,
        hasAttachments: false,
        mainFile: fileName,
      };
    } catch {
      return null;
    }
  }

  private extractMetadataFromContent(
    content: string,
    defaultName: string
  ): Partial<WorkflowManifest> {
    const metadata: Partial<WorkflowManifest> = {
      name: defaultName,
      description: '',
      author: 'Unknown',
      tags: [],
    };

    // Try to extract metadata from comments at the beginning of the file
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines

    for (const line of lines) {
      const commentMatch = line.match(/^\s*(?:\/\/|#)\s*@(\w+)\s+(.+)$/);
      if (commentMatch) {
        const [, key, value] = commentMatch;
        switch (key?.toLowerCase()) {
          case 'name':
            metadata.name = value?.trim() || defaultName;
            break;
          case 'description':
            metadata.description = value?.trim() || '';
            break;
          case 'author':
            metadata.author = value?.trim() || 'Unknown';
            break;
          case 'tags':
            metadata.tags = value?.split(',').map(t => t.trim()) || [];
            break;
        }
      }
    }

    return metadata;
  }

  private async loadMetadata(workflowDir: string): Promise<WorkflowMetadata | null> {
    try {
      const manifestPath = path.join(workflowDir, 'workflow.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: WorkflowManifest = JSON.parse(manifestContent);

      const stats = await fs.stat(workflowDir);
      const relativePath = path.relative(this.basePath, workflowDir);
      const id = this.generateId(relativePath, manifest.name);

      const files = await fs.readdir(workflowDir);
      const hasAttachments = files.some(
        file => file !== manifest.mainFile && file !== 'workflow.json'
      );

      return {
        id,
        name: manifest.name,
        description: manifest.description,
        author: manifest.author,
        tags: manifest.tags,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        path: relativePath,
        hasAttachments,
        mainFile: manifest.mainFile,
      };
    } catch {
      return null;
    }
  }

  private async saveManifest(workflowDir: string, metadata: WorkflowMetadata): Promise<void> {
    const manifest: WorkflowManifest = {
      name: metadata.name,
      description: metadata.description,
      author: metadata.author,
      tags: [...metadata.tags],
      mainFile: metadata.mainFile,
    };

    const manifestPath = path.join(workflowDir, 'workflow.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  private async findWorkflowById(id: string): Promise<WorkflowMetadata | null> {
    const workflows = await this.list();
    return workflows.find(w => w.id === id) || null;
  }

  private async loadAttachments(workflowPath: string): Promise<readonly WorkflowAttachment[]> {
    // Single-file workflows don't have attachments
    if (workflowPath.endsWith('.xxp') || workflowPath.endsWith('.espace')) {
      return [];
    }

    const workflowDir = path.join(this.basePath, workflowPath);
    const attachments: WorkflowAttachment[] = [];

    try {
      const files = await fs.readdir(workflowDir);
      const manifest = await this.loadMetadata(workflowDir);

      if (!manifest) {
        return attachments;
      }

      for (const file of files) {
        if (file !== manifest.mainFile && file !== 'workflow.json') {
          const filePath = path.join(workflowDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            attachments.push({
              name: file,
              path: path.join(workflowPath, file),
              size: stats.size,
              mimeType: this.getMimeType(file),
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return attachments;
  }

  private filterWorkflows(
    workflows: readonly WorkflowMetadata[],
    options: WorkflowSearchOptions
  ): readonly WorkflowMetadata[] {
    let filtered = [...workflows];

    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(
        w =>
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.author) {
      filtered = filtered.filter(w =>
        w.author.toLowerCase().includes(options.author!.toLowerCase())
      );
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(w =>
        options.tags!.some(tag => w.tags.some(wTag => wTag.toLowerCase() === tag.toLowerCase()))
      );
    }

    if (options.path) {
      filtered = filtered.filter(w => w.path.startsWith(options.path!));
    }

    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  private async buildTreeNode(dirPath: string, relativePath: string): Promise<WorkflowTreeNode> {
    const name = relativePath === '' ? 'Repository' : path.basename(dirPath);
    const children: WorkflowTreeNode[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // First, add single-file workflows in the current directory
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.xxp') || entry.name.endsWith('.espace'))) {
          const filePath = path.join(dirPath, entry.name);
          const relPath = path.join(relativePath, entry.name);
          const metadata = await this.loadSingleFileWorkflow(filePath, relPath);

          if (metadata) {
            children.push({
              name: entry.name,
              path: relPath,
              type: 'workflow',
              metadata,
            });
          }
        }
      }

      // Then process directories
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const childRelativePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          const manifestPath = path.join(fullPath, 'workflow.json');

          try {
            await fs.access(manifestPath);
            const metadata = await this.loadMetadata(fullPath);
            if (metadata) {
              children.push({
                name: entry.name,
                path: childRelativePath,
                type: 'workflow',
                metadata,
              });
            }
          } catch {
            // No workflow.json, so it's a regular folder
            const childNode = await this.buildTreeNode(fullPath, childRelativePath);
            if (childNode.children && childNode.children.length > 0) {
              children.push(childNode);
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return {
      name,
      path: relativePath,
      type: 'folder',
      children: children.length > 0 ? children : [],
    };
  }

  private generateId(workflowPath: string, name: string): string {
    const input = `${workflowPath}/${name}`.replace(/\\/g, '/'); // Normalize path separators
    return createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  private sanitizeFileName(name: string): string {
    // Remove or replace characters that are invalid in file names
    return name
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 255); // Limit length
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.py': 'text/x-python',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.xml': 'application/xml',
      '.yaml': 'application/x-yaml',
      '.yml': 'application/x-yaml',
      '.xxp': 'application/x-xxp',
      '.espace': 'application/x-espace',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
