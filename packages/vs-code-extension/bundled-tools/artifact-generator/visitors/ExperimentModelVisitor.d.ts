import { ESPACEVisitor } from '@extremexp/core';
import { ControlBlockContext, DataDefinitionContext, ExperimentDeclarationContext, ParamDefinitionContext, ParamValueContext, SpaceDeclarationContext, TaskConfigurationContext } from '@extremexp/core/src/language/generated/ESPACEParser';
import { ControlFlow, DataDefinition, ExperimentModel, ExpressionType, ParameterDefinition, SpaceModel, TaskConfiguration } from '../models/ExperimentModel.js';
export declare class ExperimentModelVisitor extends ESPACEVisitor<any> {
    visitExperimentDeclaration: (ctx: ExperimentDeclarationContext) => ExperimentModel;
    visitSpaceDeclaration: (ctx: SpaceDeclarationContext) => SpaceModel;
    visitParamDefinition: (ctx: ParamDefinitionContext) => ParameterDefinition;
    visitParamValue: (ctx: ParamValueContext) => {
        type: string;
        values: ExpressionType[];
    };
    visitTaskConfiguration: (ctx: TaskConfigurationContext) => TaskConfiguration;
    visitControlBlock: (ctx: ControlBlockContext) => ControlFlow;
    visitDataDefinition: (ctx: DataDefinitionContext) => DataDefinition;
    private parseExpression;
    private getSpaceNameFromControlChainElement;
}
//# sourceMappingURL=ExperimentModelVisitor.d.ts.map