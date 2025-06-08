import { ArtifactModel } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { DataFlowResolver } from '../parsers/DataFlowResolver.js';
import { DataResolver } from '../resolvers/DataResolver.js';
import { ExperimentParser } from '../parsers/ExperimentParser.js';
import { FileResolver } from '../resolvers/FileResolver.js';
import { ParameterResolver } from '../resolvers/ParameterResolver.js';
import { TaskResolver, ResolvedTask } from '../resolvers/TaskResolver.js';
import { WorkflowParser } from '../parsers/WorkflowParser.js';
import path from 'path';
import * as fs from 'fs';
import { ControlFlowGenerator } from './ControlFlowGenerator.js';
import { SpaceGenerator } from './SpaceGenerator.js';
import { TaskGenerator } from './TaskGenerator.js';

export interface ArtifactGeneratorOptions {
  verbose?: boolean;
  workflowDirectory?: string;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ArtifactGeneratorOutput {
  artifact?: ArtifactModel;
  validation: ValidationResult;
}

export class ArtifactGenerator {
  private verbose = false;
  private experimentParser = new ExperimentParser();
  private workflowParser = new WorkflowParser();
  private fileResolver: FileResolver | undefined;
  private taskResolver = new TaskResolver();
  private parameterResolver = new ParameterResolver();
  private dataFlowResolver = new DataFlowResolver();
  private dataResolver = new DataResolver();
  private taskGenerator = new TaskGenerator();
  private spaceGenerator = new SpaceGenerator();
  private controlFlowGenerator = new ControlFlowGenerator();

  constructor(options: ArtifactGeneratorOptions) {
    this.verbose = options.verbose || false;
  }

  async generate(espaceFilePath: string): Promise<ArtifactGeneratorOutput> {
    if (this.verbose) {
      console.log(`Generating artifact from: ${espaceFilePath}`);
    }
    this.initializeFileResolver(espaceFilePath);

    const validation = await this.validate(espaceFilePath);

    if (validation.errors.length > 0) {
      return { validation };
    }

    const { experiment, workflows } = await this.parseFiles(espaceFilePath);

    // Filter out unreachable spaces
    const reachableSpaces = this.getReachableSpaces(experiment);
    const filteredExperiment = this.filterExperimentSpaces(experiment, reachableSpaces);

    const resolvedTasks = this.taskResolver.resolve(filteredExperiment, workflows);
    const resolvedParameters = this.parameterResolver.resolve(filteredExperiment);
    const resolvedData = this.dataResolver.resolve(filteredExperiment, workflows, resolvedTasks);

    this.dataFlowResolver.validate(filteredExperiment, workflows, resolvedTasks);

    // Determine which tasks are actually used in execution chains
    const usedTaskIds = this.getUsedTaskIds(filteredExperiment, workflows, resolvedTasks);
    const filteredTasks = this.filterTasks(resolvedTasks, usedTaskIds);

    // Generate components - use all resolved tasks for spaces, filtered tasks for final tasks array
    const workflowsWithTasks = new Set<string>();
    for (const task of resolvedTasks.values()) {
      workflowsWithTasks.add(task.workflowName);
    }
    const tasks = this.taskGenerator.generate(filteredTasks, workflowsWithTasks);
    const spaces = this.spaceGenerator.generate(
      filteredExperiment,
      resolvedParameters,
      resolvedTasks, // Use all resolved tasks here
      this.taskResolver,
      workflows,
      resolvedData.spaceLevelData
    );
    const control = this.controlFlowGenerator.generate(filteredExperiment);

    const artifact = new ArtifactModel(
      filteredExperiment.name,
      '1.0',
      tasks,
      spaces,
      control,
      resolvedData.experimentLevelData
    );

    return { artifact, validation };
  }

