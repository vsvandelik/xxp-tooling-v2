import {
  ExperimentModel,
  ExpressionType,
  ParameterDefinition,
  SpaceModel,
  TaskConfiguration,
} from '../models/ExperimentModel.js';
import { WorkflowModel, TaskModel } from '../models/WorkflowModel.js';

export interface ResolvedTask {
  id: string;
  name: string;
  workflowName: string;
  implementation: string | null;
  parameters: Map<string, ExpressionType>;
  inputs: string[];
  outputs: string[];
  dynamicParameters: string[];
  staticParameters: Record<string, ExpressionType>;
}

export class TaskResolver {
  resolve(experiment: ExperimentModel, workflows: WorkflowModel[]): Map<string, ResolvedTask> {
    const resolvedTasks = new Map<string, ResolvedTask>();
    const workflowMap = this.buildWorkflowMap(workflows);

    for (const space of experiment.spaces) {
      const workflow = workflowMap.get(space.workflowName);
      if (!workflow) {
        throw new Error(`Workflow '${space.workflowName}' not found`);
      }

      const resolvedWorkflow = this.resolveWorkflowInheritance(workflow, workflowMap);

      for (const task of resolvedWorkflow.tasks) {
        const taskId = `${space.workflowName}:${task.name}`;

        if (!resolvedTasks.has(taskId)) {
          const spaceParameters = this.getSpaceParametersForTask(space, task.name);
          const resolvedTask = this.resolveTask(task, spaceParameters);
          resolvedTasks.set(taskId, resolvedTask);
        }
      }
    }

    return resolvedTasks;
  }

  private buildWorkflowMap(workflows: WorkflowModel[]): Map<string, WorkflowModel> {
    const workflowMap = new Map<string, WorkflowModel>();
    for (const workflow of workflows) {
      workflowMap.set(workflow.name, workflow);
    }
    return workflowMap;
  }

  private resolveWorkflowInheritance(
    workflow: WorkflowModel,
    workflowMap: Map<string, WorkflowModel>
  ): WorkflowModel {
    if (!workflow.parentWorkflow) {
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

    // Add child tasks first
    for (const task of workflow.tasks) {
      const taskModel = this.constructTaskModel(task, workflow.name);
      mergedTasks.set(task.name, taskModel);
    }

    // Override with parent tasks (parent overrides child)
    for (const task of resolvedParent.tasks) {
      const existingTask = mergedTasks.get(task.name);
      if (existingTask) {
        // Merge task configurations, parent overrides child
        const mergedTask = new TaskModel(task.name, workflow.name);
        mergedTask.implementation = task.implementation || existingTask.implementation;
        mergedTask.parameters = [...existingTask.parameters, ...task.parameters];
        mergedTask.inputs = task.inputs.length > 0 ? task.inputs : existingTask.inputs;
        mergedTask.outputs = task.outputs.length > 0 ? task.outputs : existingTask.outputs;
        mergedTasks.set(task.name, mergedTask);
      } else {
        const taskModel = this.constructTaskModel(task, workflow.name);
        mergedTasks.set(task.name, taskModel);
      }
    }

    return {
      ...workflow,
      tasks: Array.from(mergedTasks.values()),
      data: [...workflow.data, ...resolvedParent.data],
      taskChain: resolvedParent.taskChain || workflow.taskChain,
    };
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

    // Start with task's own parameters
    for (const param of task.parameters) {
      allParameters.set(param.name, param.value!);
    }

    // Apply space parameters
    for (const [paramName, paramDef] of spaceParameters) {
      if (paramDef.type === 'value') {
        staticParameters[paramName] = paramDef.values[0]!;
        allParameters.set(paramName, paramDef.values[0]!);
      } else {
        dynamicParameters.push(paramName);
      }
    }

    // Check for remaining required parameters
    for (const param of task.parameters) {
      if (param.isRequired && !allParameters.has(param.name)) {
        throw new Error(`Required parameter '${param.name}' not provided for task '${task.name}'`);
      }
      if (
        !param.isRequired &&
        !staticParameters[param.name] &&
        !dynamicParameters.includes(param.name)
      ) {
        staticParameters[param.name] = param.value!;
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

  private constructTaskModel(task: TaskModel, workflowName: string): TaskModel {
    const taskModel = new TaskModel(task.name, workflowName);
    taskModel.implementation = task.implementation;
    taskModel.parameters = task.parameters;
    taskModel.inputs = task.inputs;
    taskModel.outputs = task.outputs;
    return taskModel;
  }
}
