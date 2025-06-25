import EventEmitter from 'events';
export class ProgressEmitter extends EventEmitter {
    callback;
    constructor(callback) {
        super();
        this.callback = callback;
        this.setupCallbackForwarding();
    }
    setupCallbackForwarding() {
        if (!this.callback)
            return;
        if (this.callback.onTaskStart) {
            this.on('task:start', ({ taskId, params }) => this.callback.onTaskStart(taskId, params));
        }
        if (this.callback.onTaskComplete) {
            this.on('task:complete', ({ taskId, params, outputs }) => this.callback.onTaskComplete(taskId, params, outputs));
        }
        if (this.callback.onSpaceStart) {
            this.on('space:start', ({ spaceId }) => this.callback.onSpaceStart(spaceId));
        }
        if (this.callback.onSpaceComplete) {
            this.on('space:complete', ({ spaceId }) => this.callback.onSpaceComplete(spaceId));
        }
        if (this.callback.onParameterSetStart) {
            this.on('paramset:start', ({ spaceId, index, params }) => this.callback.onParameterSetStart(spaceId, index, params));
        }
        if (this.callback.onParameterSetComplete) {
            this.on('paramset:complete', ({ spaceId, index }) => this.callback.onParameterSetComplete(spaceId, index));
        }
        if (this.callback.onUserInputRequired) {
            this.on('input:required', ({ prompt }) => this.callback.onUserInputRequired(prompt));
        }
        if (this.callback.onError) {
            this.on('error', ({ error, context }) => this.callback.onError(error, context));
        }
        if (this.callback.onProgress) {
            this.on('progress', ({ progress, message }) => this.callback.onProgress(progress, message));
        }
    }
    emitTaskStart(taskId, params) {
        this.emit('task:start', { taskId, params });
    }
    emitTaskComplete(taskId, params, outputs) {
        this.emit('task:complete', { taskId, params, outputs });
    }
    emitSpaceStart(spaceId) {
        this.emit('space:start', { spaceId });
    }
    emitSpaceComplete(spaceId) {
        this.emit('space:complete', { spaceId });
    }
    emitParameterSetStart(spaceId, index, params) {
        this.emit('paramset:start', { spaceId, index, params });
    }
    emitParameterSetComplete(spaceId, index) {
        this.emit('paramset:complete', { spaceId, index });
    }
    emitUserInputRequired(prompt) {
        this.emit('input:required', { prompt });
    }
    emitError(error, context) {
        this.emit('error', { error, context });
    }
    emitProgress(progress, message) {
        this.emit('progress', { progress, message });
    }
}
//# sourceMappingURL=ProgressEmitter.js.map