import * as vscode from 'vscode';
import * as path from 'path';

export interface ToolInfo {
  name: string;
  path: string;
  type: 'node' | 'binary';
  cwd?: string;
}

export class ToolResolver {
  private toolCache = new Map<string, ToolInfo>();

  constructor(private context: vscode.ExtensionContext) {}

  async resolveTool(toolName: string): Promise<ToolInfo> {
    // Check cache first
    if (this.toolCache.has(toolName)) {
      return this.toolCache.get(toolName)!;
    }

    const toolInfo = await this.findTool(toolName);
    this.toolCache.set(toolName, toolInfo);
    return toolInfo;
  }

  private async findTool(toolName: string): Promise<ToolInfo> {
    // Check user configuration first
    const config = vscode.workspace.getConfiguration('extremexp');
    const configKey = `tools.${toolName.replace('-', '')}.path`; // Remove hyphens for config key
    const userPath = config.get<string>(configKey);
    if (userPath && (await this.pathExists(userPath))) {
      return {
        name: toolName,
        path: userPath,
        type: this.getToolType(userPath),
      };
    }

    // Rest of the method remains the same...
    const searchPaths = this.getSearchPaths(toolName);

    for (const searchPath of searchPaths) {
      if (await this.pathExists(searchPath)) {
        return {
          name: toolName,
          path: searchPath,
          type: this.getToolType(searchPath),
          cwd: this.getToolWorkingDirectory(searchPath),
        };
      }
    }

    throw new Error(`Tool '${toolName}' not found. Please check your configuration.`);
  }

  private getSearchPaths(toolName: string): string[] {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const extensionPath = this.context.extensionPath;

    const toolMappings: Record<string, string[]> = {
      'artifact-generator': [
        // Bundled with extension (production)
        path.join(extensionPath, 'bundled-tools/artifact-generator/cli.js'),

        // Development paths (monorepo)
        path.join(workspacePath, 'packages/artifact-generator/dist/cli.js'),
        path.join(extensionPath, '../artifact-generator/dist/cli.js'),
        path.join(extensionPath, '../../packages/artifact-generator/dist/cli.js'),

        // Node modules
        path.join(extensionPath, 'node_modules/@extremexp/artifact-generator/dist/cli.js'),
        path.join(workspacePath, 'node_modules/@extremexp/artifact-generator/dist/cli.js'),
      ],
      'experiment-runner-server': [
        // Bundled with extension (production)
        path.join(extensionPath, 'bundled-tools/experiment-runner-server/server.js'),

        // Development paths (monorepo)
        path.join(workspacePath, 'packages/experiment-runner-server/dist/server.js'),
        path.join(extensionPath, '../experiment-runner-server/dist/server.js'),
        path.join(extensionPath, '../../packages/experiment-runner-server/dist/server.js'),

        // Node modules
        path.join(extensionPath, 'node_modules/@extremexp/experiment-runner-server/dist/server.js'),
        path.join(workspacePath, 'node_modules/@extremexp/experiment-runner-server/dist/server.js'),
      ],
    };

    return toolMappings[toolName] || [];
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return stat.type === vscode.FileType.File;
    } catch {
      return false;
    }
  }

  private getToolType(toolPath: string): 'node' | 'binary' {
    return toolPath.endsWith('.js') ? 'node' : 'binary';
  }

  private getToolWorkingDirectory(toolPath: string): string {
    return path.dirname(toolPath);
  }

  clearCache(): void {
    this.toolCache.clear();
  }
}
