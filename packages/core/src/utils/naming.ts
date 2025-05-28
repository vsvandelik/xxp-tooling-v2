/**
 * Utility functions for converting names to file names following the project conventions.
 */

/**
 * Converts a workflow or experiment name to a file name.
 * 
 * Rules:
 * - First character is lowercase
 * - Rest of the name remains unchanged (preserving camelCase)
 * 
 * @param name The workflow or experiment name (e.g., "MyBestWorkflow")
 * @returns The file name without extension (e.g., "myBestWorkflow")
 * 
 * @example
 * ```typescript
 * nameToFileName("MyBestWorkflow") // returns "myBestWorkflow"
 * nameToFileName("A") // returns "a"
 * nameToFileName("A2") // returns "a2"
 * nameToFileName("WorkflowName") // returns "workflowName"
 * ```
 */
function nameToFileName(name: string): string {
  if (!name || name.length === 0) {
    throw new Error('Name cannot be empty');
  }
  
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Converts a workflow name to a workflow file name with .xxp extension.
 * 
 * @param workflowName The workflow name (e.g., "MyBestWorkflow")
 * @returns The workflow file name (e.g., "myBestWorkflow.xxp")
 */
export function workflowNameToFileName(workflowName: string): string {
  return `${nameToFileName(workflowName)}.xxp`;
}