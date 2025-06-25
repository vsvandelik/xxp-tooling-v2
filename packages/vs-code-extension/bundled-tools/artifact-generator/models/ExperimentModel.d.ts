export declare class ExperimentModel {
    name: string;
    spaces: SpaceModel[];
    dataDefinitions: DataDefinition[];
    controlFlow: ControlFlow | null;
    constructor(name: string, spaces: SpaceModel[], dataDefinitions: DataDefinition[], controlFlow?: ControlFlow | null);
}
export declare class SpaceModel {
    name: string;
    workflowName: string;
    strategy: string;
    parameters: ParameterDefinition[];
    taskConfigurations: TaskConfiguration[];
    dataDefinitions: DataDefinition[];
    constructor(name: string, workflowName: string, strategy: string, parameters: ParameterDefinition[], taskConfigurations: TaskConfiguration[], dataDefinitions?: DataDefinition[]);
}
export type ExpressionType = number | string | boolean;
export declare class ParameterDefinition {
    name: string;
    type: 'enum' | 'range' | 'value';
    values: ExpressionType[];
    constructor(name: string, type: 'enum' | 'range' | 'value', values: ExpressionType[]);
}
export declare class TaskConfiguration {
    taskName: string;
    parameters: ParameterDefinition[];
    constructor(taskName: string, parameters: ParameterDefinition[]);
}
export declare class ControlFlow {
    transitions: Transition[];
    constructor(transitions: Transition[]);
}
export declare class Transition {
    from: string;
    to: string;
    condition?: string | undefined;
    constructor(from: string, to: string, condition?: string | undefined);
}
export declare class DataDefinition {
    name: string;
    value: string;
    constructor(name: string, value: string);
}
//# sourceMappingURL=ExperimentModel.d.ts.map