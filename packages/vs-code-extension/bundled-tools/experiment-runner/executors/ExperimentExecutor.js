import { createHash } from 'crypto';
import fs from 'fs';
import { SqliteRepository } from '../database/SqliteRepository.js';
import { ControlFlowManager } from '../managers/ControlFlowManager.js';
import { DataManager } from '../managers/DataManager.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { ConsoleInputProvider } from '../userInput/ConsoleInputProvider.js';
import { SpaceExecutor } from './SpaceExecutor.js';
import { TaskExecutor } from './TaskExecutor.js';
import path, { resolve } from 'path';
export class ExperimentExecutor {
    repository;
    constructor(repositoryOrPath) {
        if (typeof repositoryOrPath === 'string' || repositoryOrPath === undefined) {
            this.repository = new SqliteRepository(repositoryOrPath || './experiment_runs.db');
        }
        else {
            this.repository = repositoryOrPath;
        }
    }
    getRepository() {
        return this.repository;
    }
    async run(artifactPath, options = {}) {
        const { progressCallback = {}, userInputProvider = new ConsoleInputProvider(), resume = false, } = options;
        await this.repository.initialize();
        try {
            const artifact = await this.loadArtifact(artifactPath);
            const progress = new ProgressEmitter(progressCallback);
            let runId;
            let isResuming = false;
            if (resume) {
                const existingRun = await this.repository.getRun(artifact.experiment, artifact.version);
                if (existingRun && existingRun.status !== 'completed') {
                    runId = existingRun.id;
                    isResuming = true;
                    progress.emitProgress(0, `Resuming experiment ${artifact.experiment} v${artifact.version}`);
                }
                else {
                    runId = this.generateRunId();
                }
            }
            else {
                runId = this.generateRunId();
            }
            if (!isResuming) {
                const oldRunToDelete = await this.repository.getRun(artifact.experiment, artifact.version);
                if (oldRunToDelete) {
                    await this.repository.deleteRun(oldRunToDelete.id);
                    progress.emitProgress(0, `Deleted existing run data for ${artifact.experiment} v${artifact.version} before starting a new run.`);
                }
                await this.repository.createRun({
                    id: runId,
                    experiment_name: artifact.experiment,
                    experiment_version: artifact.version,
                    artifact_path: artifactPath,
                    artifact_hash: this.hashArtifact(artifact),
                    start_time: Date.now(),
                    status: 'running',
                });
            }
            const taskExecutor = new TaskExecutor(this.repository, path.dirname(artifactPath), progress);
            taskExecutor.setArtifact(artifact);
            const spaceExecutor = new SpaceExecutor(this.repository, taskExecutor, progress);
            const controlFlow = new ControlFlowManager(this.repository, progress, userInputProvider);
            const dataManager = new DataManager(this.repository);
            const taskMap = this.buildTaskMap(artifact.tasks);
            progress.emitProgress(0, `Starting experiment ${artifact.experiment} v${artifact.version}`);
            let currentSpace = artifact.control.START;
            const completedSpaces = [];
            const totalSpaces = artifact.spaces.length;
            if (isResuming) {
                const savedSpace = await controlFlow.getState(runId);
                if (savedSpace) {
                    currentSpace = savedSpace;
                }
            }
            while (currentSpace !== 'END') {
                progress.emitSpaceStart(currentSpace);
                const space = artifact.spaces.find(s => s.spaceId === currentSpace);
                if (!space) {
                    throw new Error(`Space ${currentSpace} not found in artifact`);
                }
                await spaceExecutor.execute(runId, space, taskMap);
                completedSpaces.push(currentSpace);
                progress.emitSpaceComplete(currentSpace);
                const overallProgress = completedSpaces.length / totalSpaces;
                progress.emitProgress(overallProgress, `Completed space ${currentSpace} (${completedSpaces.length}/${totalSpaces} spaces)`);
                currentSpace = await controlFlow.getNextSpace(runId, currentSpace, artifact.control.transitions);
                await controlFlow.saveState(runId, currentSpace);
            }
            const outputs = await dataManager.collectFinalOutputs(runId, artifact.spaces, taskMap);
            let totalTasks = 0;
            for (const space of artifact.spaces) {
                totalTasks += space.parameters.length * space.tasksOrder.length;
            }
            const taskStats = await this.repository.getTaskStats(runId);
            let completedTasks = 0;
            let failedTasks = 0;
            let skippedTasks = 0;
            for (const stat of taskStats) {
                if (stat.status === 'completed')
                    completedTasks = stat.count;
                else if (stat.status === 'failed')
                    failedTasks = stat.count;
                else if (stat.status === 'skipped')
                    skippedTasks = stat.count;
            }
            await this.repository.updateRunStatus(runId, 'completed', Date.now());
            progress.emitProgress(1.0, `Experiment completed successfully: ${completedTasks} tasks completed`);
            return {
                runId,
                status: 'completed',
                completedSpaces,
                outputs,
                summary: {
                    totalTasks,
                    completedTasks,
                    failedTasks,
                    skippedTasks,
                },
            };
        }
        catch (error) {
            if (await this.repository.getRunById(this.generateRunId())) {
                await this.repository.updateRunStatus(this.generateRunId(), 'failed', Date.now());
            }
            throw error;
        }
        finally {
            await this.repository.close();
        }
    }
    async getStatus(experimentName, experimentVersion) {
        await this.repository.initialize();
        try {
            const run = await this.repository.getRun(experimentName, experimentVersion);
            if (!run) {
                return null;
            }
            const spaceStats = await this.repository.getSpaceStats(run.id);
            const paramStats = await this.repository.getParamSetStats(run.id);
            const result = {
                runId: run.id,
                experimentName: run.experiment_name,
                experimentVersion: run.experiment_version,
                status: run.status,
                progress: {
                    completedSpaces: spaceStats.completed,
                    totalSpaces: spaceStats.total,
                    completedParameterSets: paramStats.completed,
                    totalParameterSets: paramStats.total,
                },
            };
            if (run.current_space !== undefined) {
                result.currentSpace = run.current_space;
            }
            if (run.current_param_set !== undefined) {
                result.currentParameterSet = run.current_param_set;
            }
            return result;
        }
        finally {
            await this.repository.close();
        }
    }
    async terminate(experimentName, experimentVersion) {
        await this.repository.initialize();
        try {
            const run = await this.repository.getRun(experimentName, experimentVersion);
            if (!run || run.status !== 'running') {
                return false;
            }
            await this.repository.updateRunStatus(run.id, 'terminated', Date.now());
            return true;
        }
        finally {
            await this.repository.close();
        }
    }
    async loadArtifact(artifactPath) {
        if (!artifactPath.endsWith('.json')) {
            throw new Error('Invalid artifact file type. Please provide a .json file.');
        }
        let artifactString;
        try {
            artifactString = fs.readFileSync(resolve(artifactPath), 'utf-8');
        }
        catch (error) {
            throw new Error(`Error reading artifact file: ${error.message}`);
        }
        let parsedArtifact;
        try {
            parsedArtifact = JSON.parse(artifactString);
        }
        catch (error) {
            throw new Error(`Error parsing artifact JSON: ${error.message}`);
        }
        if (!parsedArtifact ||
            typeof parsedArtifact !== 'object' ||
            parsedArtifact === null ||
            typeof parsedArtifact.experiment !== 'string' ||
            typeof parsedArtifact.version !== 'string' ||
            !Array.isArray(parsedArtifact.tasks) ||
            !Array.isArray(parsedArtifact.spaces) ||
            typeof parsedArtifact.control !== 'object' ||
            !parsedArtifact.control ||
            typeof parsedArtifact.control.START !== 'string' ||
            !Array.isArray(parsedArtifact.control.transitions)) {
            throw new Error('Invalid artifact structure. Missing required fields.');
        }
        return parsedArtifact;
    }
    generateRunId() {
        return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    hashArtifact(artifact) {
        const content = JSON.stringify(artifact);
        return createHash('sha256').update(content).digest('hex');
    }
    buildTaskMap(taskGroups) {
        const map = new Map();
        for (const group of taskGroups) {
            for (const task of group) {
                map.set(task.taskId, task);
            }
        }
        return map;
    }
}
//# sourceMappingURL=ExperimentExecutor.js.map