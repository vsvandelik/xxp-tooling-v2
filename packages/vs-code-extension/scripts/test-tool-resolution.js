#!/usr/bin/env node

import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test to verify tool paths exist
const tools = ['artifact-generator', 'experiment-runner-server'];
const packagesDir = path.join(__dirname, '../../../packages');

console.log('Testing tool resolution...');

for (const tool of tools) {
  const toolPath = path.join(packagesDir, tool, 'dist');
  try {
    const fs = await import('fs');
    if (fs.existsSync(toolPath)) {
      console.log(`✓ ${tool}: Found at ${toolPath}`);
    } else {
      console.log(`✗ ${tool}: Not found at ${toolPath}`);
    }
  } catch (error) {
    console.log(`✗ ${tool}: Error checking ${toolPath} - ${error.message}`);
  }
}