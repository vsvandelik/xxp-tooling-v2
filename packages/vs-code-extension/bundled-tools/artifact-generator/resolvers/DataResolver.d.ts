import { ExperimentModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { ResolvedTask } from './TaskResolver.js';
export interface ResolvedData {
    experimentLevelData: Record<string, string>;
    spaceLevelData: Map<string, Record<string, string>>;
}
export declare class DataResolver {
    resolve(experiment: ExperimentModel, workflows: WorkflowModel[], resolvedTasks: Map<string, ResolvedTask>): ResolvedData;
    private buildWorkflowMap;
    private getRequiredInitialInputs;
    private resolveExperimentLevelData;
    private resolveWorkflowData;
    private resolveSpaceLevelData;
    private validateRequiredInputs;
}
//# sourceMappingURL=DataResolver.d.ts.map