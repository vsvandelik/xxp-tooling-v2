#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { IntegrationTestRunner } from './testing/IntegrationTestRunner.js';

const program = new Command();

program
  .name('integration-test-runner')
  .description('Run integration tests for artifact generator')
  .version('1.0.0')
  .argument('<test-file>', 'Path to the integration test file (.test.xxp)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (testFile: string, options: { verbose?: boolean }) => {
    try {
      if (!fs.existsSync(testFile)) {
        console.error(`Error: Test file not found: ${testFile}`);
        process.exit(1);
      }

      if (!testFile.endsWith('.test.xxp')) {
        console.warn('Warning: Test file should have .test.xxp extension');
      }

      const runner = new IntegrationTestRunner({ 
        verbose: options.verbose || false 
      });

      console.log(`Running integration test: ${path.basename(testFile)}`);
      
      const result = await runner.runTestFromFile(testFile);

      if (result.success) {
        console.log('✅ Test PASSED');
        if (options.verbose) {
          console.log('Expected output matches generated artifact');
        }
      } else {
        console.log('❌ Test FAILED');
        console.error('Error:', result.error);
        
        if (result.expectedOutput && result.actualOutput && options.verbose) {
          console.log('\nExpected Output:');
          console.log(JSON.stringify(result.expectedOutput, null, 2));
          console.log('\nActual Output:');
          console.log(JSON.stringify(result.actualOutput, null, 2));
        }
        
        process.exit(1);
      }

    } catch (error) {
      console.error('Unexpected error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();