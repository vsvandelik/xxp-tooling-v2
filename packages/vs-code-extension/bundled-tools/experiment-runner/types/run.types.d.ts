export interface RunResult {
    runId: string;
    status: 'completed' | 'failed' | 'terminated';
    error?: Error;
    completedSpaces: string[];
    outputs: Record<string, Record<string, string>>;
    summary: {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        skippedTasks: number;
    };
}
export interface RunStatus {
    runId: string;
    experimentName: string;
    experimentVersion: string;
    status: 'running' | 'completed' | 'failed' | 'terminated';
    currentSpace?: string;
    currentParameterSet?: number;
    progress: {
        completedSpaces: number;
        totalSpaces: number;
        completedParameterSets: number;
        totalParameterSets: number;
    };
}
//# sourceMappingURL=run.types.d.ts.map