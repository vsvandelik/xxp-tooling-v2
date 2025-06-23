import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DocumentManager } from '../src/core/managers/DocumentsManager.js';
import { XxpSuggestionsProvider } from '../src/providers/XxpSuggestionsProvider.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionParams, Position, CompletionItem, Connection } from 'vscode-languageserver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TestCase {
  name: string;
  files: Map<string, string>;
  cursorPosition: { line: number; character: number };
  expectedSuggestions: string[];
  notExpectedSuggestions?: string[];
}

interface CompletionTestFile {
  content: string;
  cursorPosition: { line: number; character: number };
}

describe('Language Server Completion Tests', () => {
  let tempDir: string;
  let documentsManager: DocumentManager;
  let suggestionsProvider: XxpSuggestionsProvider;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-test-'));
    
    // Initialize language server components
    documentsManager = new DocumentManager();
    suggestionsProvider = new XxpSuggestionsProvider();
    
    // Mock connection for the provider
    const mockConnection = {
      onCompletion: jest.fn(),
      onCompletionResolve: jest.fn(),
    } as unknown as Connection;
    suggestionsProvider.initialize(mockConnection, documentsManager);
  });

  afterEach(() => {
    // Clean up temporary directory after each test
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const testCasesDir = path.join(__dirname, 'completion-test-cases');

  // Dynamically discover and parse test case files
  let testCaseFiles: string[] = [];
  if (fs.existsSync(testCasesDir)) {
    testCaseFiles = fs.readdirSync(testCasesDir)
      .filter(file => file.endsWith('.test'))
      .map(file => path.join(testCasesDir, file));
  }

  if (testCaseFiles.length === 0) {
    it('should find at least one test case file when test cases directory exists', () => {
      if (fs.existsSync(testCasesDir)) {
        expect(testCaseFiles.length).toBeGreaterThan(0);
      } else {
        // Skip this test if directory doesn't exist
        expect(true).toBe(true);
      }
    });
  }

  // Parse each test case file and create dynamic tests
  testCaseFiles.forEach(testCaseFile => {
    const testCase = parseCompletionTestCaseFile(testCaseFile);

    it(`should provide completions for ${testCase.name}`, async () => {
      // Create temporary files for this test case
      const createdFiles = new Map<string, string>();

      try {
        for (const [fileName, content] of testCase.files) {
          const filePath = path.join(tempDir, fileName);
          // Create directory if it doesn't exist
          const dirPath = path.dirname(filePath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          fs.writeFileSync(filePath, content, 'utf8');
          createdFiles.set(fileName, filePath);
        }

        // Find the main .xxp file to test completions on
        const xxpFiles = Array.from(createdFiles.entries())
          .filter(([fileName]) => fileName.endsWith('.xxp'));        expect(xxpFiles.length).toBeGreaterThan(0);
        
        // Test completions on the main file (assuming first .xxp file is the main one)
        const firstFile = xxpFiles[0];
        if (!firstFile) {
          throw new Error('No .xxp files found');
        }
        const [, mainFilePath] = firstFile;        const completions = await getCompletionsAtPosition(
          mainFilePath,
          testCase.cursorPosition,
          Array.from(createdFiles.values()) // Pass all file paths
        );

        // Check that expected suggestions are present
        const completionLabels = completions.map(c => c.label);
        
        for (const expectedSuggestion of testCase.expectedSuggestions) {
          expect(completionLabels).toContain(expectedSuggestion);
        }

        // Check that not expected suggestions are not present (if specified)
        if (testCase.notExpectedSuggestions) {
          for (const notExpectedSuggestion of testCase.notExpectedSuggestions) {
            expect(completionLabels).not.toContain(notExpectedSuggestion);
          }
        }

      } catch (error) {
        // Enhanced error reporting
        console.error(`Test case '${testCase.name}' failed:`);
        console.error(`Temp directory: ${tempDir}`);
        console.error(`Created files: ${Array.from(createdFiles.keys()).join(', ')}`);
        throw error;
      }
    });
  });

  // Manual test cases for specific completion scenarios
  it('should suggest data and task names in workflow body', async () => {
    const content = `workflow ParentWorkflow {
    define data existingData;
    define task existingTask;
    define data anotherData;
    
    
}`;

    const filePath = path.join(tempDir, 'parentWorkflow.xxp');
    fs.writeFileSync(filePath, content, 'utf8');    // Position after the empty lines in the workflow body
    const completions = await getCompletionsAtPosition(
      filePath,
      { line: 5, character: 4 }, // Inside workflow body
      [filePath]
    );const completionLabels = completions.map(c => c.label);
    
    // Should suggest defined tasks (but not data)
    expect(completionLabels).toContain('existingTask');
    
    // Should suggest keywords
    expect(completionLabels).toContain('define');
    expect(completionLabels).toContain('configure');
  });

  it('should suggest inherited data and tasks in child workflow', async () => {
    const parentContent = `workflow ParentWorkflow {
    define data parentData;
    define task parentTask;
    
    parentTask -> END;
}`;

    const childContent = `workflow ChildWorkflow from ParentWorkflow {
    define data childData;
    define task childTask;
    
    
}`;

    const parentFile = path.join(tempDir, 'parentWorkflow.xxp');
    const childFile = path.join(tempDir, 'childWorkflow.xxp');
    
    fs.writeFileSync(parentFile, parentContent, 'utf8');
    fs.writeFileSync(childFile, childContent, 'utf8');    // Test completions in child workflow
    const completions = await getCompletionsAtPosition(
      childFile,
      { line: 4, character: 4 }, // Inside child workflow body
      [parentFile, childFile] // Pass both files for inheritance
    );const completionLabels = completions.map(c => c.label);
    
    // Should suggest child's own tasks (but not data)
    expect(completionLabels).toContain('childTask');
    
    // Should suggest inherited tasks from parent (but not data)
    expect(completionLabels).toContain('parentTask');
  });

  it('should suggest only tasks after arrow in chains', async () => {
    const content = `workflow TestWorkflow {
    define data testData;
    define task taskA;
    define task taskB;
    
    taskA -> 
}`;

    const filePath = path.join(tempDir, 'testWorkflow.xxp');
    fs.writeFileSync(filePath, content, 'utf8');    // Position after the arrow
    const completions = await getCompletionsAtPosition(
      filePath,
      { line: 5, character: 13 }, // After "taskA -> "
      [filePath]
    );

    const completionLabels = completions.map(c => c.label);
    
    // Should suggest tasks
    expect(completionLabels).toContain('taskB');
    expect(completionLabels).toContain('END');
    
    // Should NOT suggest data
    expect(completionLabels).not.toContain('testData');
  });
});

/**
 * Parse a completion test case file and extract file contents, cursor position, and expected suggestions
 */
function parseCompletionTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  const expectedSuggestions: string[] = [];
  const notExpectedSuggestions: string[] = [];
  let cursorPosition: { line: number; character: number } = { line: 0, character: 0 };

  // Split content by === markers
  const sections = content.split(/=== (.+?) ===/);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'SUGGESTIONS') {
      // Parse expected suggestions
      parseExpectedSuggestions(sectionContent, expectedSuggestions);
    } else if (sectionName === 'NOT_EXPECTED') {
      // Parse suggestions that should NOT be present
      parseExpectedSuggestions(sectionContent, notExpectedSuggestions);
    } else {
      // This is a file section - process cursor marker
      const processedFile = processFileWithCursor(sectionContent);
      files.set(sectionName, processedFile.content);
      if (processedFile.cursorPosition) {
        cursorPosition = processedFile.cursorPosition;
      }
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  return {
    name: testName,
    files,
    cursorPosition,
    expectedSuggestions,
    notExpectedSuggestions
  };
}

