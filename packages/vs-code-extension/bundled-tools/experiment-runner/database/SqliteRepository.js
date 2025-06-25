import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
export class SqliteRepository {
    dbPath;
    db = null;
    isInitialized = false;
    constructor(dbPath) {
        this.dbPath = dbPath;
    }
    async initialize() {
        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database,
            });
            await this.createTables();
            this.isInitialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async close() {
        if (this.db) {
            try {
                await this.db.close();
            }
            catch (error) {
                console.warn('Error closing database:', error);
            }
            finally {
                this.db = null;
                this.isInitialized = false;
            }
        }
    }
    ensureInitialized() {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }
    async createTables() {
        await this.db.exec(`
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
    async createRun(run) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT INTO runs (id, experiment_name, experiment_version, artifact_path, artifact_hash, start_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                run.id,
                run.experiment_name,
                run.experiment_version,
                run.artifact_path,
                run.artifact_hash,
                run.start_time,
                run.status,
            ]);
        }
        catch (error) {
            throw new Error(`Failed to create run: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateRunStatus(runId, status, endTime) {
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
        }
        catch (error) {
            throw new Error(`Failed to update run status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getRun(experimentName, experimentVersion) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT * FROM runs WHERE experiment_name = ? AND experiment_version = ? ORDER BY start_time DESC LIMIT 1', [experimentName, experimentVersion]);
            return result || null;
        }
        catch (error) {
            throw new Error(`Failed to get run: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getRunById(runId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT * FROM runs WHERE id = ?', [runId]);
            return result || null;
        }
        catch (error) {
            throw new Error(`Failed to get run by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteRun(runId) {
        const db = this.ensureInitialized();
        try {
            await db.run('DELETE FROM runs WHERE id = ?', [runId]);
            await db.run('DELETE FROM space_executions WHERE run_id = ?', [runId]);
            await db.run('DELETE FROM param_set_executions WHERE run_id = ?', [runId]);
            await db.run('DELETE FROM task_executions WHERE run_id = ?', [runId]);
            await db.run('DELETE FROM data_mappings WHERE run_id = ?', [runId]);
            await db.run('DELETE FROM control_state WHERE run_id = ?', [runId]);
        }
        catch (error) {
            throw new Error(`Failed to delete run with id ${runId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createSpaceExecution(record) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT INTO space_executions (run_id, space_id, status, start_time) VALUES (?, ?, ?, ?)', [record.run_id, record.space_id, record.status, record.start_time]);
        }
        catch (error) {
            throw new Error(`Failed to create space execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateSpaceExecution(runId, spaceId, status, endTime) {
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
        }
        catch (error) {
            throw new Error(`Failed to update space execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSpaceExecution(runId, spaceId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT * FROM space_executions WHERE run_id = ? AND space_id = ?', [runId, spaceId]);
            return result || null;
        }
        catch (error) {
            throw new Error(`Failed to get space execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createParamSetExecution(record) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT OR REPLACE INTO param_set_executions (run_id, space_id, param_set_index, params_hash, status, start_time) VALUES (?, ?, ?, ?, ?, ?)', [
                record.run_id,
                record.space_id,
                record.param_set_index,
                record.params_hash,
                record.status,
                record.start_time,
            ]);
        }
        catch (error) {
            throw new Error(`Failed to create param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateParamSetExecution(runId, spaceId, index, status, endTime) {
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
                throw new Error(`Param set execution not found: runId=${runId}, spaceId=${spaceId}, index=${index}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to update param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getParamSetExecution(runId, spaceId, index) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT * FROM param_set_executions WHERE run_id = ? AND space_id = ? AND param_set_index = ?', [runId, spaceId, index]);
            return result || null;
        }
        catch (error) {
            throw new Error(`Failed to get param set execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createTaskExecution(record) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT OR REPLACE INTO task_executions (run_id, space_id, param_set_index, task_id, status, start_time) VALUES (?, ?, ?, ?, ?, ?)', [
                record.run_id,
                record.space_id,
                record.param_set_index,
                record.task_id,
                record.status,
                record.start_time,
            ]);
        }
        catch (error) {
            throw new Error(`Failed to create task execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateTaskExecution(runId, spaceId, paramIndex, taskId, updates) {
        const db = this.ensureInitialized();
        try {
            const setClauses = [];
            const values = [];
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
            const result = await db.run(`UPDATE task_executions SET ${setClauses.join(', ')} WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND task_id = ?`, values);
            if (result.changes === 0) {
                throw new Error(`Task execution not found: runId=${runId}, spaceId=${spaceId}, paramIndex=${paramIndex}, taskId=${taskId}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to update task execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTaskExecution(runId, spaceId, paramIndex, taskId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT * FROM task_executions WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND task_id = ?', [runId, spaceId, paramIndex, taskId]);
            return result || null;
        }
        catch (error) {
            throw new Error(`Failed to get task execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTaskStats(runId) {
        const db = this.ensureInitialized();
        try {
            return await db.all('SELECT status, COUNT(*) as count FROM task_executions WHERE run_id = ? GROUP BY status', [runId]);
        }
        catch (error) {
            throw new Error(`Failed to get task stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTaskExecutionHistory(runId, options) {
        const db = this.ensureInitialized();
        try {
            let query = 'SELECT * FROM task_executions WHERE run_id = ?';
            const params = [runId];
            if (options?.spaceId) {
                query += ' AND space_id = ?';
                params.push(options.spaceId);
            }
            if (options?.taskId) {
                query += ' AND task_id = ?';
                params.push(options.taskId);
            }
            query += ' ORDER BY start_time DESC';
            if (options?.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
                if (options?.offset) {
                    query += ' OFFSET ?';
                    params.push(options.offset);
                }
            }
            return await db.all(query, params);
        }
        catch (error) {
            throw new Error(`Failed to get task execution history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createDataMapping(record) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT OR REPLACE INTO data_mappings (run_id, space_id, param_set_index, data_name, data_value) VALUES (?, ?, ?, ?, ?)', [
                record.run_id,
                record.space_id,
                record.param_set_index,
                record.data_name,
                record.data_value,
            ]);
        }
        catch (error) {
            throw new Error(`Failed to create data mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDataMapping(runId, spaceId, paramIndex, dataName) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT data_value FROM data_mappings WHERE run_id = ? AND space_id = ? AND param_set_index = ? AND data_name = ?', [runId, spaceId, paramIndex, dataName]);
            return result?.data_value || null;
        }
        catch (error) {
            throw new Error(`Failed to get data mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async saveControlState(runId, currentSpace) {
        const db = this.ensureInitialized();
        try {
            await db.run('INSERT OR REPLACE INTO control_state (run_id, current_space) VALUES (?, ?)', [
                runId,
                currentSpace,
            ]);
        }
        catch (error) {
            throw new Error(`Failed to save control state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getControlState(runId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get('SELECT current_space FROM control_state WHERE run_id = ?', [runId]);
            return result?.current_space || null;
        }
        catch (error) {
            throw new Error(`Failed to get control state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSpaceStats(runId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get(`
        SELECT 
          COUNT(DISTINCT space_id) as total,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN space_id END) as completed
        FROM space_executions
        WHERE run_id = ?
      `, [runId]);
            return { total: result?.total || 0, completed: result?.completed || 0 };
        }
        catch (error) {
            throw new Error(`Failed to get space stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getParamSetStats(runId) {
        const db = this.ensureInitialized();
        try {
            const result = await db.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM param_set_executions
        WHERE run_id = ?
      `, [runId]);
            return { total: result?.total || 0, completed: result?.completed || 0 };
        }
        catch (error) {
            throw new Error(`Failed to get param set stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
//# sourceMappingURL=SqliteRepository.js.map