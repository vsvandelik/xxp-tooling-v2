import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DocumentManager } from '../src/core/managers/DocumentsManager.js';
import { XxpDocument } from '../src/core/documents/XxpDocument.js';
import { DocumentParser } from '../src/language/parsing/DocumentParser.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TestCase {
  name: string;
  files: Map<string, string>;
  expectedErrors: ExpectedDiagnostic[];
  expectedWarnings: ExpectedDiagnostic[];
}

interface ExpectedDiagnostic {
  message: string;
  file: string;
  line: number;
  column: number;
}

interface ValidationResult {
  errors: DiagnosticWithLocation[];
  warnings: DiagnosticWithLocation[];
}

interface DiagnosticWithLocation {
  message: string;
  file: string;
  line: number;
  column: number;
}

describe('Language Server Validation Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'language-server-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory after each test
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const testCasesDir = path.join(__dirname, 'validation-test-cases');

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
    const testCase = parseTestCaseFile(testCaseFile);

    it(`should validate ${testCase.name} and produce expected errors/warnings`, async () => {
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

        // Find the main .xxp file to validate
        const xxpFiles = Array.from(createdFiles.entries())
          .filter(([fileName]) => fileName.endsWith('.xxp'));

        expect(xxpFiles.length).toBeGreaterThan(0);
        
        // Validate each .xxp file and collect all errors/warnings
        const allValidationResults: ValidationResult[] = [];
        
        for (const [, filePath] of xxpFiles) {
          const validation = await runValidationWithNoConsoleOutput(filePath, tempDir);
          allValidationResults.push(validation);
        }

        // Combine all errors and warnings
        const allErrors = allValidationResults.flatMap(v => v.errors);
        const allWarnings = allValidationResults.flatMap(v => v.warnings);        // Check validation results
        expect(allErrors).toEqual(expect.arrayContaining(testCase.expectedErrors));
        expect(allWarnings).toEqual(expect.arrayContaining(testCase.expectedWarnings));

      } catch (error) {
        // Enhanced error reporting
        console.error(`Test case '${testCase.name}' failed:`);
        console.error(`Temp directory: ${tempDir}`);
        console.error(`Created files: ${Array.from(createdFiles.keys()).join(', ')}`);
        throw error;
      }
    });
  });
  // Manual test case for inheritance checking
  it('should prevent data overriding from parent workflow', async () => {
    const parentContent = `workflow ParentWorkflow {
    define data parentData;
    define task parentTask;
    
    parentTask -> END;
}`;

    const childContent = `workflow ChildWorkflow from ParentWorkflow {
    define data parentData;  // Should cause error - overriding parent data
    define task newTask;     // Should be fine - new task
    
    newTask -> END;
}`;

    // Create temporary files
    const parentFile = path.join(tempDir, 'parentWorkflow.xxp');
    const childFile = path.join(tempDir, 'childWorkflow.xxp');
    
    fs.writeFileSync(parentFile, parentContent, 'utf8');
    fs.writeFileSync(childFile, childContent, 'utf8');

    // Validate child workflow
    const validation = await runValidationWithNoConsoleOutput(childFile, tempDir);    // Should have error about overriding parent data
    expect(validation.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: "Cannot override data 'parentData' from parent workflow",
        file: 'childWorkflow.xxp'
      })
    ]));
  });

  it('should prevent task overriding from parent workflow', async () => {
    const parentContent = `workflow ParentWorkflow {
    define data parentData;
    define task parentTask;
    
    parentTask -> END;
}`;

    const childContent = `workflow ChildWorkflow from ParentWorkflow {
    define data newData;     // Should be fine - new data
    define task parentTask;  // Should cause error - overriding parent task
    
    parentTask -> END;
}`;

    // Create temporary files
    const parentFile = path.join(tempDir, 'parentWorkflow.xxp');
    const childFile = path.join(tempDir, 'childWorkflow.xxp');
    
    fs.writeFileSync(parentFile, parentContent, 'utf8');
    fs.writeFileSync(childFile, childContent, 'utf8');

    // Validate child workflow
    const validation = await runValidationWithNoConsoleOutput(childFile, tempDir);    // Should have error about overriding parent task
    expect(validation.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: "Cannot override task 'parentTask' from parent workflow",
        file: 'childWorkflow.xxp'
      })
    ]));
  });

  it('should allow new data and tasks in child workflow', async () => {
    const parentContent = `workflow ParentWorkflow {
    define data parentData;
    define task parentTask;
    
    parentTask -> END;
}`;

    const childContent = `workflow ChildWorkflow from ParentWorkflow {
    define data newData;     // Should be fine - new data
    define task newTask;     // Should be fine - new task
    
    newTask -> END;
}`;

    // Create temporary files
    const parentFile = path.join(tempDir, 'parentWorkflow.xxp');
    const childFile = path.join(tempDir, 'childWorkflow.xxp');
    
    fs.writeFileSync(parentFile, parentContent, 'utf8');
    fs.writeFileSync(childFile, childContent, 'utf8');

    // Validate child workflow
    const validation = await runValidationWithNoConsoleOutput(childFile, tempDir);    // Should not have any inheritance-related errors
    const inheritanceErrors = validation.errors.filter(error => 
      error.message.includes('Cannot override') || error.message.includes('from parent workflow')
    );
    expect(inheritanceErrors).toEqual([]);
  });
});

