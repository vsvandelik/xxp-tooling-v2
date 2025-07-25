/**
 * Task resolver for ExtremeXP workflows.
 * Resolves task definitions from workflows and experiments, handling inheritance and parameter resolution.
 */

import {
  ExperimentModel,
  ExpressionType,
  ParameterDefinition,
  SpaceModel,
  TaskConfiguration,
} from '../models/ExperimentModel.js';
import { WorkflowModel, TaskModel } from '../models/WorkflowModel.js';

import { ParameterCombination } from './ParameterResolver.js';

/**
 * Represents a fully resolved task with all parameters and metadata.
 */
export interface ResolvedTask {
  /** Unique identifier for the task */
  id: string;
  /** Name of the task */
  name: string;
  /** Name of the workflow this task belongs to */
  workflowName: string;
  /** Path to the task implementation file */
  implementation: string | null;
  /** All parameters for this task */
  parameters: Map<string, ExpressionType>;
  /** Input data requirements */
  inputs: string[];
  /** Output data produced */
  outputs: string[];
  /** Parameters that vary across experiment runs */
  dynamicParameters: string[];
  /** Parameters with fixed values */
  staticParameters: Record<string, ExpressionType>;
}

/**
 * Resolves task definitions from experiment spaces and workflow inheritance.
 * Handles parameter classification, inheritance resolution, and task deduplication.
 */