  async validate(espaceFilePath: string): Promise<ValidationResult> {
    this.initializeFileResolver(espaceFilePath);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { experiment, workflows } = await this.parseFiles(espaceFilePath);

      // Validate workflow inheritance early (before task resolution)
      this.validateWorkflowInheritance(workflows, errors, warnings);
      
      // Early exit if there are critical errors that would cause stack overflow
      if (errors.length > 0) {
        return { errors, warnings };
      }

      // Validate workflow references
      for (const space of experiment.spaces) {
        const workflow = workflows.find(w => w.name === space.workflowName);
        if (!workflow) {
          errors.push(
            `Workflow '${space.workflowName}' referenced in space '${space.name}' not found`
          );
        }
      }

      // Validate task implementations
      const resolvedTasks = this.taskResolver.resolve(experiment, workflows);
      for (const task of resolvedTasks.values()) {
        if (!task.implementation) {
          errors.push(
            `Abstract task '${task.name}' in workflow '${task.workflowName}' has no implementation`
          );
        } else {
          // Check if implementation file exists
          const implementationPath = this.fileResolver!.resolveImplementationPath(
            task.implementation
          );
          if (!fs.existsSync(implementationPath)) {
            warnings.push(
              `Implementation file '${task.implementation}' for task '${task.name}' in workflow '${task.workflowName}' not found`
            );
          }
        }
      }

      try {
        this.dataResolver.resolve(experiment, workflows, resolvedTasks);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(...error.message.split('\n').filter(line => line.startsWith('Required')));
        }
      }

      // Check for unused parameters
      const usedParams = new Set<string>();
      for (const space of experiment.spaces) {
        space.parameters.forEach(param => usedParams.add(param.name));
        space.taskConfigurations.forEach(config =>
          config.parameters.forEach(param => usedParams.add(param.name))
        );
      }

      const definedParams = new Set<string>();
      const staticParams = new Set<string>();
      workflows.forEach(workflow =>
        workflow.tasks.forEach(task =>
          task.parameters.forEach(param => {
            definedParams.add(param.name);
            // Parameters with static values (non-null) are considered "used"
            if (param.value !== null) {
              staticParams.add(param.name);
            }
          })
        )
      );

      for (const param of definedParams) {
        // A parameter is considered "used" if it's either used in experiment spaces
        // or has a static value defined in the workflow
        if (!usedParams.has(param) && !staticParams.has(param)) {
          warnings.push(`Parameter '${param}' is defined but never used`);
        }
      }

      // Validate control flow
      if (experiment.controlFlow) {
        this.validateControlFlow(experiment, errors, warnings);
      }

      // Validate workflows (check for empty workflows after inheritance resolution)
      this.validateWorkflowsAfterInheritance(experiment, workflows, errors, warnings);

      // Validate task chains
      this.validateTaskChains(workflows, errors, warnings);

      // Validate circular task dependencies
      this.validateCircularTaskDependencies(workflows, errors, warnings);

      // Validate strategies
      this.validateStrategies(experiment, errors, warnings);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return { errors, warnings };
  }

