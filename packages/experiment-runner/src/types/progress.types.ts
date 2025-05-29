import { Expression } from './artifact.types.js';

export interface ProgressEvents {
  'task:start': { taskId: string; params: Record<string, Expression> };
  'task:complete': {
    taskId: string;
    params: Record<string, Expression>;
    outputs: Record<string, string>;
  };
  'space:start': { spaceId: string };
  'space:complete': { spaceId: string };
  'paramset:start': { spaceId: string; index: number; params: Record<string, Expression> };
  'paramset:complete': { spaceId: string; index: number };
  'input:required': { prompt: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: { error: Error; context: any };
  progress: { progress: number; message: string };
}

export interface ProgressCallback {
  onTaskStart?: (taskId: string, params: Record<string, Expression>) => void;
  onTaskComplete?: (
    taskId: string,
    params: Record<string, Expression>,
    outputs: Record<string, string>
  ) => void;
  onSpaceStart?: (spaceId: string) => void;
  onSpaceComplete?: (spaceId: string) => void;
  onParameterSetStart?: (
    spaceId: string,
    index: number,
    params: Record<string, Expression>
  ) => void;
  onParameterSetComplete?: (spaceId: string, index: number) => void;
  onUserInputRequired?: (prompt: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: Error, context: any) => void;
  onProgress?: (progress: number, message: string) => void;
}
