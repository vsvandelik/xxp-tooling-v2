import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ArtifactGenerator } from '../generators/ArtifactGenerator.js';
import { IntegrationTestCase, IntegrationTestParser } from './IntegrationTestParser.js';

export interface IntegrationTestResult {
  success: boolean;
  actualOutput?: any | undefined;
  expectedOutput?: any | undefined;
  error?: string | undefined;
  warnings?: string[] | undefined;
}

export class IntegrationTestRunner {
  private generator: ArtifactGenerator;

  constructor(options?: { verbose?: boolean }) {
    this.generator = new ArtifactGenerator({
      verbose: options?.verbose || false
    });
  }

  /**
   * Run an integration test from a test case
   */
  async runTest(testCase: IntegrationTestCase): Promise<IntegrationTestResult> {
    let tempDir: string | null = null;
    
    try {
      // Create temporary directory
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xxp-integration-test-'));

      // Write all files to temporary directory
      for (const [filename, content] of Object.entries(testCase.files)) {
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
      }

      // Find the .espace file (the main experiment file)
      const espaceFiles = Object.keys(testCase.files).filter(name => name.endsWith('.espace'));
      if (espaceFiles.length === 0) {
        return {
          success: false,
          error: 'No .espace file found in test case'
        };
      }
      if (espaceFiles.length > 1) {
        return {
          success: false,
          error: `Multiple .espace files found in test case: ${espaceFiles.join(', ')}`
        };
      }

      const espaceFile = path.join(tempDir, espaceFiles[0]!);

      // Run the generator
      const actualOutput = await this.generator.generate(espaceFile);

      // Compare with expected output
      const matches = this.compareOutputs(actualOutput, testCase.expectedOutput);

      const result: IntegrationTestResult = {
        success: matches,
        actualOutput,
        expectedOutput: testCase.expectedOutput
      };

      if (!matches) {
        result.error = 'Output does not match expected result';
      }

      return result;

    } catch (error) {
      const result: IntegrationTestResult = {
        success: false,
        expectedOutput: testCase.expectedOutput
      };
      
      result.error = error instanceof Error ? error.message : String(error);
      
      return result;
    } finally {
      // Clean up temporary directory
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Run an integration test from a file path
   */
  async runTestFromFile(filePath: string): Promise<IntegrationTestResult> {
    const content = fs.readFileSync(filePath, 'utf8');
    const testCase = IntegrationTestParser.parse(content);
    return this.runTest(testCase);
  }

  /**
   * Compare actual output with expected output
   * Uses deep equality comparison
   */
  private compareOutputs(actual: any, expected: any): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}