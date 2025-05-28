import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { IntegrationTestRunner } from '../src/testing/IntegrationTestRunner';

describe('Integration Tests', () => {
  const testRunner = new IntegrationTestRunner({ verbose: false });
  const integrationTestsDir = path.join(__dirname, 'integration');

  describe('basic workflow test', () => {
    it('should generate correct artifact for basic workflow inheritance scenario', async () => {
      const testFilePath = path.join(integrationTestsDir, 'basic-workflow.test.xxp');
      
      // Verify the test file exists
      expect(fs.existsSync(testFilePath)).toBe(true);

      const result = await testRunner.runTestFromFile(testFilePath);

      if (!result.success) {
        console.error('Test failed with error:', result.error);
        if (result.actualOutput && result.expectedOutput) {
          console.error('Expected:', JSON.stringify(result.expectedOutput, null, 2));
          console.error('Actual:', JSON.stringify(result.actualOutput, null, 2));
        }
      }

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.actualOutput).toBeDefined();
      expect(result.expectedOutput).toBeDefined();
    });
  });

  describe('integration test parser', () => {
    it('should find all integration test files', () => {
      if (fs.existsSync(integrationTestsDir)) {
        const testFiles = fs.readdirSync(integrationTestsDir)
          .filter(file => file.endsWith('.test.xxp'));
        
        expect(testFiles.length).toBeGreaterThan(0);
        expect(testFiles).toContain('basic-workflow.test.xxp');
      }
    });
  });
});