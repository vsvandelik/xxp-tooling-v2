export class ExperimentModel {
    name;
    spaces;
    dataDefinitions;
    controlFlow;
    constructor(name, spaces, dataDefinitions, controlFlow = null) {
        this.name = name;
        this.spaces = spaces;
        this.dataDefinitions = dataDefinitions;
        this.controlFlow = controlFlow;
    }
}
export class SpaceModel {
    name;
    workflowName;
    strategy;
    parameters;
    taskConfigurations;
    dataDefinitions;
    constructor(name, workflowName, strategy, parameters, taskConfigurations, dataDefinitions = []) {
        this.name = name;
        this.workflowName = workflowName;
        this.strategy = strategy;
        this.parameters = parameters;
        this.taskConfigurations = taskConfigurations;
        this.dataDefinitions = dataDefinitions;
    }
}
export class ParameterDefinition {
    name;
    type;
    values;
    constructor(name, type, values) {
        this.name = name;
        this.type = type;
        this.values = values;
    }
}
export class TaskConfiguration {
    taskName;
    parameters;
    constructor(taskName, parameters) {
        this.taskName = taskName;
        this.parameters = parameters;
    }
}
export class ControlFlow {
    transitions;
    constructor(transitions) {
        this.transitions = transitions;
    }
}
export class Transition {
    from;
    to;
    condition;
    constructor(from, to, condition) {
        this.from = from;
        this.to = to;
        this.condition = condition;
    }
}
export class DataDefinition {
    name;
    value;
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}
//# sourceMappingURL=ExperimentModel.js.map