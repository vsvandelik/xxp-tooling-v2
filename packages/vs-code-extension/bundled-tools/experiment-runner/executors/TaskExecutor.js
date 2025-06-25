import { spawn } from 'child_process';
export class TaskExecutor {
    repository;
    artifactFolder;
    progress;
    artifact = null;
    constructor(repository, artifactFolder, progress) {
        this.repository = repository;
        this.artifactFolder = artifactFolder;
        this.progress = progress;
    }
    setArtifact(artifact) {
        this.artifact = artifact;
    }
    async execute(runId, spaceId, paramSetIndex, task, paramSet) {
        const existing = await this.repository.getTaskExecution(runId, spaceId, paramSetIndex, task.taskId);
        if (existing?.status === 'completed') {
            const outputs = {};
            for (const outputName of task.outputData) {
                const value = await this.repository.getDataMapping(runId, spaceId, paramSetIndex, outputName);
                if (value)
                    outputs[outputName] = value;
            }
            return outputs;
        }
        const allParams = this.resolveParameters(task, paramSet);
        this.progress.emitTaskStart(task.taskId, allParams);
        await this.repository.createTaskExecution({
            run_id: runId,
            space_id: spaceId,
            param_set_index: paramSetIndex,
            task_id: task.taskId,
            status: 'running',
            start_time: Date.now(),
        });
        try {
            const inputData = await this.resolveInputData(runId, spaceId, paramSetIndex, task.inputData);
            const outputData = await this.runPythonScript(task.implementation, allParams, inputData, task);
            const outputs = {};
            for (const [outputName, outputValue] of Object.entries(outputData)) {
                outputs[outputName] = outputValue;
                await this.repository.createDataMapping({
                    run_id: runId,
                    space_id: spaceId,
                    param_set_index: paramSetIndex,
                    data_name: outputName,
                    data_value: outputValue,
                });
            }
            await this.repository.updateTaskExecution(runId, spaceId, paramSetIndex, task.taskId, {
                status: 'completed',
                end_time: Date.now(),
            });
            this.progress.emitTaskComplete(task.taskId, allParams, outputs);
            return outputs;
        }
        catch (error) {
            await this.repository.updateTaskExecution(runId, spaceId, paramSetIndex, task.taskId, {
                status: 'failed',
                end_time: Date.now(),
                error_message: error.message,
            });
            this.progress.emitError(error, { taskId: task.taskId, params: allParams });
            throw error;
        }
    }
    resolveParameters(task, paramSet) {
        const params = { ...task.staticParameters };
        for (const dynParam of task.dynamicParameters) {
            const overrideKey = `${task.taskId}:${dynParam}`;
            if (overrideKey in paramSet) {
                params[dynParam] = paramSet[overrideKey];
            }
            else if (dynParam in paramSet) {
                params[dynParam] = paramSet[dynParam];
            }
        }
        for (const staticParam of Object.keys(task.staticParameters)) {
            const overrideKey = `${task.taskId}:${staticParam}`;
            if (overrideKey in paramSet) {
                params[staticParam] = paramSet[overrideKey];
            }
            else if (staticParam in paramSet) {
                params[staticParam] = paramSet[staticParam];
            }
        }
        return params;
    }
    async resolveInputData(runId, spaceId, paramSetIndex, inputNames) {
        const inputs = {};
        for (const inputName of inputNames) {
            const value = await this.repository.getDataMapping(runId, spaceId, paramSetIndex, inputName);
            if (value) {
                inputs[inputName] = value;
            }
            else {
                const initialValue = this.getInitialInputValue(inputName, spaceId);
                if (initialValue) {
                    inputs[inputName] = initialValue;
                }
                else {
                    throw new Error(`No value found for input '${inputName}' in space '${spaceId}'. ` +
                        `Please ensure it's defined in the experiment or space configuration.`);
                }
            }
        }
        return inputs;
    }
    getInitialInputValue(inputName, spaceId) {
        if (!this.artifact) {
            return null;
        }
        const space = this.artifact.spaces.find(s => s.spaceId === spaceId);
        if (space && space.inputData && inputName in space.inputData) {
            return space.inputData[inputName];
        }
        if (this.artifact.inputData && inputName in this.artifact.inputData) {
            return this.artifact.inputData[inputName];
        }
        return null;
    }
    async runPythonScript(scriptPath, params, inputData, task) {
        return new Promise((resolve, reject) => {
            const args = [];
            for (const [key, value] of Object.entries(params)) {
                args.push(`--${key}`, String(value));
            }
            const inputValues = [];
            for (const inputName of task.inputData) {
                const inputValue = inputData[inputName];
                if (inputValue) {
                    inputValues.push(inputValue);
                }
            }
            if (inputValues.length > 0) {
                args.push(...inputValues.map(val => String(val)));
            }
            const proc = spawn('python', [scriptPath, ...args], {
                cwd: this.artifactFolder,
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', data => {
                stdout += data.toString();
            });
            proc.stderr.on('data', data => {
                stderr += data.toString();
            });
            proc.on('close', code => {
                if (code !== 0) {
                    reject(new Error(`Task failed with exit code ${code}: ${stderr}`));
                }
                else {
                    try {
                        const firstLine = stdout.split('\n')[0]?.trim();
                        if (!firstLine) {
                            reject(new Error(`No output received from Python script ${scriptPath}`));
                            return;
                        }
                        const outputStrings = firstLine.split(',').map(str => str.trim().replace(/^"|"$/g, ''));
                        const outputs = {};
                        for (let i = 0; i < task.outputData.length; i++) {
                            const outputName = task.outputData[i];
                            const outputString = outputStrings[i];
                            if (outputName && outputString) {
                                outputs[outputName] = outputString;
                            }
                            else {
                                reject(new Error(`Missing output for '${outputName}' or insufficient outputs returned`));
                                return;
                            }
                        }
                        resolve(outputs);
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse script output: ${error.message}`));
                    }
                }
            });
            proc.on('error', err => {
                reject(err);
            });
        });
    }
}
//# sourceMappingURL=TaskExecutor.js.map