export class DataManager {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async collectFinalOutputs(runId, spaces, taskMap) {
        const outputs = {};
        for (const space of spaces) {
            outputs[space.spaceId] = {};
            const lastTaskId = space.tasksOrder[space.tasksOrder.length - 1];
            if (!lastTaskId)
                continue;
            const lastTask = taskMap.get(lastTaskId);
            if (!lastTask)
                continue;
            for (let i = 0; i < space.parameters.length; i++) {
                const paramExec = await this.repository.getParamSetExecution(runId, space.spaceId, i);
                if (paramExec?.status !== 'completed')
                    continue;
                for (const outputName of lastTask.outputData) {
                    const path = await this.repository.getDataMapping(runId, space.spaceId, i, outputName);
                    if (path) {
                        const key = `${outputName}_param${i}`;
                        outputs[space.spaceId][key] = path;
                    }
                }
            }
        }
        return outputs;
    }
}
//# sourceMappingURL=DataManager.js.map