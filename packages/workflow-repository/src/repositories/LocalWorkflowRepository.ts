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
  version: string;
  tags: string[];
  mainFile: string;
}

export class LocalWorkflowRepository implements IWorkflowRepository {
  constructor(private readonly basePath: string) {}

  async list(workflowPath?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]> {
    const searchPath = workflowPath ? path.join(this.basePath, workflowPath) : this.basePath;
    const workflows: WorkflowMetadata[] = [];
    
    await this.collectWorkflows(searchPath, workflows);
    
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
      attachments
    };
  }

  async getContent(id: string): Promise<WorkflowContent | null> {
    const metadata = await this.findWorkflowById(id);
    if (!metadata) {
      return null;
    }

    const workflowDir = path.join(this.basePath, metadata.path);
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
    } catch (error) {
      return null;
    }
  }

  async upload(workflowPath: string, content: WorkflowContent, metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>): Promise<WorkflowMetadata> {
    const id = this.generateId(workflowPath, metadata.name);
    const workflowDir = path.join(this.basePath, workflowPath);
    
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
      path: workflowPath,
      hasAttachments: content.attachments.size > 0
    };

    await this.saveManifest(workflowDir, fullMetadata);
    
    return fullMetadata;
  }

  async update(id: string, content: WorkflowContent, metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>): Promise<WorkflowMetadata> {
    const existingMetadata = await this.findWorkflowById(id);
    if (!existingMetadata) {
      throw new Error(`Workflow with id ${id} not found`);
    }

    const workflowDir = path.join(this.basePath, existingMetadata.path);
    
    if (content.mainFile) {
      const mainFilePath = path.join(workflowDir, existingMetadata.mainFile);
      await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');
    }

    const files = await fs.readdir(workflowDir);
    for (const file of files) {
      if (file !== existingMetadata.mainFile && file !== 'workflow.json') {
        await fs.unlink(path.join(workflowDir, file));
      }
    }

    for (const [fileName, fileContent] of content.attachments) {
      const filePath = path.join(workflowDir, fileName);
      await fs.writeFile(filePath, fileContent);
    }

    const updatedMetadata: WorkflowMetadata = {
      ...existingMetadata,
      ...metadata,
      modifiedAt: new Date(),
      hasAttachments: content.attachments.size > 0
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

  private async collectWorkflows(searchPath: string, workflows: WorkflowMetadata[]): Promise<void> {
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(searchPath, entry.name);
        
        if (entry.isDirectory()) {
          const manifestPath = path.join(fullPath, 'workflow.json');
          
          try {
            await fs.access(manifestPath);
            const metadata = await this.loadMetadata(fullPath);
            if (metadata) {
              workflows.push(metadata);
            }
          } catch {
            await this.collectWorkflows(fullPath, workflows);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
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
      const hasAttachments = files.some(file => file !== manifest.mainFile && file !== 'workflow.json');
      
      return {
        id,
        name: manifest.name,
        description: manifest.description,
        author: manifest.author,
        version: manifest.version,
        tags: manifest.tags,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        path: relativePath,
        hasAttachments,
        mainFile: manifest.mainFile
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
      version: metadata.version,
      tags: [...metadata.tags],
      mainFile: metadata.mainFile
    };
    
    const manifestPath = path.join(workflowDir, 'workflow.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  private async findWorkflowById(id: string): Promise<WorkflowMetadata | null> {
    const workflows = await this.list();
    return workflows.find(w => w.id === id) || null;
  }

  private async loadAttachments(workflowPath: string): Promise<readonly WorkflowAttachment[]> {
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
              modifiedAt: stats.mtime
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
    
    return attachments;
  }

  private filterWorkflows(workflows: readonly WorkflowMetadata[], options: WorkflowSearchOptions): readonly WorkflowMetadata[] {
    let filtered = [...workflows];
    
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(query) || 
        w.description.toLowerCase().includes(query)
      );
    }
    
    if (options.author) {
      filtered = filtered.filter(w => w.author === options.author);
    }
    
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(w => 
        options.tags!.some(tag => w.tags.includes(tag))
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
    const name = path.basename(dirPath) || 'Repository';
    const children: WorkflowTreeNode[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
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
                metadata
              });
            }
          } catch {
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
      children
    };
  }

  private generateId(workflowPath: string, name: string): string {
    const input = `${workflowPath}/${name}`;
    return createHash('sha256').update(input).digest('hex').substring(0, 16);
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
      '.xxp': 'application/x-xxp',
      '.espace': 'application/x-espace'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}