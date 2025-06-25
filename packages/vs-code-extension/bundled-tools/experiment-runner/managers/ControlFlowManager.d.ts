import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Transition } from '../types/artifact.types.js';
import { UserInputProvider } from '../userInput/UserInputProvider.js';
export declare class ControlFlowManager {
    private repository;
    private progress;
    private userInputProvider;
    constructor(repository: DatabaseRepository, progress: ProgressEmitter, userInputProvider: UserInputProvider);
    getNextSpace(runId: string, currentSpace: string, transitions: Transition[]): Promise<string>;
    saveState(runId: string, currentSpace: string): Promise<void>;
    getState(runId: string): Promise<string | null>;
}
//# sourceMappingURL=ControlFlowManager.d.ts.map