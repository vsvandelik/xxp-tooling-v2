import * as fs from 'fs';
import * as path from 'path';

export class FileResolver {
  private workflowDirectory: string;

  constructor(workflowDirectory: string) {
    this.workflowDirectory = path.resolve(workflowDirectory);
  }

  async findWorkflowFiles(workflowName: string): Promise<string[]> {
    const files: string[] = [];
    const visited = new Set<string>();

    const findWorkflowRecursive = async (name: string): Promise<void> => {
      if (visited.has(name)) return;
      visited.add(name);

      const filePath = path.join(this.workflowDirectory, `${name}.xxp`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Workflow file not found: ${filePath}`);
      }

      // First, parse to find parent workflow
      const content = fs.readFileSync(filePath, 'utf8');
      const parentMatch = content.match(/workflow\s+\w+\s+from\s+(\w+)/);

      if (parentMatch) {
        const parentName = parentMatch[1];
        await findWorkflowRecursive(parentName!);
      }

      files.push(filePath);
    };

    await findWorkflowRecursive(workflowName);
    return files;
  }

  resolveDataPath(dataPath: string): string {
    if (path.isAbsolute(dataPath)) {
      return dataPath;
    }
    return path.resolve(this.workflowDirectory, dataPath);
  }

  resolveImplementationPath(implementationPath: string): string {
    if (path.isAbsolute(implementationPath)) {
      return implementationPath;
    }
    return path.resolve(this.workflowDirectory, implementationPath);
  }
}
