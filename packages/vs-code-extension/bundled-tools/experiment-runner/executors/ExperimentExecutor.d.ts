import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { RunResult, RunStatus } from '../types/run.types.js';
import { ExperimentRunner, ExperimentRunnerOptions } from '../types/runner.types.js';
export declare class ExperimentExecutor implements ExperimentRunner {
    private repository;
    constructor(repositoryOrPath?: DatabaseRepository | string);
    getRepository(): DatabaseRepository;
    run(artifactPath: string, options?: ExperimentRunnerOptions): Promise<RunResult>;
    getStatus(experimentName: string, experimentVersion: string): Promise<RunStatus | null>;
    terminate(experimentName: string, experimentVersion: string): Promise<boolean>;
    private loadArtifact;
    private generateRunId;
    private hashArtifact;
    private buildTaskMap;
}
//# sourceMappingURL=ExperimentExecutor.d.ts.map