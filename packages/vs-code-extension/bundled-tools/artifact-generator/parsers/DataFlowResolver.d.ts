import { ExperimentModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';
export declare class DataFlowResolver {
    validate(experiment: ExperimentModel, workflows: WorkflowModel[], resolvedTasks: Map<string, ResolvedTask>): void;
    private validateSpaceDataFlow;
}
//# sourceMappingURL=DataFlowResolver.d.ts.map