import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ArtifactGenerator, ArtifactGeneratorOutput } from '../src/generators/ArtifactGenerator.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TestCase {
  name: string;
  files: Map<string, string>;
  expectedOutput: object | undefined;
  expectedErrors: string[];
  expectedWarnings: string[];
  isNegativeTest: boolean;
}

const testCaseName = process.env['TEST_CASE'];

const describeFn = testCaseName ? describe : describe.skip;

describeFn('Single Integration Test', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory after each test
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const testCaseName = process.env['TEST_CASE'];
  
  if (!testCaseName) {
    it('should have TEST_CASE environment variable set', () => {
      throw new Error('TEST_CASE environment variable must be set to specify which test case to run');
    });
    return;
  }

  const testCasesDir = path.join(__dirname, 'integration-test-cases');
  const testCaseFile = path.join(testCasesDir, `${testCaseName}.test`);

  if (!fs.existsSync(testCaseFile)) {
    it(`should find test case file: ${testCaseName}.test`, () => {
      expect(fs.existsSync(testCaseFile)).toBe(true);
    });
    return;
  }

  const testCase = parseTestCaseFile(testCaseFile);

  it(`should ${testCase.isNegativeTest ? 'fail with expected errors/warnings' : 'generate correct artifact'} for ${testCase.name}`, async () => {
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

      // Find the .espace file (should be exactly one)
      const espaceFiles = Array.from(createdFiles.entries())
        .filter(([fileName]) => fileName.endsWith('.espace'));

      expect(espaceFiles).toHaveLength(1);
      const espaceFile = espaceFiles[0];
      if (!espaceFile) {
        throw new Error('No .espace file found in test case');
      }
      const [, espaceFilePath] = espaceFile;

      const { artifact, validation } = await runArtifactGenerationWithNoConsoleOutput(espaceFilePath);

      // Store artifact to JSON file in outputs folder
      if (artifact) {
        const outputsDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputsDir)) {
          fs.mkdirSync(outputsDir, { recursive: true });
        }
        const outputFilePath = path.join(outputsDir, `${testCase.name}.json`);
        fs.writeFileSync(outputFilePath, JSON.stringify(artifact, null, 2), 'utf8');
      }

      // Compare with expected output
      expect(artifact).toEqual(testCase.expectedOutput);

      // Check validation results  
      expect(validation.errors).toEqual(testCase.expectedErrors);
      expect(validation.warnings).toEqual(testCase.expectedWarnings);

      if (testCase.isNegativeTest) {
        // For negative tests, artifact should be undefined
        expect(artifact).toBeUndefined();
      } else {
        // For positive tests, artifact should match expected output
        expect(artifact).toEqual(testCase.expectedOutput);
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
//});

/**
 * Parse a test case file and extract file contents and expected output
 */
function parseTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  let expectedOutput: object | undefined = undefined;
  const expectedErrors: string[] = [];
  const expectedWarnings: string[] = [];
  let isNegativeTest = false;

  // Split content by === markers
  const sections = content.split(/=== (.+?) ===/);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'ERRORS') {
      // Parse expected errors
      const lines = sectionContent.split('\n').map(line => line.trim()).filter(line => line);
      for (const line of lines) {
        if (line.startsWith('- ')) {
          expectedErrors.push(line.substring(2).trim());
        } else {
          expectedErrors.push(line);
        }
      }
      continue;

    } else if (sectionName === 'WARNINGS') {
      // Parse expected warnings
      const lines = sectionContent.split('\n').map(line => line.trim()).filter(line => line);
      for (const line of lines) {
        if (line.startsWith('- ')) {
          expectedWarnings.push(line.substring(2).trim());
        } else {
          expectedWarnings.push(line);
        }
      }
      continue;

    } else if (sectionName === 'OUTPUT') {
      // Regular positive test case - parse JSON
      try {
        expectedOutput = JSON.parse(sectionContent);
      } catch (error) {
        throw new Error(`Failed to parse OUTPUT section in ${filePath}: ${error}`);
      }
    } else {
      files.set(sectionName, sectionContent);
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  isNegativeTest = expectedErrors.length > 0 || expectedOutput === undefined;

  if (!isNegativeTest && !expectedOutput) {
    throw new Error(`No valid OUTPUT section found in test case: ${filePath}`);
  }

  return {
    name: testName,
    files,
    expectedOutput: expectedOutput,
    expectedErrors,
    expectedWarnings,
    isNegativeTest
  };
}

async function runArtifactGenerationWithNoConsoleOutput(espaceFilePath: string): Promise<ArtifactGeneratorOutput> {
  // Capture console output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

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

  const generator = new ArtifactGenerator({ verbose: false });
  const output = await generator.generate(espaceFilePath);

  // Restore original console functions
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  // Check console output
  expect(consoleOutput).toEqual([]);

  return output;
}
