import { TaskDefinition } from '../models/ArtifactModel.js';
export class TaskGenerator {
    generate(resolvedTasks, workflowsInUse) {
        const taskGroups = new Map();
        if (workflowsInUse) {
            for (const workflowName of workflowsInUse) {
                taskGroups.set(workflowName, []);
            }
        }
        for (const resolvedTask of resolvedTasks.values()) {
            const workflowName = resolvedTask.workflowName;
            if (!taskGroups.has(workflowName)) {
                taskGroups.set(workflowName, []);
            }
            const taskDefinition = this.createTaskDefinition(resolvedTask);
            taskGroups.get(workflowName).push(taskDefinition);
        }
        return Array.from(taskGroups.values());
    }
    createTaskDefinition(resolvedTask) {
        if (!resolvedTask.implementation) {
            throw new Error(`Task '${resolvedTask.name}' has no implementation`);
        }
        return new TaskDefinition(resolvedTask.id, resolvedTask.workflowName, resolvedTask.implementation, resolvedTask.dynamicParameters, resolvedTask.staticParameters, resolvedTask.inputs, resolvedTask.outputs);
    }
}
//# sourceMappingURL=TaskGenerator.js.map