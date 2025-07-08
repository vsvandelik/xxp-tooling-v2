#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

import { Command } from 'commander';

import { ArtifactGenerator } from './generators/ArtifactGenerator.js';

const program = new Command();

// prettier-ignore
program
  .name('artifact-generator')
  .description('Generate experiment artifacts from ESPACE files')
  .version('1.0.0')['argument']('<espace-file>', 'Path to the ESPACE experiment file')
  .option('-o, --output <path>', 'Output file path (default: artifact.json in same directory as input file)', 'artifact.json')
  .option('--validate-only', 'Only validate, do not generate artifact')
  .option('--verbose', 'Enable verbose logging')
  .action(
    async (
      espaceFile: string,
      options: { output: string; validateOnly?: boolean; verbose?: boolean }
    ) => {
      try {
        if (!fs.existsSync(espaceFile)) {
          console.error(`Error: ESPACE file not found: ${espaceFile}`);
          process.exit(1);
        }

        const generator = new ArtifactGenerator({
          verbose: options.verbose || false,
        });

        if (options.validateOnly) {
          const validation = await generator.validate(espaceFile);
          printValidationResults(validation);
          console.log('Validation successful');
          return;
        }

        const { artifact, validation } = await generator.generate(espaceFile);

        printValidationResults(validation);

        // If output is the default 'artifact.json', place it in the same directory as the input file
        let outputPath: string;
        if (options.output === 'artifact.json') {
          const espaceDir = path.dirname(path.resolve(espaceFile));
          outputPath = path.join(espaceDir, 'artifact.json');
        } else {
          outputPath = path.resolve(options.output);
        }
        
        fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

        console.log(`Artifact generated successfully: ${outputPath}`);
      } catch (error) {
        console.error('Unexpected error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );

program.parse();

function printValidationResults(validation: { errors: string[]; warnings: string[] }): void {
  if (validation.errors.length > 0) {
    console.error('Validation errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  if (validation.warnings.length > 0) {
    console.warn('Validation warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}
