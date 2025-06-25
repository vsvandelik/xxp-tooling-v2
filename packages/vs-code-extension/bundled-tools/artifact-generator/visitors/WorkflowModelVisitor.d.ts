import { XXPVisitor } from '@extremexp/core';
import { WorkflowDeclarationContext, TaskDefinitionContext, TaskChainContext, ChainElementContext, DataDefinitionContext, TaskConfigurationContext } from '@extremexp/core/src/language/generated/XXPParser';
import { ChainElement, DataModel, TaskChain, TaskConfigurationModel, TaskModel, WorkflowModel } from '../models/WorkflowModel.js';
export declare class WorkflowModelVisitor extends XXPVisitor<any> {
    private workflowName;
    visitWorkflowDeclaration: (ctx: WorkflowDeclarationContext) => WorkflowModel;
    visitTaskDefinition: (ctx: TaskDefinitionContext) => TaskModel;
    visitDataDefinition: (ctx: DataDefinitionContext) => DataModel;
    visitTaskChain: (ctx: TaskChainContext) => TaskChain;
    visitChainElement: (ctx: ChainElementContext) => ChainElement;
    visitTaskConfiguration: (ctx: TaskConfigurationContext) => TaskConfigurationModel;
    private parseExpression;
}
//# sourceMappingURL=WorkflowModelVisitor.d.ts.map