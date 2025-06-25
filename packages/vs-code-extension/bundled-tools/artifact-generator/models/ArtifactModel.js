export class ArtifactModel {
    experiment;
    version;
    tasks;
    spaces;
    control;
    inputData;
    constructor(experiment, version, tasks, spaces, control, inputData = {}) {
        this.experiment = experiment;
        this.version = version;
        this.tasks = tasks;
        this.spaces = spaces;
        this.control = control;
        this.inputData = inputData;
    }
    toJSON() {
        return {
            experiment: this.experiment,
            version: this.version,
            tasks: this.tasks.map(taskGroup => taskGroup.map(task => task.toJSON())),
            spaces: this.spaces.map(space => space.toJSON()),
            control: this.control.toJSON(),
            inputData: this.inputData,
        };
    }
}
export class TaskDefinition {
    taskId;
    workflow;
    implementation;
    dynamicParameters;
    staticParameters;
    inputData;
    outputData;
    constructor(taskId, workflow, implementation, dynamicParameters, staticParameters, inputData, outputData) {
        this.taskId = taskId;
        this.workflow = workflow;
        this.implementation = implementation;
        this.dynamicParameters = dynamicParameters;
        this.staticParameters = staticParameters;
        this.inputData = inputData;
        this.outputData = outputData;
    }
    toJSON() {
        return {
            taskId: this.taskId,
            workflow: this.workflow,
            implementation: this.implementation,
            dynamicParameters: [...this.dynamicParameters],
            staticParameters: { ...this.staticParameters },
            inputData: [...this.inputData],
            outputData: [...this.outputData],
        };
    }
}
export class SpaceDefinition {
    spaceId;
    tasksOrder;
    parameters;
    inputData;
    constructor(spaceId, tasksOrder, parameters, inputData = {}) {
        this.spaceId = spaceId;
        this.tasksOrder = tasksOrder;
        this.parameters = parameters;
        this.inputData = inputData;
    }
    toJSON() {
        return {
            spaceId: this.spaceId,
            tasksOrder: [...this.tasksOrder],
            parameters: this.parameters.map(param => ({ ...param })),
            inputData: { ...this.inputData },
        };
    }
}
export class ControlDefinition {
    START;
    transitions;
    constructor(START, transitions) {
        this.START = START;
        this.transitions = transitions;
    }
    toJSON() {
        return {
            START: this.START,
            transitions: this.transitions.map(transition => transition.toJSON()),
        };
    }
}
export class TransitionDefinition {
    from;
    to;
    condition;
    constructor(from, to, condition) {
        this.from = from;
        this.to = to;
        this.condition = condition;
    }
    toJSON() {
        return {
            from: this.from,
            to: this.to,
            ...(this.condition !== undefined && { condition: this.condition }),
        };
    }
}
//# sourceMappingURL=ArtifactModel.js.map