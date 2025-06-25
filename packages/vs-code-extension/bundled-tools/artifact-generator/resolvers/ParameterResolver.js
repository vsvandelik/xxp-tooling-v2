export class ParameterResolver {
    resolve(experiment, workflows) {
        const results = [];
        for (const space of experiment.spaces) {
            const combinations = this.generateParameterCombinations(space, workflows);
            results.push({
                spaceId: space.name,
                combinations,
            });
        }
        return results;
    }
    generateParameterCombinations(space, workflows) {
        const parameterSets = this.collectParameterSets(space, workflows);
        if (space.strategy === 'gridsearch') {
            return this.generateGridSearchCombinations(parameterSets);
        }
        else if (space.strategy === 'randomsearch') {
            return this.generateRandomSearchCombinations(parameterSets);
        }
        else {
            throw new Error(`Unknown strategy: ${space.strategy}`);
        }
    }
    collectParameterSets(space, workflows) {
        const parameterSets = new Map();
        let usedParameterNames;
        if (workflows) {
            usedParameterNames = this.getUsedParameterNames(space, workflows);
        }
        for (const param of space.parameters) {
            if (!usedParameterNames || usedParameterNames.has(param.name)) {
                parameterSets.set(param.name, this.expandParameterValues(param));
            }
        }
        for (const taskConfig of space.taskConfigurations) {
            for (const param of taskConfig.parameters) {
                const prefixedName = `${taskConfig.taskName}:${param.name}`;
                parameterSets.set(prefixedName, this.expandParameterValues(param));
            }
        }
        return parameterSets;
    }
    getUsedParameterNames(space, workflows) {
        const usedParameterNames = new Set();
        const workflow = workflows.find(w => w.name === space.workflowName);
        if (workflow) {
            const workflowMap = new Map();
            workflows.forEach(w => workflowMap.set(w.name, w));
            const resolvedWorkflow = this.resolveWorkflowInheritance(workflow, workflowMap);
            for (const task of resolvedWorkflow.tasks) {
                for (const param of task.parameters) {
                    usedParameterNames.add(param.name);
                }
            }
        }
        return usedParameterNames;
    }
    resolveWorkflowInheritance(workflow, workflowMap) {
        if (!workflow.parentWorkflow) {
            const result = {
                ...workflow,
                tasks: [...workflow.tasks],
            };
            for (const config of workflow.taskConfigurations) {
                const task = result.tasks.find(t => t.name === config.name);
                if (task) {
                    if (config.implementation !== null) {
                        task.implementation = config.implementation;
                    }
                    task.parameters = [...task.parameters, ...config.parameters];
                    if (config.inputs.length > 0) {
                        task.inputs = config.inputs;
                    }
                    if (config.outputs.length > 0) {
                        task.outputs = config.outputs;
                    }
                }
            }
            return result;
        }
        const parentWorkflow = workflowMap.get(workflow.parentWorkflow);
        if (!parentWorkflow) {
            throw new Error(`Parent workflow '${workflow.parentWorkflow}' not found`);
        }
        const resolvedParent = this.resolveWorkflowInheritance(parentWorkflow, workflowMap);
        const mergedTasks = [...resolvedParent.tasks];
        for (const config of workflow.taskConfigurations) {
            const existingTask = mergedTasks.find(t => t.name === config.name);
            if (existingTask) {
                existingTask.parameters = [...existingTask.parameters, ...config.parameters];
                if (config.implementation !== null) {
                    existingTask.implementation = config.implementation;
                }
                if (config.inputs.length > 0) {
                    existingTask.inputs = config.inputs;
                }
                if (config.outputs.length > 0) {
                    existingTask.outputs = config.outputs;
                }
            }
        }
        for (const task of workflow.tasks) {
            if (!mergedTasks.find(t => t.name === task.name)) {
                mergedTasks.push(task);
            }
        }
        return {
            name: workflow.name,
            parentWorkflow: workflow.parentWorkflow,
            tasks: mergedTasks,
            data: [...resolvedParent.data, ...workflow.data],
            taskChain: workflow.taskChain || resolvedParent.taskChain,
            taskConfigurations: workflow.taskConfigurations,
        };
    }
    expandParameterValues(param) {
        switch (param.type) {
            case 'enum':
                return param.values;
            case 'range': {
                if (param.values.length !== 3) {
                    throw new Error(`Range parameter must have exactly 3 values, got ${param.values.length}`);
                }
                const [min, max, step] = param.values;
                if (typeof min !== 'number' || typeof max !== 'number' || typeof step !== 'number') {
                    throw new Error('Range parameter values must be numbers');
                }
                const values = [];
                for (let value = min; value <= max; value += step) {
                    values.push(Math.round(value * 10000) / 10000);
                }
                return values;
            }
            case 'value':
                return [param.values[0]];
            default:
                throw new Error(`Unknown parameter type: ${param.type}`);
        }
    }
    generateGridSearchCombinations(parameterSets) {
        const paramNames = Array.from(parameterSets.keys());
        const paramValues = paramNames.map(name => parameterSets.get(name));
        if (paramNames.length === 0) {
            return [{}];
        }
        const combinations = [];
        const generateCombination = (index, current) => {
            if (index === paramNames.length) {
                combinations.push({ ...current });
                return;
            }
            const paramName = paramNames[index];
            const values = paramValues[index];
            for (const value of values) {
                current[paramName] = value;
                generateCombination(index + 1, current);
            }
        };
        generateCombination(0, {});
        return combinations;
    }
    generateRandomSearchCombinations(parameterSets, count = 10) {
        const paramNames = Array.from(parameterSets.keys());
        const combinations = [];
        for (let i = 0; i < count; i++) {
            const combination = {};
            for (const paramName of paramNames) {
                const values = parameterSets.get(paramName);
                const randomIndex = Math.floor(Math.random() * values.length);
                combination[paramName] = values[randomIndex];
            }
            combinations.push(combination);
        }
        return combinations;
    }
}
//# sourceMappingURL=ParameterResolver.js.map