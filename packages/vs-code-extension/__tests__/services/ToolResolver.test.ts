import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock vscode module first
const mockWorkspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: '/mock/workspace/path',
      },
    },
  ] as any,
  fs: {
    stat: jest.fn() as jest.MockedFunction<any>,
  },
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
  })),
};

const mockUri = {
  file: jest.fn((path: string) => ({ fsPath: path })),
};

const mockFileType = {
  File: 1,
  Directory: 2,
};

const mockWindow = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  })),
};

jest.mock('vscode', () => ({
  workspace: mockWorkspace,
  Uri: mockUri,
  FileType: mockFileType,
  window: mockWindow,
}), { virtual: true });

import { ToolResolver, ToolInfo } from '../../src/services/ToolResolver.js';

// Mock context
const mockContext = {
  extensionPath: '/mock/extension/path',
};

describe('ToolResolver', () => {
  let toolResolver: ToolResolver;

  beforeEach(() => {
    toolResolver = new ToolResolver(mockContext as any);
    jest.clearAllMocks();
    // Reset configuration mock to return undefined by default
    mockWorkspace.getConfiguration.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });
  });

  afterEach(() => {
    toolResolver.clearCache();
  });

  describe('constructor', () => {
    it('should initialize with extension context', () => {
      expect(toolResolver).toBeDefined();
    });
  });

  describe('resolveTool', () => {
    it('should resolve artifact-generator tool successfully', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('artifact-generator');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('artifact-generator');
      expect(toolInfo.path).toBeDefined();
      expect(toolInfo.type).toMatch(/^(node|binary)$/);
      expect(toolInfo.cwd).toBeDefined();
    });

    it('should resolve experiment-runner-server tool successfully', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('experiment-runner-server');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('experiment-runner-server');
      expect(toolInfo.path).toBeDefined();
      expect(toolInfo.type).toMatch(/^(node|binary)$/);
      expect(toolInfo.cwd).toBeDefined();
    });

    it('should resolve language-server tool successfully', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('language-server');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('language-server');
      expect(toolInfo.path).toBeDefined();
      expect(toolInfo.type).toMatch(/^(node|binary)$/);
      expect(toolInfo.cwd).toBeDefined();
    });

    it('should use custom language-server path from configuration', async () => {
      const customPath = '/custom/path/to/language-server.js';
      
      // Mock configuration to return custom path
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'tools.languageserver.path') {
            return customPath;
          }
          return undefined;
        }) as jest.MockedFunction<any>,
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockConfig);
      
      // Mock file existence check to succeed only for custom path
      mockWorkspace.fs.stat.mockImplementation((uri: any) => {
        if (uri.fsPath === customPath) {
          return Promise.resolve({ type: mockFileType.File });
        } else {
          return Promise.reject(new Error('File not found'));
        }
      });

      const toolInfo = await toolResolver.resolveTool('language-server');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('language-server');
      expect(toolInfo.path).toBe(customPath);
      expect(toolInfo.type).toBe('node');
      expect(mockConfig.get).toHaveBeenCalledWith('tools.languageserver.path');
    });

    it('should return cached tool on second call', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo1 = await toolResolver.resolveTool('artifact-generator');
      const toolInfo2 = await toolResolver.resolveTool('artifact-generator');

      expect(toolInfo1).toBe(toolInfo2); // Should be exact same object reference
      expect(mockWorkspace.fs.stat).toHaveBeenCalledTimes(1); // Should only check file once
    });

    it('should throw error when tool is not found', async () => {
      // Mock file not existing
      mockWorkspace.fs.stat.mockRejectedValue(new Error('File not found'));

      await expect(toolResolver.resolveTool('non-existent-tool')).rejects.toThrow();
    });

    it('should throw error when no valid tool paths exist', async () => {
      // Mock all file existence checks failing
      mockWorkspace.fs.stat.mockRejectedValue(new Error('File not found'));

      await expect(toolResolver.resolveTool('artifact-generator')).rejects.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear the tool cache', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      // Resolve a tool to cache it
      await toolResolver.resolveTool('artifact-generator');
      expect(mockWorkspace.fs.stat).toHaveBeenCalledTimes(1);

      // Clear cache
      toolResolver.clearCache();

      // Resolve again - should make another file system call
      await toolResolver.resolveTool('artifact-generator');
      expect(mockWorkspace.fs.stat).toHaveBeenCalledTimes(2);
    });

    it('should not throw when clearing empty cache', () => {
      expect(() => toolResolver.clearCache()).not.toThrow();
    });
  });

  describe('private method behavior', () => {
    it('should handle workspace without folders', async () => {
      // Temporarily remove workspace folders
      const originalFolders = mockWorkspace.workspaceFolders;
      (mockWorkspace as any).workspaceFolders = undefined;

      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('artifact-generator');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('artifact-generator');

      // Restore workspace folders
      mockWorkspace.workspaceFolders = originalFolders;
    });

    it('should handle empty workspace folders array', async () => {
      // Temporarily set empty workspace folders
      const originalFolders = mockWorkspace.workspaceFolders;
      mockWorkspace.workspaceFolders = [];

      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('artifact-generator');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('artifact-generator');

      // Restore workspace folders
      mockWorkspace.workspaceFolders = originalFolders;
    });
  });

  describe('edge cases', () => {
    it('should handle tool with binary type', async () => {
      // Test using user configuration to specify a binary tool
      const mockConfig = {
        get: jest.fn().mockReturnValue('/usr/bin/some-binary-tool'),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockConfig);
      
      // Mock file existence for the binary tool
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('some-binary-tool');

      expect(toolInfo.type).toBe('binary');
      expect(toolInfo.name).toBe('some-binary-tool');
      expect(toolInfo.path).toBe('/usr/bin/some-binary-tool');
    });

    it('should handle file system errors gracefully', async () => {
      // Mock file system throwing different types of errors
      mockWorkspace.fs.stat
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce({ type: mockFileType.File });

      const toolInfo = await toolResolver.resolveTool('artifact-generator');

      expect(toolInfo).toBeDefined();
      expect(toolInfo.name).toBe('artifact-generator');
    });

    it('should handle tools that are not in the predefined mappings', async () => {
      // Make sure the mock doesn't return a user-configured path
      mockWorkspace.getConfiguration.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      });
      
      await expect(toolResolver.resolveTool('unknown-tool')).rejects.toThrow();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent resolution of the same tool', async () => {
      // Create a fresh resolver for this test
      const concurrentResolver = new ToolResolver(mockContext as any);
      
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      // Start multiple concurrent resolutions
      const promises = [
        concurrentResolver.resolveTool('artifact-generator'),
        concurrentResolver.resolveTool('artifact-generator'),
        concurrentResolver.resolveTool('artifact-generator'),
      ];

      const results = await Promise.all(promises);

      // All results should be identical (cached) - use toStrictEqual for deep comparison
      expect(results[0]).toStrictEqual(results[1]);
      expect(results[1]).toStrictEqual(results[2]);
      expect(results[0]!.name).toBe('artifact-generator');

      // The tool should be cached, so subsequent calls should use cache
      const cachedResult = await concurrentResolver.resolveTool('artifact-generator');
      expect(cachedResult).toStrictEqual(results[0]);
    });

    it('should handle concurrent resolution of different tools', async () => {
      // Mock file existence check
      mockWorkspace.fs.stat.mockResolvedValue({ type: mockFileType.File });

      // Start concurrent resolutions for different tools
      const promises = [
        toolResolver.resolveTool('artifact-generator'),
        toolResolver.resolveTool('experiment-runner-server'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]!.name).toBe('artifact-generator');
      expect(results[1]!.name).toBe('experiment-runner-server');
      expect(results[0]).not.toBe(results[1]);
    });
  });

  describe('tool configuration consistency', () => {
    it('should support custom paths for all external tools', async () => {
      const tools = [
        { name: 'artifact-generator', configKey: 'tools.artifactgenerator.path' },
        { name: 'experiment-runner-server', configKey: 'tools.experimentrunnerserver.path' },
        { name: 'language-server', configKey: 'tools.languageserver.path' },
      ];

      for (const tool of tools) {
        const customPath = `/custom/path/to/${tool.name}.js`;
        
        // Mock configuration to return custom path for this tool
        const mockConfig = {
          get: jest.fn((key: string) => {
            if (key === tool.configKey) {
              return customPath;
            }
            return undefined;
          }) as jest.MockedFunction<any>,
        };
        mockWorkspace.getConfiguration.mockReturnValue(mockConfig);

        // Mock file existence check to succeed only for custom path
        mockWorkspace.fs.stat.mockImplementation((uri: any) => {
          if (uri.fsPath === customPath) {
            return Promise.resolve({ type: mockFileType.File });
          } else {
            return Promise.reject(new Error('File not found'));
          }
        });

        const toolInfo = await toolResolver.resolveTool(tool.name);

        expect(toolInfo).toBeDefined();
        expect(toolInfo.name).toBe(tool.name);
        expect(toolInfo.path).toBe(customPath);
        expect(toolInfo.type).toBe('node');
        expect(mockConfig.get).toHaveBeenCalledWith(tool.configKey);

        // Clear cache for next iteration
        toolResolver.clearCache();
      }
    });
  });
});