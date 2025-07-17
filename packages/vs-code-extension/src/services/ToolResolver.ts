/**
 * Tool resolver for locating ExtremeXP toolchain executables.
 * Provides intelligent tool discovery across bundled tools, development environments,
 * user configurations, and node_modules with caching for performance.
 */

import * as path from 'path';

import * as vscode from 'vscode';

/**
 * Information about a resolved tool including execution details.
 */
export interface ToolInfo {
  /** Name of the tool (e.g., 'artifact-generator') */
  name: string;
  /** Absolute path to the tool executable */
  path: string;
  /** Execution type - Node.js script or native binary */
  type: 'node' | 'binary';
  /** Optional working directory for tool execution */
  cwd?: string;
}

/**
 * Service for resolving ExtremeXP tool locations across different deployment scenarios.
 * Handles bundled tools, development environments, user configurations, and package installations.
 */
export class ToolResolver {
  /** Cache of resolved tool information for performance optimization */
  private toolCache = new Map<string, ToolInfo>();
  /** Debug output channel for tool resolution logging */
  private debugChannel: vscode.OutputChannel;

  /**
   * Creates a new tool resolver instance.
   *
   * @param context - VS Code extension context for accessing extension paths
   */
  constructor(private context: vscode.ExtensionContext) {
    this.debugChannel = vscode.window.createOutputChannel('ExtremeXP Tools');
  }

  /**
   * Resolves the location and execution information for a named tool.
   * Uses caching to avoid repeated file system operations.
   *
   * @param toolName - Name of the tool to resolve (e.g., 'artifact-generator')
   * @returns Promise resolving to tool information
   * @throws Error if tool cannot be found in any search location
   */
  async resolveTool(toolName: string): Promise<ToolInfo> {
    // Check cache first
    if (this.toolCache.has(toolName)) {
      return this.toolCache.get(toolName)!;
    }

    const toolInfo = await this.findTool(toolName);
    this.toolCache.set(toolName, toolInfo);
    return toolInfo;
  }

  /**
   * Searches for a tool across all possible locations.
   * Checks user configuration first, then searches predefined paths.
   *
   * @param toolName - Name of the tool to find
   * @returns Promise resolving to tool information
   * @throws Error if tool is not found in any location
   */
  private async findTool(toolName: string): Promise<ToolInfo> {
    this.debugChannel.appendLine(`[ToolResolver] Finding tool: ${toolName}`);

    // Check user configuration first
    const config = vscode.workspace.getConfiguration('extremexp');
    const configKey = `tools.${toolName.replace(/-/g, '')}.path`; // Remove all hyphens for config key
    const userPath = config.get<string>(configKey);

    if (userPath && (await this.pathExists(userPath))) {
      this.debugChannel.appendLine(
        `[ToolResolver] Found tool at user configured path: ${userPath}`
      );
      return {
        name: toolName,
        path: userPath,
        type: this.getToolType(userPath),
      };
    }

    // Search in predefined paths
    const searchPaths = this.getSearchPaths(toolName);

    for (const searchPath of searchPaths) {
      if (await this.pathExists(searchPath)) {
        const toolInfo = {
          name: toolName,
          path: searchPath,
          type: this.getToolType(searchPath),
          cwd: this.getToolWorkingDirectory(searchPath),
        };
        this.debugChannel.appendLine(
          `[ToolResolver] Found tool: ${toolInfo.name} at ${toolInfo.path}`
        );
        return toolInfo;
      }
    }

    this.debugChannel.appendLine(`[ToolResolver] Tool '${toolName}' not found in any search path`);
    throw new Error(`Tool '${toolName}' not found. Please check your configuration.`);
  }

  /**
   * Gets the ordered list of search paths for a specific tool.
   * Includes bundled tools, development paths, and node_modules locations.
   *
   * @param toolName - Name of the tool to get search paths for
   * @returns Array of absolute paths to search in priority order
   */
  private getSearchPaths(toolName: string): string[] {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const extensionPath = this.context.extensionPath;

    const toolMappings: Record<string, string[]> = {
      'artifact-generator': [
        // Bundled with extension (production)
        path.join(extensionPath, 'tools/artifact-generator.cjs'),

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
        path.join(extensionPath, 'tools/experiment-runner-server.cjs'),

        // Development paths (monorepo)
        path.join(workspacePath, 'packages/experiment-runner-server/dist/server.js'),
        path.join(extensionPath, '../experiment-runner-server/dist/server.js'),
        path.join(extensionPath, '../../packages/experiment-runner-server/dist/server.js'),

        // Node modules
        path.join(extensionPath, 'node_modules/@extremexp/experiment-runner-server/dist/server.js'),
        path.join(workspacePath, 'node_modules/@extremexp/experiment-runner-server/dist/server.js'),
      ],
      'language-server': [
        // Bundled with extension (production)
        path.join(extensionPath, 'tools/language-server.cjs'),

        // Development paths (monorepo)
        path.join(workspacePath, 'packages/language-server/dist/server.js'),
        path.join(extensionPath, '../language-server/dist/server.js'),
        path.join(extensionPath, '../../packages/language-server/dist/server.js'),

        // Node modules
        path.join(extensionPath, 'node_modules/@extremexp/language-server/dist/server.js'),
        path.join(workspacePath, 'node_modules/@extremexp/language-server/dist/server.js'),
      ],
    };

    return toolMappings[toolName] || [];
  }

  /**
   * Checks if a file exists at the specified path.
   *
   * @param filePath - Absolute path to check
   * @returns Promise resolving to true if file exists and is a file
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return stat.type === vscode.FileType.File;
    } catch {
      return false;
    }
  }

  /**
   * Determines the execution type of a tool based on its file extension.
   *
   * @param toolPath - Path to the tool executable
   * @returns 'node' for .js files, 'binary' for everything else
   */
  private getToolType(toolPath: string): 'node' | 'binary' {
    return toolPath.endsWith('.js') ? 'node' : 'binary';
  }

  /**
   * Gets the appropriate working directory for tool execution.
   *
   * @param toolPath - Path to the tool executable
   * @returns Directory containing the tool executable
   */
  private getToolWorkingDirectory(toolPath: string): string {
    return path.dirname(toolPath);
  }

  /**
   * Clears the tool resolution cache.
   * Useful when configuration changes or during development.
   */
  clearCache(): void {
    this.toolCache.clear();
  }
}
