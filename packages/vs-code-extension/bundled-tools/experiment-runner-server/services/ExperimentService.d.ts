import { RunResult, RunStatus } from '@extremexp/experiment-runner';
import { ActiveExperiment, ExperimentProgress, TaskHistoryItem, UserInputRequest, UserInputResponse, ValidationResult, GenerateArtifactResponse } from '../types/server.types.js';
interface ExperimentServiceConfig {
    databasePath: string;
    maxConcurrent: number;
}
export declare class ExperimentService {
    private executor;
    private activeExperiments;
    private pendingInputs;
    private config;
    constructor(config: ExperimentServiceConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    startExperiment(artifactPath: string, options?: {
        experimentId?: string;
        resume?: boolean;
        onProgress?: (progress: ExperimentProgress) => void;
        onInputRequired?: (request: UserInputRequest) => void;
        onComplete?: (result: RunResult) => void;
        onError?: (error: Error) => void;
    }): Promise<string>;
    private runExperiment;
    terminateExperiment(experimentId: string): Promise<boolean>;
    getExperimentStatus(experimentId: string): Promise<RunStatus | null>;
    getExperimentHistory(experimentId: string, options?: {
        limit?: number;
        offset?: number;
        spaceId?: string;
        taskId?: string;
    }): Promise<TaskHistoryItem[]>;
    submitUserInput(response: UserInputResponse): boolean;
    getActiveExperiments(): ActiveExperiment[];
    private updateProgress;
    private generateExperimentId;
    private generateRequestId;
    private loadArtifact;
    validateArtifact(artifactPath: string): Promise<ValidationResult>;
    generateArtifact(espacePath: string, outputPath?: string): Promise<GenerateArtifactResponse>;
}
export {};
//# sourceMappingURL=ExperimentService.d.ts.map