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
        total_spaces INTEGER NOT NULL DEFAULT 0,
        total_parameter_sets INTEGER NOT NULL DEFAULT 0,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        UNIQUE(experiment_name, experiment_version)
      );
      
      CREATE TABLE IF NOT EXISTS space_executions (
        run_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
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
        'INSERT INTO runs (id, experiment_name, experiment_version, artifact_path, artifact_hash, start_time, status, total_spaces, total_parameter_sets, total_tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          run.id,
          run.experiment_name,
          run.experiment_version,
          run.artifact_path,
          run.artifact_hash,
          run.start_time,
          run.status,
          run.total_spaces,
          run.total_parameter_sets,
          run.total_tasks,
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
        'INSERT INTO space_executions (run_id, space_id, status, start_time) VALUES (?, ?, ?, ?)',
        [record.run_id, record.space_id, record.status, record.start_time]
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
    const db = this.ensureInitialized();

    try {
      return await db.all<{ status: string; count: number }[]>(
        'SELECT status, COUNT(*) as count FROM task_executions WHERE run_id = ? GROUP BY status',
        [runId]
      );
    } catch (error) {
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

  // Progress operations
  async getSpaceStats(runId: string): Promise<{ total: number; completed: number }> {
    const db = this.ensureInitialized();

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
      throw new Error(
        `Failed to get space stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getParamSetStats(runId: string): Promise<{ total: number; completed: number }> {
    const db = this.ensureInitialized();

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
      throw new Error(
        `Failed to get param set stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
