import { TaskDefinition } from '../models/ArtifactModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';

export class TaskGenerator {
  generate(resolvedTasks: Map<string, ResolvedTask>, workflowsInUse?: Set<string>): TaskDefinition[][] {
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
