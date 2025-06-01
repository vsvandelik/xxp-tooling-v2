import { createHash } from 'crypto';
import fs from 'fs';
import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { SqliteRepository } from '../database/SqliteRepository.js';
import { ControlFlowManager } from '../managers/ControlFlowManager.js';
import { DataManager } from '../managers/DataManager.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Artifact, Task } from '../types/artifact.types.js';
import { RunResult, RunStatus } from '../types/run.types.js';
import { ExperimentRunner, ExperimentRunnerOptions } from '../types/runner.types.js';
import { ConsoleInputProvider } from '../userInput/ConsoleInputProvider.js';
import { SpaceExecutor } from './SpaceExecutor.js';
import { TaskExecutor } from './TaskExecutor.js';
import path, { resolve } from 'path';

export class ExperimentExecutor implements ExperimentRunner {
  private repository: DatabaseRepository;

  constructor(repositoryOrPath?: DatabaseRepository | string) {
    if (typeof repositoryOrPath === 'string' || repositoryOrPath === undefined) {
      this.repository = new SqliteRepository(repositoryOrPath || './experiment_runs.db');
    } else {
      this.repository = repositoryOrPath;
    }
  }

  getRepository(): DatabaseRepository {
    return this.repository;
  }

  async run(artifactPath: string, options: ExperimentRunnerOptions = {}): Promise<RunResult> {
    const {
      progressCallback = {},
      userInputProvider = new ConsoleInputProvider(),
      resume = false,
    } = options;

    // Initialize repository
    await this.repository.initialize();

    try {
      const artifact = await this.loadArtifact(artifactPath);
      // Setup progress emitter
      const progress = new ProgressEmitter(progressCallback);

      // Check for existing run if resume is enabled
      let runId: string;
      let isResuming = false;

      if (resume) {
        const existingRun = await this.repository.getRun(artifact.experiment, artifact.version);

        if (existingRun && existingRun.status !== 'completed') {
          runId = existingRun.id;
          isResuming = true;
          progress.emitProgress(
            0,
            `Resuming experiment ${artifact.experiment} v${artifact.version}`
          );
        } else {
          runId = this.generateRunId();
        }
      } else {
        runId = this.generateRunId();
      }

      // Create run record if new. If not resuming, any existing run for this experiment/version will be deleted first.
      if (!isResuming) {
        const oldRunToDelete = await this.repository.getRun(artifact.experiment, artifact.version);
        if (oldRunToDelete) {
          await this.repository.deleteRun(oldRunToDelete.id);
          progress.emitProgress(
            0,
            `Deleted existing run data for ${artifact.experiment} v${artifact.version} before starting a new run.`
          );
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
      // Create components
      const taskExecutor = new TaskExecutor(this.repository, path.dirname(artifactPath), progress);
      const spaceExecutor = new SpaceExecutor(this.repository, taskExecutor, progress);
      const controlFlow = new ControlFlowManager(this.repository, progress, userInputProvider);
      const dataManager = new DataManager(this.repository);

      const taskMap = this.buildTaskMap(artifact.tasks);

      // Emit initial progress
      progress.emitProgress(0, `Starting experiment ${artifact.experiment} v${artifact.version}`);

      // Execute experiment
      let currentSpace = artifact.control.START;
      const completedSpaces: string[] = [];

      // Calculate total spaces for progress tracking
      const totalSpaces = artifact.spaces.length;

      // If resuming, get the current space
      if (isResuming) {
        const savedSpace = await controlFlow.getState(runId);
        if (savedSpace) {
          currentSpace = savedSpace;
        }
      }

      while (currentSpace !== 'END') {
        progress.emitSpaceStart(currentSpace);

        // Execute space
        const space = artifact.spaces.find(s => s.spaceId === currentSpace);
        if (!space) {
          throw new Error(`Space ${currentSpace} not found in artifact`);
        }

        await spaceExecutor.execute(runId, space, taskMap);

        completedSpaces.push(currentSpace);
        progress.emitSpaceComplete(currentSpace);

        // Emit overall experiment progress after space completion
        const overallProgress = completedSpaces.length / totalSpaces;
        progress.emitProgress(
          overallProgress,
          `Completed space ${currentSpace} (${completedSpaces.length}/${totalSpaces} spaces)`
        );

        // Determine next space
        currentSpace = await controlFlow.getNextSpace(
          runId,
          currentSpace,
          artifact.control.transitions
        );

        // Save control state
        await controlFlow.saveState(runId, currentSpace);
      }

      // Collect final outputs
      const outputs = await dataManager.collectFinalOutputs(runId, artifact.spaces, taskMap);

      // Calculate summary
      let totalTasks = 0;
      for (const space of artifact.spaces) {
        totalTasks += space.parameters.length * space.tasksOrder.length;
      }

      const taskStats = await this.repository.getTaskStats(runId);
      let completedTasks = 0;
      let failedTasks = 0;
      let skippedTasks = 0;

      for (const stat of taskStats) {
        if (stat.status === 'completed') completedTasks = stat.count;
        else if (stat.status === 'failed') failedTasks = stat.count;
        else if (stat.status === 'skipped') skippedTasks = stat.count;
      }

      // Update run status
      await this.repository.updateRunStatus(runId, 'completed', Date.now());

      // Emit final progress
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
    } catch (error) {
      // Update run status on failure
      if (await this.repository.getRunById(this.generateRunId())) {
        await this.repository.updateRunStatus(this.generateRunId(), 'failed', Date.now());
      }

      throw error;
    } finally {
      await this.repository.close();
    }
  }

  async getStatus(experimentName: string, experimentVersion: string): Promise<RunStatus | null> {
    await this.repository.initialize();

    try {
      const run = await this.repository.getRun(experimentName, experimentVersion);

      if (!run) {
        return null;
      }

      // Get stats
      const spaceStats = await this.repository.getSpaceStats(run.id);
      const paramStats = await this.repository.getParamSetStats(run.id);

      const result: RunStatus = {
        runId: run.id,
        experimentName: run.experiment_name,
        experimentVersion: run.experiment_version,
        status: run.status as 'running' | 'completed' | 'failed' | 'terminated',
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
    } finally {
      await this.repository.close();
    }
  }

  async terminate(experimentName: string, experimentVersion: string): Promise<boolean> {
    await this.repository.initialize();

    try {
      const run = await this.repository.getRun(experimentName, experimentVersion);

      if (!run || run.status !== 'running') {
        return false;
      }

      await this.repository.updateRunStatus(run.id, 'terminated', Date.now());
      return true;
    } finally {
      await this.repository.close();
    }
  }

  private async loadArtifact(artifactPath: string): Promise<Artifact> {
    // Validate artifactPath
    if (!artifactPath.endsWith('.json')) {
      throw new Error('Invalid artifact file type. Please provide a .json file.');
    }

    // Load artifact
    let artifactString: string;
    try {
      artifactString = fs.readFileSync(resolve(artifactPath), 'utf-8');
    } catch (error) {
      throw new Error(`Error reading artifact file: ${(error as Error).message}`);
    }

    let parsedArtifact: unknown; // Changed from any to unknown
    try {
      parsedArtifact = JSON.parse(artifactString);
    } catch (error) {
      throw new Error(`Error parsing artifact JSON: ${(error as Error).message}`);
    }

    // Validate artifact structure (basic check)
    if (
      !parsedArtifact ||
      typeof parsedArtifact !== 'object' || // Ensure parsedArtifact is an object
      parsedArtifact === null || // Ensure parsedArtifact is not null
      typeof (parsedArtifact as Artifact).experiment !== 'string' ||
      typeof (parsedArtifact as Artifact).version !== 'string' ||
      !Array.isArray((parsedArtifact as Artifact).tasks) ||
      !Array.isArray((parsedArtifact as Artifact).spaces) ||
      typeof (parsedArtifact as Artifact).control !== 'object' ||
      !(parsedArtifact as Artifact).control || // Ensure control is not null
      typeof (parsedArtifact as Artifact).control.START !== 'string' ||
      !Array.isArray((parsedArtifact as Artifact).control.transitions)
    ) {
      throw new Error('Invalid artifact structure. Missing required fields.');
    }

    return parsedArtifact as Artifact;
  }

  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashArtifact(artifact: Artifact): string {
    const content = JSON.stringify(artifact);
    return createHash('sha256').update(content).digest('hex');
  }

  private buildTaskMap(taskGroups: Task[][]): Map<string, Task> {
    const map = new Map<string, Task>();
    for (const group of taskGroups) {
      for (const task of group) {
        map.set(task.taskId, task);
      }
    }
    return map;
  }
}
