/**
 * @fileoverview Data flow validation for ExtremeXP workflows.
 * Validates that all required data inputs are available and data flows are consistent.
 */

import { ExperimentModel, SpaceModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';

/**
 * Validates data flow consistency within experiments and workflows.
 * Ensures all task inputs are satisfied by available data sources.
 */
export class DataFlowResolver {
  /**
   * Validates data flow for all spaces in an experiment.
   * 
   * @param experiment - The experiment model to validate
   * @param workflows - Array of workflow models
   * @param resolvedTasks - Map of resolved task definitions
   * @throws Error if data flow validation fails
   */
  validate(
    experiment: ExperimentModel,
    workflows: WorkflowModel[],
    resolvedTasks: Map<string, ResolvedTask>
  ): void {
    for (const space of experiment.spaces) {
      this.validateSpaceDataFlow(space, workflows, resolvedTasks, experiment);
    }
  }

  /**
   * Validates data flow for a specific space.
   * 
   * @param space - The space model to validate
   * @param workflows - Array of workflow models
   * @param resolvedTasks - Map of resolved task definitions
   * @param experiment - The parent experiment model
   * @throws Error if data flow validation fails for this space
   */
  private validateSpaceDataFlow(
    space: SpaceModel,
    workflows: WorkflowModel[],
    resolvedTasks: Map<string, ResolvedTask>,
    experiment: ExperimentModel
  ): void {
    const workflow = workflows.find(w => w.name === space.workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${space.workflowName}' not found`);
    }

    const availableData = new Set<string>();
    const requiredData = new Set<string>();

    // Add experiment-level data definitions
    for (const dataDef of experiment.dataDefinitions) {
      availableData.add(dataDef.name);
    }

    // Add workflow-level data definitions
    for (const data of workflow.data) {
      availableData.add(data.name);
    }

    // Process tasks in execution order
    const executionOrder = workflow.taskChain?.getExecutionOrder() || [];

    for (const taskName of executionOrder) {
      const taskId = `${space.workflowName}:${taskName}`;
      const resolvedTask = resolvedTasks.get(taskId);

      if (!resolvedTask) {
        throw new Error(`Task '${taskName}' not found in space '${space.name}'`);
      }

      // Check that all required inputs are available
      for (const input of resolvedTask.inputs) {
        if (!availableData.has(input)) {
          throw new Error(
            `Input data '${input}' for task '${taskName}' in space '${space.name}' is not available`
          );
        }
        requiredData.add(input);
      }

      // Add task outputs to available data
      for (const output of resolvedTask.outputs) {
        availableData.add(output);
      }
    }

    // Validate that all required data is satisfied
    for (const data of requiredData) {
      const dataDef = experiment.dataDefinitions.find(d => d.name === data);
      if (!dataDef && !workflow.data.find(d => d.name === data)) {
        // Check if it's produced by another task
        let isProduced = false;
        for (const [, task] of resolvedTasks) {
          if (task.outputs.includes(data)) {
            isProduced = true;
            break;
          }
        }

        if (!isProduced) {
          throw new Error(
            `Required data '${data}' in space '${space.name}' is not defined or produced`
          );
        }
      }
    }
  }
}
