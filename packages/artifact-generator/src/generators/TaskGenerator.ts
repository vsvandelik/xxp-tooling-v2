import { TaskDefinition } from '../models/ArtifactModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';
import { ExpressionType } from '../models/ExperimentModel.js';

export class TaskGenerator {
  generate(resolvedTasks: Map<string, ResolvedTask>): TaskDefinition[][] {
    // Create a map to detect duplicate tasks
    const taskMap = new Map<string, { task: ResolvedTask; workflowName: string }[]>();
    
    // Group tasks by their content fingerprint
    for (const resolvedTask of resolvedTasks.values()) {
      // Create a fingerprint of the task's essential properties
      const fingerprint = JSON.stringify({
        name: resolvedTask.name,
        implementation: resolvedTask.implementation,
        dynamicParameters: resolvedTask.dynamicParameters,
        staticParameters: resolvedTask.staticParameters,
        inputs: resolvedTask.inputs,
        outputs: resolvedTask.outputs
      });
      
      if (!taskMap.has(fingerprint)) {
        taskMap.set(fingerprint, []);
      }
      
      taskMap.get(fingerprint)!.push({
        task: resolvedTask,
        workflowName: resolvedTask.workflowName
      });
    }
    
    // Create unique task definitions
    const uniqueTasks = new Map<string, TaskDefinition>();
    
    // For each group of identical tasks
    for (const taskGroup of taskMap.values()) {
      // Sort to prioritize the most "ancestral" workflow
      taskGroup.sort((a, b) => {
        // If A is a parent of B (B's workflow name starts with A's), prioritize A
        if (b.workflowName.startsWith(a.workflowName + " ")) return -1;
        // If B is a parent of A, prioritize B
        if (a.workflowName.startsWith(b.workflowName + " ")) return 1;
        // Otherwise, pick the shorter name (more likely to be ancestral)
        return a.workflowName.length - b.workflowName.length;
      });
      
      // Take the first (most likely ancestral) task
      const representative = taskGroup[0];
      if (representative) {
        const taskDefinition = this.createTaskDefinition(representative.task);
        uniqueTasks.set(representative.task.id, taskDefinition);
      }
    }
    
    // Group the unique tasks by workflow
    const workflowGroups = new Map<string, TaskDefinition[]>();
    
    for (const taskDef of uniqueTasks.values()) {
      if (!workflowGroups.has(taskDef.workflow)) {
        workflowGroups.set(taskDef.workflow, []);
      }
      
      workflowGroups.get(taskDef.workflow)!.push(taskDef);
    }
    
    return Array.from(workflowGroups.values());
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
