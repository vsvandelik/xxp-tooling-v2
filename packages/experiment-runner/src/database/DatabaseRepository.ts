/**
 * Database repository interface for experiment data persistence.
 * Defines the contract for storing and retrieving experiment execution state,
 * progress tracking, and result data.
 */

import {
  RunRecord,
  SpaceExecutionRecord,
  ParamSetExecutionRecord,
  TaskExecutionRecord,
  DataMappingRecord,
} from '../types/database.types.js';

/**
 * Abstract interface for experiment data persistence.
 * Provides methods for storing and retrieving experiment state, progress,
 * and execution history. Implementations should handle database connections,
 * transactions, and error recovery.
 */
export interface DatabaseRepository {
  /**
   * Initializes the database connection and creates necessary tables.
   *
   * @returns Promise that resolves when database is ready for use
   * @throws Error if database initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Closes the database connection gracefully.
   *
   * @returns Promise that resolves when connection is closed
   */
  close(): Promise<void>;

  /**
   * Forces immediate closure of database connection.
   * Used for emergency cleanup or when graceful shutdown fails.
   *
   * @returns Promise that resolves when connection is forcibly closed
   */
  forceClose(): Promise<void>;

  // Run operations
  /**
   * Creates a new experiment run record.
   *
   * @param run - Run data without end_time (set when run completes)
   * @returns Promise that resolves when run is created
   * @throws Error if run creation fails or run already exists
   */
  createRun(run: Omit<RunRecord, 'end_time'>): Promise<void>;

  /**
   * Updates the status of an existing run.
   *
   * @param runId - Unique identifier for the run
   * @param status - New status ('running', 'completed', 'failed', 'terminated')
   * @param endTime - Optional timestamp when run ended
   * @returns Promise that resolves when status is updated
   * @throws Error if run not found or update fails
   */
  updateRunStatus(runId: string, status: string, endTime?: number): Promise<void>;

  /**
   * Retrieves a run by experiment name and version.
   *
   * @param experimentName - Name of the experiment
   * @param experimentVersion - Version of the experiment
   * @returns Promise resolving to run record or null if not found
   */
  getRun(experimentName: string, experimentVersion: string): Promise<RunRecord | null>;

  /**
   * Retrieves a run by its unique ID.
   *
   * @param runId - Unique identifier for the run
   * @returns Promise resolving to run record or null if not found
   */
  getRunById(runId: string): Promise<RunRecord | null>;

  /**
   * Deletes a run and all associated data.
   *
   * @param runId - Unique identifier for the run to delete
   * @returns Promise that resolves when run is deleted
   * @throws Error if run not found or deletion fails
   */
  deleteRun(runId: string): Promise<void>;

  // Space operations
  /**
   * Creates a new space execution record.
   *
   * @param record - Space execution data
   * @returns Promise that resolves when space execution is created
   * @throws Error if creation fails
   */
  createSpaceExecution(record: SpaceExecutionRecord): Promise<void>;

  /**
   * Updates the status of a space execution.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param status - New status
   * @param endTime - Optional completion timestamp
   * @returns Promise that resolves when status is updated
   */
  updateSpaceExecution(
    runId: string,
    spaceId: string,
    status: string,
    endTime?: number
  ): Promise<void>;

  /**
   * Retrieves a space execution record.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @returns Promise resolving to space execution record or null if not found
   */
  getSpaceExecution(runId: string, spaceId: string): Promise<SpaceExecutionRecord | null>;

  // Parameter set operations
  /**
   * Creates a new parameter set execution record.
   *
   * @param record - Parameter set execution data
   * @returns Promise that resolves when parameter set execution is created
   */
  createParamSetExecution(record: ParamSetExecutionRecord): Promise<void>;

  /**
   * Updates the status of a parameter set execution.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param index - Parameter set index
   * @param status - New status
   * @param endTime - Optional completion timestamp
   * @returns Promise that resolves when status is updated
   */
  updateParamSetExecution(
    runId: string,
    spaceId: string,
    index: number,
    status: string,
    endTime?: number
  ): Promise<void>;

  /**
   * Retrieves a parameter set execution record.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param index - Parameter set index
   * @returns Promise resolving to parameter set execution record or null if not found
   */
  getParamSetExecution(
    runId: string,
    spaceId: string,
    index: number
  ): Promise<ParamSetExecutionRecord | null>;

