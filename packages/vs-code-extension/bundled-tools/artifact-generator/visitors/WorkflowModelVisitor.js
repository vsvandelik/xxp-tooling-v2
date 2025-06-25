import { XXPVisitor } from '@extremexp/core';
import { ChainElement, DataModel, ParameterModel, TaskChain, TaskConfigurationModel, TaskModel, WorkflowModel, } from '../models/WorkflowModel.js';
export class WorkflowModelVisitor extends XXPVisitor {
    workflowName = undefined;
    visitWorkflowDeclaration = (ctx) => {
        const header = ctx.workflowHeader();
        const body = ctx.workflowBody();
        this.workflowName = header.IDENTIFIER().getText();
        const parentWorkflow = header.workflowNameRead()?.IDENTIFIER().getText() || null;
        const tasks = [];
        const data = [];
        const taskConfigurations = new Map();
        let taskChain = null;
        for (const content of body.workflowContent()) {
            if (content.taskDefinition()) {
                tasks.push(this.visit(content.taskDefinition()));
            }
            else if (content.dataDefinition()) {
                data.push(this.visit(content.dataDefinition()));
            }
            else if (content.taskChain()) {
                taskChain = this.visit(content.taskChain());
            }
            else if (content.taskConfiguration()) {
                const config = this.visit(content.taskConfiguration());
                taskConfigurations.set(config.name, config);
            }
        }
        return new WorkflowModel(this.workflowName, parentWorkflow, tasks, data, taskChain, Array.from(taskConfigurations.values()));
    };
    visitTaskDefinition = (ctx) => {
        const taskName = ctx.IDENTIFIER().getText();
        return new TaskModel(taskName, this.workflowName);
    };
    visitDataDefinition = (ctx) => {
        const dataName = ctx.IDENTIFIER().getText();
        if (ctx.STRING()) {
            const value = ctx.STRING().getText().slice(1, -1);
            return new DataModel(dataName, value);
        }
        else {
            return new DataModel(dataName, null);
        }
    };
    visitTaskChain = (ctx) => {
        const elements = ctx.chainElement().map(element => this.visit(element));
        return new TaskChain(elements);
    };
    visitChainElement = (ctx) => {
        if (ctx.START()) {
            return new ChainElement('START');
        }
        else if (ctx.END()) {
            return new ChainElement('END');
        }
        else if (ctx.taskNameRead()) {
            return new ChainElement(ctx.taskNameRead().IDENTIFIER().getText());
        }
        throw new Error('Unknown chain element type');
    };
    visitTaskConfiguration = (ctx) => {
        const header = ctx.taskConfigurationHeader();
        const body = ctx.taskConfigurationBody();
        const taskNameRead = header.taskNameRead();
        if (!taskNameRead) {
            throw new Error('TaskNameRead is null/undefined in task configuration');
        }
        const identifier = taskNameRead.IDENTIFIER();
        if (!identifier) {
            throw new Error('IDENTIFIER is null/undefined in task configuration');
        }
        const taskName = identifier.getText();
        let implementation = null;
        const parameters = [];
        const inputs = [];
        const outputs = [];
        for (const content of body.configurationContent()) {
            if (content.implementation()) {
                implementation = content.implementation().fileNameString().getText().slice(1, -1);
            }
            else if (content.paramAssignment()) {
                const paramAssignment = content.paramAssignment();
                const paramName = paramAssignment.IDENTIFIER().getText();
                const expression = paramAssignment.expression();
                let value = null;
                if (expression) {
                    value = this.parseExpression(expression);
                }
                parameters.push(new ParameterModel(paramName, value));
            }
            else if (content.inputStatement()) {
                const inputStatement = content.inputStatement();
                const dataNames = inputStatement
                    .dataNameList()
                    .dataNameRead()
                    .map(data => data.IDENTIFIER().getText());
                inputs.push(...dataNames);
            }
            else if (content.outputStatement()) {
                const outputStatement = content.outputStatement();
                const dataNames = outputStatement
                    .dataNameList()
                    .dataNameRead()
                    .map(data => data.IDENTIFIER().getText());
                outputs.push(...dataNames);
            }
        }
        const result = new TaskConfigurationModel(taskName, implementation, parameters, inputs, outputs);
        return result;
    };
    parseExpression(ctx) {
        if (ctx.NUMBER()) {
            const text = ctx.NUMBER().getText();
            return text.includes('.') ? parseFloat(text) : parseInt(text);
        }
        else if (ctx.STRING()) {
            return ctx.STRING().getText().slice(1, -1);
        }
        else if (ctx.BOOLEAN()) {
            return ctx.BOOLEAN().getText() === 'true';
        }
        return null;
    }
}
//# sourceMappingURL=WorkflowModelVisitor.js.map