import { TaskModel } from '../models/WorkflowModel.js';
export class TaskResolver {
    resolve(experiment, workflows, resolvedParameters) {
        const workflowMap = this.buildWorkflowMap(workflows);
        const tempTasks = new Map();
        const spaceUsedParameters = new Map();
        if (resolvedParameters) {
            for (const paramCombination of resolvedParameters) {
                const usedParamNames = new Set();
                if (paramCombination.combinations.length > 0 && paramCombination.combinations[0]) {
                    for (const paramName of Object.keys(paramCombination.combinations[0])) {
                        if (!paramName.includes(':')) {
                            usedParamNames.add(paramName);
                        }
                    }
                }
                spaceUsedParameters.set(paramCombination.spaceId, usedParamNames);
            }
        }
        for (const space of experiment.spaces) {
            const workflow = workflowMap.get(space.workflowName);
            if (!workflow) {
                throw new Error(`Workflow '${space.workflowName}' not found`);
            }
            const resolvedWorkflow = this.resolveWorkflowInheritance(workflow, workflowMap);
            for (const task of resolvedWorkflow.tasks) {
                const taskId = `${space.workflowName}:${task.name}`;
                if (!tempTasks.has(taskId)) {
                    const spaceParameters = this.getSpaceParametersForTask(space, task.name);
                    const usedParameters = spaceUsedParameters.get(space.name);
                    const resolvedTask = this.resolveTask(task, spaceParameters, usedParameters);
                    tempTasks.set(taskId, resolvedTask);
                }
            }
        }
        return this.deduplicateTasks(tempTasks, workflowMap);
    }
    buildWorkflowMap(workflows) {
        const workflowMap = new Map();
        for (const workflow of workflows) {
            workflowMap.set(workflow.name, workflow);
        }
        return workflowMap;
    }
    resolveWorkflowInheritance(workflow, workflowMap) {
        if (!workflow.parentWorkflow) {
            for (const config of workflow.taskConfigurations) {
                const task = workflow.tasks.find(t => t.name === config.name);
                if (task) {
                    if (config.implementation !== null) {
                        task.implementation = config.implementation;
                    }
                    const parametersMap = new Map();
                    for (const param of task.parameters) {
                        parametersMap.set(param.name, param);
                    }
                    for (const param of config.parameters) {
                        parametersMap.set(param.name, param);
                    }
                    task.parameters = Array.from(parametersMap.values());
                    if (config.inputs.length > 0) {
                        task.inputs = config.inputs;
                    }
                    if (config.outputs.length > 0) {
                        task.outputs = config.outputs;
                    }
                }
            }
            return workflow;
        }
        const parentWorkflow = workflowMap.get(workflow.parentWorkflow);
        if (!parentWorkflow) {
            throw new Error(`Parent workflow '${workflow.parentWorkflow}' not found for workflow '${workflow.name}'`);
        }
        const resolvedParent = this.resolveWorkflowInheritance(parentWorkflow, workflowMap);
        const mergedTasks = new Map();
        for (const task of resolvedParent.tasks) {
            const taskModel = this.constructTaskModel(task, workflow.name);
            mergedTasks.set(task.name, taskModel);
        }
        for (const task of workflow.tasks) {
            const existingTask = mergedTasks.get(task.name);
            if (existingTask) {
                const mergedTask = new TaskModel(task.name, workflow.name);
                mergedTask.implementation = task.implementation || existingTask.implementation;
                const mergedParametersMap = new Map();
                for (const param of existingTask.parameters) {
                    mergedParametersMap.set(param.name, param);
                }
                for (const param of task.parameters) {
                    mergedParametersMap.set(param.name, param);
                }
                mergedTask.parameters = Array.from(mergedParametersMap.values());
                mergedTask.inputs = task.inputs.length > 0 ? task.inputs : existingTask.inputs;
                mergedTask.outputs = task.outputs.length > 0 ? task.outputs : existingTask.outputs;
                mergedTasks.set(task.name, mergedTask);
            }
            else {
                const taskModel = this.constructTaskModel(task, workflow.name);
                mergedTasks.set(task.name, taskModel);
            }
        }
        const result = {
            ...workflow,
            tasks: Array.from(mergedTasks.values()),
            data: [...workflow.data, ...resolvedParent.data],
            taskChain: resolvedParent.taskChain || workflow.taskChain,
            taskConfigurations: workflow.taskConfigurations,
        };
        for (const config of workflow.taskConfigurations) {
            const task = result.tasks.find(t => t.name === config.name);
            if (task) {
                if (config.implementation !== null) {
                    task.implementation = config.implementation;
                }
                const parametersMap = new Map();
                for (const param of task.parameters) {
                    parametersMap.set(param.name, param);
                }
                for (const param of config.parameters) {
                    parametersMap.set(param.name, param);
                }
                task.parameters = Array.from(parametersMap.values());
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
    getSpaceParametersForTask(space, taskName) {
        const parameters = new Map();
        for (const param of space.parameters) {
            parameters.set(param.name, param);
        }
        const taskConfig = space.taskConfigurations.find((config) => config.taskName === taskName);
        if (taskConfig) {
            for (const param of taskConfig.parameters) {
                parameters.set(param.name, param);
            }
        }
        return parameters;
    }
    resolveTask(task, spaceParameters, usedParameters) {
        const dynamicParameters = [];
        const staticParameters = {};
        const allParameters = new Map();
        for (const param of task.parameters) {
            if (param.value !== null) {
                staticParameters[param.name] = param.value;
                allParameters.set(param.name, param.value);
            }
            else {
                const spaceParam = spaceParameters.get(param.name);
                if (spaceParam) {
                    if (spaceParam.type === 'enum' || spaceParam.type === 'range') {
                        dynamicParameters.push(param.name);
                    }
                    else if (spaceParam.type === 'value') {
                        dynamicParameters.push(param.name);
                    }
                }
                else if (param.isRequired) {
                    throw new Error(`Required parameter '${param.name}' not provided for task '${task.name}'`);
                }
            }
        }
        return {
            id: task.id,
            name: task.name,
            workflowName: task.workflowName,
            implementation: task.implementation,
            parameters: allParameters,
            inputs: task.inputs,
            outputs: task.outputs,
            dynamicParameters,
            staticParameters,
        };
    }
    constructTaskModel(task, workflowName) {
        const taskModel = new TaskModel(task.name, workflowName);
        taskModel.implementation = task.implementation;
        taskModel.parameters = task.parameters;
        taskModel.inputs = task.inputs;
        taskModel.outputs = task.outputs;
        return taskModel;
    }
    deduplicateTasks(tempTasks, workflowMap) {
        const resolvedTasks = new Map();
        const tasksByName = new Map();
        const taskIdMapping = new Map();
        for (const resolvedTask of tempTasks.values()) {
            if (!tasksByName.has(resolvedTask.name)) {
                tasksByName.set(resolvedTask.name, []);
            }
            tasksByName.get(resolvedTask.name).push(resolvedTask);
        }
        for (const [taskName, tasks] of tasksByName) {
            if (tasks.length === 0)
                continue;
            if (tasks.length === 1) {
                const task = tasks[0];
                resolvedTasks.set(task.id, task);
            }
            else {
                const groupedByParent = new Map();
                for (const task of tasks) {
                    const workflow = workflowMap.get(task.workflowName);
                    const parentWorkflow = workflow?.parentWorkflow || task.workflowName;
                    if (!groupedByParent.has(parentWorkflow)) {
                        groupedByParent.set(parentWorkflow, []);
                    }
                    groupedByParent.get(parentWorkflow).push(task);
                }
                for (const [parentWorkflow, parentTasks] of groupedByParent) {
                    if (parentTasks.length === 0)
                        continue;
                    if (parentTasks.length === 1) {
                        const task = parentTasks[0];
                        resolvedTasks.set(task.id, task);
                    }
                    else {
                        const firstTask = parentTasks[0];
                        let allIdentical = true;
                        for (let i = 1; i < parentTasks.length; i++) {
                            const currentTask = parentTasks[i];
                            if (!this.areTasksIdentical(firstTask, currentTask)) {
                                allIdentical = false;
                                break;
                            }
                        }
                        if (allIdentical) {
                            const deduplicatedTaskId = `${parentWorkflow}:${taskName}`;
                            const deduplicatedTask = {
                                id: deduplicatedTaskId,
                                name: firstTask.name,
                                workflowName: parentWorkflow,
                                implementation: firstTask.implementation,
                                parameters: firstTask.parameters,
                                inputs: firstTask.inputs,
                                outputs: firstTask.outputs,
                                dynamicParameters: firstTask.dynamicParameters,
                                staticParameters: firstTask.staticParameters,
                            };
                            resolvedTasks.set(deduplicatedTaskId, deduplicatedTask);
                            for (const task of parentTasks) {
                                taskIdMapping.set(task.id, deduplicatedTaskId);
                            }
                        }
                        else {
                            for (const task of parentTasks) {
                                resolvedTasks.set(task.id, task);
                            }
                        }
                    }
                }
            }
        }
        this.taskIdMapping = taskIdMapping;
        return resolvedTasks;
    }
    areTasksIdentical(task1, task2) {
        if (task1.name !== task2.name)
            return false;
        if (task1.implementation !== task2.implementation)
            return false;
        if (task1.inputs.length !== task2.inputs.length ||
            !task1.inputs.every((input, i) => input === task2.inputs[i]))
            return false;
        if (task1.outputs.length !== task2.outputs.length ||
            !task1.outputs.every((output, i) => output === task2.outputs[i]))
            return false;
        if (task1.dynamicParameters.length !== task2.dynamicParameters.length ||
            !task1.dynamicParameters.every((param, i) => param === task2.dynamicParameters[i]))
            return false;
        const staticKeys1 = Object.keys(task1.staticParameters).sort();
        const staticKeys2 = Object.keys(task2.staticParameters).sort();
        if (staticKeys1.length !== staticKeys2.length ||
            !staticKeys1.every((key, i) => key === staticKeys2[i]))
            return false;
        for (const key of staticKeys1) {
            if (task1.staticParameters[key] !== task2.staticParameters[key])
                return false;
        }
        return true;
    }
    taskIdMapping = new Map();
    getTaskIdMapping() {
        return this.taskIdMapping;
    }
}
//# sourceMappingURL=TaskResolver.js.map