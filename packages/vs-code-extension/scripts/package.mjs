#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionRoot = dirname(__dirname);
const repoRoot = join(extensionRoot, '..', '..');

console.log('📦 Starting package process...');

// Step 1: Build the VS Code extension itself
console.log('🔨 Building VS Code extension...');
execSync('node esbuild.cjs --production', { 
  cwd: extensionRoot, 
  stdio: 'inherit' 
});

// Step 2: Build and bundle all required packages
const packages = [
  'artifact-generator',
  'language-server', 
  'experiment-runner-server'
];

const toolsDir = join(extensionRoot, 'tools');
if (!existsSync(toolsDir)) {
  mkdirSync(toolsDir, { recursive: true });
}

for (const pkg of packages) {
  console.log(`🔨 Building and bundling ${pkg}...`);
  const packagePath = join(repoRoot, 'packages', pkg);
  
  // Build the package with esbuild
  execSync('npm run bundle', { 
    cwd: packagePath, 
    stdio: 'inherit' 
  });
  
  // Copy the bundled .cjs file to tools directory
  let sourceFile, targetFile;
  
  if (pkg === 'artifact-generator') {
    sourceFile = join(packagePath, 'dist', 'cli.cjs');
    targetFile = join(toolsDir, 'artifact-generator.cjs');
  } else if (pkg === 'language-server') {
    sourceFile = join(packagePath, 'dist', 'server.cjs');
    targetFile = join(toolsDir, 'language-server.cjs');
  } else if (pkg === 'experiment-runner-server') {
    sourceFile = join(packagePath, 'dist', 'server.cjs');
    targetFile = join(toolsDir, 'experiment-runner-server.cjs');
  }
  
  console.log(`📁 Copying ${sourceFile} to ${targetFile}`);
  copyFileSync(sourceFile, targetFile);
}

// Step 3: Package the extension
console.log('📦 Creating VSIX package...');
execSync('vsce package', { 
  cwd: extensionRoot, 
  stdio: 'inherit' 
});

console.log('✅ Package process completed successfully!');
