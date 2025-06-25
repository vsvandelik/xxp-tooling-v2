import { ExpressionType } from './ExperimentModel.js';
export declare class ArtifactModel {
    experiment: string;
    version: string;
    tasks: TaskDefinition[][];
    spaces: SpaceDefinition[];
    control: ControlDefinition;
    inputData: Record<string, string>;
    constructor(experiment: string, version: string, tasks: TaskDefinition[][], spaces: SpaceDefinition[], control: ControlDefinition, inputData?: Record<string, string>);
    toJSON(): any;
}
export declare class TaskDefinition {
    taskId: string;
    workflow: string;
    implementation: string;
    dynamicParameters: string[];
    staticParameters: Record<string, ExpressionType>;
    inputData: string[];
    outputData: string[];
    constructor(taskId: string, workflow: string, implementation: string, dynamicParameters: string[], staticParameters: Record<string, ExpressionType>, inputData: string[], outputData: string[]);
    toJSON(): any;
}
export declare class SpaceDefinition {
    spaceId: string;
    tasksOrder: string[];
    parameters: Record<string, ExpressionType>[];
    inputData: Record<string, string>;
    constructor(spaceId: string, tasksOrder: string[], parameters: Record<string, ExpressionType>[], inputData?: Record<string, string>);
    toJSON(): any;
}
export declare class ControlDefinition {
    START: string;
    transitions: TransitionDefinition[];
    constructor(START: string, transitions: TransitionDefinition[]);
    toJSON(): any;
}
export declare class TransitionDefinition {
    from: string;
    to: string;
    condition?: string | undefined;
    constructor(from: string, to: string, condition?: string | undefined);
    toJSON(): any;
}
//# sourceMappingURL=ArtifactModel.d.ts.map