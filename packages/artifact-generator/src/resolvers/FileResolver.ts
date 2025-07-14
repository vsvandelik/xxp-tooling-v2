/**
 * @fileoverview File resolver for ExtremeXP workflows.
 * Handles file path resolution and workflow file discovery with inheritance support.
 */

import * as fs from 'fs';
import * as path from 'path';

import { workflowNameToFileName } from '@extremexp/core';

/**
 * Resolves file paths for workflows, implementations, and data files.
 * Handles workflow inheritance and relative path resolution.
 */
export class FileResolver {
  private workflowDirectory: string;

  /**
   * Creates a new file resolver.
   * 
   * @param workflowDirectory - Base directory for resolving relative paths
   */
  constructor(workflowDirectory: string) {
    this.workflowDirectory = path.resolve(workflowDirectory);
  }

  /**
   * Finds all workflow files in the inheritance chain for a given workflow.
   * 
   * @param workflowName - Name of the workflow to find
   * @returns Promise resolving to array of file paths in dependency order (parents first)
   * @throws Error if workflow files are not found
   */
  async findWorkflowFiles(workflowName: string): Promise<string[]> {
    const files: string[] = [];
    const visited = new Set<string>();

    const findWorkflowRecursive = async (name: string): Promise<void> => {
      if (visited.has(name)) return;
      visited.add(name);

      const filePath = path.join(this.workflowDirectory, workflowNameToFileName(name));

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

  /**
   * Resolves a data file path relative to the workflow directory.
   * 
   * @param dataPath - Absolute or relative path to a data file
   * @returns Absolute path to the data file
   */
  resolveDataPath(dataPath: string): string {
    if (path.isAbsolute(dataPath)) {
      return dataPath;
    }
    return path.resolve(this.workflowDirectory, dataPath);
  }

  /**
   * Resolves an implementation file path relative to the workflow directory.
   * 
   * @param implementationPath - Absolute or relative path to an implementation file
   * @returns Absolute path to the implementation file
   */
  resolveImplementationPath(implementationPath: string): string {
    if (path.isAbsolute(implementationPath)) {
      return implementationPath;
    }
    return path.resolve(this.workflowDirectory, implementationPath);
  }
}
