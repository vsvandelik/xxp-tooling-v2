import { SpaceDefinition } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';
import { ParameterCombination } from '../resolvers/ParameterResolver.js';
import { ResolvedTask, TaskResolver } from '../resolvers/TaskResolver.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
export declare class SpaceGenerator {
    generate(experiment: ExperimentModel, parameterCombinations: ParameterCombination[], resolvedTasks: Map<string, ResolvedTask>, taskResolver: TaskResolver, workflows: WorkflowModel[], spaceLevelData?: Map<string, Record<string, string>>): SpaceDefinition[];
    private getTasksOrder;
}
//# sourceMappingURL=SpaceGenerator.d.ts.map