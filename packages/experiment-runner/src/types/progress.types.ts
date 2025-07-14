/**
 * @fileoverview Type definitions for experiment progress tracking and callbacks.
 * Defines interfaces for monitoring experiment execution progress and receiving updates.
 */

import { Expression } from './artifact.types.js';

/**
 * Event definitions for progress tracking with typed payloads.
 * Maps event names to their corresponding data structures.
 */
export interface ProgressEvents {
  /** Emitted when a task starts execution */
  'task:start': { taskId: string; params: Record<string, Expression> };
  /** Emitted when a task completes successfully */
  'task:complete': {
    taskId: string;
    params: Record<string, Expression>;
    outputs: Record<string, string>;
  };
  /** Emitted when a parameter space starts execution */
  'space:start': { spaceId: string };
  /** Emitted when a parameter space completes execution */
  'space:complete': { spaceId: string };
  /** Emitted when a parameter set starts execution within a space */
  'paramset:start': { spaceId: string; index: number; params: Record<string, Expression> };
  /** Emitted when a parameter set completes execution */
  'paramset:complete': { spaceId: string; index: number };
  /** Emitted when user input is required */
  'input:required': { prompt: string };
  /** Emitted when an error occurs during execution */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: { error: Error; context: any };
  /** Emitted to report overall experiment progress */
  progress: { progress: number; message: string };
}

/**
 * Callback interface for receiving experiment execution progress updates.
 * All callbacks are optional and can be implemented as needed.
 */
export interface ProgressCallback {
  /** Called when a task starts execution */
  onTaskStart?: (taskId: string, params: Record<string, Expression>) => void;
  /** Called when a task completes successfully */
  onTaskComplete?: (
    taskId: string,
    params: Record<string, Expression>,
    outputs: Record<string, string>
  ) => void;
  /** Called when a parameter space starts execution */
  onSpaceStart?: (spaceId: string) => void;
  /** Called when a parameter space completes execution */
  onSpaceComplete?: (spaceId: string) => void;
  /** Called when a parameter set starts execution within a space */
  onParameterSetStart?: (
    spaceId: string,
    index: number,
    params: Record<string, Expression>
  ) => void;
  /** Called when a parameter set completes execution */
  onParameterSetComplete?: (spaceId: string, index: number) => void;
  /** Called when user input is required during experiment execution */
  onUserInputRequired?: (prompt: string) => void;
  /** Called when an error occurs during experiment execution */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: Error, context: any) => void;
  /** Called to report overall experiment progress (0-1 scale) */
  onProgress?: (progress: number, message: string) => void | Promise<void>;
}
