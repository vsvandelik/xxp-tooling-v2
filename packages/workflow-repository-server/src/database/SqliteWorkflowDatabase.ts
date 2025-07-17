/**
 * SQLite implementation of the workflow database interface.
 * Provides persistent storage for workflow metadata using SQLite database.
 */

import { WorkflowSearchOptions } from '@extremexp/workflow-repository';
import { open, Database as SqliteDatabase } from 'sqlite';
import sqlite3 from 'sqlite3';

import { IWorkflowDatabase, WorkflowRecord, WorkflowTreeRecord } from './IWorkflowDatabase.js';

/**
 * SQLite implementation of the workflow database interface.
 * Handles all database operations for workflow metadata persistence using SQLite.
 */
export class SqliteWorkflowDatabase implements IWorkflowDatabase {
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
        `Failed to initialize workflow database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
      } catch (error) {
        console.warn('Error closing workflow database:', error);
      } finally {
        this.db = null;
        this.isInitialized = false;
        this.initializationPromise = null;
      }
    }
  }

  private ensureInitialized(): SqliteDatabase {
    if (!this.isInitialized || !this.db) {
      throw new Error(
        'Workflow database not initialized. Call initialize() first. ' +
          `Current state: isInitialized=${this.isInitialized}, ` +
          `hasDb=${!!this.db}`
      );
    }
    return this.db;
  }

  private async createTables(): Promise<void> {
    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        author TEXT NOT NULL,
        tags TEXT NOT NULL, -- JSON string
        path TEXT NOT NULL,
        mainFile TEXT NOT NULL,
        version TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        modifiedAt TEXT NOT NULL,
        hasAttachments BOOLEAN NOT NULL DEFAULT 0,
        filePath TEXT NOT NULL,
        UNIQUE(path, name)
      );

      CREATE TABLE IF NOT EXISTS workflow_tree (
        path TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isDirectory BOOLEAN NOT NULL,
        parentPath TEXT,
        workflowId TEXT,
        FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_workflows_path ON workflows(path);
      CREATE INDEX IF NOT EXISTS idx_workflows_author ON workflows(author);
      CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);
      CREATE INDEX IF NOT EXISTS idx_workflows_tags ON workflows(tags);
      CREATE INDEX IF NOT EXISTS idx_tree_parent ON workflow_tree(parentPath);
      CREATE INDEX IF NOT EXISTS idx_tree_directory ON workflow_tree(isDirectory);
    `);
  }

  async storeWorkflow(record: WorkflowRecord): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run(
        `INSERT OR REPLACE INTO workflows 
         (id, name, description, author, tags, path, mainFile, version, createdAt, modifiedAt, hasAttachments, filePath)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.description,
          record.author,
          record.tags,
          record.path,
          record.mainFile,
          record.version,
          record.createdAt,
          record.modifiedAt,
          record.hasAttachments ? 1 : 0,
          record.filePath,
        ]
      );
    } catch (error) {
      throw new Error(
        `Failed to store workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getWorkflow(id: string): Promise<WorkflowRecord | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<WorkflowRecord>('SELECT * FROM workflows WHERE id = ?', [id]);
      return result || null;
    } catch (error) {
      throw new Error(
        `Failed to get workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowRecord>): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const setClauses: string[] = [];
      const values: (string | number | boolean)[] = [];

      if (updates.name !== undefined) {
        setClauses.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        values.push(updates.description);
      }
      if (updates.author !== undefined) {
        setClauses.push('author = ?');
        values.push(updates.author);
      }
      if (updates.tags !== undefined) {
        setClauses.push('tags = ?');
        values.push(updates.tags);
      }
      if (updates.path !== undefined) {
        setClauses.push('path = ?');
        values.push(updates.path);
      }
      if (updates.mainFile !== undefined) {
        setClauses.push('mainFile = ?');
        values.push(updates.mainFile);
      }
      if (updates.version !== undefined) {
        setClauses.push('version = ?');
        values.push(updates.version);
      }
      if (updates.modifiedAt !== undefined) {
        setClauses.push('modifiedAt = ?');
        values.push(updates.modifiedAt);
      }
      if (updates.hasAttachments !== undefined) {
        setClauses.push('hasAttachments = ?');
        values.push(updates.hasAttachments ? 1 : 0);
      }
      if (updates.filePath !== undefined) {
        setClauses.push('filePath = ?');
        values.push(updates.filePath);
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const result = await db.run(
        `UPDATE workflows SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );

      if (result.changes === 0) {
        throw new Error(`Workflow with id ${id} not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const db = this.ensureInitialized();

    try {
      const result = await db.run('DELETE FROM workflows WHERE id = ?', [id]);
      return (result.changes || 0) > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async workflowExists(id: string): Promise<boolean> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM workflows WHERE id = ?',
        [id]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      throw new Error(
        `Failed to check workflow existence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async listWorkflows(path?: string): Promise<WorkflowRecord[]> {
    const db = this.ensureInitialized();

    try {
      let query = 'SELECT * FROM workflows';
      const params: string[] = [];

      if (path) {
        query += ' WHERE path = ? OR path LIKE ?';
        params.push(path, `${path}/%`);
      }

      query += ' ORDER BY path, name';

      const results = await db.all<WorkflowRecord[]>(query, params);
      return results;
    } catch (error) {
      throw new Error(
        `Failed to list workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async searchWorkflows(options: WorkflowSearchOptions): Promise<WorkflowRecord[]> {
    const db = this.ensureInitialized();

    try {
      let query = 'SELECT * FROM workflows WHERE 1=1';
      const params: (string | number)[] = [];

      if (options.query) {
        query += ' AND (name LIKE ? OR description LIKE ? OR author LIKE ?)';
        const searchTerm = `%${options.query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (options.author) {
        query += ' AND author = ?';
        params.push(options.author);
      }

      if (options.path) {
        query += ' AND (path = ? OR path LIKE ?)';
        params.push(options.path, `${options.path}/%`);
      }

      if (options.tags && options.tags.length > 0) {
        const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' AND ');
        query += ` AND (${tagConditions})`;
        options.tags.forEach(tag => {
          params.push(`%"${tag}"%`);
        });
      }

      query += ' ORDER BY path, name';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);

        if (options.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      const results = await db.all<WorkflowRecord[]>(query, params);
      return results;
    } catch (error) {
      throw new Error(
        `Failed to search workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllTags(): Promise<string[]> {
    const db = this.ensureInitialized();

    try {
      const results = await db.all<{ tags: string }[]>('SELECT DISTINCT tags FROM workflows');
      const tagSet = new Set<string>();

      results.forEach(row => {
        try {
          const tags = JSON.parse(row.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (typeof tag === 'string') {
                tagSet.add(tag);
              }
            });
          }
        } catch {
          // Ignore invalid JSON
        }
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      throw new Error(
        `Failed to get all tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllAuthors(): Promise<string[]> {
    const db = this.ensureInitialized();

    try {
      const results = await db.all<{ author: string }[]>(
        'SELECT DISTINCT author FROM workflows ORDER BY author'
      );
      return results.map(row => row.author);
    } catch (error) {
      throw new Error(
        `Failed to get all authors: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getWorkflowOwner(id: string): Promise<string | null> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<{ author: string }>('SELECT author FROM workflows WHERE id = ?', [
        id,
      ]);
      return result?.author || null;
    } catch (error) {
      throw new Error(
        `Failed to get workflow owner: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findWorkflowByPathAndName(
    path: string,
    name: string
  ): Promise<{ exists: boolean; id?: string }> {
    const db = this.ensureInitialized();

    try {
      const result = await db.get<{ id: string }>(
        'SELECT id FROM workflows WHERE path = ? AND name = ?',
        [path, name]
      );

      if (result) {
        return { exists: true, id: result.id };
      }

      return { exists: false };
    } catch (error) {
      throw new Error(
        `Failed to find workflow by path and name: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTreeStructure(path?: string): Promise<WorkflowTreeRecord[]> {
    const db = this.ensureInitialized();

    try {
      let query = 'SELECT * FROM workflow_tree';
      const params: string[] = [];

      if (path) {
        query += ' WHERE path = ? OR path LIKE ?';
        params.push(path, `${path}/%`);
      }

      query += ' ORDER BY path';

      const results = await db.all<WorkflowTreeRecord[]>(query, params);
      return results;
    } catch (error) {
      throw new Error(
        `Failed to get tree structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateTreeStructure(
    path: string,
    isDirectory: boolean,
    workflowId?: string
  ): Promise<void> {
    const db = this.ensureInitialized();

    try {
      const name = path.split('/').pop() || '';
      const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : null;

      await db.run(
        `INSERT OR REPLACE INTO workflow_tree (path, name, isDirectory, parentPath, workflowId)
         VALUES (?, ?, ?, ?, ?)`,
        [path, name, isDirectory ? 1 : 0, parentPath, workflowId || null]
      );
    } catch (error) {
      throw new Error(
        `Failed to update tree structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async removeTreeStructure(path: string): Promise<void> {
    const db = this.ensureInitialized();

    try {
      await db.run('DELETE FROM workflow_tree WHERE path = ? OR path LIKE ?', [path, `${path}/%`]);
    } catch (error) {
      throw new Error(
        `Failed to remove tree structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
