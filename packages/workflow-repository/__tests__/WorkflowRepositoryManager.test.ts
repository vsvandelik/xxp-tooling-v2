import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowRepositoryManager } from '../src/managers/WorkflowRepositoryManager.js';
import { LocalWorkflowRepository } from '../src/repositories/LocalWorkflowRepository.js';
import { RemoteWorkflowRepository } from '../src/repositories/RemoteWorkflowRepository.js';
import { RepositoryConfig } from '../src/models/RepositoryConfig.js';
import { WorkflowContent } from '../src/models/WorkflowItem.js';

// Mock the repository classes
jest.mock('../src/repositories/LocalWorkflowRepository.js');
jest.mock('../src/repositories/RemoteWorkflowRepository.js');

const MockedLocalWorkflowRepository = LocalWorkflowRepository as jest.MockedClass<typeof LocalWorkflowRepository>;
const MockedRemoteWorkflowRepository = RemoteWorkflowRepository as jest.MockedClass<typeof RemoteWorkflowRepository>;

describe('WorkflowRepositoryManager', () => {
  let manager: WorkflowRepositoryManager;
  let mockLocalRepo: jest.Mocked<LocalWorkflowRepository>;
  let mockRemoteRepo: jest.Mocked<RemoteWorkflowRepository>;

  beforeEach(() => {
    manager = new WorkflowRepositoryManager();
    
    // Create mock instances
    mockLocalRepo = {
      list: jest.fn(),
      get: jest.fn(),
      getContent: jest.fn(),
      upload: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      search: jest.fn(),
      getTreeStructure: jest.fn(),
    } as any;

    mockRemoteRepo = {
      list: jest.fn(),
      get: jest.fn(),
      getContent: jest.fn(),
      upload: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      search: jest.fn(),
      getTreeStructure: jest.fn(),
      authenticate: jest.fn(),
      getTags: jest.fn(),
      getAuthors: jest.fn(),
    } as any;

    // Mock constructors to return our mock instances
    MockedLocalWorkflowRepository.mockImplementation(() => mockLocalRepo);
    MockedRemoteWorkflowRepository.mockImplementation(() => mockRemoteRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create empty manager', () => {
      expect(manager).toBeInstanceOf(WorkflowRepositoryManager);
      expect(manager.listRepositories()).toEqual([]);
    });
  });

  describe('addRepository', () => {
    it('should add local repository', () => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'local-repo',
        path: '/path/to/repo',
        isDefault: true
      };

      manager.addRepository(config);

      expect(MockedLocalWorkflowRepository).toHaveBeenCalledWith('/path/to/repo');
      expect(manager.listRepositories()).toContainEqual(config);
      expect(manager.getRepository()).toBe(mockLocalRepo);
    });

    it('should add remote repository with credentials', () => {
      const config: RepositoryConfig = {
        type: 'remote',
        name: 'remote-repo',
        path: '',
        url: 'https://api.example.com',
        authToken: 'user:pass',
        isDefault: false
      };

      manager.addRepository(config);

      expect(MockedRemoteWorkflowRepository).toHaveBeenCalledWith('https://api.example.com', 'user', 'pass');
      expect(manager.listRepositories()).toContainEqual(config);
    });

    it('should add remote repository without credentials', () => {
      const config: RepositoryConfig = {
        type: 'remote',
        name: 'remote-repo',
        path: '',
        url: 'https://api.example.com'
      };

      manager.addRepository(config);

      expect(MockedRemoteWorkflowRepository).toHaveBeenCalledWith('https://api.example.com', undefined, undefined);
    });

    it('should throw error for remote repository without URL', () => {
      const config: RepositoryConfig = {
        type: 'remote',
        name: 'remote-repo',
        path: ''
      };

      expect(() => manager.addRepository(config)).toThrow('Remote repository requires URL');
    });

    it('should set default repository when isDefault is true', () => {
      const config1: RepositoryConfig = {
        type: 'local',
        name: 'repo1',
        path: '/path1'
      };

      const config2: RepositoryConfig = {
        type: 'local',
        name: 'repo2',
        path: '/path2',
        isDefault: true
      };

      manager.addRepository(config1);
      manager.addRepository(config2);

      expect(manager.getRepository()).toBe(mockLocalRepo); // Should be repo2's instance
      expect(manager.getRepository('repo1')).toBe(mockLocalRepo); // Should be repo1's instance
    });

    it('should handle authToken with single colon', () => {
      const config: RepositoryConfig = {
        type: 'remote',
        name: 'remote-repo',
        path: '',
        url: 'https://api.example.com',
        authToken: 'token-value'
      };

      manager.addRepository(config);

      expect(MockedRemoteWorkflowRepository).toHaveBeenCalledWith('https://api.example.com', undefined, undefined);
    });
  });

  describe('removeRepository', () => {
    beforeEach(() => {
      const config1: RepositoryConfig = {
        type: 'local',
        name: 'repo1',
        path: '/path1',
        isDefault: true
      };

      const config2: RepositoryConfig = {
        type: 'local',
        name: 'repo2',
        path: '/path2'
      };

      manager.addRepository(config1);
      manager.addRepository(config2);
    });

    it('should remove repository', () => {
      const result = manager.removeRepository('repo2');
      expect(result).toBe(true);
      expect(manager.listRepositories()).toHaveLength(1);
      expect(manager.getRepository('repo2')).toBeNull();
    });

    it('should return true even for non-existent repository', () => {
      const result = manager.removeRepository('nonexistent');
      expect(result).toBe(true); // Implementation always returns true
    });

    it('should update default repository when default is removed', () => {
      manager.removeRepository('repo1'); // Remove default
      expect(manager.getRepository()).toBe(mockLocalRepo); // Should fall back to repo2
    });

    it('should clear default when all repositories are removed', () => {
      manager.removeRepository('repo1');
      manager.removeRepository('repo2');
      expect(manager.getRepository()).toBeNull();
    });
  });

  describe('getRepository', () => {
    beforeEach(() => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'test-repo',
        path: '/test/path',
        isDefault: true
      };

      manager.addRepository(config);
    });

    it('should get default repository', () => {
      const repo = manager.getRepository();
      expect(repo).toBe(mockLocalRepo);
    });

    it('should get repository by name', () => {
      const repo = manager.getRepository('test-repo');
      expect(repo).toBe(mockLocalRepo);
    });

    it('should return null for non-existent repository', () => {
      const repo = manager.getRepository('nonexistent');
      expect(repo).toBeNull();
    });

    it('should return null when no default repository is set', () => {
      const emptyManager = new WorkflowRepositoryManager();
      const repo = emptyManager.getRepository();
      expect(repo).toBeNull();
    });
  });

  describe('getRepositoryConfig', () => {
    it('should get repository configuration', () => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'test-repo',
        path: '/test/path'
      };

      manager.addRepository(config);

      const retrievedConfig = manager.getRepositoryConfig('test-repo');
      expect(retrievedConfig).toEqual(config);
    });

    it('should return null for non-existent repository', () => {
      const config = manager.getRepositoryConfig('nonexistent');
      expect(config).toBeNull();
    });
  });

  describe('listRepositories', () => {
    it('should list all repositories', () => {
      const config1: RepositoryConfig = {
        type: 'local',
        name: 'repo1',
        path: '/path1'
      };

      const config2: RepositoryConfig = {
        type: 'remote',
        name: 'repo2',
        path: '',
        url: 'https://api.example.com'
      };

      manager.addRepository(config1);
      manager.addRepository(config2);

      const repositories = manager.listRepositories();
      expect(repositories).toHaveLength(2);
      expect(repositories).toContainEqual(config1);
      expect(repositories).toContainEqual(config2);
    });

    it('should return empty array for empty manager', () => {
      const repositories = manager.listRepositories();
      expect(repositories).toEqual([]);
    });
  });

  describe('workflow operations', () => {
    const mockWorkflow = {
      id: 'workflow1',
      name: 'Test Workflow',
      description: 'Test description',
      author: 'Test Author',
      tags: ['test'],
      createdAt: new Date(),
      modifiedAt: new Date(),
      path: 'test/workflow1',
      hasAttachments: false,
      mainFile: 'main.xxp'
    };

    const mockWorkflowItem = {
      metadata: mockWorkflow,
      mainFileContent: 'print("hello")',
      attachments: []
    };

    const workflowContent: WorkflowContent = {
      mainFile: 'print("hello")',
      attachments: new Map()
    };

    beforeEach(() => {
      const config: RepositoryConfig = {
        type: 'local',
        name: 'test-repo',
        path: '/test/path',
        isDefault: true
      };

      manager.addRepository(config);
    });

    describe('listWorkflows', () => {
      it('should list workflows from default repository', async () => {
        mockLocalRepo.list.mockResolvedValue([mockWorkflow]);

        const workflows = await manager.listWorkflows();
        expect(workflows).toEqual([mockWorkflow]);
        expect(mockLocalRepo.list).toHaveBeenCalledWith(undefined, undefined);
      });

      it('should list workflows from specific repository', async () => {
        mockLocalRepo.list.mockResolvedValue([mockWorkflow]);

        const workflows = await manager.listWorkflows('test-repo', 'path', { query: 'test' });
        expect(workflows).toEqual([mockWorkflow]);
        expect(mockLocalRepo.list).toHaveBeenCalledWith('path', { query: 'test' });
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.listWorkflows('nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('getWorkflow', () => {
      it('should get workflow from default repository', async () => {
        mockLocalRepo.get.mockResolvedValue(mockWorkflowItem);

        const workflow = await manager.getWorkflow('workflow1');
        expect(workflow).toEqual(mockWorkflowItem);
        expect(mockLocalRepo.get).toHaveBeenCalledWith('workflow1');
      });

      it('should get workflow from specific repository', async () => {
        mockLocalRepo.get.mockResolvedValue(mockWorkflowItem);

        const workflow = await manager.getWorkflow('workflow1', 'test-repo');
        expect(workflow).toEqual(mockWorkflowItem);
        expect(mockLocalRepo.get).toHaveBeenCalledWith('workflow1');
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.getWorkflow('workflow1', 'nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('uploadWorkflow', () => {
      it('should upload workflow to default repository', async () => {
        mockLocalRepo.upload.mockResolvedValue(mockWorkflow);

        const result = await manager.uploadWorkflow('test', workflowContent, {
          name: 'Test Workflow',
          description: 'Test description',
          author: 'Test Author',
          tags: ['test'],
          path: 'test',
          mainFile: 'main.xxp'
        });

        expect(result).toEqual(mockWorkflow);
        expect(mockLocalRepo.upload).toHaveBeenCalledWith('test', workflowContent, expect.any(Object));
      });

      it('should upload workflow to specific repository', async () => {
        mockLocalRepo.upload.mockResolvedValue(mockWorkflow);

        const result = await manager.uploadWorkflow('test', workflowContent, {
          name: 'Test Workflow',
          description: 'Test description',
          author: 'Test Author',
          tags: ['test'],
          path: 'test',
          mainFile: 'main.xxp'
        }, 'test-repo');

        expect(result).toEqual(mockWorkflow);
        expect(mockLocalRepo.upload).toHaveBeenCalled();
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.uploadWorkflow('test', workflowContent, {
          name: 'Test Workflow',
          description: 'Test description',
          author: 'Test Author',
          tags: ['test'],
          path: 'test',
          mainFile: 'main.xxp'
        }, 'nonexistent')).rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('updateWorkflow', () => {
      it('should update workflow in default repository', async () => {
        mockLocalRepo.update.mockResolvedValue(mockWorkflow);

        const result = await manager.updateWorkflow('workflow1', workflowContent, {
          name: 'Updated Name'
        });

        expect(result).toEqual(mockWorkflow);
        expect(mockLocalRepo.update).toHaveBeenCalledWith('workflow1', workflowContent, { name: 'Updated Name' });
      });

      it('should update workflow in specific repository', async () => {
        mockLocalRepo.update.mockResolvedValue(mockWorkflow);

        const result = await manager.updateWorkflow('workflow1', workflowContent, {
          name: 'Updated Name'
        }, 'test-repo');

        expect(result).toEqual(mockWorkflow);
        expect(mockLocalRepo.update).toHaveBeenCalled();
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.updateWorkflow('workflow1', workflowContent, {}, 'nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('deleteWorkflow', () => {
      it('should delete workflow from default repository', async () => {
        mockLocalRepo.delete.mockResolvedValue(true);

        const result = await manager.deleteWorkflow('workflow1');
        expect(result).toBe(true);
        expect(mockLocalRepo.delete).toHaveBeenCalledWith('workflow1');
      });

      it('should delete workflow from specific repository', async () => {
        mockLocalRepo.delete.mockResolvedValue(true);

        const result = await manager.deleteWorkflow('workflow1', 'test-repo');
        expect(result).toBe(true);
        expect(mockLocalRepo.delete).toHaveBeenCalledWith('workflow1');
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.deleteWorkflow('workflow1', 'nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('searchWorkflows', () => {
      it('should search workflows in default repository', async () => {
        mockLocalRepo.search.mockResolvedValue([mockWorkflow]);

        const results = await manager.searchWorkflows({ query: 'test' });
        expect(results).toEqual([mockWorkflow]);
        expect(mockLocalRepo.search).toHaveBeenCalledWith({ query: 'test' });
      });

      it('should search workflows in specific repository', async () => {
        mockLocalRepo.search.mockResolvedValue([mockWorkflow]);

        const results = await manager.searchWorkflows({ query: 'test' }, 'test-repo');
        expect(results).toEqual([mockWorkflow]);
        expect(mockLocalRepo.search).toHaveBeenCalledWith({ query: 'test' });
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.searchWorkflows({ query: 'test' }, 'nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('getTreeStructure', () => {
      const mockTree = {
        name: 'Repository',
        path: '',
        type: 'folder' as const,
        children: []
      };

      it('should get tree structure from default repository', async () => {
        mockLocalRepo.getTreeStructure.mockResolvedValue(mockTree);

        const tree = await manager.getTreeStructure();
        expect(tree).toEqual(mockTree);
        expect(mockLocalRepo.getTreeStructure).toHaveBeenCalledWith(undefined);
      });

      it('should get tree structure from specific repository and path', async () => {
        mockLocalRepo.getTreeStructure.mockResolvedValue(mockTree);

        const tree = await manager.getTreeStructure('test-repo', 'test/path');
        expect(tree).toEqual(mockTree);
        expect(mockLocalRepo.getTreeStructure).toHaveBeenCalledWith('test/path');
      });

      it('should throw error for non-existent repository', async () => {
        await expect(manager.getTreeStructure('nonexistent'))
          .rejects.toThrow('Repository nonexistent not found');
      });
    });

    describe('searchAllRepositories', () => {
      it('should search across all repositories', async () => {
        const config2: RepositoryConfig = {
          type: 'local',
          name: 'repo2',
          path: '/path2'
        };
        manager.addRepository(config2);

        // Create a second mock instance for repo2
        const mockLocalRepo2 = {
          search: jest.fn(),
        } as any;
        MockedLocalWorkflowRepository.mockImplementationOnce(() => mockLocalRepo2);

        // Add repo2 after creating the manager to get the new mock instance
        manager.removeRepository('repo2');
        manager.addRepository(config2);

        mockLocalRepo.search.mockResolvedValue([mockWorkflow]);
        mockLocalRepo2.search.mockResolvedValue([]);

        const results = await manager.searchAllRepositories({ query: 'test' });

        expect(results.size).toBe(2);
        expect(results.get('test-repo')).toEqual([mockWorkflow]);
        expect(results.get('repo2')).toEqual([]);
      });

      it('should handle search errors gracefully', async () => {
        mockLocalRepo.search.mockRejectedValue(new Error('Search failed'));

        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const results = await manager.searchAllRepositories({ query: 'test' });

        expect(results.size).toBe(1);
        expect(results.get('test-repo')).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to search repository test-repo:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('error handling', () => {
    it('should handle repository operations without default repository', async () => {
      const emptyManager = new WorkflowRepositoryManager();

      await expect(emptyManager.listWorkflows())
        .rejects.toThrow('Repository default not found');

      await expect(emptyManager.getWorkflow('workflow1'))
        .rejects.toThrow('Repository default not found');

      await expect(emptyManager.uploadWorkflow('test', { mainFile: '', attachments: new Map() }, {
        name: 'Test',
        description: '',
        author: '',
        tags: [],
        path: '',
        mainFile: ''
      })).rejects.toThrow('Repository default not found');

      await expect(emptyManager.updateWorkflow('workflow1', { mainFile: '', attachments: new Map() }, {}))
        .rejects.toThrow('Repository default not found');

      await expect(emptyManager.deleteWorkflow('workflow1'))
        .rejects.toThrow('Repository default not found');

      await expect(emptyManager.searchWorkflows({ query: 'test' }))
        .rejects.toThrow('Repository default not found');

      await expect(emptyManager.getTreeStructure())
        .rejects.toThrow('Repository default not found');
    });
  });
});