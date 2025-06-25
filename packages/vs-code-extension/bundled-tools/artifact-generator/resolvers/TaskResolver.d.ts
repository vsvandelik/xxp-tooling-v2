import { ExperimentModel, ExpressionType } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { ParameterCombination } from './ParameterResolver.js';
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
export declare class TaskResolver {
    resolve(experiment: ExperimentModel, workflows: WorkflowModel[], resolvedParameters?: ParameterCombination[]): Map<string, ResolvedTask>;
    buildWorkflowMap(workflows: WorkflowModel[]): Map<string, WorkflowModel>;
    resolveWorkflowInheritance(workflow: WorkflowModel, workflowMap: Map<string, WorkflowModel>): WorkflowModel;
    private getSpaceParametersForTask;
    private resolveTask;
    private constructTaskModel;
    private deduplicateTasks;
    private areTasksIdentical;
    private taskIdMapping;
    getTaskIdMapping(): Map<string, string>;
}
//# sourceMappingURL=TaskResolver.d.ts.map