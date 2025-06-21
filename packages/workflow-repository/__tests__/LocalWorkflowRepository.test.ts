import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalWorkflowRepository } from '../src/repositories/LocalWorkflowRepository.js';
import { WorkflowContent } from '../src/models/WorkflowItem.js';
import { WorkflowMetadata } from '../src/models/WorkflowMetadata.js';

describe('LocalWorkflowRepository', () => {
  let repository: LocalWorkflowRepository;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp('test-repo-');
    repository = new LocalWorkflowRepository(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create repository with base path', () => {
      expect(repository).toBeInstanceOf(LocalWorkflowRepository);
    });
  });

  describe('list', () => {
    it('should return empty array for empty repository', async () => {
      const workflows = await repository.list();
      expect(workflows).toEqual([]);
    });

    it('should list single-file workflows', async () => {
      const workflowContent = '// @name Test Workflow\n// @description A test\n// @author John Doe\nprint("hello")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]?.name).toBe('Test Workflow');
      expect(workflows[0]?.description).toBe('A test');
      expect(workflows[0]?.author).toBe('John Doe');
      expect(workflows[0]?.path).toBe('test.xxp');
    });

    it('should list multi-file workflows', async () => {
      const workflowDir = path.join(tempDir, 'testworkflow');
      await fs.mkdir(workflowDir, { recursive: true });
      
      const metadata = {
        id: 'test-id',
        name: 'Test Workflow',
        description: 'A test workflow',
        author: 'John Doe',
        tags: ['test'],
        createdAt: new Date(),
        modifiedAt: new Date(),
        path: 'testworkflow',
        hasAttachments: false,
        mainFile: 'main.xxp'
      };
      
      await fs.writeFile(path.join(workflowDir, 'workflow.json'), JSON.stringify(metadata));
      await fs.writeFile(path.join(workflowDir, 'main.xxp'), 'print("hello")');

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]?.name).toBe('Test Workflow');
    });

    it('should list workflows in subdirectories', async () => {
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });
      
      const workflowContent = '// @name Sub Workflow\nprint("hello")';
      const filePath = path.join(subDir, 'sub.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]?.name).toBe('Sub Workflow');
      expect(workflows[0]?.path).toBe('subdir/sub.xxp');
    });

    it('should filter workflows by path', async () => {
      // Create workflow in root
      await fs.writeFile(path.join(tempDir, 'root.xxp'), '// @name Root\nprint("root")');
      
      // Create workflow in subdirectory
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'sub.xxp'), '// @name Sub\nprint("sub")');

      const allWorkflows = await repository.list();
      expect(allWorkflows).toHaveLength(2);

      const subWorkflows = await repository.list('subdir');
      expect(subWorkflows).toHaveLength(1);
      expect(subWorkflows[0]?.name).toBe('Sub');
    });

    it('should filter workflows by search options', async () => {
      await fs.writeFile(path.join(tempDir, 'test1.xxp'), '// @name Test One\n// @author Alice\n// @tags tag1,tag2\nprint("test1")');
      await fs.writeFile(path.join(tempDir, 'test2.xxp'), '// @name Test Two\n// @author Bob\n// @tags tag2,tag3\nprint("test2")');

      // Filter by query
      let workflows = await repository.list(undefined, { query: 'One' });
      expect(workflows).toHaveLength(1);
      expect(workflows[0]?.name).toBe('Test One');

      // Filter by author
      workflows = await repository.list(undefined, { author: 'Alice' });
      expect(workflows).toHaveLength(1);
      expect(workflows[0]?.author).toBe('Alice');

      // Filter by tags
      workflows = await repository.list(undefined, { tags: ['tag2'] });
      expect(workflows).toHaveLength(2);

      // Filter by limit
      workflows = await repository.list(undefined, { limit: 1 });
      expect(workflows).toHaveLength(1);

      // Filter by offset
      workflows = await repository.list(undefined, { offset: 1 });
      expect(workflows).toHaveLength(1);
    });

    it('should handle non-existent directory gracefully', async () => {
      const workflows = await repository.list('nonexistent');
      expect(workflows).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return null for non-existent workflow', async () => {
      const workflow = await repository.get('nonexistent-id');
      expect(workflow).toBeNull();
    });

    it('should get single-file workflow', async () => {
      const workflowContent = '// @name Test Workflow\nprint("hello")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      const id = workflows[0]?.id;
      expect(id).toBeDefined();

      const workflow = await repository.get(id!);
      expect(workflow).not.toBeNull();
      expect(workflow?.metadata.name).toBe('Test Workflow');
      expect(workflow?.mainFileContent).toBe(workflowContent);
      expect(workflow?.attachments).toEqual([]);
    });

    it('should get multi-file workflow with attachments', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map([
          ['data.txt', Buffer.from('test data')],
          ['config.json', Buffer.from('{"test": true}')]
        ]),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: 'A test workflow',
        author: 'Test Author',
        tags: ['test'],
        path: 'test',
        mainFile: 'main.xxp',
      });

      const workflow = await repository.get(metadata.id);
      expect(workflow).not.toBeNull();
      expect(workflow?.metadata.name).toBe('Test Workflow');
      expect(workflow?.mainFileContent).toBe('print("hello")');
      expect(workflow?.attachments).toHaveLength(2);
    });

    it('should return null if content cannot be loaded', async () => {
      // Create workflow directory but no main file
      const workflowDir = path.join(tempDir, 'badworkflow');
      await fs.mkdir(workflowDir, { recursive: true });
      
      const metadata = {
        id: 'bad-id',
        name: 'Bad Workflow',
        description: '',
        author: 'Unknown',
        tags: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
        path: 'badworkflow',
        hasAttachments: false,
        mainFile: 'missing.xxp'
      };
      
      await fs.writeFile(path.join(workflowDir, 'workflow.json'), JSON.stringify(metadata));

      const workflow = await repository.get('bad-id');
      expect(workflow).toBeNull();
    });
  });

  describe('getContent', () => {
    it('should return null for non-existent workflow', async () => {
      const content = await repository.getContent('nonexistent-id');
      expect(content).toBeNull();
    });

    it('should get content for single-file workflow', async () => {
      const workflowContent = '// @name Test\nprint("hello")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      const id = workflows[0]?.id;

      const content = await repository.getContent(id!);
      expect(content).not.toBeNull();
      expect(content?.mainFile).toBe(workflowContent);
      expect(content?.attachments.size).toBe(0);
    });

    it('should get content for multi-file workflow', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map([['data.txt', Buffer.from('test data')]]),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: '',
        author: 'Test Author',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp',
      });

      const content = await repository.getContent(metadata.id);
      expect(content).not.toBeNull();
      expect(content?.mainFile).toBe('print("hello")');
      expect(content?.attachments.size).toBe(1);
      expect(content?.attachments.get('data.txt')).toEqual(Buffer.from('test data'));
    });

    it('should return null if main file is missing', async () => {
      const workflowDir = path.join(tempDir, 'badworkflow');
      await fs.mkdir(workflowDir, { recursive: true });
      
      const metadata = {
        id: 'bad-id',
        name: 'Bad Workflow',
        description: '',
        author: 'Unknown',
        tags: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
        path: 'badworkflow',
        hasAttachments: false,
        mainFile: 'missing.xxp'
      };
      
      await fs.writeFile(path.join(workflowDir, 'workflow.json'), JSON.stringify(metadata));

      const content = await repository.getContent('bad-id');
      expect(content).toBeNull();
    });
  });

  describe('upload', () => {
    it('should upload workflow with main file only', async () => {
      const workflowContent = {
        mainFile: 'print("hello world")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: 'A test workflow',
        author: 'Test Author',
        tags: ['test', 'demo'],
        path: 'test',
        mainFile: 'main.xxp',
      });

      expect(metadata.id).toBeDefined();
      expect(metadata.name).toBe('Test Workflow');
      expect(metadata.description).toBe('A test workflow');
      expect(metadata.author).toBe('Test Author');
      expect(metadata.tags).toEqual(['test', 'demo']);
      expect(metadata.path).toBe('test/Test_Workflow');
      expect(metadata.mainFile).toBe('main.xxp');
      expect(metadata.hasAttachments).toBe(false);
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.modifiedAt).toBeInstanceOf(Date);
    });

    it('should upload workflow with attachments', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map([
          ['data.csv', Buffer.from('col1,col2\nval1,val2')],
          ['config.json', Buffer.from('{"setting": "value"}')]
        ]),
      };

      const metadata = await repository.upload('project', workflowContent, {
        name: 'Data Processing',
        description: 'Process CSV data',
        author: 'Data Scientist',
        tags: ['data', 'csv'],
        path: 'project',
        mainFile: 'process.xxp',
      });

      expect(metadata.hasAttachments).toBe(true);

      // Verify files were created
      const workflowDir = path.join(tempDir, metadata.path);
      const mainFileExists = await fs.access(path.join(workflowDir, 'process.xxp')).then(() => true, () => false);
      const dataFileExists = await fs.access(path.join(workflowDir, 'data.csv')).then(() => true, () => false);
      const configFileExists = await fs.access(path.join(workflowDir, 'config.json')).then(() => true, () => false);

      expect(mainFileExists).toBe(true);
      expect(dataFileExists).toBe(true);
      expect(configFileExists).toBe(true);
    });

    it('should throw error if workflow already exists', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map<string, Buffer>(),
      };

      const uploadData = {
        name: 'Duplicate Workflow',
        description: 'This will be duplicated',
        author: 'Test Author',
        tags: ['test'],
        path: 'test',
        mainFile: 'main.xxp',
      };

      // First upload should succeed
      await repository.upload('test', workflowContent, uploadData);

      // Second upload should fail
      await expect(repository.upload('test', workflowContent, uploadData))
        .rejects.toThrow('Workflow "Duplicate Workflow" already exists');
    });

    it('should throw error if directory already exists', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map<string, Buffer>(),
      };

      // Create directory manually
      const workflowDir = path.join(tempDir, 'test', 'Existing_Dir');
      await fs.mkdir(workflowDir, { recursive: true });

      await expect(repository.upload('test', workflowContent, {
        name: 'Existing Dir',
        description: 'This directory exists',
        author: 'Test Author',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp',
      })).rejects.toThrow('Directory "Existing_Dir" already exists');
    });

    it('should sanitize workflow names', async () => {
      const workflowContent = {
        mainFile: 'print("hello")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Invalid<>Name|With?*Special/Characters',
        description: 'Testing name sanitization',
        author: 'Test Author',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp',
      });

      expect(metadata.path).toBe('test/Invalid--Name-With--Special-Characters');
    });
  });

  describe('update', () => {
    let existingWorkflow: WorkflowMetadata;

    beforeEach(async () => {
      const workflowContent = {
        mainFile: 'print("original")',
        attachments: new Map([['old.txt', Buffer.from('old data')]]),
      };

      existingWorkflow = await repository.upload('test', workflowContent, {
        name: 'Original Workflow',
        description: 'Original description',
        author: 'Original Author',
        tags: ['original'],
        path: 'test',
        mainFile: 'main.xxp',
      });
    });

    it('should update workflow content and metadata', async () => {
      const newContent = {
        mainFile: 'print("updated")',
        attachments: new Map([
          ['new.txt', Buffer.from('new data')],
          ['config.json', Buffer.from('{"updated": true}')]
        ]),
      };

      const updatedMetadata = await repository.update(existingWorkflow.id, newContent, {
        description: 'Updated description',
        tags: ['updated', 'test'],
      });

      expect(updatedMetadata.id).toBe(existingWorkflow.id);
      expect(updatedMetadata.description).toBe('Updated description');
      expect(updatedMetadata.tags).toEqual(['updated', 'test']);
      expect(updatedMetadata.hasAttachments).toBe(true);
      expect(updatedMetadata.modifiedAt.getTime()).toBeGreaterThan(existingWorkflow.modifiedAt.getTime());

      // Verify content was updated
      const content = await repository.getContent(existingWorkflow.id);
      expect(content?.mainFile).toBe('print("updated")');
      expect(content?.attachments.size).toBe(2);
      expect(content?.attachments.has('new.txt')).toBe(true);
      expect(content?.attachments.has('config.json')).toBe(true);
      expect(content?.attachments.has('old.txt')).toBe(false); // Old attachment should be removed
    });

    it('should update only metadata without changing content', async () => {
      // Verify original content
      const originalContent = await repository.getContent(existingWorkflow.id);
      expect(originalContent?.mainFile).toBe('print("original")');
      
      // Update only description (minimal metadata change)
      const updatedMetadata = await repository.update(existingWorkflow.id, { 
        mainFile: 'print("original")', // Keep exact original content
        attachments: new Map([['old.txt', Buffer.from('old data')]])  // Keep exact original attachments
      }, {
        description: 'Updated description only',
      });

      expect(updatedMetadata.description).toBe('Updated description only');
      expect(updatedMetadata.name).toBe('Original Workflow'); // Should remain unchanged

      // Verify content is preserved
      const content = await repository.getContent(updatedMetadata.id);
      expect(content?.mainFile).toBe('print("original")');
      expect(content?.attachments.has('old.txt')).toBe(true);
    });

    it('should throw error for non-existent workflow', async () => {
      const newContent = {
        mainFile: 'print("test")',
        attachments: new Map<string, Buffer>(),
      };

      await expect(repository.update('nonexistent-id', newContent, {}))
        .rejects.toThrow('Workflow with id nonexistent-id not found');
    });
  });

  describe('delete', () => {
    it('should delete existing workflow', async () => {
      const workflowContent = {
        mainFile: 'print("to be deleted")',
        attachments: new Map([['file.txt', Buffer.from('data')]]),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Delete Me',
        description: 'This workflow will be deleted',
        author: 'Test Author',
        tags: ['delete'],
        path: 'test',
        mainFile: 'main.xxp',
      });

      const result = await repository.delete(metadata.id);
      expect(result).toBe(true);

      // Verify workflow is gone
      const workflows = await repository.list();
      expect(workflows.find(w => w.id === metadata.id)).toBeUndefined();

      // Verify directory was removed
      const workflowDir = path.join(tempDir, metadata.path);
      const dirExists = await fs.access(workflowDir).then(() => true, () => false);
      expect(dirExists).toBe(false);
    });

    it('should return false for non-existent workflow', async () => {
      const result = await repository.delete('nonexistent-id');
      expect(result).toBe(false);
    });

    it('should handle deletion errors gracefully', async () => {
      // Create a workflow
      const workflowContent = {
        mainFile: 'print("test")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: '',
        author: 'Test Author',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp',
      });

      // Manually delete the directory to simulate file system error
      const workflowDir = path.join(tempDir, metadata.path);
      await fs.rm(workflowDir, { recursive: true, force: true });

      const result = await repository.delete(metadata.id);
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing workflow', async () => {
      const workflowContent = {
        mainFile: 'print("exists")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Existing Workflow',
        description: '',
        author: 'Test Author',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp',
      });

      const exists = await repository.exists(metadata.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent workflow', async () => {
      const exists = await repository.exists('nonexistent-id');
      expect(exists).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test workflows
      const workflows = [
        {
          name: 'Data Analysis',
          description: 'Analyze customer data',
          author: 'Alice Johnson',
          tags: ['data', 'analysis', 'python'],
          path: 'analytics'
        },
        {
          name: 'Web Scraper',
          description: 'Scrape website data',
          author: 'Bob Smith',
          tags: ['web', 'scraping', 'automation'],
          path: 'automation'
        },
        {
          name: 'ML Model Training',
          description: 'Train machine learning models',
          author: 'Alice Johnson',
          tags: ['ml', 'training', 'python'],
          path: 'ml'
        }
      ];

      for (const workflow of workflows) {
        await repository.upload(workflow.path, {
          mainFile: `print("${workflow.name}")`,
          attachments: new Map(),
        }, {
          name: workflow.name,
          description: workflow.description,
          author: workflow.author,
          tags: workflow.tags,
          path: workflow.path,
          mainFile: 'main.xxp',
        });
      }
    });

    it('should search by query in name', async () => {
      const results = await repository.search({ query: 'Data' });
      expect(results).toHaveLength(2); // "Data Analysis" and "Scrape website data"
    });

    it('should search by query in description', async () => {
      const results = await repository.search({ query: 'website' });
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('Web Scraper');
    });

    it('should search by author', async () => {
      const results = await repository.search({ author: 'Alice' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.author === 'Alice Johnson')).toBe(true);
    });

    it('should search by tags', async () => {
      const results = await repository.search({ tags: ['python'] });
      expect(results).toHaveLength(2);
    });

    it('should search by multiple criteria', async () => {
      const results = await repository.search({ 
        author: 'Alice',
        tags: ['data']
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('Data Analysis');
    });

    it('should search by path', async () => {
      const results = await repository.search({ path: 'ml' });
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('ML Model Training');
    });

    it('should apply limit and offset', async () => {
      const limitedResults = await repository.search({ limit: 2 });
      expect(limitedResults).toHaveLength(2);

      const offsetResults = await repository.search({ offset: 1, limit: 2 });
      expect(offsetResults).toHaveLength(2);
    });

    it('should return empty array for no matches', async () => {
      const results = await repository.search({ query: 'nonexistent' });
      expect(results).toEqual([]);
    });
  });

  describe('getTreeStructure', () => {
    beforeEach(async () => {
      // Create nested directory structure with workflows
      await repository.upload('root', {
        mainFile: 'print("root")',
        attachments: new Map(),
      }, {
        name: 'Root Workflow',
        description: '',
        author: 'Test Author',
        tags: [],
        path: 'root',
        mainFile: 'main.xxp',
      });

      await repository.upload('folder1/subfolder', {
        mainFile: 'print("nested")',
        attachments: new Map(),
      }, {
        name: 'Nested Workflow',
        description: '',
        author: 'Test Author',
        tags: [],
        path: 'folder1/subfolder',
        mainFile: 'main.xxp',
      });

      // Create single-file workflow
      await fs.writeFile(path.join(tempDir, 'single.xxp'), '// @name Single File\nprint("single")');
      
      // Create empty folder
      await fs.mkdir(path.join(tempDir, 'empty'), { recursive: true });
    });

    it('should build tree structure for entire repository', async () => {
      const tree = await repository.getTreeStructure();
      
      expect(tree.name).toBe('Repository');
      expect(tree.type).toBe('folder');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBeGreaterThan(0);

      // Should include single file workflow
      const singleFile = tree.children!.find(c => c.name === 'single.xxp');
      expect(singleFile).toBeDefined();
      expect(singleFile?.type).toBe('workflow');

      // Should include folder structure
      const folder1 = tree.children!.find(c => c.name === 'folder1');
      expect(folder1).toBeDefined();
      expect(folder1?.type).toBe('folder');
    });

    it('should build tree structure for specific path', async () => {
      const tree = await repository.getTreeStructure('folder1');
      
      expect(tree.name).toBe('folder1');
      expect(tree.type).toBe('folder');
      expect(tree.children).toBeDefined();
      
      // The tree structure shows directories that contain workflows
      // In this case, folder1/subfolder is uploaded as a multi-file workflow
      // so "subfolder" should be a workflow directory with a workflow.json file
      const children = tree.children!;
      expect(children.length).toBeGreaterThan(0);
      
      // Since we uploaded to 'folder1/subfolder', subfolder should contain the workflow
      const subfolder = children.find(c => c.name === 'subfolder');
      expect(subfolder).toBeDefined();
      
      // Multi-file workflows in their own directories appear as 'workflow' type when they have workflow.json
      if (subfolder?.type === 'workflow') {
        expect(subfolder.metadata).toBeDefined();
        expect(subfolder.metadata?.name).toBe('Nested Workflow');
      } else {
        // If it appears as folder, it should have children with the workflow
        expect(subfolder?.type).toBe('folder');
        expect(subfolder?.children).toBeDefined();
      }
    });

    it('should handle non-existent path', async () => {
      const tree = await repository.getTreeStructure('nonexistent');
      
      expect(tree.name).toBe('nonexistent');
      expect(tree.type).toBe('folder');
      expect(tree.children).toEqual([]);
    });

    it('should not include empty folders in tree', async () => {
      const tree = await repository.getTreeStructure();
      
      const emptyFolder = tree.children!.find(c => c.name === 'empty');
      expect(emptyFolder).toBeUndefined();
    });
  });

  describe('version support removal', () => {
    it('should no longer include version in workflow metadata', async () => {
      const workflowContent = {
        mainFile: '// @name Test Workflow\nprint("hello")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: 'A test workflow',
        author: 'Test Author',
        tags: ['test'],
        path: 'test',
        mainFile: 'main.xxp',
      });

      expect(metadata).not.toHaveProperty('version');

      // Verify the workflow can be retrieved without version
      const retrieved = await repository.get(metadata.id);
      expect(retrieved?.metadata).not.toHaveProperty('version');
    });

    it('should no longer extract version from file comments', async () => {
      const workflowContent = '// @name Test\n// @version 1.2.3\nprint("test")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]).not.toHaveProperty('version');
    });

    it('should work without any version-related metadata', async () => {
      const workflowContent = '// @name Test\nprint("test")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]).not.toHaveProperty('version');
      expect(workflows[0]?.name).toBe('Test');
    });
  });
});