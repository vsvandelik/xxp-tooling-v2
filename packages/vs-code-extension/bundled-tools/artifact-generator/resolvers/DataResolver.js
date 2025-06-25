export class DataResolver {
    resolve(experiment, workflows, resolvedTasks) {
        const workflowMap = this.buildWorkflowMap(workflows);
        const requiredInitialInputs = this.getRequiredInitialInputs(resolvedTasks);
        const experimentLevelData = this.resolveExperimentLevelData(experiment, workflowMap);
        const spaceLevelData = this.resolveSpaceLevelData(experiment, workflowMap);
        this.validateRequiredInputs(requiredInitialInputs, experimentLevelData, spaceLevelData, experiment.spaces);
        return {
            experimentLevelData,
            spaceLevelData,
        };
    }
    buildWorkflowMap(workflows) {
        const workflowMap = new Map();
        for (const workflow of workflows) {
            workflowMap.set(workflow.name, workflow);
        }
        return workflowMap;
    }
    getRequiredInitialInputs(resolvedTasks) {
        const allInputs = new Set();
        const allOutputs = new Set();
        for (const task of resolvedTasks.values()) {
            task.inputs.forEach(input => allInputs.add(input));
            task.outputs.forEach(output => allOutputs.add(output));
        }
        const initialInputs = new Set();
        for (const input of allInputs) {
            if (!allOutputs.has(input)) {
                initialInputs.add(input);
            }
        }
        return initialInputs;
    }
    resolveExperimentLevelData(experiment, workflowMap) {
        const data = {};
        for (const dataDef of experiment.dataDefinitions) {
            data[dataDef.name] = dataDef.value;
        }
        const usedWorkflows = new Set(experiment.spaces.map(space => space.workflowName));
        for (const workflowName of usedWorkflows) {
            const workflowData = this.resolveWorkflowData(workflowName, workflowMap);
            for (const [name, value] of Object.entries(workflowData)) {
                if (!(name in data)) {
                    data[name] = value;
                }
            }
        }
        return data;
    }
    resolveWorkflowData(workflowName, workflowMap) {
        const data = {};
        const visited = new Set();
        const resolveWorkflowRecursively = (name) => {
            if (visited.has(name))
                return;
            visited.add(name);
            const workflow = workflowMap.get(name);
            if (!workflow)
                return;
            if (workflow.parentWorkflow) {
                resolveWorkflowRecursively(workflow.parentWorkflow);
            }
            for (const dataModel of workflow.data) {
                if (dataModel.value !== null) {
                    data[dataModel.name] = dataModel.value;
                }
            }
        };
        resolveWorkflowRecursively(workflowName);
        return data;
    }
    resolveSpaceLevelData(experiment, workflowMap) {
        const spaceLevelData = new Map();
        for (const space of experiment.spaces) {
            const spaceData = {};
            for (const dataDef of space.dataDefinitions) {
                spaceData[dataDef.name] = dataDef.value;
            }
            if (Object.keys(spaceData).length > 0) {
                spaceLevelData.set(space.name, spaceData);
            }
        }
        return spaceLevelData;
    }
    validateRequiredInputs(requiredInitialInputs, experimentLevelData, spaceLevelData, spaces) {
        const errors = [];
        for (const space of spaces) {
            const spaceOverrides = spaceLevelData.get(space.name) || {};
            for (const inputName of requiredInitialInputs) {
                const hasSpaceValue = inputName in spaceOverrides;
                const hasExperimentValue = inputName in experimentLevelData;
                if (!hasSpaceValue && !hasExperimentValue) {
                    errors.push(`Required initial input '${inputName}' is not defined for space '${space.name}'. ` +
                        `Please define it at experiment level or space level.`);
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(`Data validation failed:\n${errors.join('\n')}`);
        }
    }
}
//# sourceMappingURL=DataResolver.js.map