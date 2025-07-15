/**
 * Data manager for experiment output collection.
 * Handles the collection and aggregation of experiment output data
 * from completed task executions.
 */

import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { Space, Task } from '../types/artifact.types.js';

/**
 * Manager responsible for collecting and organizing experiment output data.
 * Aggregates outputs from completed tasks and provides final result summaries.
 */
export class DataManager {
  /**
   * Creates a new data manager.
   *
   * @param repository - Database repository for accessing execution data
   */
  constructor(private repository: DatabaseRepository) {}

  /**
   * Collects final output data from all completed task executions.
   * Aggregates outputs from all spaces and parameter sets into a structured result.
   *
   * @param runId - Unique identifier for the experiment run
   * @param spaces - Array of spaces that were executed
   * @param taskMap - Map of task IDs to task definitions
   * @returns Promise resolving to aggregated output data organized by space
   */
  async collectFinalOutputs(
    runId: string,
    spaces: Space[],
    taskMap: Map<string, Task>
  ): Promise<Record<string, Record<string, string>>> {
    const outputs: Record<string, Record<string, string>> = {};

    for (const space of spaces) {
      outputs[space.spaceId] = {};

      // Get the last task in the space
      const lastTaskId = space.tasksOrder[space.tasksOrder.length - 1];
      if (!lastTaskId) continue;

      const lastTask = taskMap.get(lastTaskId);
      if (!lastTask) continue;

      // Collect outputs from all parameter sets
      for (let i = 0; i < space.parameters.length; i++) {
        // Check if this parameter set was completed
        const paramExec = await this.repository.getParamSetExecution(runId, space.spaceId, i);
        if (paramExec?.status !== 'completed') continue;

        // Get outputs from the last task
        for (const outputName of lastTask.outputData) {
          const path = await this.repository.getDataMapping(runId, space.spaceId, i, outputName);
          if (path) {
            // Use a unique key for each output
            const key = `${outputName}_param${i}`;
            outputs[space.spaceId]![key] = path;
          }
        }
      }
    }

    return outputs;
  }
}
