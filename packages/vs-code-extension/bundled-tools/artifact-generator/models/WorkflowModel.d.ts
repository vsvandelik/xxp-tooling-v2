import { ExpressionType } from './ExperimentModel.js';
export declare class WorkflowModel {
    name: string;
    parentWorkflow: string | null;
    tasks: TaskModel[];
    data: DataModel[];
    taskChain: TaskChain | null;
    taskConfigurations: TaskConfigurationModel[];
    constructor(name: string, parentWorkflow: string | null, tasks: TaskModel[], data: DataModel[], taskChain: TaskChain | null, taskConfigurations?: TaskConfigurationModel[]);
}
export declare class TaskModel {
    name: string;
    workflowName: string;
    implementation: string | null;
    parameters: ParameterModel[];
    inputs: string[];
    outputs: string[];
    constructor(name: string, workflowName: string);
    get isAbstract(): boolean;
    get id(): string;
}
export declare class TaskConfigurationModel {
    name: string;
    implementation: string | null;
    parameters: ParameterModel[];
    inputs: string[];
    outputs: string[];
    constructor(name: string, implementation: string | null, parameters: ParameterModel[], inputs: string[], outputs: string[]);
}
export declare class ParameterModel {
    name: string;
    value: ExpressionType | null;
    constructor(name: string, value?: ExpressionType | null);
    get isRequired(): boolean;
}
export declare class DataModel {
    name: string;
    value: string | null;
    constructor(name: string, value?: string | null);
}
export declare class TaskChain {
    elements: ChainElement[];
    constructor(elements: ChainElement[]);
    getExecutionOrder(): string[];
}
export declare class ChainElement {
    name: string;
    constructor(name: string);
}
//# sourceMappingURL=WorkflowModel.d.ts.map