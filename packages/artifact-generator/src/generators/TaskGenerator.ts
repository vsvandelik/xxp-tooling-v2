/**
 * Generator for task definitions in experiment artifacts.
 * Converts resolved tasks into grouped task definitions for parallel execution.
 */

import { TaskDefinition } from '../models/ArtifactModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';

/**
 * Generates task definitions for experiment artifacts.
 * Groups tasks by workflow for potential parallel execution.
 */
export class TaskGenerator {
  /**
   * Generates task definitions grouped by workflow.
   *
   * @param resolvedTasks - Map of resolved task definitions
   * @param workflowsInUse - Optional set of workflows to ensure empty groups are created
   * @returns Array of task definition groups (one group per workflow)
   */
  generate(
    resolvedTasks: Map<string, ResolvedTask>,
    workflowsInUse?: Set<string>
  ): TaskDefinition[][] {
    const taskGroups = new Map<string, TaskDefinition[]>();

    // Initialize empty groups for workflows in use
    if (workflowsInUse) {
      for (const workflowName of workflowsInUse) {
        taskGroups.set(workflowName, []);
      }
    }

    // Group tasks by workflow
    for (const resolvedTask of resolvedTasks.values()) {
      const workflowName = resolvedTask.workflowName;

      if (!taskGroups.has(workflowName)) {
        taskGroups.set(workflowName, []);
      }

      const taskDefinition = this.createTaskDefinition(resolvedTask);
      taskGroups.get(workflowName)!.push(taskDefinition);
    }

    // Return as array of arrays (grouped by workflow)
    return Array.from(taskGroups.values());
  }

  /**
   * Creates a task definition from a resolved task.
   *
   * @param resolvedTask - The resolved task to convert
   * @returns Task definition for the artifact
   * @throws Error if the task has no implementation
   */
  private createTaskDefinition(resolvedTask: ResolvedTask): TaskDefinition {
    if (!resolvedTask.implementation) {
      throw new Error(`Task '${resolvedTask.name}' has no implementation`);
    }

    return new TaskDefinition(
      resolvedTask.id,
      resolvedTask.workflowName,
      resolvedTask.implementation,
      resolvedTask.dynamicParameters,
      resolvedTask.staticParameters,
      resolvedTask.inputs,
      resolvedTask.outputs
    );
  }
}
