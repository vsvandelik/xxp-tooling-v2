import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Task, ParameterSet, Artifact } from '../types/artifact.types.js';
export declare class TaskExecutor {
    private repository;
    private artifactFolder;
    private progress;
    private artifact;
    constructor(repository: DatabaseRepository, artifactFolder: string, progress: ProgressEmitter);
    setArtifact(artifact: Artifact): void;
    execute(runId: string, spaceId: string, paramSetIndex: number, task: Task, paramSet: ParameterSet): Promise<Record<string, string>>;
    private resolveParameters;
    private resolveInputData;
    private getInitialInputValue;
    private runPythonScript;
}
//# sourceMappingURL=TaskExecutor.d.ts.map