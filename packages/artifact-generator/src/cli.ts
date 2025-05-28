#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ArtifactGenerator } from './ArtifactGenerator.js';

const program = new Command();

program
    .name('artifact-generator')
    .description('Generate experiment artifacts from ESPACE files')
    .version('1.0.0')['argument']('<espace-file>', 'Path to the ESPACE experiment file')
    .option('-o, --output <path>', 'Output file path', 'artifact.json')
    .option('--validate-only', 'Only validate, do not generate artifact')
    .option('--verbose', 'Enable verbose logging')
    .action(async (espaceFile: string, options: { output: string; validateOnly?: boolean; verbose?: boolean }) => {
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
        if (validation.errors.length > 0) {
            console.error('Validation errors:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            process.exit(1);
        }
        if (validation.warnings.length > 0) {
            console.warn('Validation warnings:');
            validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }
        console.log('Validation successful');
        return;
        }

        const artifact = await generator.generate(espaceFile);
        
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
        
        console.log(`Artifact generated successfully: ${outputPath}`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    });

program.parse();