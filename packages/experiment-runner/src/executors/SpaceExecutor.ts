import { createHash } from 'crypto';
import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Expression, Space, Task } from '../types/artifact.types.js';
import { TaskExecutor } from './TaskExecutor.js';

export class SpaceExecutor {
  constructor(
    private repository: DatabaseRepository,
    private taskExecutor: TaskExecutor,
    private progress: ProgressEmitter
  ) {}

  async execute(runId: string, space: Space, taskMap: Map<string, Task>): Promise<void> {
    // Check/create space execution record
    const spaceExec = await this.repository.getSpaceExecution(runId, space.spaceId);

    if (!spaceExec) {
      await this.repository.createSpaceExecution({
        run_id: runId,
        space_id: space.spaceId,
        status: 'running', // TODO: Replace with enum
        start_time: Date.now(),
      });
    }

    // Get total tasks for progress calculation
    const totalParameterSets = space.parameters.length;
    const tasksPerParameterSet = space.tasksOrder.length;
    const totalTasksInSpace = totalParameterSets * tasksPerParameterSet;

    // Execute each parameter set
    for (let i = 0; i < space.parameters.length; i++) {
      const paramSet = space.parameters[i];

      if (!paramSet) {
        throw new Error(`Parameter set ${i} not found`);
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

      try {
        // Execute tasks in order
        let completedTasksInParameterSet = 0;
        for (const taskId of space.tasksOrder) {
          const task = taskMap.get(taskId);
          if (!task) {
            throw new Error(`Task ${taskId} not found`);
          }

          await this.taskExecutor.execute(runId, space.spaceId, i, task, paramSet);
          completedTasksInParameterSet++;

          // Emit progress after each task completion
          const completedTasksInSpace = (i * tasksPerParameterSet) + completedTasksInParameterSet;
          const progressPercentage = completedTasksInSpace / totalTasksInSpace;
          this.progress.emitProgress(
            progressPercentage,
            `Completed task ${taskId} in parameter set ${i + 1}/${totalParameterSets} of space ${space.spaceId}`
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
        // Mark parameter set as failed
        await this.repository.updateParamSetExecution(
          runId,
          space.spaceId,
          i,
          'failed',
          Date.now()
        );
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
