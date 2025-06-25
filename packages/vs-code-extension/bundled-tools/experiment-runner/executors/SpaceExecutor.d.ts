import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Space, Task } from '../types/artifact.types.js';
import { TaskExecutor } from './TaskExecutor.js';
export declare class SpaceExecutor {
    private repository;
    private taskExecutor;
    private progress;
    constructor(repository: DatabaseRepository, taskExecutor: TaskExecutor, progress: ProgressEmitter);
    execute(runId: string, space: Space, taskMap: Map<string, Task>): Promise<void>;
    private hashParams;
}
//# sourceMappingURL=SpaceExecutor.d.ts.map