  private async parseFiles(
    espaceFilePath: string
  ): Promise<{ experiment: ExperimentModel; workflows: WorkflowModel[] }> {
    if (this.verbose) {
      console.log(`Parsing experiment file: ${espaceFilePath}`);
    }

    const experiment = await this.experimentParser.parse(espaceFilePath);
    const workflowNames = experiment.spaces.map(space => space.workflowName);
    const uniqueWorkflowNames = [...new Set(workflowNames)];

    if (this.verbose) {
      console.log(`Found workflows: ${uniqueWorkflowNames.join(', ')}`);
    }

    const workflows: WorkflowModel[] = [];

    for (const workflowName of uniqueWorkflowNames) {
      const workflowFiles = await this.fileResolver!.findWorkflowFiles(workflowName);

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

  private initializeFileResolver(espaceFilePath: string): void {
    const workspaceDir = path.dirname(espaceFilePath);
    this.fileResolver = new FileResolver(workspaceDir);
    if (this.verbose) {
      console.log(`File resolver initialized with directory: ${workspaceDir}`);
    }
  }

  private validateControlFlow(experiment: ExperimentModel, errors: string[], warnings: string[]): void {
    if (!experiment.controlFlow) {
      return;
    }

    const definedSpaces = new Set(experiment.spaces.map(space => space.name));
    const referencedSpaces = new Set<string>();
    
    // Track spaces that can be reached from START
    const reachableSpaces = new Set<string>();
    
    // Process transitions in order to maintain deterministic error reporting
    const transitions = experiment.controlFlow.transitions;
    
    // First pass: check for invalid transitions from END and missing spaces
    for (const transition of transitions) {
      // Check for invalid transitions from END first (highest priority)
      if (transition.from === 'END') {
        errors.push('Invalid control flow: transition from END is not allowed');
      }
      
      // Check if referenced spaces exist
      if (transition.from !== 'START' && transition.from !== 'END' && !definedSpaces.has(transition.from)) {
        errors.push(`Space '${transition.from}' referenced in control flow but not found`);
      }
      if (transition.to !== 'START' && transition.to !== 'END' && !definedSpaces.has(transition.to)) {
        errors.push(`Space '${transition.to}' referenced in control flow but not found`);
      }
      
      // Track referenced spaces
      if (transition.from !== 'START' && transition.from !== 'END') {
        referencedSpaces.add(transition.from);
      }
      if (transition.to !== 'START' && transition.to !== 'END') {
        referencedSpaces.add(transition.to);
      }
    }
    
    // Second pass: check for self-loops (after END validation)
    for (const transition of transitions) {
      if (transition.from === transition.to && transition.from !== 'START' && transition.from !== 'END') {
        errors.push(`Self-loop detected in space '${transition.from}'`);
      }
    }
    
    // Build reachability graph
    const transitionMap = new Map<string, string[]>();
    for (const transition of experiment.controlFlow.transitions) {
      if (!transitionMap.has(transition.from)) {
        transitionMap.set(transition.from, []);
      }
      transitionMap.get(transition.from)!.push(transition.to);
    }
    
    // Find all spaces reachable from START
    const queue = ['START'];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
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
    
    // Check for unreachable spaces
    for (const space of experiment.spaces) {
      if (!reachableSpaces.has(space.name)) {
        if (referencedSpaces.has(space.name)) {
          errors.push(`Space '${space.name}' is defined but unreachable in control flow`);
        } else {
          warnings.push(`Space '${space.name}' is defined but not reachable in control flow`);
        }
      }
    }
  }

  private validateWorkflows(workflows: WorkflowModel[], errors: string[], warnings: string[]): void {
    for (const workflow of workflows) {
      // Check for duplicate task definitions
      const taskNames = workflow.tasks.map(task => task.name);
      const duplicates = taskNames.filter((name, index) => taskNames.indexOf(name) !== index);
      for (const duplicate of [...new Set(duplicates)]) {
        errors.push(`Duplicate task definition '${duplicate}' in workflow '${workflow.name}'`);
      }
    }
  }

  private validateWorkflowsAfterInheritance(experiment: ExperimentModel, workflows: WorkflowModel[], errors: string[], warnings: string[]): void {
    // First do basic validations
    this.validateWorkflows(workflows, errors, warnings);
    
    // Check for empty workflows after inheritance resolution
    const workflowMap = this.taskResolver.buildWorkflowMap(workflows);
    
    // Only validate workflows that are actually used in the experiment
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

  private validateStrategies(experiment: ExperimentModel, errors: string[], warnings: string[]): void {
    const validStrategies = ['gridsearch', 'randomsearch'];
    
    for (const space of experiment.spaces) {
      if (!validStrategies.includes(space.strategy)) {
        errors.push(`Unknown strategy: ${space.strategy}`);
      }
    }
  }

  private validateWorkflowInheritance(workflows: WorkflowModel[], errors: string[], warnings: string[]): void {
    const workflowMap = new Map<string, WorkflowModel>();
    for (const workflow of workflows) {
      workflowMap.set(workflow.name, workflow);
    }

    // Check for circular inheritance
    for (const workflow of workflows) {
      if (workflow.parentWorkflow) {
        const visited = new Set<string>();
        if (this.hasCircularInheritance(workflow.name, workflowMap, visited)) {
          errors.push('Circular inheritance detected in workflow hierarchy');
          break; // Only report this error once
        }
      }
    }
  }

  private hasCircularInheritance(workflowName: string, workflowMap: Map<string, WorkflowModel>, visited: Set<string>): boolean {
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

  private validateTaskChains(workflows: WorkflowModel[], errors: string[], warnings: string[]): void {
    const workflowMap = this.taskResolver.buildWorkflowMap(workflows);
    
    for (const workflow of workflows) {
      if (workflow.taskChain) {
        // Resolve inheritance to get all available tasks
        const resolvedWorkflow = this.taskResolver.resolveWorkflowInheritance(workflow, workflowMap);
        const definedTasks = new Set(resolvedWorkflow.tasks.map(task => task.name));
        const executionOrder = workflow.taskChain.getExecutionOrder();
        
        // Check if all tasks in the chain are defined (considering inheritance)
        for (const taskName of executionOrder) {
          if (!definedTasks.has(taskName)) {
            errors.push(`Task '${taskName}' referenced in workflow chain but not found in workflow '${workflow.name}'`);
          }
        }
        
        // Check for unused tasks (warning) - only consider tasks actually defined in this workflow
        for (const task of workflow.tasks) {
          if (!executionOrder.includes(task.name)) {
            warnings.push(`Task '${task.name}' is defined but not used in execution chain`);
          }
        }
      }
    }
  }

  private validateCircularTaskDependencies(workflows: WorkflowModel[], errors: string[], warnings: string[]): void {
    for (const workflow of workflows) {
      // Build dependency graph based on input/output data relationships
      const dependencyGraph = new Map<string, string[]>();
      const taskMap = new Map<string, any>();
      
      for (const task of workflow.tasks) {
        taskMap.set(task.name, task);
        dependencyGraph.set(task.name, []);
      }
      
      // Build dependencies: if task A outputs data that task B inputs, then B depends on A
      for (const task of workflow.tasks) {
        for (const output of task.outputs) {
          for (const otherTask of workflow.tasks) {
            if (otherTask.name !== task.name && otherTask.inputs.includes(output)) {
              if (!dependencyGraph.has(otherTask.name)) {
                dependencyGraph.set(otherTask.name, []);
              }
              dependencyGraph.get(otherTask.name)!.push(task.name);
            }
          }
        }
      }
      
      // Check for circular dependencies using DFS
      for (const taskName of dependencyGraph.keys()) {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];
        
        if (this.hasCircularDependency(taskName, dependencyGraph, visited, recursionStack, path)) {
          // Find the actual cycle in the path
          const cycleStart = path.indexOf(taskName);
          const cycle = path.slice(cycleStart);
          cycle.push(taskName); // Complete the cycle
          errors.push(`Circular data dependency detected: ${cycle.join(' -> ')}`);
          return; // Report only the first circular dependency found
        }
      }
    }
  }

  private hasCircularDependency(
    taskName: string,
    dependencyGraph: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): boolean {
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

  private getReachableSpaces(experiment: ExperimentModel): Set<string> {
    if (!experiment.controlFlow) {
      // If there's no control flow, all spaces are considered reachable
      return new Set(experiment.spaces.map(space => space.name));
    }

    const reachableSpaces = new Set<string>();
    
    // Build transition map
    const transitionMap = new Map<string, string[]>();
    for (const transition of experiment.controlFlow.transitions) {
      if (!transitionMap.has(transition.from)) {
        transitionMap.set(transition.from, []);
      }
      transitionMap.get(transition.from)!.push(transition.to);
    }
    
    // Find all spaces reachable from START using BFS
    const queue = ['START'];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
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

  private filterExperimentSpaces(experiment: ExperimentModel, reachableSpaces: Set<string>): ExperimentModel {
    const filteredSpaces = experiment.spaces.filter(space => reachableSpaces.has(space.name));
    
    // Create a new experiment model with filtered spaces
    return {
      ...experiment,
      spaces: filteredSpaces
    };
  }

  private getUsedTaskIds(experiment: ExperimentModel, workflows: WorkflowModel[], resolvedTasks: Map<string, ResolvedTask>): Set<string> {
    const usedTaskIds = new Set<string>();
    const workflowMap = this.taskResolver.buildWorkflowMap(workflows);

    for (const space of experiment.spaces) {
      const workflow = workflowMap.get(space.workflowName);
      if (!workflow) {
        continue;
      }

      // Get execution order for this space
      let executionOrder: string[] = [];
      
      if (workflow.taskChain) {
        executionOrder = workflow.taskChain.getExecutionOrder();
      } else if (workflow.parentWorkflow) {
        // Look for task chain in parent workflow
        const parentWorkflow = workflowMap.get(workflow.parentWorkflow);
        if (parentWorkflow?.taskChain) {
          executionOrder = parentWorkflow.taskChain.getExecutionOrder();
        }
      }

      // Add task IDs that are used in this space's execution order
      for (const taskName of executionOrder) {
        const taskId = `${space.workflowName}:${taskName}`;
        if (resolvedTasks.has(taskId)) {
          usedTaskIds.add(taskId);
        }
      }
    }

    return usedTaskIds;
  }

  private filterTasks(resolvedTasks: Map<string, ResolvedTask>, usedTaskIds: Set<string>): Map<string, ResolvedTask> {
    const filteredTasks = new Map<string, ResolvedTask>();
    
    for (const [taskId, task] of resolvedTasks) {
      if (usedTaskIds.has(taskId)) {
        filteredTasks.set(taskId, task);
      }
    }
    
    return filteredTasks;
  }
}
