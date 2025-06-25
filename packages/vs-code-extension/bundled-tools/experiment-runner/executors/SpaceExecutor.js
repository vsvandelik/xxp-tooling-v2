import { createHash } from 'crypto';
export class SpaceExecutor {
    repository;
    taskExecutor;
    progress;
    constructor(repository, taskExecutor, progress) {
        this.repository = repository;
        this.taskExecutor = taskExecutor;
        this.progress = progress;
    }
    async execute(runId, space, taskMap) {
        const spaceExec = await this.repository.getSpaceExecution(runId, space.spaceId);
        if (!spaceExec) {
            await this.repository.createSpaceExecution({
                run_id: runId,
                space_id: space.spaceId,
                status: 'running',
                start_time: Date.now(),
            });
        }
        const totalParameterSets = space.parameters.length;
        const tasksPerParameterSet = space.tasksOrder.length;
        const totalTasksInSpace = totalParameterSets * tasksPerParameterSet;
        for (let i = 0; i < space.parameters.length; i++) {
            const paramSet = space.parameters[i];
            if (!paramSet) {
                throw new Error(`Parameter set ${i} not found`);
            }
            const paramExec = await this.repository.getParamSetExecution(runId, space.spaceId, i);
            if (paramExec?.status === 'completed') {
                continue;
            }
            this.progress.emitParameterSetStart(space.spaceId, i, paramSet);
            await this.repository.createParamSetExecution({
                run_id: runId,
                space_id: space.spaceId,
                param_set_index: i,
                params_hash: this.hashParams(paramSet),
                status: 'running',
                start_time: Date.now(),
            });
            try {
                let completedTasksInParameterSet = 0;
                for (const taskId of space.tasksOrder) {
                    const task = taskMap.get(taskId);
                    if (!task) {
                        throw new Error(`Task ${taskId} not found`);
                    }
                    await this.taskExecutor.execute(runId, space.spaceId, i, task, paramSet);
                    completedTasksInParameterSet++;
                    const completedTasksInSpace = i * tasksPerParameterSet + completedTasksInParameterSet;
                    const progressPercentage = completedTasksInSpace / totalTasksInSpace;
                    this.progress.emitProgress(progressPercentage, `Completed task ${taskId} in parameter set ${i + 1}/${totalParameterSets} of space ${space.spaceId}`);
                }
                await this.repository.updateParamSetExecution(runId, space.spaceId, i, 'completed', Date.now());
                this.progress.emitParameterSetComplete(space.spaceId, i);
                const completedParameterSets = i + 1;
                const overallProgress = completedParameterSets / totalParameterSets;
                this.progress.emitProgress(overallProgress, `Completed parameter set ${completedParameterSets}/${totalParameterSets} in space ${space.spaceId}`);
            }
            catch (error) {
                await this.repository.updateParamSetExecution(runId, space.spaceId, i, 'failed', Date.now());
                throw error;
            }
        }
        await this.repository.updateSpaceExecution(runId, space.spaceId, 'completed', Date.now());
    }
    hashParams(params) {
        const content = JSON.stringify(params, Object.keys(params).sort());
        return createHash('sha256').update(content).digest('hex');
    }
}
//# sourceMappingURL=SpaceExecutor.js.map