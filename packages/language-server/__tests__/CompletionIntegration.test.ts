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
        );        // Check that expected suggestions are present
        const completionLabels = completions.map(c => c.label);
          // Verify exact set of suggestions (no more, no less)
        try {
          expect(completionLabels.sort()).toEqual(testCase.expectedSuggestions.sort());
        } catch (error) {
          // Enhanced error reporting for exact match failures
          console.error(`Exact match failed for test case '${testCase.name}':`);
          console.error(`Expected: [${testCase.expectedSuggestions.sort().join(', ')}]`);
          console.error(`Actual:   [${completionLabels.sort().join(', ')}]`);
          
          const missing = testCase.expectedSuggestions.filter(s => !completionLabels.includes(s));
          const unexpected = completionLabels.filter(s => !testCase.expectedSuggestions.includes(s));
          
          if (missing.length > 0) {
            console.error(`Missing suggestions: [${missing.join(', ')}]`);
          }
          if (unexpected.length > 0) {
            console.error(`Unexpected suggestions: [${unexpected.join(', ')}]`);
          }
          
          throw error;
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
});

/**
 * Parse a completion test case file and extract file contents, cursor position, and expected suggestions
 */
function parseCompletionTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  const expectedSuggestions: string[] = [];
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
    expectedSuggestions
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
