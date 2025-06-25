export class ControlFlowManager {
    repository;
    progress;
    userInputProvider;
    constructor(repository, progress, userInputProvider) {
        this.repository = repository;
        this.progress = progress;
        this.userInputProvider = userInputProvider;
    }
    async getNextSpace(runId, currentSpace, transitions) {
        const spaceTransitions = transitions.filter(t => t.from === currentSpace);
        if (spaceTransitions.length === 0) {
            return 'END';
        }
        if (spaceTransitions.length === 1 && !spaceTransitions[0].condition) {
            return spaceTransitions[0].to;
        }
        for (const transition of spaceTransitions) {
            if (!transition.condition) {
                return transition.to;
            }
            const conditionFunc = new Function('input', `return ${transition.condition}`);
            this.progress.emitUserInputRequired(transition.condition);
            const userInput = await this.userInputProvider.getInput('Enter value for condition evaluation');
            const inputFunc = () => userInput;
            if (conditionFunc(inputFunc)) {
                return transition.to;
            }
        }
        throw new Error('No transition condition evaluated to true');
    }
    async saveState(runId, currentSpace) {
        await this.repository.saveControlState(runId, currentSpace);
    }
    async getState(runId) {
        return await this.repository.getControlState(runId);
    }
}
//# sourceMappingURL=ControlFlowManager.js.map