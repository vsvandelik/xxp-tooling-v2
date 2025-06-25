import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { Space, Task } from '../types/artifact.types.js';
export declare class DataManager {
    private repository;
    constructor(repository: DatabaseRepository);
    collectFinalOutputs(runId: string, spaces: Space[], taskMap: Map<string, Task>): Promise<Record<string, Record<string, string>>>;
}
//# sourceMappingURL=DataManager.d.ts.map