/**
 * Parse a test case file and extract file contents and expected errors/warnings
 */
function parseTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  const expectedErrors: ExpectedDiagnostic[] = [];
  const expectedWarnings: ExpectedDiagnostic[] = [];

  // Split content by === markers
  const sections = content.split(/=== (.+?) ===/);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'ERRORS') {
      // Parse expected errors with optional position information
      parseExpectedDiagnostics(sectionContent, expectedErrors);
    } else if (sectionName === 'WARNINGS') {
      // Parse expected warnings with optional position information
      parseExpectedDiagnostics(sectionContent, expectedWarnings);
    } else {
      // This is a file section
      files.set(sectionName, sectionContent);
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  return {
    name: testName,
    files,
    expectedErrors,
    expectedWarnings
  };
}

function parseExpectedDiagnostics(content: string, diagnostics: ExpectedDiagnostic[]): void {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    if (line.startsWith('- ')) {
      const diagnosticText = line.substring(2).trim();
      const diagnostic = parseExpectedDiagnosticLine(diagnosticText);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    } else if (line) {
      const diagnostic = parseExpectedDiagnosticLine(line);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }
  }
}

function parseExpectedDiagnosticLine(line: string): ExpectedDiagnostic | null {
  // Try to parse format: "message" at file:line:column
  // If no position info, default to line 0, column 0 and main workflow file
  const positionMatch = line.match(/^(.+?) at (.+?):(\d+):(\d+)$/);
  
  if (positionMatch && positionMatch[1] && positionMatch[2] && positionMatch[3] && positionMatch[4]) {
    return {
      message: positionMatch[1].trim(),
      file: positionMatch[2].trim(),
      line: parseInt(positionMatch[3], 10),
      column: parseInt(positionMatch[4], 10)
    };
  } else {
    // No position specified - use message as-is and default position
    return {
      message: line.trim(),
      file: '', // Will be filled in during comparison if needed
      line: -1, // Use -1 to indicate position should be ignored
      column: -1
    };
  }
}

async function runValidationWithNoConsoleOutput(
  xxpFilePath: string, 
  _baseDir: string
): Promise<ValidationResult> {
  // Capture console output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  const consoleOutput: string[] = [];

  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    consoleOutput.push(args.join(' '));
  };
  console.warn = (...args: unknown[]) => {
    consoleOutput.push(args.join(' '));
  };
  console.info = (...args: unknown[]) => {
    consoleOutput.push(args.join(' '));
  };

  try {
    // Read file content
    const content = fs.readFileSync(xxpFilePath, 'utf8');
    const uri = `file:///${xxpFilePath.replace(/\\/g, '/')}`;
    
    // Create TextDocument
    const textDocument = TextDocument.create(uri, 'xxp', 1, content);
    
    // Create document manager and parser
    const documentsManager = new DocumentManager();
    const documentParser = new DocumentParser(documentsManager);
    
    // Create XxpDocument
    const document = new XxpDocument(uri, documentParser);
    
    // Parse the document
    document.updateDocument(textDocument);
      // Extract errors and warnings from diagnostics with location information
    const errors: DiagnosticWithLocation[] = [];
    const warnings: DiagnosticWithLocation[] = [];
    
    if (document.diagnostics) {
      for (const diagnostic of document.diagnostics) {
        const diagnosticWithLocation: DiagnosticWithLocation = {
          message: diagnostic.message,
          file: path.basename(xxpFilePath),
          line: diagnostic.range.start.line,
          column: diagnostic.range.start.character
        };
        
        if (diagnostic.severity === 1) { // Error
          errors.push(diagnosticWithLocation);
        } else if (diagnostic.severity === 2) { // Warning
          warnings.push(diagnosticWithLocation);
        }
      }
    }
    
    return { errors, warnings };
    
  } finally {
    // Restore original console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }
}
