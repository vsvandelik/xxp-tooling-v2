import { spawn } from 'child_process';
import * as path from 'path';
import { ExperimentExecutor, } from '@extremexp/experiment-runner';
export class ExperimentService {
    executor;
    activeExperiments = new Map();
    pendingInputs = new Map();
    config;
    constructor(config) {
        this.config = config;
        this.executor = new ExperimentExecutor(config.databasePath);
    }
    async initialize() {
        console.log('ExperimentService initialized');
    }
    async shutdown() {
        for (const [id, experiment] of this.activeExperiments) {
            if (experiment.status.status === 'running') {
                await this.terminateExperiment(id);
            }
        }
        this.activeExperiments.clear();
        this.pendingInputs.clear();
    }
    async startExperiment(artifactPath, options = {}) {
        const runningCount = Array.from(this.activeExperiments.values()).filter(exp => exp.status.status === 'running').length;
        if (runningCount >= this.config.maxConcurrent) {
            throw new Error(`Maximum concurrent experiments (${this.config.maxConcurrent}) reached`);
        }
        const experimentId = options.experimentId || this.generateExperimentId();
        const progressCallback = {
            onTaskStart: (taskId, params) => {
                this.updateProgress(experimentId, { currentTask: taskId });
            },
            onTaskComplete: (taskId, params, outputs) => {
            },
            onSpaceStart: spaceId => {
                this.updateProgress(experimentId, { currentSpace: spaceId });
            },
            onSpaceComplete: spaceId => {
            },
            onError: (error, context) => {
                options.onError?.(error);
            },
            onProgress: (progress, message) => {
                console.log(`Progress callback triggered: ${progress * 100}% - ${message}`);
                const experiment = this.activeExperiments.get(experimentId);
                if (experiment) {
                    const progressData = {
                        experimentId,
                        status: experiment.status.status,
                        ...(experiment.status.currentSpace && { currentSpace: experiment.status.currentSpace }),
                        progress: {
                            percentage: progress,
                            completedSpaces: experiment.status.progress.completedSpaces,
                            totalSpaces: experiment.status.progress.totalSpaces,
                            completedTasks: Math.floor(progress * (experiment.status.progress.totalParameterSets || 1)),
                            totalTasks: experiment.status.progress.totalParameterSets || 1,
                        },
                        timestamp: Date.now(),
                    };
                    console.log(`Calling onProgress with data:`, progressData);
                    options.onProgress?.(progressData);
                }
            },
        };
        const userInputProvider = {
            getInput: async (prompt) => {
                const request = {
                    requestId: this.generateRequestId(),
                    experimentId,
                    prompt,
                    timestamp: Date.now(),
                };
                options.onInputRequired?.(request);
                return new Promise((resolve, reject) => {
                    this.pendingInputs.set(request.requestId, {
                        request,
                        resolve,
                        reject,
                    });
                    setTimeout(() => {
                        if (this.pendingInputs.has(request.requestId)) {
                            this.pendingInputs.delete(request.requestId);
                            reject(new Error('User input timeout'));
                        }
                    }, 5 * 60 * 1000);
                });
            },
        };
        const runOptions = {
            resume: options.resume ?? false,
            progressCallback,
            userInputProvider,
            ...(options.onComplete && { onComplete: options.onComplete }),
            ...(options.onError && { onError: options.onError }),
        };
        this.runExperiment(experimentId, artifactPath, runOptions);
        return experimentId;
    }
    async runExperiment(experimentId, artifactPath, options) {
        try {
            const artifact = await this.loadArtifact(artifactPath);
            const status = await this.executor.getStatus(artifact.experiment, artifact.version);
            const activeExperiment = {
                id: experimentId,
                experimentName: artifact.experiment,
                experimentVersion: artifact.version,
                artifactPath,
                status: status || {
                    runId: experimentId,
                    experimentName: artifact.experiment,
                    experimentVersion: artifact.version,
                    status: 'running',
                    progress: {
                        completedSpaces: 0,
                        totalSpaces: artifact.spaces.length,
                        completedParameterSets: 0,
                        totalParameterSets: artifact.spaces.reduce((sum, space) => sum + space.parameters.length, 0),
                    },
                },
                startTime: Date.now(),
            };
            this.activeExperiments.set(experimentId, activeExperiment);
            const result = await this.executor.run(artifactPath, {
                resume: options.resume,
                progressCallback: options.progressCallback,
                userInputProvider: options.userInputProvider,
            });
            activeExperiment.status.status = result.status;
            options.onComplete?.(result);
        }
        catch (error) {
            const experiment = this.activeExperiments.get(experimentId);
            if (experiment) {
                experiment.status.status = 'failed';
            }
            options.onError?.(error);
        }
    }
    async terminateExperiment(experimentId) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) {
            return false;
        }
        const terminated = await this.executor.terminate(experiment.experimentName, experiment.experimentVersion);
        if (terminated) {
            experiment.status.status = 'terminated';
            for (const [requestId, pending] of this.pendingInputs) {
                if (pending.request.experimentId === experimentId) {
                    pending.reject(new Error('Experiment terminated'));
                    this.pendingInputs.delete(requestId);
                }
            }
        }
        return terminated;
    }
    async getExperimentStatus(experimentId) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) {
            return null;
        }
        return this.executor.getStatus(experiment.experimentName, experiment.experimentVersion);
    }
    async getExperimentHistory(experimentId, options) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        const repository = this.executor.getRepository();
        await repository.initialize();
        try {
            const run = await repository.getRun(experiment.experimentName, experiment.experimentVersion);
            if (!run) {
                return [];
            }
            const taskExecutions = await repository.getTaskExecutionHistory(run.id, options);
            const artifact = await this.loadArtifact(experiment.artifactPath);
            const historyItems = [];
            for (const execution of taskExecutions) {
                const space = artifact.spaces.find((s) => s.spaceId === execution.space_id);
                if (!space || !space.parameters[execution.param_set_index]) {
                    continue;
                }
                const parameterSet = space.parameters[execution.param_set_index];
                const outputs = {};
                const allTasks = artifact.tasks.flat();
                const task = allTasks.find((t) => t.taskId === execution.task_id);
                if (task) {
                    for (const outputName of task.outputData) {
                        const outputValue = await repository.getDataMapping(run.id, execution.space_id, execution.param_set_index, outputName);
                        if (outputValue) {
                            outputs[outputName] = outputValue;
                        }
                    }
                }
                const historyItem = {
                    taskId: execution.task_id,
                    spaceId: execution.space_id,
                    paramSetIndex: execution.param_set_index,
                    parameters: parameterSet,
                    outputs,
                    status: execution.status,
                    startTime: execution.start_time || 0,
                    ...(execution.end_time && { endTime: execution.end_time }),
                    ...(execution.error_message && { errorMessage: execution.error_message }),
                };
                historyItems.push(historyItem);
            }
            return historyItems;
        }
        finally {
            await repository.close();
        }
    }
    submitUserInput(response) {
        const pending = this.pendingInputs.get(response.requestId);
        if (!pending) {
            return false;
        }
        pending.resolve(response.value);
        this.pendingInputs.delete(response.requestId);
        return true;
    }
    getActiveExperiments() {
        return Array.from(this.activeExperiments.values());
    }
    updateProgress(experimentId, updates) {
        const experiment = this.activeExperiments.get(experimentId);
        if (experiment && updates.currentSpace) {
            experiment.status.currentSpace = updates.currentSpace;
        }
    }
    generateExperimentId() {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async loadArtifact(artifactPath) {
        const fs = await import('fs');
        const content = fs.readFileSync(path.resolve(artifactPath), 'utf-8');
        return JSON.parse(content);
    }
    async validateArtifact(artifactPath) {
        try {
            const artifact = await this.loadArtifact(artifactPath);
            const errors = [];
            const warnings = [];
            if (!artifact.experiment) {
                errors.push('Missing experiment name');
            }
            if (!artifact.version) {
                errors.push('Missing experiment version');
            }
            if (!artifact.tasks || !Array.isArray(artifact.tasks)) {
                errors.push('Missing or invalid tasks array');
            }
            if (!artifact.spaces || !Array.isArray(artifact.spaces)) {
                errors.push('Missing or invalid spaces array');
            }
            if (!artifact.control?.START) {
                errors.push('Missing control flow START');
            }
            if (artifact.spaces?.length === 0) {
                warnings.push('No spaces defined in artifact');
            }
            if (artifact.tasks?.length === 0) {
                warnings.push('No tasks defined in artifact');
            }
            return {
                errors,
                warnings,
                isValid: errors.length === 0,
            };
        }
        catch (error) {
            return {
                errors: [`Failed to load artifact: ${error.message}`],
                warnings: [],
                isValid: false,
            };
        }
    }
    async generateArtifact(espacePath, outputPath) {
        return new Promise(resolve => {
            const args = [espacePath];
            if (outputPath) {
                args.push('-o', outputPath);
            }
            const proc = spawn('artifact-generator', args, {
                cwd: path.dirname(espacePath),
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
                const errors = [];
                const warnings = [];
                const lines = (stdout + stderr).split('\n');
                for (const line of lines) {
                    if (line.includes('Validation error:') || line.includes('Error:')) {
                        errors.push(line.replace(/^.*?Error:\s*/, ''));
                    }
                    else if (line.includes('Validation warning:') || line.includes('Warning:')) {
                        warnings.push(line.replace(/^.*?Warning:\s*/, ''));
                    }
                }
                const validation = {
                    errors: code === 0 ? errors : errors.length > 0 ? errors : ['Artifact generation failed'],
                    warnings,
                    isValid: code === 0 && errors.length === 0,
                };
                if (code === 0) {
                    const pathMatch = stdout.match(/Artifact generated successfully:\s*(.+)/);
                    const artifactPath = pathMatch ? pathMatch[1].trim() : undefined;
                    const result = {
                        success: true,
                        validation,
                    };
                    if (artifactPath) {
                        result.artifactPath = artifactPath;
                    }
                    resolve(result);
                }
                else {
                    const result = {
                        success: false,
                        validation,
                    };
                    const errorMsg = stderr || 'Unknown error';
                    if (errorMsg) {
                        result.error = errorMsg;
                    }
                    resolve(result);
                }
            });
            proc.on('error', error => {
                resolve({
                    success: false,
                    validation: {
                        errors: [`Failed to run artifact generator: ${error.message}`],
                        warnings: [],
                        isValid: false,
                    },
                    error: error.message,
                });
            });
        });
    }
}
//# sourceMappingURL=ExperimentService.js.map