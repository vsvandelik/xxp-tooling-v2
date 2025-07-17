import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock vscode module with simple any types to avoid TypeScript issues
const mockActiveTextEditor = {
  document: {
    fileName: '/test/file.espace',
    isDirty: false,
    save: jest.fn(),
    uri: { fsPath: '/test/file.espace' },
  },
};

const mockWindow = {
  activeTextEditor: mockActiveTextEditor,
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  withProgress: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
  })),
  showTextDocument: jest.fn(),
};

const mockWorkspace = {
  getWorkspaceFolder: jest.fn(),
  openTextDocument: jest.fn(),
};

const mockProgressLocation = {
  Notification: 15,
};

jest.mock('vscode', () => ({
  window: mockWindow,
  workspace: mockWorkspace,
  ProgressLocation: mockProgressLocation,
}), { virtual: true });

import { GenerateArtifactCommand } from '../../src/commands/generateArtifact.js';

// Mock ToolExecutor
const mockToolExecutor = {
  execute: jest.fn(),
} as any;

describe('GenerateArtifactCommand', () => {
  let command: GenerateArtifactCommand;

  beforeEach(() => {
    command = new GenerateArtifactCommand(mockToolExecutor);
    jest.clearAllMocks();
    
    // Reset default mocks
    (mockWindow as any).activeTextEditor = mockActiveTextEditor;
    mockActiveTextEditor.document.fileName = '/test/file.espace';
    mockActiveTextEditor.document.isDirty = false;
    (mockActiveTextEditor.document.save as any).mockResolvedValue(true);
  });

  describe('constructor', () => {
    it('should initialize with tool executor', () => {
      expect(command).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should show error when no active editor', async () => {
      (mockWindow as any).activeTextEditor = undefined;
      
      await command.execute();
      
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'No active editor found. Please open an ESPACE file.'
      );
      expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    });

    it('should show error when active file is not .espace', async () => {
      mockActiveTextEditor.document.fileName = '/test/file.txt';
      
      await command.execute();
      
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Active file is not an ESPACE file. Please open an ESPACE file first.'
      );
      expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    });

    it('should save dirty file before generation', async () => {
      mockActiveTextEditor.document.isDirty = true;
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        const progress = { report: jest.fn() };
        const token = { isCancellationRequested: false };
        return callback(progress, token);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: true,
        stdout: 'Artifact generated successfully: /test/artifact.json',
        stderr: '',
        exitCode: 0,
        cancelled: false,
      });
      
      await command.execute();
      
      expect(mockActiveTextEditor.document.save).toHaveBeenCalled();
    });

    it('should show error if file save fails', async () => {
      mockActiveTextEditor.document.isDirty = true;
      (mockActiveTextEditor.document.save as any).mockResolvedValue(false);
      
      await command.execute();
      
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Failed to save ESPACE file.'
      );
      expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    });

    it('should generate artifact successfully', async () => {
      const mockProgress = { report: jest.fn() };
      const mockToken = { isCancellationRequested: false };
      
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        return callback(mockProgress, mockToken);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: true,
        stdout: 'Artifact generated successfully: /test/artifact.json',
        stderr: '',
        exitCode: 0,
        cancelled: false,
      });
      
      (mockWindow.showInformationMessage as any).mockResolvedValue('Open Artifact');
      (mockWorkspace.openTextDocument as any).mockResolvedValue({ uri: '/test/artifact.json' });
      
      await command.execute();
      
      expect(mockToolExecutor.execute).toHaveBeenCalledWith('artifact-generator', {
        args: ['/test/file.espace'],
        cwd: '/test',
        cancellationToken: mockToken,
      });
      
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'Artifact generated successfully!',
        'Open Artifact'
      );
      
      expect(mockWorkspace.openTextDocument).toHaveBeenCalledWith('/test/artifact.json');
      expect(mockWindow.showTextDocument).toHaveBeenCalled();
    });

    it('should handle generation with warnings', async () => {
      const mockProgress = { report: jest.fn() };
      const mockToken = { isCancellationRequested: false };
      
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        return callback(mockProgress, mockToken);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: true,
        stdout: 'Artifact generated successfully: /test/artifact.json\n',
        stderr: 'Validation warning: Deprecated feature used\n',
        exitCode: 0,
        cancelled: false,
      });
      
      (mockWindow.showWarningMessage as any).mockResolvedValue('Show Warnings');
      
      await command.execute();
      
      // The warnings should be detected and showWarningMessage should be called
      expect(mockWindow.showWarningMessage).toHaveBeenCalledWith(
        'Artifact generated with 1 warning(s)',
        'Show Warnings',
        'Open Artifact'
      );
    });

    it('should handle generation failure', async () => {
      const mockProgress = { report: jest.fn() };
      const mockToken = { isCancellationRequested: false };
      
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        return callback(mockProgress, mockToken);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: false,
        stdout: '',
        stderr: 'Validation error: Missing required field',
        exitCode: 1,
        cancelled: false,
      });
      
      (mockWindow.showErrorMessage as any).mockResolvedValue('Show Details');
      
      await command.execute();
      
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Artifact generation failed with 1 error(s)',
        'Show Details'
      );
    });

    it('should handle execution exception', async () => {
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        const progress = { report: jest.fn() };
        const token = { isCancellationRequested: false };
        return callback(progress, token);
      });
      
      (mockToolExecutor.execute as any).mockRejectedValue(new Error('Tool not found'));
      
      await command.execute();
      
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Artifact generation failed: Tool not found'
      );
    });

    it('should handle progress reporting', async () => {
      const mockProgress = { report: jest.fn() };
      const mockToken = { isCancellationRequested: false };
      
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        expect(options.location).toBe(mockProgressLocation.Notification);
        expect(options.title).toBe('Generating Artifact');
        expect(options.cancellable).toBe(true);
        
        return callback(mockProgress, mockToken);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: true,
        stdout: 'Artifact generated successfully: /test/artifact.json',
        stderr: '',
        exitCode: 0,
        cancelled: false,
      });
      
      await command.execute();
      
      expect(mockProgress.report).toHaveBeenCalledWith({
        increment: 0,
        message: 'Starting artifact generation...'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty stdout and stderr', async () => {
      const mockProgress = { report: jest.fn() };
      const mockToken = { isCancellationRequested: false };
      
      (mockWindow.withProgress as any).mockImplementation(async (options: any, callback: any) => {
        return callback(mockProgress, mockToken);
      });
      
      (mockToolExecutor.execute as any).mockResolvedValue({
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        cancelled: false,
      });
      
      await command.execute();
      
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'Artifact generated successfully!',
        'Open Artifact'
      );
    });
  });
});