export class WorkflowModel {
    name;
    parentWorkflow;
    tasks;
    data;
    taskChain;
    taskConfigurations;
    constructor(name, parentWorkflow, tasks, data, taskChain, taskConfigurations = []) {
        this.name = name;
        this.parentWorkflow = parentWorkflow;
        this.tasks = tasks;
        this.data = data;
        this.taskChain = taskChain;
        this.taskConfigurations = taskConfigurations;
    }
}
export class TaskModel {
    name;
    workflowName;
    implementation = null;
    parameters = [];
    inputs = [];
    outputs = [];
    constructor(name, workflowName) {
        this.name = name;
        this.workflowName = workflowName;
    }
    get isAbstract() {
        return this.implementation === null;
    }
    get id() {
        return `${this.workflowName}:${this.name}`;
    }
}
export class TaskConfigurationModel {
    name;
    implementation;
    parameters;
    inputs;
    outputs;
    constructor(name, implementation, parameters, inputs, outputs) {
        this.name = name;
        this.implementation = implementation;
        this.parameters = parameters;
        this.inputs = inputs;
        this.outputs = outputs;
    }
}
export class ParameterModel {
    name;
    value;
    constructor(name, value = null) {
        this.name = name;
        this.value = value;
    }
    get isRequired() {
        return this.value === null;
    }
}
export class DataModel {
    name;
    value;
    constructor(name, value = null) {
        this.name = name;
        this.value = value;
    }
}
export class TaskChain {
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    getExecutionOrder() {
        return this.elements
            .filter(element => element.name !== 'START' && element.name !== 'END')
            .map(element => element.name);
    }
}
export class ChainElement {
    name;
    constructor(name) {
        this.name = name;
    }
}
//# sourceMappingURL=WorkflowModel.js.map