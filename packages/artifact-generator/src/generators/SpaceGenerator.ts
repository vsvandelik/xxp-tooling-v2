import { SpaceDefinition } from '../models/ArtifactModel.js';
import { ExperimentModel, SpaceModel } from '../models/ExperimentModel.js';
import { ParameterCombination } from '../resolvers/ParameterResolver.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';

export class SpaceGenerator {
  generate(
    experiment: ExperimentModel,
    parameterCombinations: ParameterCombination[],
    resolvedTasks: Map<string, ResolvedTask>
  ): SpaceDefinition[] {
    const spaceDefinitions: SpaceDefinition[] = [];

    for (const space of experiment.spaces) {
      const paramCombo = parameterCombinations.find(pc => pc.spaceId === space.name);
      if (!paramCombo) {
        throw new Error(`Parameter combinations not found for space '${space.name}'`);
      }

      const tasksOrder = this.getTasksOrder(space, resolvedTasks);
      const spaceDefinition = new SpaceDefinition(space.name, tasksOrder, paramCombo.combinations);

      spaceDefinitions.push(spaceDefinition);
    }

    return spaceDefinitions;
  }

  private getTasksOrder(space: SpaceModel, resolvedTasks: Map<string, ResolvedTask>): string[] {
    const tasksOrder: string[] = [];

    // Find all tasks for this space's workflow
    for (const [taskId, resolvedTask] of resolvedTasks) {
      if (resolvedTask.workflowName === space.workflowName) {
        tasksOrder.push(taskId);
      }
    }

    // Sort tasks based on their dependencies (simplified - assumes linear chain)
    // In a more complex implementation, this would use topological sorting
    return tasksOrder.sort();
  }
}
