/**
 * Generator for experiment space definitions.
 * Converts experiment spaces with parameter combinations into executable space definitions.
 */

import { SpaceDefinition } from '../models/ArtifactModel.js';
import { ExperimentModel, SpaceModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { ParameterCombination } from '../resolvers/ParameterResolver.js';
import { ResolvedTask, TaskResolver } from '../resolvers/TaskResolver.js';

/**
 * Generates space definitions for experiment artifacts.
 * Combines parameter spaces with task execution order and data mappings.
 */
export class SpaceGenerator {
  /**
   * Generates space definitions from experiment spaces and resolved components.
   *
   * @param experiment - The experiment model containing spaces
   * @param parameterCombinations - Resolved parameter combinations for each space
   * @param resolvedTasks - Map of resolved task definitions
   * @param taskResolver - Task resolver for ID mapping
   * @param workflows - Array of workflow models
   * @param spaceLevelData - Space-specific data overrides
   * @returns Array of space definitions for the artifact
   */
  generate(
    experiment: ExperimentModel,
    parameterCombinations: ParameterCombination[],
    resolvedTasks: Map<string, ResolvedTask>,
    taskResolver: TaskResolver,
    workflows: WorkflowModel[],
    spaceLevelData: Map<string, Record<string, string>> = new Map()
  ): SpaceDefinition[] {
    const spaceDefinitions: SpaceDefinition[] = [];

    for (const space of experiment.spaces) {
      const paramCombo = parameterCombinations.find(pc => pc.spaceId === space.name);
      if (!paramCombo) {
        throw new Error(`Parameter combinations not found for space '${space.name}'`);
      }

      const tasksOrder = this.getTasksOrder(space, resolvedTasks, taskResolver, workflows);

      const spaceInputData = spaceLevelData.get(space.name) || {};

      const spaceDefinition = new SpaceDefinition(
        space.name,
        tasksOrder,
        paramCombo.combinations,
        spaceInputData
      );

      spaceDefinitions.push(spaceDefinition);
    }

    return spaceDefinitions;
  }

  /**
   * Determines the execution order of tasks for a given space.
   *
   * @param space - The space model
   * @param resolvedTasks - Map of resolved task definitions
   * @param taskResolver - Task resolver for ID mapping
   * @param workflows - Array of workflow models
   * @returns Array of task IDs in execution order
   */
  private getTasksOrder(
    space: SpaceModel,
    resolvedTasks: Map<string, ResolvedTask>,
    taskResolver: TaskResolver,
    workflows: WorkflowModel[]
  ): string[] {
    const workflow = workflows.find(w => w.name === space.workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${space.workflowName}' not found`);
    }

    // First try to get execution order from the workflow's task chain
    let executionOrder: string[] = [];
    let sourceWorkflow = workflow;

    // If the workflow has its own task chain, use it
    if (workflow.taskChain) {
      executionOrder = workflow.taskChain.getExecutionOrder();
    }
    // If it's a child workflow without its own task chain, use the parent's task chain
    else if (workflow.parentWorkflow) {
      const parentWorkflow = workflows.find(w => w.name === workflow.parentWorkflow);
      if (parentWorkflow?.taskChain) {
        executionOrder = parentWorkflow.taskChain.getExecutionOrder();
        sourceWorkflow = parentWorkflow;
      }
    }

    // If we still don't have an execution order, fall back to getting tasks from resolvedTasks
    if (executionOrder.length === 0) {
      for (const [, resolvedTask] of resolvedTasks) {
        if (resolvedTask.workflowName === space.workflowName) {
          executionOrder.push(resolvedTask.name);
        }
      }
    }

    const taskIdMapping = taskResolver.getTaskIdMapping();
    const tasksOrder: string[] = [];

    // Process each task in the execution order
    for (const taskName of executionOrder) {
      // First try to find the task in the current workflow
      let rawTaskId = `${space.workflowName}:${taskName}`;
      let resolvedTask = resolvedTasks.get(rawTaskId);

      // If not found and we're using a parent workflow's task chain,
      // check if the task exists in the parent workflow
      if (!resolvedTask && sourceWorkflow.name !== space.workflowName) {
        rawTaskId = `${sourceWorkflow.name}:${taskName}`;
        resolvedTask = resolvedTasks.get(rawTaskId);

        // If found in parent, use the mapped ID for the space's workflow
        if (resolvedTask) {
          // Create the proper ID as it would appear in the space's workflow
          const spaceWorkflowTaskId = `${space.workflowName}:${taskName}`;
          // Use the mapped task ID if available
          const mappedTaskId =
            taskIdMapping.get(spaceWorkflowTaskId) || taskIdMapping.get(rawTaskId) || rawTaskId;
          tasksOrder.push(mappedTaskId);
        }
      } else if (resolvedTask) {
        // Use the mapped task ID if available, otherwise use the original
        const mappedTaskId = taskIdMapping.get(rawTaskId) || rawTaskId;
        tasksOrder.push(mappedTaskId);
      }
    }

    return tasksOrder;
  }
}
