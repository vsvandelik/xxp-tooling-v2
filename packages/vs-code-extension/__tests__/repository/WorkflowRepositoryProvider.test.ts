import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock VS Code API before importing other modules
const mockCommands = {
  executeCommand: jest.fn(),
};

const mockEventEmitter = {
  event: jest.fn(),
  fire: jest.fn(),
};

jest.mock('vscode', () => ({
  commands: mockCommands,
  EventEmitter: jest.fn().mockImplementation(() => mockEventEmitter),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: jest.fn().mockImplementation((id) => ({ id })),
  ThemeColor: jest.fn().mockImplementation((id) => ({ id })),
  TreeItem: jest.fn().mockImplementation((label, collapsibleState) => ({
    label,
    collapsibleState,
  })),
}), { virtual: true });

// Mock workflow-repository package
jest.mock('@extremexp/workflow-repository', () => ({
  WorkflowRepositoryManager: jest.fn().mockImplementation(() => ({})),
}), { virtual: true });

import { RepositoryConfigManager } from '../../src/repository/RepositoryConfigManager.js';
import { WorkflowRepositoryProvider } from '../../src/repository/WorkflowRepositoryProvider.js';

// Mock RepositoryConfigManager
const mockConfigManager = {
  getRepositories: jest.fn().mockReturnValue([]),
  onConfigurationChanged: jest.fn().mockReturnValue({ dispose: jest.fn() }),
} as unknown as RepositoryConfigManager;

describe('WorkflowRepositoryProvider', () => {
  let provider: WorkflowRepositoryProvider;

  beforeEach(() => {
    mockCommands.executeCommand.mockClear();
    provider = new WorkflowRepositoryProvider(mockConfigManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Search functionality', () => {
    it('should initialize with search context set to false', () => {
      expect(mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'extremexp.workflows.searchActive', false);
    });

    it('should set search context to true when search filter is set', () => {
      mockCommands.executeCommand.mockClear();
      
      provider.setSearchFilter('test query');
      
      expect(mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'extremexp.workflows.searchActive', true);
    });

    it('should set search context to false when search filter is cleared', () => {
      // First set a search filter
      provider.setSearchFilter('test query');
      mockCommands.executeCommand.mockClear();
      
      // Then clear it
      provider.setSearchFilter('');
      
      expect(mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'extremexp.workflows.searchActive', false);
    });

    it('should set search context to false when search filter is empty string', () => {
      mockCommands.executeCommand.mockClear();
      
      provider.setSearchFilter('');
      
      expect(mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'extremexp.workflows.searchActive', false);
    });
  });
});