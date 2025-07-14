/**
 * @fileoverview Progress emitter for experiment execution tracking.
 * Manages progress event emission and callback coordination for real-time
 * experiment monitoring and status updates.
 */

import EventEmitter from 'events';

import { Expression } from '../types/artifact.types.js';
import { ProgressCallback } from '../types/progress.types.js';

/**
 * Emitter responsible for broadcasting progress events during experiment execution.
 * Extends EventEmitter to provide both callback-based and event-based progress tracking.
 * Coordinates between execution components and external progress callbacks.
 */
export class ProgressEmitter extends EventEmitter {
  constructor(private callback?: ProgressCallback) {
    super();
    this.setupCallbackForwarding();
  }

  private setupCallbackForwarding() {
    if (!this.callback) return;

    if (this.callback.onTaskStart) {
      this.on('task:start', ({ taskId, params }) => this.callback!.onTaskStart!(taskId, params));
    }
    if (this.callback.onTaskComplete) {
      this.on('task:complete', ({ taskId, params, outputs }) =>
        this.callback!.onTaskComplete!(taskId, params, outputs)
      );
    }
    if (this.callback.onSpaceStart) {
      this.on('space:start', ({ spaceId }) => this.callback!.onSpaceStart!(spaceId));
    }
    if (this.callback.onSpaceComplete) {
      this.on('space:complete', ({ spaceId }) => this.callback!.onSpaceComplete!(spaceId));
    }
    if (this.callback.onParameterSetStart) {
      this.on('paramset:start', ({ spaceId, index, params }) =>
        this.callback!.onParameterSetStart!(spaceId, index, params)
      );
    }
    if (this.callback.onParameterSetComplete) {
      this.on('paramset:complete', ({ spaceId, index }) =>
        this.callback!.onParameterSetComplete!(spaceId, index)
      );
    }
    if (this.callback.onUserInputRequired) {
      this.on('input:required', ({ prompt }) => this.callback!.onUserInputRequired!(prompt));
    }
    if (this.callback.onError) {
      this.on('error', ({ error, context }) => this.callback!.onError!(error, context));
    }
    if (this.callback.onProgress) {
      this.on('progress', async ({ progress, message }) => {
        const result = this.callback!.onProgress!(progress, message);
        if (result instanceof Promise) {
          await result;
        }
      });
    }
  }

  emitTaskStart(taskId: string, params: Record<string, Expression>): void {
    this.emit('task:start', { taskId, params });
  }

  emitTaskComplete(
    taskId: string,
    params: Record<string, Expression>,
    outputs: Record<string, string>
  ): void {
    this.emit('task:complete', { taskId, params, outputs });
  }

  emitSpaceStart(spaceId: string): void {
    this.emit('space:start', { spaceId });
  }

  emitSpaceComplete(spaceId: string): void {
    this.emit('space:complete', { spaceId });
  }

  emitParameterSetStart(spaceId: string, index: number, params: Record<string, Expression>): void {
    this.emit('paramset:start', { spaceId, index, params });
  }

  emitParameterSetComplete(spaceId: string, index: number): void {
    this.emit('paramset:complete', { spaceId, index });
  }

  emitUserInputRequired(prompt: string): void {
    this.emit('input:required', { prompt });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitError(error: Error, context: any): void {
    this.emit('error', { error, context });
  }

  emitProgress(progress: number, message: string): void {
    this.emit('progress', { progress, message });
  }
}
