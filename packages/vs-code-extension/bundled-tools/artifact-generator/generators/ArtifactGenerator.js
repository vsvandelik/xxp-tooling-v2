import { ArtifactModel } from '../models/ArtifactModel.js';
import { DataFlowResolver } from '../parsers/DataFlowResolver.js';
import { DataResolver } from '../resolvers/DataResolver.js';
import { ExperimentParser } from '../parsers/ExperimentParser.js';
import { FileResolver } from '../resolvers/FileResolver.js';
import { ParameterResolver } from '../resolvers/ParameterResolver.js';
import { TaskResolver } from '../resolvers/TaskResolver.js';
import { WorkflowParser } from '../parsers/WorkflowParser.js';
import path from 'path';
import * as fs from 'fs';
import { ControlFlowGenerator } from './ControlFlowGenerator.js';
import { SpaceGenerator } from './SpaceGenerator.js';
import { TaskGenerator } from './TaskGenerator.js';
export class ArtifactGenerator {
    verbose = false;
    experimentParser = new ExperimentParser();
    workflowParser = new WorkflowParser();
    fileResolver;
    taskResolver = new TaskResolver();
    parameterResolver = new ParameterResolver();
    dataFlowResolver = new DataFlowResolver();
    dataResolver = new DataResolver();
    taskGenerator = new TaskGenerator();
    spaceGenerator = new SpaceGenerator();
    controlFlowGenerator = new ControlFlowGenerator();
    constructor(options) {
        this.verbose = options.verbose || false;
    }
    async generate(espaceFilePath) {
        if (this.verbose) {
            console.log(`Generating artifact from: ${espaceFilePath}`);
        }
        this.initializeFileResolver(espaceFilePath);
        const validation = await this.validate(espaceFilePath);
        if (validation.errors.length > 0) {
            return { validation };
        }
        const { experiment, workflows } = await this.parseFiles(espaceFilePath);
        const reachableSpaces = this.getReachableSpaces(experiment);
        const filteredExperiment = this.filterExperimentSpaces(experiment, reachableSpaces);
        const resolvedParameters = this.parameterResolver.resolve(filteredExperiment, workflows);
        const resolvedTasks = this.taskResolver.resolve(filteredExperiment, workflows, resolvedParameters);
        const resolvedData = this.dataResolver.resolve(filteredExperiment, workflows, resolvedTasks);
        this.dataFlowResolver.validate(filteredExperiment, workflows, resolvedTasks);
        const usedTaskIds = this.getUsedTaskIds(filteredExperiment, workflows, resolvedTasks);
        const filteredTasks = this.filterTasks(resolvedTasks, usedTaskIds);
        const workflowsWithTasks = new Set();
        for (const task of resolvedTasks.values()) {
            workflowsWithTasks.add(task.workflowName);
        }
        const tasks = this.taskGenerator.generate(filteredTasks, workflowsWithTasks);
        const spaces = this.spaceGenerator.generate(filteredExperiment, resolvedParameters, resolvedTasks, this.taskResolver, workflows, resolvedData.spaceLevelData);
        const control = this.controlFlowGenerator.generate(filteredExperiment);
        const artifact = new ArtifactModel(filteredExperiment.name, '1.0', tasks, spaces, control, resolvedData.experimentLevelData);
        return { artifact: artifact.toJSON(), validation };
    }
    async validate(espaceFilePath) {
        this.initializeFileResolver(espaceFilePath);
        const errors = [];
        const warnings = [];
        try {
            const { experiment, workflows } = await this.parseFiles(espaceFilePath);
            this.validateWorkflowInheritance(workflows, errors, warnings);
            if (errors.length > 0) {
                return { errors, warnings };
            }
            for (const space of experiment.spaces) {
                const workflow = workflows.find(w => w.name === space.workflowName);
                if (!workflow) {
                    errors.push(`Workflow '${space.workflowName}' referenced in space '${space.name}' not found`);
                }
            }
            if (experiment.controlFlow) {
                this.validateControlFlow(experiment, errors, warnings);
            }
            else {
                if (experiment.spaces.length > 0) {
                    errors.push(`The control flow of the experiment \`${experiment.name}\` is not defined.`);
                }
            }
            this.validateTaskChains(workflows, errors, warnings);
            this.validateStrategies(experiment, errors, warnings);
            if (errors.length > 0) {
                return { errors, warnings };
            }
            const resolvedTasks = this.taskResolver.resolve(experiment, workflows);
            for (const task of resolvedTasks.values()) {
                if (!task.implementation) {
                    errors.push(`Abstract task '${task.name}' in workflow '${task.workflowName}' has no implementation`);
                }
                else {
                    const implementationPath = this.fileResolver.resolveImplementationPath(task.implementation);
                    if (!fs.existsSync(implementationPath)) {
                        warnings.push(`Implementation file '${task.implementation}' for task '${task.name}' in workflow '${task.workflowName}' not found`);
                    }
                }
            }
            try {
                this.dataResolver.resolve(experiment, workflows, resolvedTasks);
            }
            catch (error) {
                if (error instanceof Error) {
                    errors.push(...error.message.split('\n').filter(line => line.startsWith('Required')));
                }
            }
            const usedParams = new Set();
            const definedParams = new Set();
            for (const space of experiment.spaces) {
                const workflow = workflows.find(w => w.name === space.workflowName);
                if (workflow) {
                    const workflowMap = new Map();
                    workflows.forEach(w => workflowMap.set(w.name, w));
                    const resolvedWorkflow = this.resolveWorkflowInheritance(workflow, workflowMap);
                    for (const task of resolvedWorkflow.tasks) {
                        for (const param of task.parameters) {
                            usedParams.add(param.name);
                        }
                    }
                }
                space.parameters.forEach(param => {
                    definedParams.add(param.name);
                });
                space.taskConfigurations.forEach(config => config.parameters.forEach(param => {
                    definedParams.add(param.name);
                }));
            }
            for (const param of definedParams) {
                if (!usedParams.has(param)) {
                    warnings.push(`Parameter '${param}' is defined but never used`);
                }
            }
            this.validateWorkflowsAfterInheritance(experiment, workflows, errors, warnings);
            this.validateCircularTaskDependencies(workflows, errors, warnings);
        }
        catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
        }
        return { errors, warnings };
    }
    resolveWorkflowInheritance(workflow, workflowMap) {
        if (!workflow.parentWorkflow) {
            return workflow;
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
    async parseFiles(espaceFilePath) {
        if (this.verbose) {
            console.log(`Parsing experiment file: ${espaceFilePath}`);
        }
        const experiment = await this.experimentParser.parse(espaceFilePath);
        const workflowNames = experiment.spaces.map(space => space.workflowName);
        const uniqueWorkflowNames = [...new Set(workflowNames)];
        if (this.verbose) {
            console.log(`Found workflows: ${uniqueWorkflowNames.join(', ')}`);
        }
        const workflows = [];
        for (const workflowName of uniqueWorkflowNames) {
            const workflowFiles = await this.fileResolver.findWorkflowFiles(workflowName);
            for (const workflowFile of workflowFiles) {
                if (this.verbose) {
                    console.log(`Parsing workflow file: ${workflowFile}`);
                }
                const workflow = await this.workflowParser.parse(workflowFile);
                workflows.push(workflow);
            }
        }
        return { experiment, workflows };
    }
    initializeFileResolver(espaceFilePath) {
        const workspaceDir = path.dirname(espaceFilePath);
        this.fileResolver = new FileResolver(workspaceDir);
        if (this.verbose) {
            console.log(`File resolver initialized with directory: ${workspaceDir}`);
        }
    }
    validateControlFlow(experiment, errors, warnings) {
        if (!experiment.controlFlow) {
            return;
        }
        const definedSpaces = new Set(experiment.spaces.map(space => space.name));
        const referencedSpaces = new Set();
        const reachableSpaces = new Set();
        const transitions = experiment.controlFlow.transitions;
        const startTransitions = transitions.filter(t => t.from === 'START');
        if (startTransitions.length > 1) {
            errors.push('Multiple transitions from START are not allowed');
            return;
        }
        let hasMissingSpaces = false;
        for (const transition of transitions) {
            if (transition.from === 'END') {
                errors.push('Invalid control flow: transition from END is not allowed');
            }
            if (transition.from !== 'START' &&
                transition.from !== 'END' &&
                !definedSpaces.has(transition.from)) {
                errors.push(`Space '${transition.from}' referenced in control flow but not found`);
                hasMissingSpaces = true;
            }
            if (transition.to !== 'START' &&
                transition.to !== 'END' &&
                !definedSpaces.has(transition.to)) {
                errors.push(`Space '${transition.to}' referenced in control flow but not found`);
                hasMissingSpaces = true;
            }
            if (transition.from !== 'START' && transition.from !== 'END') {
                referencedSpaces.add(transition.from);
            }
            if (transition.to !== 'START' && transition.to !== 'END') {
                referencedSpaces.add(transition.to);
            }
        }
        for (const transition of transitions) {
            if (transition.from === transition.to &&
                transition.from !== 'START' &&
                transition.from !== 'END') {
                errors.push(`Self-loop detected in space '${transition.from}'`);
            }
        }
        const transitionMap = new Map();
        for (const transition of experiment.controlFlow.transitions) {
            if (!transitionMap.has(transition.from)) {
                transitionMap.set(transition.from, []);
            }
            transitionMap.get(transition.from).push(transition.to);
        }
        if (!hasMissingSpaces) {
            const visited = new Set();
            const canReachEnd = this.canReachEnd('START', transitionMap, visited);
            if (!canReachEnd) {
                errors.push('Control flow does not reach END - infinite loop detected');
                return;
            }
        }
        const queue = ['START'];
        const visitedForReachability = new Set();
        while (queue.length > 0) {
            const current = queue.shift();
            if (visitedForReachability.has(current))
                continue;
            visitedForReachability.add(current);
            if (current !== 'START' && current !== 'END') {
                reachableSpaces.add(current);
            }
            const nextSpaces = transitionMap.get(current) || [];
            for (const next of nextSpaces) {
                if (!visitedForReachability.has(next)) {
                    queue.push(next);
                }
            }
        }
        for (const space of experiment.spaces) {
            if (!reachableSpaces.has(space.name)) {
                if (referencedSpaces.has(space.name)) {
                    errors.push(`Space '${space.name}' is defined but unreachable in control flow`);
                }
                else {
                    warnings.push(`Space '${space.name}' is defined but not reachable in control flow`);
                }
            }
        }
    }
    canReachEnd(current, transitionMap, visited) {
        if (current === 'END') {
            return true;
        }
        if (visited.has(current)) {
            return false;
        }
        visited.add(current);
        const nextSpaces = transitionMap.get(current) || [];
        for (const next of nextSpaces) {
            if (this.canReachEnd(next, transitionMap, new Set(visited))) {
                return true;
            }
        }
        return false;
    }
    validateWorkflows(workflows, errors, warnings) {
        for (const workflow of workflows) {
            const taskNames = workflow.tasks.map(task => task.name);
            const duplicates = taskNames.filter((name, index) => taskNames.indexOf(name) !== index);
            for (const duplicate of [...new Set(duplicates)]) {
                errors.push(`Duplicate task definition '${duplicate}' in workflow '${workflow.name}'`);
            }
        }
    }
    validateWorkflowsAfterInheritance(experiment, workflows, errors, warnings) {
        this.validateWorkflows(workflows, errors, warnings);
        const workflowMap = this.taskResolver.buildWorkflowMap(workflows);
        const usedWorkflows = new Set(experiment.spaces.map(space => space.workflowName));
        for (const workflowName of usedWorkflows) {
            const workflow = workflowMap.get(workflowName);
            if (workflow) {
                const resolvedWorkflow = this.taskResolver.resolveWorkflowInheritance(workflow, workflowMap);
                if (resolvedWorkflow.tasks.length === 0) {
                    warnings.push(`Workflow '${workflowName}' has no tasks defined`);
                }
            }
        }
    }
    validateStrategies(experiment, errors, warnings) {
        const validStrategies = ['gridsearch', 'randomsearch'];
        for (const space of experiment.spaces) {
            if (!validStrategies.includes(space.strategy)) {
                errors.push(`Unknown strategy: ${space.strategy}`);
            }
        }
    }
    validateWorkflowInheritance(workflows, errors, warnings) {
        const workflowMap = new Map();
        for (const workflow of workflows) {
            workflowMap.set(workflow.name, workflow);
        }
        for (const workflow of workflows) {
            if (workflow.parentWorkflow) {
                const visited = new Set();
                if (this.hasCircularInheritance(workflow.name, workflowMap, visited)) {
                    errors.push('Circular inheritance detected in workflow hierarchy');
                    break;
                }
            }
        }
    }
    hasCircularInheritance(workflowName, workflowMap, visited) {
        if (visited.has(workflowName)) {
            return true;
        }
        const workflow = workflowMap.get(workflowName);
        if (!workflow || !workflow.parentWorkflow) {
            return false;
        }
        visited.add(workflowName);
        const result = this.hasCircularInheritance(workflow.parentWorkflow, workflowMap, visited);
        visited.delete(workflowName);
        return result;
    }
    validateTaskChains(workflows, errors, warnings) {
        const workflowMap = this.taskResolver.buildWorkflowMap(workflows);
        for (const workflow of workflows) {
            if (workflow.taskChain) {
                const resolvedWorkflow = this.taskResolver.resolveWorkflowInheritance(workflow, workflowMap);
                const definedTasks = new Set(resolvedWorkflow.tasks.map(task => task.name));
                const executionOrder = workflow.taskChain.getExecutionOrder();
                for (const taskName of executionOrder) {
                    if (!definedTasks.has(taskName)) {
                        errors.push(`Task '${taskName}' referenced in workflow chain but not found in workflow '${workflow.name}'`);
                    }
                }
                for (const task of workflow.tasks) {
                    if (!executionOrder.includes(task.name)) {
                        warnings.push(`Task '${task.name}' is defined but not used in execution chain`);
                    }
                }
            }
            else {
                if (workflow.tasks.length > 0) {
                    errors.push(`Workflow '${workflow.name}' has no task execution chain defined`);
                }
            }
        }
    }
    validateCircularTaskDependencies(workflows, errors, warnings) {
        for (const workflow of workflows) {
            const dependencyGraph = new Map();
            const taskMap = new Map();
            for (const task of workflow.tasks) {
                taskMap.set(task.name, task);
                dependencyGraph.set(task.name, []);
            }
            for (const task of workflow.tasks) {
                for (const output of task.outputs) {
                    for (const otherTask of workflow.tasks) {
                        if (otherTask.name !== task.name && otherTask.inputs.includes(output)) {
                            if (!dependencyGraph.has(otherTask.name)) {
                                dependencyGraph.set(otherTask.name, []);
                            }
                            dependencyGraph.get(otherTask.name).push(task.name);
                        }
                    }
                }
            }
            for (const taskName of dependencyGraph.keys()) {
                const visited = new Set();
                const recursionStack = new Set();
                const path = [];
                if (this.hasCircularDependency(taskName, dependencyGraph, visited, recursionStack, path)) {
                    const cycleStart = path.indexOf(taskName);
                    const cycle = path.slice(cycleStart);
                    cycle.push(taskName);
                    errors.push(`Circular data dependency detected: ${cycle.join(' -> ')}`);
                    return;
                }
            }
        }
    }
    hasCircularDependency(taskName, dependencyGraph, visited, recursionStack, path) {
        if (recursionStack.has(taskName)) {
            return true;
        }
        if (visited.has(taskName)) {
            return false;
        }
        visited.add(taskName);
        recursionStack.add(taskName);
        path.push(taskName);
        const dependencies = dependencyGraph.get(taskName) || [];
        for (const dependency of dependencies) {
            if (this.hasCircularDependency(dependency, dependencyGraph, visited, recursionStack, path)) {
                return true;
            }
        }
        recursionStack.delete(taskName);
        path.pop();
        return false;
    }
    getReachableSpaces(experiment) {
        if (!experiment.controlFlow) {
            return new Set(experiment.spaces.map(space => space.name));
        }
        const reachableSpaces = new Set();
        const transitionMap = new Map();
        for (const transition of experiment.controlFlow.transitions) {
            if (!transitionMap.has(transition.from)) {
                transitionMap.set(transition.from, []);
            }
            transitionMap.get(transition.from).push(transition.to);
        }
        const queue = ['START'];
        const visited = new Set();
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current))
                continue;
            visited.add(current);
            if (current !== 'START' && current !== 'END') {
                reachableSpaces.add(current);
            }
            const nextSpaces = transitionMap.get(current) || [];
            for (const next of nextSpaces) {
                if (!visited.has(next)) {
                    queue.push(next);
                }
            }
        }
        return reachableSpaces;
    }
    filterExperimentSpaces(experiment, reachableSpaces) {
        const filteredSpaces = experiment.spaces.filter(space => reachableSpaces.has(space.name));
        return {
            ...experiment,
            spaces: filteredSpaces,
        };
    }
    getUsedTaskIds(experiment, workflows, resolvedTasks) {
        const usedTaskIds = new Set();
        const workflowMap = this.taskResolver.buildWorkflowMap(workflows);
        for (const space of experiment.spaces) {
            const workflow = workflowMap.get(space.workflowName);
            if (!workflow) {
                continue;
            }
            let executionOrder = [];
            if (workflow.taskChain) {
                executionOrder = workflow.taskChain.getExecutionOrder();
            }
            else if (workflow.parentWorkflow) {
                const parentWorkflow = workflowMap.get(workflow.parentWorkflow);
                if (parentWorkflow?.taskChain) {
                    executionOrder = parentWorkflow.taskChain.getExecutionOrder();
                }
            }
            for (const taskName of executionOrder) {
                const taskId = `${space.workflowName}:${taskName}`;
                if (resolvedTasks.has(taskId)) {
                    usedTaskIds.add(taskId);
                }
            }
        }
        return usedTaskIds;
    }
    filterTasks(resolvedTasks, usedTaskIds) {
        const filteredTasks = new Map();
        for (const [taskId, task] of resolvedTasks) {
            if (usedTaskIds.has(taskId)) {
                filteredTasks.set(taskId, task);
            }
        }
        return filteredTasks;
    }
}
//# sourceMappingURL=ArtifactGenerator.js.map