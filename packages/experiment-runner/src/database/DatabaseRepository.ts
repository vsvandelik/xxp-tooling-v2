import {
  RunRecord,
  SpaceExecutionRecord,
  ParamSetExecutionRecord,
  TaskExecutionRecord,
  DataMappingRecord,
} from '../types/database.types.js';

export interface DatabaseRepository {
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Run operations
  createRun(run: Omit<RunRecord, 'end_time'>): Promise<void>;
  updateRunStatus(runId: string, status: string, endTime?: number): Promise<void>;
  getRun(experimentName: string, experimentVersion: string): Promise<RunRecord | null>;
  getRunById(runId: string): Promise<RunRecord | null>;
  deleteRun(runId: string): Promise<void>;

  // Space operations
  createSpaceExecution(record: SpaceExecutionRecord): Promise<void>;
  updateSpaceExecution(
    runId: string,
    spaceId: string,
    status: string,
    endTime?: number
  ): Promise<void>;
  getSpaceExecution(runId: string, spaceId: string): Promise<SpaceExecutionRecord | null>;

  // Parameter set operations
  createParamSetExecution(record: ParamSetExecutionRecord): Promise<void>;
  updateParamSetExecution(
    runId: string,
    spaceId: string,
    index: number,
    status: string,
    endTime?: number
  ): Promise<void>;
  getParamSetExecution(
    runId: string,
    spaceId: string,
    index: number
  ): Promise<ParamSetExecutionRecord | null>;

  // Task operations
  createTaskExecution(record: TaskExecutionRecord): Promise<void>;
  updateTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string,
    updates: Partial<TaskExecutionRecord>
  ): Promise<void>;
  getTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string
  ): Promise<TaskExecutionRecord | null>;
  getTaskStats(runId: string): Promise<{ status: string; count: number }[]>;
  getTaskExecutionHistory(
    runId: string,
    options?: {
      limit?: number;
      offset?: number;
      spaceId?: string;
      taskId?: string;
    }
  ): Promise<TaskExecutionRecord[]>;

  // Data mapping operations
  createDataMapping(record: DataMappingRecord): Promise<void>;
  getDataMapping(
    runId: string,
    spaceId: string,
    paramIndex: number,
    dataName: string
  ): Promise<string | null>;

  // Control state operations
  saveControlState(runId: string, currentSpace: string): Promise<void>;
  getControlState(runId: string): Promise<string | null>;

  // Progress operations
  getSpaceStats(runId: string): Promise<{ total: number; completed: number }>;
  getParamSetStats(runId: string): Promise<{ total: number; completed: number }>;
}
