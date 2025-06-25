import { ExperimentModel, ExpressionType } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
export interface ParameterCombination {
    spaceId: string;
    combinations: Record<string, ExpressionType>[];
}
export declare class ParameterResolver {
    resolve(experiment: ExperimentModel, workflows?: WorkflowModel[]): ParameterCombination[];
    private generateParameterCombinations;
    private collectParameterSets;
    private getUsedParameterNames;
    private resolveWorkflowInheritance;
    private expandParameterValues;
    private generateGridSearchCombinations;
    private generateRandomSearchCombinations;
}
//# sourceMappingURL=ParameterResolver.d.ts.map