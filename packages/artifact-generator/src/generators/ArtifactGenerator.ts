import { ArtifactModel } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
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

    const resolvedTasks = this.taskResolver.resolve(experiment, workflows);
    const resolvedParameters = this.parameterResolver.resolve(experiment);

    const resolvedData = this.dataResolver.resolve(experiment, workflows, resolvedTasks);

    this.dataFlowResolver.validate(experiment, workflows, resolvedTasks);

    const tasks = this.taskGenerator.generate(resolvedTasks);
    const spaces = this.spaceGenerator.generate(
      experiment,
      resolvedParameters,
      resolvedTasks,
      this.taskResolver,
      workflows,
      resolvedData.spaceLevelData
    );
    const control = this.controlFlowGenerator.generate(experiment);

    const artifact = new ArtifactModel(
      experiment.name,
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

      // Validate workflows
      this.validateWorkflows(workflows, errors, warnings);

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
      // Check for empty workflows
      if (workflow.tasks.length === 0) {
        warnings.push(`Workflow '${workflow.name}' has no tasks defined`);
      }

      // Check for duplicate task definitions
      const taskNames = workflow.tasks.map(task => task.name);
      const duplicates = taskNames.filter((name, index) => taskNames.indexOf(name) !== index);
      for (const duplicate of [...new Set(duplicates)]) {
        errors.push(`Duplicate task definition '${duplicate}' in workflow '${workflow.name}'`);
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
    for (const workflow of workflows) {
      if (workflow.taskChain) {
        const definedTasks = new Set(workflow.tasks.map(task => task.name));
        const executionOrder = workflow.taskChain.getExecutionOrder();
        
        // Check if all tasks in the chain are defined
        for (const taskName of executionOrder) {
          if (!definedTasks.has(taskName)) {
            errors.push(`Task '${taskName}' referenced in workflow chain but not found in workflow '${workflow.name}'`);
          }
        }
        
        // Check for unused tasks (warning)
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
}
