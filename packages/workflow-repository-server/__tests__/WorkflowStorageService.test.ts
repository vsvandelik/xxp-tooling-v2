import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowStorageService } from '../src/services/WorkflowStorageService.js';
import { LocalWorkflowRepository, WorkflowContent } from '@extremexp/workflow-repository';

// Mock fs/promises
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock LocalWorkflowRepository
jest.mock('@extremexp/workflow-repository', () => ({
  LocalWorkflowRepository: jest.fn().mockImplementation(() => ({
    list: jest.fn(),
    get: jest.fn(),
    getContent: jest.fn(),
    search: jest.fn()
  }))
}));

const MockedLocalWorkflowRepository = LocalWorkflowRepository as jest.MockedClass<typeof LocalWorkflowRepository>;

describe('WorkflowStorageService', () => {
  let workflowStorageService: WorkflowStorageService;
  let mockRepository: jest.Mocked<LocalWorkflowRepository>;
  const testBasePath = '/test/path';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository instance
    mockRepository = {
      list: jest.fn(),
      get: jest.fn(),
      getContent: jest.fn(),
      search: jest.fn()
    } as any;
    
    MockedLocalWorkflowRepository.mockImplementation(() => mockRepository);
    
    workflowStorageService = new WorkflowStorageService(testBasePath);
  });

  describe('constructor', () => {
    it('should create LocalWorkflowRepository with basePath', () => {
      expect(MockedLocalWorkflowRepository).toHaveBeenCalledWith(testBasePath);
    });
  });

  describe('ensureInitialized', () => {
    it('should not create directory if it exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);

      await workflowStorageService.ensureInitialized();

      expect(mockedFs.access).toHaveBeenCalledWith(testBasePath);
      expect(mockedFs.mkdir).not.toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('ENOENT'));
      mockedFs.mkdir.mockResolvedValue(undefined);

      await workflowStorageService.ensureInitialized();

      expect(mockedFs.access).toHaveBeenCalledWith(testBasePath);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(testBasePath, { recursive: true });
    });
  });

  describe('getAllTags', () => {
    it('should return unique sorted tags from all workflows', async () => {
      const workflows = [
        { tags: ['tag1', 'tag2'] },
        { tags: ['tag2', 'tag3'] },
        { tags: ['tag1'] }
      ] as any;

      mockRepository.list.mockResolvedValue(workflows);

      const tags = await workflowStorageService.getAllTags();

      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(mockRepository.list).toHaveBeenCalled();
    });

    it('should return empty array if no workflows', async () => {
      mockRepository.list.mockResolvedValue([]);

      const tags = await workflowStorageService.getAllTags();

      expect(tags).toEqual([]);
    });
  });

  describe('getAllAuthors', () => {
    it('should return unique sorted authors from all workflows', async () => {
      const workflows = [
        { author: 'Alice' },
        { author: 'Bob' },
        { author: 'Alice' },
        { author: 'Charlie' }
      ] as any;

      mockRepository.list.mockResolvedValue(workflows);

      const authors = await workflowStorageService.getAllAuthors();

      expect(authors).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(mockRepository.list).toHaveBeenCalled();
    });

    it('should return empty array if no workflows', async () => {
      mockRepository.list.mockResolvedValue([]);

      const authors = await workflowStorageService.getAllAuthors();

      expect(authors).toEqual([]);
    });
  });

  describe('getWorkflowOwner', () => {
    it('should return workflow author if workflow exists', async () => {
      const workflow = {
        metadata: { author: 'testuser' }
      } as any;

      mockRepository.get.mockResolvedValue(workflow);

      const owner = await workflowStorageService.getWorkflowOwner('workflow-id');

      expect(owner).toBe('testuser');
      expect(mockRepository.get).toHaveBeenCalledWith('workflow-id');
    });

    it('should return null if workflow does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const owner = await workflowStorageService.getWorkflowOwner('non-existent');

      expect(owner).toBeNull();
    });
  });

  describe('checkForExistingWorkflow', () => {
    it('should return existing workflow if found', async () => {
      const workflows = [
        { id: 'workflow-1', name: 'Test Workflow' },
        { id: 'workflow-2', name: 'Other Workflow' }
      ] as any;

      mockRepository.list.mockResolvedValue(workflows);

      const result = await workflowStorageService.checkForExistingWorkflow('test/path', 'Test Workflow');

      expect(result).toEqual({ exists: true, id: 'workflow-1' });
      expect(mockRepository.list).toHaveBeenCalledWith('test/path');
    });

    it('should return not existing if workflow not found', async () => {
      const workflows = [
        { id: 'workflow-1', name: 'Other Workflow' }
      ] as any;

      mockRepository.list.mockResolvedValue(workflows);

      const result = await workflowStorageService.checkForExistingWorkflow('test/path', 'Non-existent Workflow');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('override permissions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow override when permission is set', async () => {
      workflowStorageService.setOverridePermission('workflow-id', 'request-id', true);

      const canOverride = await workflowStorageService.canOverrideWorkflow('workflow-id', 'request-id');

      expect(canOverride).toBe(true);
    });

    it('should not allow override when permission is not set', async () => {
      const canOverride = await workflowStorageService.canOverrideWorkflow('workflow-id', 'request-id');

      expect(canOverride).toBe(false);
    });

    it('should clear override permission when set to false', async () => {
      workflowStorageService.setOverridePermission('workflow-id', 'request-id', true);
      workflowStorageService.setOverridePermission('workflow-id', 'request-id', false);

      const canOverride = await workflowStorageService.canOverrideWorkflow('workflow-id', 'request-id');

      expect(canOverride).toBe(false);
    });

    it('should auto-clear override permission after 5 minutes', async () => {
      workflowStorageService.setOverridePermission('workflow-id', 'request-id', true);

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      const canOverride = await workflowStorageService.canOverrideWorkflow('workflow-id', 'request-id');

      expect(canOverride).toBe(false);
    });
  });

  describe('createWorkflowZip', () => {
    it('should return null if workflow content not found', async () => {
      mockRepository.getContent.mockResolvedValue(null);

      const zipBuffer = await workflowStorageService.createWorkflowZip('non-existent');

      expect(zipBuffer).toBeNull();
    });

    it('should return null if workflow metadata not found', async () => {
      const content: WorkflowContent = {
        mainFile: 'main content',
        attachments: new Map()
      };

      mockRepository.getContent.mockResolvedValue(content);
      mockRepository.get.mockResolvedValue(null);

      const zipBuffer = await workflowStorageService.createWorkflowZip('workflow-id');

      expect(zipBuffer).toBeNull();
    });
  });

  describe('validateWorkflowPath', () => {
    it('should allow valid relative paths', async () => {
      const isValid = await workflowStorageService.validateWorkflowPath('valid/path');
      expect(isValid).toBe(true);
    });

    it('should reject paths with parent directory references', async () => {
      const isValid = await workflowStorageService.validateWorkflowPath('../invalid/path');
      expect(isValid).toBe(false);
    });

    it('should reject absolute paths', async () => {
      const isValid = await workflowStorageService.validateWorkflowPath('/absolute/path');
      expect(isValid).toBe(false);
    });

    it('should normalize and reject paths that become invalid', async () => {
      const isValid = await workflowStorageService.validateWorkflowPath('valid/../../../invalid');
      expect(isValid).toBe(false);
    });
  });

  describe('getRepository', () => {
    it('should return the local workflow repository instance', () => {
      const repository = workflowStorageService.getRepository();
      expect(repository).toBe(mockRepository);
    });
  });
});