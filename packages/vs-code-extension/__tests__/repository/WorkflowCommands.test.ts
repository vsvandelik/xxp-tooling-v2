import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock VS Code API before importing other modules
const mockWindow = {
  showInformationMessage: jest.fn(),
};

const mockCommands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

jest.mock('vscode', () => ({
  window: mockWindow,
  commands: mockCommands,
  EventEmitter: jest.fn().mockImplementation(() => ({
    event: jest.fn(),
    fire: jest.fn(),
  })),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
}), { virtual: true });

import { RepositoryConfigManager } from '../../src/repository/RepositoryConfigManager.js';
import { WorkflowCommands } from '../../src/repository/WorkflowCommands.js';
import { WorkflowRepositoryProvider } from '../../src/repository/WorkflowRepositoryProvider.js';

// Mock dependencies
const mockContext = {
  subscriptions: {
    push: jest.fn(),
  },
} as unknown as any;

const mockConfigManager = {
  getRepositories: jest.fn().mockReturnValue([]),
  onConfigurationChanged: jest.fn().mockReturnValue({ dispose: jest.fn() }),
} as unknown as RepositoryConfigManager;

const mockRepositoryProvider = {
  setSearchFilter: jest.fn(),
} as unknown as WorkflowRepositoryProvider;

describe('WorkflowCommands', () => {
  let workflowCommands: WorkflowCommands;

  beforeEach(() => {
    mockWindow.showInformationMessage.mockClear();
    
    workflowCommands = new WorkflowCommands(mockContext, mockConfigManager, mockRepositoryProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resetSearchInTree', () => {
    it('should clear search filter and show confirmation message', async () => {
      await workflowCommands.resetSearchInTree();
      
      expect(mockRepositoryProvider.setSearchFilter).toHaveBeenCalledWith('');
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Search filter cleared');
    });
  });
});