export class TaskResolver {
  /**
   * Resolves all tasks from experiment spaces and workflows.
   *
   * @param experiment - The experiment model containing spaces and task configurations
   * @param workflows - Array of workflow models to resolve tasks from
   * @param resolvedParameters - Optional parameter combinations for classification
   * @returns Map of task ID to resolved task definitions
   */
  resolve(
    experiment: ExperimentModel,
    workflows: WorkflowModel[],
    resolvedParameters?: ParameterCombination[]
  ): Map<string, ResolvedTask> {
    const workflowMap = this.buildWorkflowMap(workflows);
    const tempTasks = new Map<string, ResolvedTask>();

    // Create a map of space name to used parameter names for filtering dynamic parameters
    const spaceUsedParameters = new Map<string, Set<string>>();
    if (resolvedParameters) {
      for (const paramCombination of resolvedParameters) {
        const usedParamNames = new Set<string>();
        if (paramCombination.combinations.length > 0 && paramCombination.combinations[0]) {
          for (const paramName of Object.keys(paramCombination.combinations[0])) {
            // Skip task-prefixed parameters, only include space-level ones
            if (!paramName.includes(':')) {
              usedParamNames.add(paramName);
            }
          }
        }
        spaceUsedParameters.set(paramCombination.spaceId, usedParamNames);
      }
    }

    // First pass: resolve all tasks with their child workflow names
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
          const resolvedTask = this.resolveTask(task, spaceParameters);
          tempTasks.set(taskId, resolvedTask);
        }
      }
    }

    // Second pass: deduplicate identical tasks
    return this.deduplicateTasks(tempTasks, workflowMap);
  }

  public buildWorkflowMap(workflows: WorkflowModel[]): Map<string, WorkflowModel> {
    const workflowMap = new Map<string, WorkflowModel>();
    for (const workflow of workflows) {
      workflowMap.set(workflow.name, workflow);
    }
    return workflowMap;
  }

  public resolveWorkflowInheritance(
    workflow: WorkflowModel,
    workflowMap: Map<string, WorkflowModel>
  ): WorkflowModel {
    if (!workflow.parentWorkflow) {
      // Apply configurations to workflows without parents
      for (const config of workflow.taskConfigurations) {
        const task = workflow.tasks.find(t => t.name === config.name);
        if (task) {
          if (config.implementation !== null) {
            task.implementation = config.implementation;
          }
          // Merge parameters properly - config parameters override existing parameters with same name
          const parametersMap = new Map<string, any>();
          // Add existing parameters first
          for (const param of task.parameters) {
            parametersMap.set(param.name, param);
          }
          // Add/override with config parameters
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
      throw new Error(
        `Parent workflow '${workflow.parentWorkflow}' not found for workflow '${workflow.name}'`
      );
    }

    const resolvedParent = this.resolveWorkflowInheritance(parentWorkflow, workflowMap);

    // Merge parent and child workflows
    const mergedTasks = new Map<string, TaskModel>();

    // Add parent tasks first (as the base)
    for (const task of resolvedParent.tasks) {
      const taskModel = this.constructTaskModel(task, workflow.name);
      mergedTasks.set(task.name, taskModel);
    }

    // Override with child tasks (child overrides parent)
    for (const task of workflow.tasks) {
      const existingTask = mergedTasks.get(task.name);
      if (existingTask) {
        // Merge task configurations, child overrides parent
        const mergedTask = new TaskModel(task.name, workflow.name);
        mergedTask.implementation = task.implementation || existingTask.implementation;

        // Merge parameters properly - child parameters override parent parameters with same name
        const mergedParametersMap = new Map<string, any>();
        // Add parent parameters first
        for (const param of existingTask.parameters) {
          mergedParametersMap.set(param.name, param);
        }
        // Add/override with child parameters
        for (const param of task.parameters) {
          mergedParametersMap.set(param.name, param);
        }
        mergedTask.parameters = Array.from(mergedParametersMap.values());

        mergedTask.inputs = task.inputs.length > 0 ? task.inputs : existingTask.inputs;
        mergedTask.outputs = task.outputs.length > 0 ? task.outputs : existingTask.outputs;
        mergedTasks.set(task.name, mergedTask);
      } else {
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

    // Apply task configurations after inheritance resolution
    for (const config of workflow.taskConfigurations) {
      const task = result.tasks.find(t => t.name === config.name);
      if (task) {
        if (config.implementation !== null) {
          task.implementation = config.implementation;
        }
        // Merge parameters properly - config parameters override existing parameters with same name
        const parametersMap = new Map<string, any>();
        // Add existing parameters first
        for (const param of task.parameters) {
          parametersMap.set(param.name, param);
        }
        // Add/override with config parameters
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

  private getSpaceParametersForTask(
    space: SpaceModel,
    taskName: string
  ): Map<string, ParameterDefinition> {
    const parameters = new Map<string, ParameterDefinition>();

    // Add space-level parameters
    for (const param of space.parameters) {
      parameters.set(param.name, param);
    }

    // Add task-specific parameters (override space-level)
    const taskConfig = space.taskConfigurations.find(
      (config: TaskConfiguration) => config.taskName === taskName
    );
    if (taskConfig) {
      for (const param of taskConfig.parameters) {
        parameters.set(param.name, param);
      }
    }

    return parameters;
  }

  private resolveTask(
    task: TaskModel,
    spaceParameters: Map<string, ParameterDefinition>
  ): ResolvedTask {
    const dynamicParameters: string[] = [];
    const staticParameters: Record<string, ExpressionType> = {};
    const allParameters = new Map<string, ExpressionType>();

    // Based on the comment requirements:
    // Static parameters: Parameters defined WITH values in workflow (XXP) files - keep workflow values
    // Dynamic parameters: Parameters defined WITHOUT values in workflow files - get values from space
    // Space overrides only affect runtime execution, not artifact classification

    // Classify all task parameters based ONLY on workflow definitions
    // Only parameters actually defined in the workflow for this task should be included
    for (const param of task.parameters) {
      if (param.value !== null) {
        // Parameter has a value in workflow - it's static, keep workflow value
        staticParameters[param.name] = param.value;
        allParameters.set(param.name, param.value);
      } else {
        // Parameter has no value in workflow - check if space provides values
        const spaceParam = spaceParameters.get(param.name);
        if (spaceParam) {
          if (spaceParam.type === 'enum' || spaceParam.type === 'range') {
            // Space provides enum/range values for this workflow parameter - it's dynamic
            dynamicParameters.push(param.name);
          } else if (spaceParam.type === 'value') {
            // Space provides a single value for this workflow parameter - it's dynamic
            // The value will be used in parameter combinations
            dynamicParameters.push(param.name);
          }
        } else if (param.isRequired) {
          throw new Error(
            `Required parameter '${param.name}' not provided for task '${task.name}'`
          );
        }
      }
    }

    // Note: Space parameters that are not defined in the workflow should NOT be added
    // to the task's dynamic/static parameters. They only affect runtime parameter combinations.

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

  private constructTaskModel(task: TaskModel, workflowName: string): TaskModel {
    const taskModel = new TaskModel(task.name, workflowName);
    taskModel.implementation = task.implementation;
    taskModel.parameters = task.parameters;
    taskModel.inputs = task.inputs;
    taskModel.outputs = task.outputs;
    return taskModel;
  }

  private deduplicateTasks(
    tempTasks: Map<string, ResolvedTask>,
    workflowMap: Map<string, WorkflowModel>
  ): Map<string, ResolvedTask> {
    const resolvedTasks = new Map<string, ResolvedTask>();
    const tasksByName = new Map<string, ResolvedTask[]>(); // taskName -> ResolvedTask[]
    const taskIdMapping = new Map<string, string>(); // originalTaskId -> finalTaskId

    // Group tasks by name
    for (const resolvedTask of tempTasks.values()) {
      if (!tasksByName.has(resolvedTask.name)) {
        tasksByName.set(resolvedTask.name, []);
      }
      tasksByName.get(resolvedTask.name)!.push(resolvedTask);
    }

    // Process each task name group
    for (const [taskName, tasks] of tasksByName) {
      if (tasks.length === 0) continue; // Should never happen, but safety check

      if (tasks.length === 1) {
        // Only one task with this name, keep it as is
        const task = tasks[0]!;
        resolvedTasks.set(task.id, task);
      } else {
        // Multiple tasks with same name, check if they can be deduplicated
        const groupedByParent = new Map<string, ResolvedTask[]>();

        // Group by parent workflow
        for (const task of tasks) {
          const workflow = workflowMap.get(task.workflowName);
          const parentWorkflow = workflow?.parentWorkflow || task.workflowName;

          if (!groupedByParent.has(parentWorkflow)) {
            groupedByParent.set(parentWorkflow, []);
          }
          groupedByParent.get(parentWorkflow)!.push(task);
        }

        for (const [parentWorkflow, parentTasks] of groupedByParent) {
          if (parentTasks.length === 0) continue; // Should never happen, but safety check

          if (parentTasks.length === 1) {
            // Only one task from this parent, keep it as is
            const task = parentTasks[0]!;
            resolvedTasks.set(task.id, task);
          } else {
            // Multiple tasks from same parent, check if they're identical
            const firstTask = parentTasks[0]!;
            let allIdentical = true;

            for (let i = 1; i < parentTasks.length; i++) {
              const currentTask = parentTasks[i]!;
              if (!this.areTasksIdentical(firstTask, currentTask)) {
                allIdentical = false;
                break;
              }
            }

            if (allIdentical) {
              // All tasks are identical, deduplicate using parent workflow name
              const deduplicatedTaskId = `${parentWorkflow}:${taskName}`;
              const deduplicatedTask: ResolvedTask = {
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

              // Add mappings for all original task IDs
              for (const task of parentTasks) {
                taskIdMapping.set(task.id, deduplicatedTaskId);
              }
            } else {
              // Tasks are different, keep them separate
              for (const task of parentTasks) {
                resolvedTasks.set(task.id, task);
              }
            }
          }
        }
      }
    }

    // Store the mapping for use by other components
    this.taskIdMapping = taskIdMapping;
    return resolvedTasks;
  }

  private areTasksIdentical(task1: ResolvedTask, task2: ResolvedTask): boolean {
    // Compare all relevant properties to determine if tasks are identical
    if (task1.name !== task2.name) return false;
    if (task1.implementation !== task2.implementation) return false;

    // Compare inputs and outputs arrays
    if (
      task1.inputs.length !== task2.inputs.length ||
      !task1.inputs.every((input, i) => input === task2.inputs[i])
    )
      return false;
    if (
      task1.outputs.length !== task2.outputs.length ||
      !task1.outputs.every((output, i) => output === task2.outputs[i])
    )
      return false;

    // Compare dynamic parameters arrays
    if (
      task1.dynamicParameters.length !== task2.dynamicParameters.length ||
      !task1.dynamicParameters.every((param, i) => param === task2.dynamicParameters[i])
    )
      return false;

    // Compare static parameters objects
    const staticKeys1 = Object.keys(task1.staticParameters).sort();
    const staticKeys2 = Object.keys(task2.staticParameters).sort();
    if (
      staticKeys1.length !== staticKeys2.length ||
      !staticKeys1.every((key, i) => key === staticKeys2[i])
    )
      return false;

    for (const key of staticKeys1) {
      if (task1.staticParameters[key] !== task2.staticParameters[key]) return false;
    }

    return true;
  }

  // Store task ID mapping for use by SpaceGenerator
  private taskIdMapping = new Map<string, string>();

  getTaskIdMapping(): Map<string, string> {
    return this.taskIdMapping;
  }
}
