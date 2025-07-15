/**
 * SQLite implementation of the database repository.
 * Provides persistent storage for experiment data using SQLite database.
 */

import { open, Database as SqliteDatabase } from 'sqlite';
import sqlite3 from 'sqlite3';

import {
  RunRecord,
  SpaceExecutionRecord,
  ParamSetExecutionRecord,
  TaskExecutionRecord,
  DataMappingRecord,
} from '../types/database.types.js';

import { DatabaseRepository } from './DatabaseRepository.js';

/**
 * SQLite implementation of the database repository.
 * Handles all database operations for experiment data persistence using SQLite.
 */
export class SqliteRepository implements DatabaseRepository {
  private db: SqliteDatabase | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private dbPath: string) {}
  async initialize(): Promise<void> {
    // If already initializing, wait for that initialization to complete
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // If already initialized, just return
    if (this.isInitialized && this.db) {
      return;
    }

    // Start initialization
    this.initializationPromise = this.doInitialize();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  private async doInitialize(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      await this.createTables();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      this.db = null;
      throw new Error(
        `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async close(): Promise<void> {
    // Simply close the database when requested
    if (this.db) {
      try {
        await this.db.close();
      } catch (error) {
        console.warn('Error closing database:', error);
      } finally {
        this.db = null;
        this.isInitialized = false;
        this.initializationPromise = null;
      }
    }
  }

  /**
   * Force close the database regardless of reference count.
   * Should only be used during application shutdown or error recovery.
   */
  async forceClose(): Promise<void> {
    await this.close();
  }

  private ensureInitialized(): SqliteDatabase {
    if (!this.isInitialized || !this.db) {
      throw new Error(
        'Database not initialized. Call initialize() first. ' +
          `Current state: isInitialized=${this.isInitialized}, ` +
          `hasDb=${!!this.db}`
      );
    }
    return this.db;
  }

  private ensureInitializedSafe(): SqliteDatabase | null {
    if (!this.isInitialized || !this.db) {
      return null;
    }
    return this.db;
  }

  private async createTables(): Promise<void> {
    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        experiment_name TEXT NOT NULL,
        experiment_version TEXT NOT NULL,
        artifact_path TEXT NOT NULL,
        artifact_hash TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL,
        current_space TEXT,
        current_param_set INTEGER,
        current_task TEXT,
        total_spaces INTEGER NOT NULL DEFAULT 0,
        UNIQUE(experiment_name, experiment_version)
      );
      
      CREATE TABLE IF NOT EXISTS space_executions (
        run_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
        total_param_sets INTEGER NOT NULL DEFAULT 0,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (run_id, space_id),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS param_set_executions (
        run_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        param_set_index INTEGER NOT NULL,
        params_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
        PRIMARY KEY (run_id, space_id, param_set_index),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS task_executions (
        run_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        param_set_index INTEGER NOT NULL,
        task_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
        output_dir TEXT,
        error_message TEXT,
        PRIMARY KEY (run_id, space_id, param_set_index, task_id),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS data_mappings (
        run_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        param_set_index INTEGER NOT NULL,
        data_name TEXT NOT NULL,
        data_value TEXT NOT NULL,
        PRIMARY KEY (run_id, space_id, param_set_index, data_name),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS control_state (
        run_id TEXT NOT NULL,
        current_space TEXT NOT NULL,
        PRIMARY KEY (run_id),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
      );
    `);
  }

  // Run operations
  async createRun(run: Omit<RunRecord, 'end_time'>): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'INSERT INTO runs (id, experiment_name, experiment_version, artifact_path, artifact_hash, start_time, status, total_spaces) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          run.id,
          run.experiment_name,
          run.experiment_version,
          run.artifact_path,
          run.artifact_hash,
          run.start_time,
          run.status,
          run.total_spaces,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to create run: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateRunStatus(runId: string, status: string, endTime?: number): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const query = endTime
        ? 'UPDATE runs SET status = ?, end_time = ? WHERE id = ?'
        : 'UPDATE runs SET status = ? WHERE id = ?';
      const params = endTime ? [status, endTime, runId] : [status, runId];

      const result = await db.run(query, params);
      if (result.changes === 0) {
        throw new Error(`Run with id ${runId} not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update run status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getRun(experimentName: string, experimentVersion: string): Promise<RunRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<RunRecord>(
        'SELECT * FROM runs WHERE experiment_name = ? AND experiment_version = ? ORDER BY start_time DESC LIMIT 1',
        [experimentName, experimentVersion]
      );
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get run: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getRunById(runId: string): Promise<RunRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<RunRecord>('SELECT * FROM runs WHERE id = ?', [runId]);
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get run by id: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteRun(runId: string): Promise<void> {
    const db = this.ensureInitialized();
    try {
      await db.run('DELETE FROM runs WHERE id = ?', [runId]);
      // Also delete related records in other tables
      await db.run('DELETE FROM space_executions WHERE run_id = ?', [runId]);
      await db.run('DELETE FROM param_set_executions WHERE run_id = ?', [runId]);
      await db.run('DELETE FROM task_executions WHERE run_id = ?', [runId]);
      await db.run('DELETE FROM data_mappings WHERE run_id = ?', [runId]);
      await db.run('DELETE FROM control_state WHERE run_id = ?', [runId]);
    } catch (error) {
      throw new Error(
        `Failed to delete run with id ${runId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Space operations
  async createSpaceExecution(record: SpaceExecutionRecord): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'INSERT INTO space_executions (run_id, space_id, status, start_time, total_param_sets, total_tasks) VALUES (?, ?, ?, ?, ?, ?)',
        [
          record.run_id,
          record.space_id,
          record.status,
          record.start_time,
          record.total_param_sets,
          record.total_tasks,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to create space execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateSpaceExecution(
    runId: string,
    spaceId: string,
    status: string,
    endTime?: number
  ): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const query = endTime
        ? 'UPDATE space_executions SET status = ?, end_time = ? WHERE run_id = ? AND space_id = ?'
        : 'UPDATE space_executions SET status = ? WHERE run_id = ? AND space_id = ?';
      const params = endTime ? [status, endTime, runId, spaceId] : [status, runId, spaceId];

      const result = await db.run(query, params);
      if (result.changes === 0) {
        throw new Error(`Space execution not found: runId=${runId}, spaceId=${spaceId}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update space execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSpaceExecution(runId: string, spaceId: string): Promise<SpaceExecutionRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<SpaceExecutionRecord>(
        'SELECT * FROM space_executions WHERE run_id = ? AND space_id = ?',
        [runId, spaceId]
      );
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get space execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Parameter set operations
  async createParamSetExecution(record: ParamSetExecutionRecord): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'INSERT OR REPLACE INTO param_set_executions (run_id, space_id, param_set_index, params_hash, status, start_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          record.run_id,
          record.space_id,
          record.param_set_index,
          record.params_hash,
          record.status,
          record.start_time,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to create param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateParamSetExecution(
    runId: string,
    spaceId: string,
    index: number,
    status: string,
    endTime?: number
  ): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const query = endTime
        ? 'UPDATE param_set_executions SET status = ?, end_time = ? WHERE run_id = ? AND space_id = ? AND param_set_index = ?'
        : 'UPDATE param_set_executions SET status = ? WHERE run_id = ? AND space_id = ? AND param_set_index = ?';
      const params = endTime
        ? [status, endTime, runId, spaceId, index]
        : [status, runId, spaceId, index];

      const result = await db.run(query, params);
      if (result.changes === 0) {
        throw new Error(
          `Param set execution not found: runId=${runId}, spaceId=${spaceId}, index=${index}`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getParamSetExecution(
    runId: string,
    spaceId: string,
    index: number
  ): Promise<ParamSetExecutionRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<ParamSetExecutionRecord>(
        'SELECT * FROM param_set_executions WHERE run_id = ? AND space_id = ? AND param_set_index = ?',
        [runId, spaceId, index]
      );
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Task operations
  async createTaskExecution(record: TaskExecutionRecord): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'INSERT OR REPLACE INTO task_executions (run_id, space_id, param_set_index, task_id, status, start_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          record.run_id,
          record.space_id,
          record.param_set_index,
          record.task_id,
          record.status,
          record.start_time,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to create task execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string,
    updates: Partial<TaskExecutionRecord>
  ): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const setClauses: string[] = [];
      const values: (number | string)[] = [];

      if (updates.status !== undefined) {
        setClauses.push('status = ?');
        values.push(updates.status);
      }
      if (updates.end_time !== undefined) {
        setClauses.push('end_time = ?');
        values.push(updates.end_time);
      }
      if (updates.output_dir !== undefined) {
        setClauses.push('output_dir = ?');
        values.push(updates.output_dir);
      }
      if (updates.error_message !== undefined) {
        setClauses.push('error_message = ?');
        values.push(updates.error_message);
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(runId, spaceId, paramIndex, taskId);

      const result = await db.run(
        `UPDATE task_executions SET ${setClauses.join(', ')} WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND task_id = ?`,
        values
      );

      if (result.changes === 0) {
        throw new Error(
          `Task execution not found: runId=${runId}, spaceId=${spaceId}, paramIndex=${paramIndex}, taskId=${taskId}`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update task execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTaskExecution(
    runId: string,
    spaceId: string,
    paramIndex: number,
    taskId: string
  ): Promise<TaskExecutionRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<TaskExecutionRecord>(
        'SELECT * FROM task_executions WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND task_id = ?',
        [runId, spaceId, paramIndex, taskId]
      );
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get task execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTaskStats(runId: string): Promise<{ status: string; count: number }[]> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting task stats');
      return [];
    }

    try {
      return await db.all<{ status: string; count: number }[]>(
        'SELECT status, COUNT(*) as count FROM task_executions WHERE run_id = ? GROUP BY status',
        [runId]
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getTaskStats operation');
        return [];
      }
      throw new Error(
        `Failed to get task stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTaskExecutionHistory(
    runId: string,
    options?: {
      limit?: number;
      offset?: number;
      spaceId?: string;
      taskId?: string;
    }
  ): Promise<TaskExecutionRecord[]> {
    const db = this.ensureInitialized();

    try {
      let query = 'SELECT * FROM task_executions WHERE run_id = ?';
      const params: (string | number)[] = [runId];

      // Add filters
      if (options?.spaceId) {
        query += ' AND space_id = ?';
        params.push(options.spaceId);
      }

      if (options?.taskId) {
        query += ' AND task_id = ?';
        params.push(options.taskId);
      }

      // Order by start time (most recent first)
      query += ' ORDER BY start_time DESC';

      // Add pagination
      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);

        if (options?.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      return await db.all<TaskExecutionRecord[]>(query, params);
    } catch (error) {
      throw new Error(
        `Failed to get task execution history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Data mapping operations
  async createDataMapping(record: DataMappingRecord): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'INSERT OR REPLACE INTO data_mappings (run_id, space_id, param_set_index, data_name, data_value) VALUES (?, ?, ?, ?, ?)',
        [
          record.run_id,
          record.space_id,
          record.param_set_index,
          record.data_name,
          record.data_value,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to create data mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  async getDataMapping(
    runId: string,
    spaceId: string,
    paramIndex: number,
    dataName: string
  ): Promise<string | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<{ data_value: string }>(
        'SELECT data_value FROM data_mappings WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND data_name = ?',
        [runId, spaceId, paramIndex, dataName]
      );
      return result?.data_value || null;
    } catch (error) {
      throw new Error(
        `Failed to get data mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Control state operations
  async saveControlState(runId: string, currentSpace: string): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run('INSERT OR REPLACE INTO control_state (run_id, current_space) VALUES (?, ?)', [
        runId,
        currentSpace,
      ]);
    } catch (error) {
      throw new Error(
        `Failed to save control state: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getControlState(runId: string): Promise<string | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<{ current_space: string }>(
        'SELECT current_space FROM control_state WHERE run_id = ?',
        [runId]
      );
      return result?.current_space || null;
    } catch (error) {
      throw new Error(
        `Failed to get control state: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateRunProgress(
    runId: string,
    currentSpace?: string,
    currentParamSet?: number,
    currentTask?: string
  ): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        'UPDATE runs SET current_space = ?, current_param_set = ?, current_task = ? WHERE id = ?',
        [currentSpace, currentParamSet, currentTask, runId]
      );
    } catch (error) {
      throw new Error(
        `Failed to update run progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Progress operations
  async getSpaceStats(runId: string): Promise<{ total: number; completed: number }> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting space stats');
      return { total: 0, completed: 0 };
    }

    try {
      const result = await db.get<{ total: number; completed: number }>(
        `
        SELECT 
          COUNT(DISTINCT space_id) as total,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN space_id END) as completed
        FROM space_executions
        WHERE run_id = ?
      `,
        [runId]
      );
      return { total: result?.total || 0, completed: result?.completed || 0 };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getSpaceStats operation');
        return { total: 0, completed: 0 };
      }
      throw new Error(
        `Failed to get space stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getParamSetStats(runId: string): Promise<{ total: number; completed: number }> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting param set stats');
      return { total: 0, completed: 0 };
    }

    try {
      const result = await db.get<{ total: number; completed: number }>(
        `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM param_set_executions
        WHERE run_id = ?
      `,
        [runId]
      );
      return { total: result?.total || 0, completed: result?.completed || 0 };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getParamSetStats operation');
        return { total: 0, completed: 0 };
      }
      throw new Error(
        `Failed to get param set stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getParamSetStatsForSpace(
    runId: string,
    spaceId: string
  ): Promise<{ total: number; completed: number }> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting param set stats for space');
      return { total: 0, completed: 0 };
    }

    try {
      const result = await db.get<{ total: number; completed: number }>(
        `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM param_set_executions
        WHERE run_id = ? AND space_id = ?
      `,
        [runId, spaceId]
      );
      return { total: result?.total || 0, completed: result?.completed || 0 };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getParamSetStatsForSpace operation');
        return { total: 0, completed: 0 };
      }
      throw new Error(
        `Failed to get param set stats for space: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTaskStatsForSpace(
    runId: string,
    spaceId: string
  ): Promise<{ status: string; count: number }[]> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting task stats for space');
      return [];
    }

    try {
      return await db.all<{ status: string; count: number }[]>(
        'SELECT status, COUNT(*) as count FROM task_executions WHERE run_id = ? AND space_id = ? GROUP BY status',
        [runId, spaceId]
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getTaskStatsForSpace operation');
        return [];
      }
      throw new Error(
        `Failed to get task stats for space: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSpaceExecutionWithTotals(
    runId: string,
    spaceId: string
  ): Promise<{
    space_id: string;
    status: string;
    total_param_sets: number;
    total_tasks: number;
  } | null> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting space execution with totals');
      return null;
    }

    try {
      const result = await db.get<{
        space_id: string;
        status: string;
        total_param_sets: number;
        total_tasks: number;
      }>(
        'SELECT space_id, status, total_param_sets, total_tasks FROM space_executions WHERE run_id = ? AND space_id = ?',
        [runId, spaceId]
      );
      return result || null;
    } catch (error) {
      // Check if it's a database closed error and handle it gracefully
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getSpaceExecutionWithTotals operation');
        return null;
      }
      throw new Error(
        `Failed to get space execution with totals: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCurrentTaskProgress(
    runId: string
  ): Promise<{ currentTask: string | null; taskIndex: number; totalTasks: number } | null> {
    const db = this.ensureInitializedSafe();

    if (!db) {
      console.warn('Database connection not available when getting current task progress');
      return null;
    }

    try {
      const result = await db.get<{
        current_space: string;
        current_param_set: number;
        current_task: string;
      }>('SELECT current_space, current_param_set, current_task FROM runs WHERE id = ?', [runId]);

      if (!result?.current_space || result.current_param_set === undefined) {
        return null;
      }

      // Get space execution to find total tasks per set
      const spaceExecution = await db.get<{ total_tasks: number }>(
        'SELECT total_tasks FROM space_executions WHERE run_id = ? AND space_id = ?',
        [runId, result.current_space]
      );

      if (!spaceExecution) {
        return null;
      }

      // Get task order from completed task executions to determine current task index
      const completedTasks = await db.all<{ task_id: string }[]>(
        'SELECT task_id FROM task_executions WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND status = "completed" ORDER BY start_time',
        [runId, result.current_space, result.current_param_set]
      );

      const taskIndex = completedTasks.length + 1; // Current task is the next one after completed ones

      return {
        currentTask: result.current_task,
        taskIndex,
        totalTasks: spaceExecution.total_tasks,
      };
    } catch (error) {
      // Check if it's a database closed error and handle it gracefully
      if (error instanceof Error && error.message.includes('Database handle is closed')) {
        console.warn('Database handle was closed during getCurrentTaskProgress operation');
        return null;
      }
      throw new Error(
        `Failed to get current task progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
