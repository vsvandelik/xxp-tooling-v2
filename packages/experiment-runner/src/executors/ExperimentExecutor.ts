/**
 * Main experiment executor implementation.
 * Orchestrates the execution of experiment artifacts with support for resuming,
 * progress tracking, and state management.
 */

import { createHash } from 'crypto';
import fs from 'fs';
import path, { resolve } from 'path';

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

/**
 * Main implementation of the experiment execution engine.
 * Manages the complete lifecycle of experiment execution including persistence,
 * progress tracking, and state recovery.
 */
export class ExperimentExecutor implements ExperimentRunner {
  private repository: DatabaseRepository;

  /**
   * Creates a new experiment executor.
   * 
   * @param repositoryOrPath - Database repository instance or path to SQLite database file
   */
  constructor(repositoryOrPath?: DatabaseRepository | string) {
    if (typeof repositoryOrPath === 'string' || repositoryOrPath === undefined) {
      this.repository = new SqliteRepository(repositoryOrPath || './experiment_runs.db');
    } else {
      this.repository = repositoryOrPath;
    }
  }

  /**
   * Gets the underlying database repository instance.
   * 
   * @returns The database repository being used for persistence
   */
  getRepository(): DatabaseRepository {
    return this.repository;
  }

  /**
   * Executes an experiment from an artifact file.
   * Supports resuming interrupted experiments and provides comprehensive progress tracking.
   * 
   * @param artifactPath - Path to the experiment artifact JSON file
   * @param options - Execution options including callbacks and resume settings
   * @returns Promise resolving to the experiment execution result
   * @throws Error if artifact is invalid or execution fails
   */
  async run(artifactPath: string, options: ExperimentRunnerOptions = {}): Promise<RunResult> {
    const {
      progressCallback = {},
      userInputProvider = new ConsoleInputProvider(),
      resume = false,
    } = options;

    // Initialize repository
    await this.repository.initialize();

    let runId: string = '';

    try {
      const artifact = await this.loadArtifact(artifactPath);
      // Setup progress emitter
      const progress = new ProgressEmitter(progressCallback);

      // Check for existing run if resume is enabled
      let isResuming = false;

      if (resume) {
        const existingRun = await this.repository.getRun(artifact.experiment, artifact.version);

        if (existingRun && existingRun.status !== 'completed') {
          runId = existingRun.id;
          isResuming = true;

          // If resuming a terminated experiment, set status back to running
          if (existingRun.status === 'terminated') {
            await this.repository.updateRunStatus(runId, 'running', Date.now());
          }

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
        // Calculate totals from artifact
        const totalSpaces = artifact.spaces.length;

        await this.repository.createRun({
          id: runId,
          experiment_name: artifact.experiment,
          experiment_version: artifact.version,
          artifact_path: artifactPath,
          artifact_hash: this.hashArtifact(artifact),
          start_time: Date.now(),
          status: 'running',
          total_spaces: totalSpaces,
        });
      }
      // Create components
      const taskExecutor = new TaskExecutor(this.repository, path.dirname(artifactPath), progress);

      taskExecutor.setArtifact(artifact);

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
        // Check if experiment has been terminated
        const currentRun = await this.repository.getRunById(runId);
        if (currentRun && currentRun.status === 'terminated') {
          progress.emitProgress(
            completedSpaces.length / totalSpaces,
            `Experiment terminated at space ${currentSpace}`
          );

          const summary = await this.calculateTaskSummary(runId, artifact);

          return {
            runId,
            status: 'terminated',
            completedSpaces,
            outputs: {}, // Empty outputs for terminated experiment
            summary,
          };
        }

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
      const summary = await this.calculateTaskSummary(runId, artifact);

      // Update run status
      await this.repository.updateRunStatus(runId, 'completed', Date.now());

      // Emit final progress
      progress.emitProgress(
        1.0,
        `Experiment completed successfully: ${summary.completedTasks} tasks completed`
      );

      return {
        runId,
        status: 'completed',
        completedSpaces,
        outputs,
        summary,
      };
    } catch (error) {
      // Update run status on failure
      try {
        if (runId) {
          await this.repository.updateRunStatus(runId, 'failed', Date.now());
        }
      } catch (dbError) {
        // Log database error but don't let it override the original error
        // Using a more appropriate logging mechanism than console.error
      }

      throw error;
    } finally {
      // Only close after experiment completion/failure since this is a long-running operation
      // Note: If using a server-managed repository, this might not actually close the connection
      await this.repository.close();
    }
  }

  /**
   * Gets the current status and progress of an experiment.
   * 
   * @param experimentName - Name of the experiment
   * @param experimentVersion - Version of the experiment
   * @returns Promise resolving to current status or null if experiment not found
   */
  async getStatus(experimentName: string, experimentVersion: string): Promise<RunStatus | null> {
    const run = await this.repository.getRun(experimentName, experimentVersion);

    if (!run) {
      return null;
    }

    // Get overall space stats
    const spaceStats = await this.repository.getSpaceStats(run.id);

    let result: RunStatus;

    if (run.current_space) {
      // Get space-specific progress for the current space
      const currentSpaceExecution = await this.repository.getSpaceExecutionWithTotals(run.id, run.current_space);
      const spaceParamStats = await this.repository.getParamSetStatsForSpace(run.id, run.current_space);
      const currentTaskProgress = await this.repository.getCurrentTaskProgress(run.id);
      
      // For hierarchical progress, show completed tasks within current parameter set
      let completedTasks = 0;
      let totalTasks = currentSpaceExecution?.total_tasks || 0;
      
      if (currentTaskProgress) {
        completedTasks = currentTaskProgress.taskIndex - 1; // taskIndex is 1-based, so subtract 1 for completed count
        totalTasks = currentTaskProgress.totalTasks;
      }

      result = {
        runId: run.id,
        experimentName: run.experiment_name,
        experimentVersion: run.experiment_version,
        status: run.status as 'running' | 'completed' | 'failed' | 'terminated',
        progress: {
          completedSpaces: spaceStats.completed,
          totalSpaces: run.total_spaces,
          completedParameterSets: spaceParamStats.completed,
          totalParameterSets: currentSpaceExecution?.total_param_sets || 0,
          completedTasks,
          totalTasks,
        },
        currentSpace: run.current_space,
      };
    } else {
      // Overall progress (no current space - experiment completed/not started)
      const paramStats = await this.repository.getParamSetStats(run.id);
      const taskStats = await this.repository.getTaskStats(run.id);
      
      // Calculate completed task count
      let completedTasks = 0;
      for (const stat of taskStats) {
        if (stat.status === 'completed') completedTasks = stat.count;
      }

      result = {
        runId: run.id,
        experimentName: run.experiment_name,
        experimentVersion: run.experiment_version,
        status: run.status as 'running' | 'completed' | 'failed' | 'terminated',
        progress: {
          completedSpaces: spaceStats.completed,
          totalSpaces: run.total_spaces,
          completedParameterSets: paramStats.completed,
          totalParameterSets: paramStats.total,
          completedTasks,
          totalTasks: taskStats.reduce((sum, stat) => sum + stat.count, 0),
        },
      };
    }

    if (run.current_param_set !== undefined) {
      result.currentParameterSet = run.current_param_set;
    }

    return result;
  }

  /**
   * Terminates a running experiment gracefully.
   * 
   * @param experimentName - Name of the experiment to terminate
   * @param experimentVersion - Version of the experiment to terminate
   * @returns Promise resolving to true if terminated, false if not running
   */
  async terminate(experimentName: string, experimentVersion: string): Promise<boolean> {
    const run = await this.repository.getRun(experimentName, experimentVersion);

    if (!run || run.status !== 'running') {
      return false;
    }

    await this.repository.updateRunStatus(run.id, 'terminated', Date.now());
    return true;
  }

  /**
   * Loads and validates an experiment artifact from a JSON file.
   * 
   * @param artifactPath - Path to the artifact JSON file
   * @returns Promise resolving to the parsed and validated artifact
   * @throws Error if file cannot be read, parsed, or is invalid
   */
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

    let parsedArtifact: unknown;
    try {
      parsedArtifact = JSON.parse(artifactString);
    } catch (error) {
      throw new Error(`Error parsing artifact JSON: ${(error as Error).message}`);
    }

    // Validate artifact structure (basic check)
    if (
      !parsedArtifact ||
      typeof parsedArtifact !== 'object' ||
      parsedArtifact === null ||
      typeof (parsedArtifact as Artifact).experiment !== 'string' ||
      typeof (parsedArtifact as Artifact).version !== 'string' ||
      !Array.isArray((parsedArtifact as Artifact).tasks) ||
      !Array.isArray((parsedArtifact as Artifact).spaces) ||
      typeof (parsedArtifact as Artifact).control !== 'object' ||
      !(parsedArtifact as Artifact).control ||
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

  private async calculateTaskSummary(
    runId: string,
    artifact: Artifact
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    skippedTasks: number;
  }> {
    // Calculate total tasks
    let totalTasks = 0;
    for (const space of artifact.spaces) {
      totalTasks += space.parameters.length * space.tasksOrder.length;
    }

    // Get task statistics from database
    const taskStats = await this.repository.getTaskStats(runId);
    let completedTasks = 0;
    let failedTasks = 0;
    let skippedTasks = 0;

    for (const stat of taskStats) {
      if (stat.status === 'completed') completedTasks = stat.count;
      else if (stat.status === 'failed') failedTasks = stat.count;
      else if (stat.status === 'skipped') skippedTasks = stat.count;
    }

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      skippedTasks,
    };
  }
}
