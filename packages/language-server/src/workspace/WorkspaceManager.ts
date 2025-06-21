// packages/language-server/src/workspace/WorkspaceManager.ts
import { WorkspaceFolder, DidChangeWorkspaceFoldersParams } from 'vscode-languageserver/node';
import * as path from 'path';
import * as fs from 'fs/promises';

export class WorkspaceManager {
  private workspaceFolders: Map<string, WorkspaceFolder> = new Map();
  private fileIndex: Map<string, Set<string>> = new Map(); // extension -> Set<filePath>

  constructor(folders: WorkspaceFolder[]) {
    for (const folder of folders) {
      this.workspaceFolders.set(folder.uri, folder);
    }

    // Start indexing workspace files
    this.indexWorkspaceFiles();
  }

  updateWorkspaceFolders(params: DidChangeWorkspaceFoldersParams): void {
    // Remove folders
    for (const folder of params.event.removed) {
      this.workspaceFolders.delete(folder.uri);
      // TODO: Clean up file index for removed folders
    }

    // Add folders
    for (const folder of params.event.added) {
      this.workspaceFolders.set(folder.uri, folder);
      this.indexWorkspaceFolder(folder);
    }
  }

  async findFiles(pattern: string): Promise<string[]> {
    const results: string[] = [];
    const extension = path.extname(pattern);

    if (extension) {
      const files = this.fileIndex.get(extension) || new Set();
      for (const file of files) {
        if (this.matchesPattern(file, pattern)) {
          results.push(file);
        }
      }
    }

    return results;
  }

  async findWorkflowFile(workflowName: string): Promise<string | null> {
    const fileName = this.workflowNameToFileName(workflowName);
    const files = await this.findFiles(`**/${fileName}`);
    return files[0] || null;
  }

  resolveUri(uri: string): string {
    // Convert VS Code URI to file path
    if (uri.startsWith('file://')) {
      return uri.substring(7);
    }
    return uri;
  }

  getWorkspaceRoot(): string | null {
    if (this.workspaceFolders.size === 0) {
      return null;
    }

    // Return the first workspace folder
    const firstFolder = this.workspaceFolders.values().next().value;
    return firstFolder ? this.resolveUri(firstFolder.uri) : null;
  }

  private async indexWorkspaceFiles(): Promise<void> {
    for (const folder of this.workspaceFolders.values()) {
      await this.indexWorkspaceFolder(folder);
    }
  }

  private async indexWorkspaceFolder(folder: WorkspaceFolder): Promise<void> {
    const folderPath = this.resolveUri(folder.uri);

    try {
      await this.walkDirectory(folderPath, async filePath => {
        const ext = path.extname(filePath);
        if (ext === '.xxp' || ext === '.espace') {
          if (!this.fileIndex.has(ext)) {
            this.fileIndex.set(ext, new Set());
          }
          this.fileIndex.get(ext)!.add(filePath);
        }
      });
    } catch (error) {
      console.error(`Error indexing workspace folder ${folderPath}:`, error);
    }
  }

  private async walkDirectory(
    dir: string,
    callback: (filePath: string) => Promise<void>
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            await this.walkDirectory(fullPath, callback);
          }
        } else if (entry.isFile()) {
          await callback(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching (could be enhanced with glob support)
    if (pattern.includes('*')) {
      const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
      return new RegExp(regex).test(filePath);
    }

    return filePath.includes(pattern);
  }

  private workflowNameToFileName(workflowName: string): string {
    // Convert PascalCase to camelCase and add .xxp extension
    return workflowName.charAt(0).toLowerCase() + workflowName.slice(1) + '.xxp';
  }

  // File system operations
  async readFile(uri: string): Promise<string> {
    const filePath = this.resolveUri(uri);
    return await fs.readFile(filePath, 'utf8');
  }

  async fileExists(uri: string): Promise<boolean> {
    const filePath = this.resolveUri(uri);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createFile(uri: string, content: string): Promise<void> {
    const filePath = this.resolveUri(uri);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf8');

    // Update index
    const ext = path.extname(filePath);
    if (ext === '.xxp' || ext === '.espace') {
      if (!this.fileIndex.has(ext)) {
        this.fileIndex.set(ext, new Set());
      }
      this.fileIndex.get(ext)!.add(filePath);
    }
  }

  // Get all files of a specific type
  getFilesWithExtension(extension: string): string[] {
    return Array.from(this.fileIndex.get(extension) || []);
  }

  // Check if a URI is within the workspace
  isInWorkspace(uri: string): boolean {
    const filePath = this.resolveUri(uri);

    for (const folder of this.workspaceFolders.values()) {
      const folderPath = this.resolveUri(folder.uri);
      if (filePath.startsWith(folderPath)) {
        return true;
      }
    }

    return false;
  }
}
