import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { Space, Task } from '../types/artifact.types.js';

export class DataManager {
  constructor(private repository: DatabaseRepository) {}

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
