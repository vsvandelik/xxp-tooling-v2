export class DataFlowResolver {
    validate(experiment, workflows, resolvedTasks) {
        for (const space of experiment.spaces) {
            this.validateSpaceDataFlow(space, workflows, resolvedTasks, experiment);
        }
    }
    validateSpaceDataFlow(space, workflows, resolvedTasks, experiment) {
        const workflow = workflows.find(w => w.name === space.workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${space.workflowName}' not found`);
        }
        const availableData = new Set();
        const requiredData = new Set();
        for (const dataDef of experiment.dataDefinitions) {
            availableData.add(dataDef.name);
        }
        for (const data of workflow.data) {
            availableData.add(data.name);
        }
        const executionOrder = workflow.taskChain?.getExecutionOrder() || [];
        for (const taskName of executionOrder) {
            const taskId = `${space.workflowName}:${taskName}`;
            const resolvedTask = resolvedTasks.get(taskId);
            if (!resolvedTask) {
                throw new Error(`Task '${taskName}' not found in space '${space.name}'`);
            }
            for (const input of resolvedTask.inputs) {
                if (!availableData.has(input)) {
                    throw new Error(`Input data '${input}' for task '${taskName}' in space '${space.name}' is not available`);
                }
                requiredData.add(input);
            }
            for (const output of resolvedTask.outputs) {
                availableData.add(output);
            }
        }
        for (const data of requiredData) {
            const dataDef = experiment.dataDefinitions.find(d => d.name === data);
            if (!dataDef && !workflow.data.find(d => d.name === data)) {
                let isProduced = false;
                for (const [, task] of resolvedTasks) {
                    if (task.outputs.includes(data)) {
                        isProduced = true;
                        break;
                    }
                }
                if (!isProduced) {
                    throw new Error(`Required data '${data}' in space '${space.name}' is not defined or produced`);
                }
            }
        }
    }
}
//# sourceMappingURL=DataFlowResolver.js.map