/**
 * @fileoverview Space executor for managing parameter space execution.
 * Handles the execution of all parameter sets within a space and coordinates task execution.
 */

import { createHash } from 'crypto';

import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Expression, Space, Task } from '../types/artifact.types.js';

import { TaskExecutor } from './TaskExecutor.js';

/**
 * Executor responsible for managing the execution of parameter spaces.
 * Coordinates the execution of all parameter sets within a space and manages
 * progress tracking, database persistence, and task orchestration.
 */
export class SpaceExecutor {
  /**
   * Creates a new space executor.
   * 
   * @param repository - Database repository for persistence
   * @param taskExecutor - Task executor for individual task execution
   * @param progress - Progress emitter for status updates
   */
  constructor(
    private repository: DatabaseRepository,
    private taskExecutor: TaskExecutor,
    private progress: ProgressEmitter
  ) {}

  /**
   * Executes all parameter sets within a space.
   * Creates space execution records, iterates through all parameter sets,
   * and coordinates task execution for each parameter combination.
   * 
   * @param runId - Unique identifier for the experiment run
   * @param space - Space definition containing parameters and task order
   * @param taskMap - Map of task IDs to task definitions
   * @returns Promise that resolves when space execution is complete
   * @throws Error if parameter set not found or execution fails
   */
  async execute(runId: string, space: Space, taskMap: Map<string, Task>): Promise<void> {
    // Get counts for progress calculation
    const totalParameterSets = space.parameters.length;
    const tasksPerParameterSet = space.tasksOrder.length;
    const totalTasksInSpace = totalParameterSets * tasksPerParameterSet; // For overall progress calculation

    // Check/create space execution record
    const spaceExec = await this.repository.getSpaceExecution(runId, space.spaceId);

    if (!spaceExec) {
      await this.repository.createSpaceExecution({
        run_id: runId,
        space_id: space.spaceId,
        status: 'running', // TODO: Replace with enum
        start_time: Date.now(),
        total_param_sets: totalParameterSets,
        total_tasks: tasksPerParameterSet, // Store tasks per set, not total tasks
      });
    }

    // Execute each parameter set
    for (let i = 0; i < space.parameters.length; i++) {
      const paramSet = space.parameters[i];

      if (!paramSet) {
        throw new Error(`Parameter set ${i} not found`);
      }

      // Check if experiment has been terminated
      const currentRun = await this.repository.getRunById(runId);
      if (currentRun && currentRun.status === 'terminated') {
        this.progress.emitProgress(
          i / space.parameters.length,
          `Experiment terminated during space ${space.spaceId} at parameter set ${i + 1}`
        );
        return; // Stop execution
      }

      // Check if already executed
      const paramExec = await this.repository.getParamSetExecution(runId, space.spaceId, i);

      if (paramExec?.status === 'completed') {
        continue; // Skip already completed parameter sets
      }

      this.progress.emitParameterSetStart(space.spaceId, i, paramSet);

      // Create/update parameter set execution record
      await this.repository.createParamSetExecution({
        run_id: runId,
        space_id: space.spaceId,
        param_set_index: i,
        params_hash: this.hashParams(paramSet),
        status: 'running',
        start_time: Date.now(),
      });

      // Update run progress to current parameter set
      await this.repository.updateRunProgress(runId, space.spaceId, i, undefined);

      try {
        // Execute tasks in order
        let completedTasksInParameterSet = 0;
        for (let taskIndex = 0; taskIndex < space.tasksOrder.length; taskIndex++) {
          const taskId = space.tasksOrder[taskIndex];
          
          if (!taskId) {
            throw new Error(`Task at index ${taskIndex} not found in space ${space.spaceId}`);
          }
          
          // Update current task in run progress
          await this.repository.updateRunProgress(runId, space.spaceId, i, taskId);

          // Check if experiment has been terminated
          const currentRun = await this.repository.getRunById(runId);
          if (currentRun && currentRun.status === 'terminated') {
            this.progress.emitProgress(
              (i * tasksPerParameterSet + completedTasksInParameterSet) / totalTasksInSpace,
              `Experiment terminated during task ${taskId} in parameter set ${i + 1} of space ${space.spaceId}`
            );
            return; // Stop execution
          }

          const task = taskMap.get(taskId);
          if (!task) {
            throw new Error(`Task ${taskId} not found`);
          }

          await this.taskExecutor.execute(runId, space.spaceId, i, task, paramSet);
          completedTasksInParameterSet++;

          // Emit progress after each task completion
          const completedTasksInSpace = i * tasksPerParameterSet + completedTasksInParameterSet;
          const progressPercentage = completedTasksInSpace / totalTasksInSpace;
          this.progress.emitProgress(
            progressPercentage,
            `Completed task ${taskId} (${taskIndex + 1}/${tasksPerParameterSet}) in parameter set ${i + 1}/${totalParameterSets} of space ${space.spaceId}`
          );
        }

        // Mark parameter set as completed
        await this.repository.updateParamSetExecution(
          runId,
          space.spaceId,
          i,
          'completed',
          Date.now()
        );

        this.progress.emitParameterSetComplete(space.spaceId, i);

        // Emit progress after parameter set completion
        const completedParameterSets = i + 1;
        const overallProgress = completedParameterSets / totalParameterSets;
        this.progress.emitProgress(
          overallProgress,
          `Completed parameter set ${completedParameterSets}/${totalParameterSets} in space ${space.spaceId}`
        );
      } catch (error) {
        // Mark parameter set as failed and stop execution
        await this.repository.updateParamSetExecution(
          runId,
          space.spaceId,
          i,
          'failed',
          Date.now()
        );
        
        // Mark space as failed and stop execution since subsequent tasks may depend on failed output
        await this.repository.updateSpaceExecution(runId, space.spaceId, 'failed', Date.now());
        
        this.progress.emitProgress(
          (i + 1) / totalParameterSets,
          `Parameter set ${i + 1}/${totalParameterSets} failed in space ${space.spaceId}: ${(error as Error).message}`
        );
        
        // Re-throw error to stop execution since subsequent tasks may depend on this one
        throw error;
      }
    }

    // Mark space as completed
    await this.repository.updateSpaceExecution(runId, space.spaceId, 'completed', Date.now());
  }

  private hashParams(params: Record<string, Expression>): string {
    const content = JSON.stringify(params, Object.keys(params).sort());
    return createHash('sha256').update(content).digest('hex');
  }
}
