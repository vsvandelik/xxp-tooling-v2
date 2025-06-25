import EventEmitter from 'events';
import { ProgressCallback } from '../types/progress.types.js';
import { Expression } from '../types/artifact.types.js';
export declare class ProgressEmitter extends EventEmitter {
    private callback?;
    constructor(callback?: ProgressCallback | undefined);
    private setupCallbackForwarding;
    emitTaskStart(taskId: string, params: Record<string, Expression>): void;
    emitTaskComplete(taskId: string, params: Record<string, Expression>, outputs: Record<string, string>): void;
    emitSpaceStart(spaceId: string): void;
    emitSpaceComplete(spaceId: string): void;
    emitParameterSetStart(spaceId: string, index: number, params: Record<string, Expression>): void;
    emitParameterSetComplete(spaceId: string, index: number): void;
    emitUserInputRequired(prompt: string): void;
    emitError(error: Error, context: any): void;
    emitProgress(progress: number, message: string): void;
}
//# sourceMappingURL=ProgressEmitter.d.ts.map