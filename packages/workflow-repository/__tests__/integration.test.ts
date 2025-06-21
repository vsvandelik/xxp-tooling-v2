import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import { WorkflowRepositoryManager } from '../src/managers/WorkflowRepositoryManager.js';
import { RepositoryConfig } from '../src/models/RepositoryConfig.js';
import { WorkflowContent } from '../src/models/WorkflowItem.js';

describe('Integration Tests', () => {
  let manager: WorkflowRepositoryManager;
  let tempDir1: string;
  let tempDir2: string;

  beforeEach(async () => {
    tempDir1 = await fs.mkdtemp('test-repo1-');
    tempDir2 = await fs.mkdtemp('test-repo2-');
    manager = new WorkflowRepositoryManager();
  });

  afterEach(async () => {
    await fs.rm(tempDir1, { recursive: true, force: true });
    await fs.rm(tempDir2, { recursive: true, force: true });
  });

  describe('Multi-repository workflow management', () => {
    beforeEach(() => {
      const config1: RepositoryConfig = {
        type: 'local',
        name: 'repo1',
        path: tempDir1,
        isDefault: true
      };

      const config2: RepositoryConfig = {
        type: 'local',
        name: 'repo2',
        path: tempDir2
      };

      manager.addRepository(config1);
      manager.addRepository(config2);
    });

    it('should manage workflows across multiple repositories', async () => {
      const workflowContent: WorkflowContent = {
        mainFile: 'print("Hello from integration test")',
        attachments: new Map([
          ['data.txt', Buffer.from('Integration test data')],
          ['config.json', Buffer.from('{"integration": true}')]
        ])
      };

      const metadata = {
        name: 'Integration Test Workflow',
        description: 'Testing cross-repository functionality',
        author: 'Test Suite',
        tags: ['integration', 'test'],
        path: 'integration',
        mainFile: 'main.xxp'
      };

      // Upload to repo1 (default)
      const uploadedMetadata1 = await manager.uploadWorkflow('test', workflowContent, metadata);
      expect(uploadedMetadata1.name).toBe('Integration Test Workflow');

      // Upload to repo2 (explicit)
      const uploadedMetadata2 = await manager.uploadWorkflow('test', workflowContent, {
        ...metadata,
        name: 'Integration Test Workflow 2'
      }, 'repo2');
      expect(uploadedMetadata2.name).toBe('Integration Test Workflow 2');

      // List workflows from repo1
      const repo1Workflows = await manager.listWorkflows('repo1');
      expect(repo1Workflows).toHaveLength(1);
      expect(repo1Workflows[0]?.name).toBe('Integration Test Workflow');

      // List workflows from repo2
      const repo2Workflows = await manager.listWorkflows('repo2');
      expect(repo2Workflows).toHaveLength(1);
      expect(repo2Workflows[0]?.name).toBe('Integration Test Workflow 2');

      // Search across all repositories
      const searchResults = await manager.searchAllRepositories({ query: 'Integration' });
      expect(searchResults.size).toBe(2);
      expect(searchResults.get('repo1')).toHaveLength(1);
      expect(searchResults.get('repo2')).toHaveLength(1);

      // Get workflow from specific repository
      const workflow1 = await manager.getWorkflow(uploadedMetadata1.id, 'repo1');
      expect(workflow1).not.toBeNull();
      expect(workflow1?.metadata.name).toBe('Integration Test Workflow');
      expect(workflow1?.mainFileContent).toBe('print("Hello from integration test")');
      expect(workflow1?.attachments).toHaveLength(2);

      // Update workflow in repo1
      const updatedMetadata = await manager.updateWorkflow(uploadedMetadata1.id, {
        mainFile: 'print("Updated integration test")',
        attachments: new Map([['updated.txt', Buffer.from('Updated data')]])
      }, {
        description: 'Updated description'
      }, 'repo1');

      expect(updatedMetadata.description).toBe('Updated description');

      // Verify update
      const updatedWorkflow = await manager.getWorkflow(uploadedMetadata1.id, 'repo1');
      expect(updatedWorkflow?.mainFileContent).toBe('print("Updated integration test")');
      expect(updatedWorkflow?.attachments).toHaveLength(1);
      expect(updatedWorkflow?.attachments[0]?.name).toBe('updated.txt');

      // Delete workflow from repo2
      const deleteResult = await manager.deleteWorkflow(uploadedMetadata2.id, 'repo2');
      expect(deleteResult).toBe(true);

      // Verify deletion
      const repo2WorkflowsAfterDelete = await manager.listWorkflows('repo2');
      expect(repo2WorkflowsAfterDelete).toHaveLength(0);
    });

    it('should handle tree structure across repositories', async () => {
      // Create workflows in different paths
      const workflowContent: WorkflowContent = {
        mainFile: 'print("tree test")',
        attachments: new Map()
      };

      await manager.uploadWorkflow('folder1/subfolder', workflowContent, {
        name: 'Nested Workflow 1',
        description: 'In folder1/subfolder',
        author: 'Test',
        tags: [],
        path: 'folder1/subfolder',
        mainFile: 'main.xxp'
      }, 'repo1');

      await manager.uploadWorkflow('folder2', workflowContent, {
        name: 'Nested Workflow 2',
        description: 'In folder2',
        author: 'Test',
        tags: [],
        path: 'folder2',
        mainFile: 'main.xxp'
      }, 'repo2');

      // Get tree structures
      const tree1 = await manager.getTreeStructure('repo1');
      expect(tree1.name).toBe('Repository');
      expect(tree1.children).toBeDefined();
      expect(tree1.children!.length).toBeGreaterThan(0);

      const tree2 = await manager.getTreeStructure('repo2');
      expect(tree2.name).toBe('Repository');
      expect(tree2.children).toBeDefined();
      expect(tree2.children!.length).toBeGreaterThan(0);

      // Get specific subtree
      const subtree = await manager.getTreeStructure('repo1', 'folder1');
      expect(subtree.name).toBe('folder1');
    });

    it('should handle repository configuration operations', async () => {
      // Test repository listing
      const repositories = manager.listRepositories();
      expect(repositories).toHaveLength(2);
      expect(repositories.map(r => r.name)).toContain('repo1');
      expect(repositories.map(r => r.name)).toContain('repo2');

      // Test configuration retrieval
      const config1 = manager.getRepositoryConfig('repo1');
      expect(config1).not.toBeNull();
      expect(config1?.type).toBe('local');
      expect(config1?.isDefault).toBe(true);

      const config2 = manager.getRepositoryConfig('repo2');
      expect(config2).not.toBeNull();
      expect(config2?.type).toBe('local');
      expect(config2?.isDefault).toBeFalsy();

      // Test default repository
      const defaultRepo = manager.getRepository();
      expect(defaultRepo).not.toBeNull();

      const specificRepo = manager.getRepository('repo2');
      expect(specificRepo).not.toBeNull();

      // Test repository removal
      const removeResult = manager.removeRepository('repo2');
      expect(removeResult).toBe(true);

      const updatedRepositories = manager.listRepositories();
      expect(updatedRepositories).toHaveLength(1);
      expect(updatedRepositories[0]?.name).toBe('repo1');
    });
  });

  describe('Error handling and edge cases', () => {
    beforeEach(() => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'test-repo',
        path: tempDir1,
        isDefault: true
      };

      manager.addRepository(config);
    });

    it('should handle invalid workflow operations gracefully', async () => {
      // Test operations on non-existent workflow
      const nonExistentWorkflow = await manager.getWorkflow('nonexistent-id');
      expect(nonExistentWorkflow).toBeNull();

      // Test update on non-existent workflow
      await expect(manager.updateWorkflow('nonexistent-id', {
        mainFile: 'test',
        attachments: new Map()
      }, {})).rejects.toThrow();

      // Test delete on non-existent workflow
      const deleteResult = await manager.deleteWorkflow('nonexistent-id');
      expect(deleteResult).toBe(false);
    });

    it('should handle search with no results', async () => {
      const searchResults = await manager.searchWorkflows({ query: 'nonexistent' });
      expect(searchResults).toEqual([]);

      const allSearchResults = await manager.searchAllRepositories({ query: 'nonexistent' });
      expect(allSearchResults.get('test-repo')).toEqual([]);
    });

    it('should handle edge cases in workflow content', async () => {
      // Test with empty main file
      const emptyContent: WorkflowContent = {
        mainFile: '',
        attachments: new Map()
      };

      const uploadResult = await manager.uploadWorkflow('test', emptyContent, {
        name: 'Empty Workflow',
        description: 'Testing empty content',
        author: 'Test',
        tags: [],
        path: 'test',
        mainFile: 'main.xxp'
      });

      expect(uploadResult.name).toBe('Empty Workflow');

      const retrievedWorkflow = await manager.getWorkflow(uploadResult.id);
      expect(retrievedWorkflow?.mainFileContent).toBe('');
      expect(retrievedWorkflow?.attachments).toHaveLength(0);

      // Test with large attachment
      const largeData = Buffer.alloc(1024 * 1024, 'x'); // 1MB of 'x'
      const largeContent: WorkflowContent = {
        mainFile: 'print("large attachment test")',
        attachments: new Map([['large.txt', largeData]])
      };

      const largeUploadResult = await manager.uploadWorkflow('test', largeContent, {
        name: 'Large Attachment Workflow',
        description: 'Testing large attachment',
        author: 'Test',
        tags: ['large'],
        path: 'test',
        mainFile: 'main.xxp'
      });

      expect(largeUploadResult.hasAttachments).toBe(true);

      const largeWorkflow = await manager.getWorkflow(largeUploadResult.id);
      expect(largeWorkflow?.attachments).toHaveLength(1);
      expect(largeWorkflow?.attachments[0]?.size).toBe(1024 * 1024);
    });
  });

  describe('Workflow metadata extraction and validation', () => {
    beforeEach(() => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'test-repo',
        path: tempDir1,
        isDefault: true
      };

      manager.addRepository(config);
    });

    it('should handle workflows with various metadata formats', async () => {
      // Test workflow with comprehensive metadata
      const workflowContent: WorkflowContent = {
        mainFile: `// @name Comprehensive Test
// @description A workflow with all metadata
// @author Integration Test Suite
// @tags test,comprehensive,metadata
print("comprehensive test")`,
        attachments: new Map()
      };

      // Create a single-file workflow by writing directly to filesystem
      const workflowFile = `${tempDir1}/comprehensive.xxp`;
      await fs.writeFile(workflowFile, workflowContent.mainFile);

      // List workflows to trigger metadata extraction
      const workflows = await manager.listWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0]!;
      expect(workflow.name).toBe('Comprehensive Test');
      expect(workflow.description).toBe('A workflow with all metadata');
      expect(workflow.author).toBe('Integration Test Suite');
      expect(workflow.tags).toContain('test');
      expect(workflow.tags).toContain('comprehensive');
      expect(workflow.tags).toContain('metadata');
    });

    it('should handle workflows with minimal metadata', async () => {
      // Create workflow with only name
      const minimalContent = `// @name Minimal Test
print("minimal")`;

      const workflowFile = `${tempDir1}/minimal.xxp`;
      await fs.writeFile(workflowFile, minimalContent);

      const workflows = await manager.listWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0]!;
      expect(workflow.name).toBe('Minimal Test');
      expect(workflow.description).toBe('Single-file workflow: minimal.xxp');
      expect(workflow.author).toBe('Unknown');
      expect(workflow.tags).toEqual([]);
    });

    it('should handle workflows with no metadata comments', async () => {
      // Create workflow without any metadata comments
      const noMetadataContent = `print("no metadata")`;

      const workflowFile = `${tempDir1}/no-metadata.xxp`;
      await fs.writeFile(workflowFile, noMetadataContent);

      const workflows = await manager.listWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0]!;
      expect(workflow.name).toBe('no-metadata'); // Should use filename
      expect(workflow.description).toBe('Single-file workflow: no-metadata.xxp');
      expect(workflow.author).toBe('Unknown');
      expect(workflow.tags).toEqual([]);
    });
  });
});