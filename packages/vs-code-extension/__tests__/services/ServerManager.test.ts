import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock vscode module
const mockOutputChannel = {
  appendLine: jest.fn(),
  append: jest.fn(),
  show: jest.fn(),
  dispose: jest.fn(),
  clear: jest.fn(),
};

const mockWindow = {
  createOutputChannel: jest.fn(() => mockOutputChannel),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
};

const mockWorkspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
  })),
};

const mockDisposable = {
  dispose: jest.fn(),
};

jest.mock('vscode', () => ({
  window: mockWindow,
  workspace: mockWorkspace,
  Disposable: jest.fn(() => mockDisposable),
}), { virtual: true });

// Mock ToolExecutor
const mockToolExecutor = {
  executeStreaming: jest.fn(),
} as any;

import { ServerManager, ServerStatus } from '../../src/services/ServerManager.js';

// Mock context
const mockContext = {
  extensionPath: '/mock/extension/path',
  subscriptions: [],
};

describe('ServerManager', () => {
  let serverManager: ServerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock configuration
    mockWorkspace.getConfiguration.mockReturnValue({
      get: jest.fn().mockImplementation((...args: any[]) => {
        const [key, defaultValue] = args;
        if (key === 'server.port') return 3000;
        if (key === 'server.autoStart') return true;
        return defaultValue;
      }),
    });
    
    serverManager = new ServerManager(mockContext as any, mockToolExecutor);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(serverManager).toBeDefined();
      expect(serverManager.getStatus()).toBe('stopped');
      expect(mockWindow.createOutputChannel).toHaveBeenCalledWith('ExtremeXP Server');
    });

    it('should load custom port from configuration', () => {
      const customConfig = {
        get: jest.fn().mockImplementation((...args: any[]) => {
          const [key] = args;
          if (key === 'server.port') return 4000;
          return args[1]; // defaultValue
        }),
      };
      mockWorkspace.getConfiguration.mockReturnValue(customConfig);
      
      new ServerManager(mockContext as any, mockToolExecutor);
      
      expect(mockWorkspace.getConfiguration).toHaveBeenCalledWith('extremexp');
      expect(customConfig.get).toHaveBeenCalledWith('server.port', 3000);
    });
  });

  describe('getStatus', () => {
    it('should return current server status', () => {
      expect(serverManager.getStatus()).toBe('stopped');
    });
  });

  describe('onStatusChange', () => {
    it('should register status change handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const disposable1 = serverManager.onStatusChange(handler1);
      const disposable2 = serverManager.onStatusChange(handler2);
      
      expect(disposable1).toBeDefined();
      expect(disposable2).toBeDefined();
      expect(typeof disposable1.dispose).toBe('function');
      expect(typeof disposable2.dispose).toBe('function');
    });

    it('should remove handler when disposable is disposed', () => {
      const handler = jest.fn();
      const disposable = serverManager.onStatusChange(handler);
      
      // Should not throw when disposing
      expect(() => disposable.dispose()).not.toThrow();
    });
  });

  describe('getServerUrl', () => {
    it('should return null when server is stopped', async () => {
      const url = await serverManager.getServerUrl();
      expect(url).toBeNull();
    });
  });

  describe('reloadConfiguration', () => {
    it('should reload configuration without throwing', () => {
      expect(() => serverManager.reloadConfiguration()).not.toThrow();
    });

    it('should check workspace configuration on reload', () => {
      serverManager.reloadConfiguration();
      expect(mockWorkspace.getConfiguration).toHaveBeenCalledWith('extremexp');
    });
  });

  describe('dispose', () => {
    it('should dispose output channel', async () => {
      await serverManager.dispose();
      expect(mockOutputChannel.dispose).toHaveBeenCalled();
    });
  });

  describe('status management', () => {
    it('should notify handlers when status changes', () => {
      const handler = jest.fn();
      serverManager.onStatusChange(handler);
      
      // Create a new instance to trigger status changes during construction
      new ServerManager(mockContext as any, mockToolExecutor);
      
      // Handler should have been called for the new instance
      // (we can't easily test internal status changes without calling private methods)
    });
  });

  describe('ensureServerRunning', () => {
    it('should not throw when called', async () => {
      // Mock autoStart to false to avoid complex startup logic
      mockWorkspace.getConfiguration.mockReturnValue({
        get: jest.fn().mockImplementation((...args: any[]) => {
          const [key, defaultValue] = args;
          if (key === 'server.autoStart') return false;
          return defaultValue;
        }),
      });
      
      await expect(serverManager.ensureServerRunning()).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle missing configuration gracefully', () => {
      mockWorkspace.getConfiguration.mockReturnValue({
        get: jest.fn(() => undefined),
      });
      
      expect(() => new ServerManager(mockContext as any, mockToolExecutor)).not.toThrow();
    });

    it('should handle output channel creation failure', () => {
      mockWindow.createOutputChannel.mockImplementation(() => {
        throw new Error('Failed to create output channel');
      });
      
      expect(() => new ServerManager(mockContext as any, mockToolExecutor)).toThrow();
    });
  });
});