  // Task operations
  /**
   * Creates a new task execution record.
   *
   * @param record - Task execution data
   * @returns Promise that resolves when task execution is created
   */
  createTaskExecution(record: TaskExecutionRecord): Promise<void>;

  /**
   * Updates a task execution record with partial data.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param paramIndex - Parameter set index
   * @param taskId - Task identifier
   * @param updates - Partial updates to apply
   * @returns Promise that resolves when task execution is updated
   */
  updateTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string,
    updates: Partial<TaskExecutionRecord>
  ): Promise<void>;

  /**
   * Retrieves a task execution record.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param paramIndex - Parameter set index
   * @param taskId - Task identifier
   * @returns Promise resolving to task execution record or null if not found
   */
  getTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string
  ): Promise<TaskExecutionRecord | null>;

  /**
   * Gets task execution statistics for a run.
   *
   * @param runId - Run identifier
   * @returns Promise resolving to array of status counts
   */
  getTaskStats(runId: string): Promise<{ status: string; count: number }[]>;

  /**
   * Retrieves task execution history with optional filtering.
   *
   * @param runId - Run identifier
   * @param options - Optional filtering and pagination options
   * @param options.limit - Maximum number of records to return
   * @param options.offset - Number of records to skip
   * @param options.spaceId - Filter by space ID
   * @param options.taskId - Filter by task ID
   * @returns Promise resolving to array of task execution records
   */
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
  /**
   * Creates a new data mapping record.
   *
   * @param record - Data mapping data
   * @returns Promise that resolves when data mapping is created
   */
  createDataMapping(record: DataMappingRecord): Promise<void>;

  /**
   * Retrieves a data mapping value.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @param paramIndex - Parameter set index
   * @param dataName - Name of the data mapping
   * @returns Promise resolving to data value or null if not found
   */
  getDataMapping(
    runId: string,
    spaceId: string,
    paramIndex: number,
    dataName: string
  ): Promise<string | null>;

  // Control state operations
  /**
   * Saves the current control flow state for resumption.
   *
   * @param runId - Run identifier
   * @param currentSpace - Current space being executed
   * @returns Promise that resolves when state is saved
   */
  saveControlState(runId: string, currentSpace: string): Promise<void>;

  /**
   * Retrieves the saved control flow state.
   *
   * @param runId - Run identifier
   * @returns Promise resolving to current space or null if not found
   */
  getControlState(runId: string): Promise<string | null>;

  // Progress operations
  /**
   * Updates the current progress state of a run.
   *
   * @param runId - Run identifier
   * @param currentSpace - Optional current space being executed
   * @param currentParamSet - Optional current parameter set index
   * @param currentTask - Optional current task being executed
   * @returns Promise that resolves when progress is updated
   */
  updateRunProgress(
    runId: string,
    currentSpace?: string,
    currentParamSet?: number,
    currentTask?: string
  ): Promise<void>;

  /**
   * Gets space execution statistics.
   *
   * @param runId - Run identifier
   * @returns Promise resolving to total and completed space counts
   */
  getSpaceStats(runId: string): Promise<{ total: number; completed: number }>;

  /**
   * Gets parameter set execution statistics.
   *
   * @param runId - Run identifier
   * @returns Promise resolving to total and completed parameter set counts
   */
  getParamSetStats(runId: string): Promise<{ total: number; completed: number }>;

  /**
   * Gets parameter set statistics for a specific space.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @returns Promise resolving to total and completed parameter set counts for the space
   */
  getParamSetStatsForSpace(
    runId: string,
    spaceId: string
  ): Promise<{ total: number; completed: number }>;

  /**
   * Gets task execution statistics for a specific space.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @returns Promise resolving to array of task status counts for the space
   */
  getTaskStatsForSpace(
    runId: string,
    spaceId: string
  ): Promise<{ status: string; count: number }[]>;

  /**
   * Gets space execution record with total counts.
   *
   * @param runId - Run identifier
   * @param spaceId - Space identifier
   * @returns Promise resolving to space execution with totals or null if not found
   */
  getSpaceExecutionWithTotals(
    runId: string,
    spaceId: string
  ): Promise<{
    space_id: string;
    status: string;
    total_param_sets: number;
    total_tasks: number;
  } | null>;

  /**
   * Gets current task progress information.
   *
   * @param runId - Run identifier
   * @returns Promise resolving to current task progress or null if not found
   */
  getCurrentTaskProgress(
    runId: string
  ): Promise<{ currentTask: string | null; taskIndex: number; totalTasks: number } | null>;
}
