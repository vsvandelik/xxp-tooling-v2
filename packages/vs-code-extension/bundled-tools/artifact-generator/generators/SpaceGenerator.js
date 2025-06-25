import { SpaceDefinition } from '../models/ArtifactModel.js';
export class SpaceGenerator {
    generate(experiment, parameterCombinations, resolvedTasks, taskResolver, workflows, spaceLevelData = new Map()) {
        const spaceDefinitions = [];
        for (const space of experiment.spaces) {
            const paramCombo = parameterCombinations.find(pc => pc.spaceId === space.name);
            if (!paramCombo) {
                throw new Error(`Parameter combinations not found for space '${space.name}'`);
            }
            const tasksOrder = this.getTasksOrder(space, resolvedTasks, taskResolver, workflows);
            const spaceInputData = spaceLevelData.get(space.name) || {};
            const spaceDefinition = new SpaceDefinition(space.name, tasksOrder, paramCombo.combinations, spaceInputData);
            spaceDefinitions.push(spaceDefinition);
        }
        return spaceDefinitions;
    }
    getTasksOrder(space, resolvedTasks, taskResolver, workflows) {
        const workflow = workflows.find(w => w.name === space.workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${space.workflowName}' not found`);
        }
        let executionOrder = [];
        let sourceWorkflow = workflow;
        if (workflow.taskChain) {
            executionOrder = workflow.taskChain.getExecutionOrder();
        }
        else if (workflow.parentWorkflow) {
            const parentWorkflow = workflows.find(w => w.name === workflow.parentWorkflow);
            if (parentWorkflow?.taskChain) {
                executionOrder = parentWorkflow.taskChain.getExecutionOrder();
                sourceWorkflow = parentWorkflow;
            }
        }
        if (executionOrder.length === 0) {
            for (const [, resolvedTask] of resolvedTasks) {
                if (resolvedTask.workflowName === space.workflowName) {
                    executionOrder.push(resolvedTask.name);
                }
            }
        }
        const taskIdMapping = taskResolver.getTaskIdMapping();
        const tasksOrder = [];
        for (const taskName of executionOrder) {
            let rawTaskId = `${space.workflowName}:${taskName}`;
            let resolvedTask = resolvedTasks.get(rawTaskId);
            if (!resolvedTask && sourceWorkflow.name !== space.workflowName) {
                rawTaskId = `${sourceWorkflow.name}:${taskName}`;
                resolvedTask = resolvedTasks.get(rawTaskId);
                if (resolvedTask) {
                    const spaceWorkflowTaskId = `${space.workflowName}:${taskName}`;
                    const mappedTaskId = taskIdMapping.get(spaceWorkflowTaskId) || taskIdMapping.get(rawTaskId) || rawTaskId;
                    tasksOrder.push(mappedTaskId);
                }
            }
            else if (resolvedTask) {
                const mappedTaskId = taskIdMapping.get(rawTaskId) || rawTaskId;
                tasksOrder.push(mappedTaskId);
            }
        }
        return tasksOrder;
    }
}
//# sourceMappingURL=SpaceGenerator.js.map