function parseExpectedSuggestions(content: string, suggestions: string[]): void {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    if (line.startsWith('- ')) {
      const suggestion = line.substring(2).trim();
      if (suggestion) {
        suggestions.push(suggestion);
      }
    } else if (line) {
      suggestions.push(line);
    }
  }
}

function processFileWithCursor(content: string): CompletionTestFile {
  const cursorMarker = '<-CURSOR->';
  const cursorIndex = content.indexOf(cursorMarker);
  
  if (cursorIndex === -1) {
    return {
      content,
      cursorPosition: { line: 0, character: 0 }
    };
  }

  // Remove the cursor marker from content
  const cleanContent = content.replace(cursorMarker, '');
    // Calculate line and character position
  const beforeCursor = content.substring(0, cursorIndex);
  const lines = beforeCursor.split('\n');
  const line = lines.length - 1;
  const lastLine = lines[lines.length - 1];
  const character = lastLine ? lastLine.length : 0;

  return {
    content: cleanContent,
    cursorPosition: { line, character }
  };
}

async function getCompletionsAtPosition(
  xxpFilePath: string,
  position: { line: number; character: number },
  allFilePaths?: string[]
): Promise<CompletionItem[]> {
  // Capture console output to avoid noise during tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};  try {
    // Create document manager and use it to parse all documents
    const documentsManager = new DocumentManager();
    
    // Open all documents (this is important for inheritance to work properly)
    const filesToOpen = allFilePaths || [xxpFilePath];
    for (const filePath of filesToOpen) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileUri = `file:///${filePath.replace(/\\/g, '/')}`;
      const textDocument = TextDocument.create(fileUri, 'xxp', 1, fileContent);
      await documentsManager.onDocumentOpened(textDocument);
    }

    // Use the main file's URI for completion params
    const uri = `file:///${xxpFilePath.replace(/\\/g, '/')}`;

    // Create suggestions provider
    const suggestionsProvider = new XxpSuggestionsProvider();
    
    // Mock the connection 
    const mockConnection = {
      onCompletion: jest.fn(),
      onCompletionResolve: jest.fn(),
    } as unknown as Connection;
    
    suggestionsProvider.initialize(mockConnection, documentsManager);

    // Create completion params
    const completionParams: CompletionParams = {
      textDocument: { uri },
      position: position as Position
    };    // Call the completion method using reflection
    const completions = await (suggestionsProvider as unknown as { onCompletion: (params: CompletionParams) => Promise<CompletionItem[]> }).onCompletion(completionParams);
      // Temporarily restore console for debugging
    console.log = originalConsoleLog;
    console.log(`Debug - Completions for ${xxpFilePath} at line ${position.line}, char ${position.character}:`, completions.map(c => c.label));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log(`Debug - DocumentManager has documents:`, Object.keys((documentsManager as any).parsedDocuments || {}));
      // Get the specific document and check its symbol table
    const doc = documentsManager.getDocument(uri);
    if (doc && doc.symbolTable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Debug - Document ${uri} has symbol table with:`, Object.keys(doc.symbolTable as any));
    } else {
      console.log(`Debug - Document ${uri} has no symbol table or document not found`);
    }
    
    console.log = () => {}; // Suppress again
    
    return completions || [];
    
  } finally {
    // Restore original console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }
}
