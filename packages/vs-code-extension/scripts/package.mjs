#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
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

// Step 2.5: Remove @extremexp dependencies from package.json
console.log('🧹 Removing @extremexp dependencies from package.json...');
const packageJsonPath = join(extensionRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Backup original package.json
const backupPath = join(extensionRoot, 'package.json.backup');
copyFileSync(packageJsonPath, backupPath);

// Remove @extremexp dependencies
if (packageJson.dependencies) {
  Object.keys(packageJson.dependencies).forEach(dep => {
    if (dep.startsWith('@extremexp')) {
      delete packageJson.dependencies[dep];
    }
  });
}

if (packageJson.devDependencies) {
  Object.keys(packageJson.devDependencies).forEach(dep => {
    if (dep.startsWith('@extremexp')) {
      delete packageJson.devDependencies[dep];
    }
  });
}~

// Write modified package.json
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Step 3: Package the extension
console.log('📦 Creating VSIX package...');
execSync('vsce package', { 
  cwd: extensionRoot, 
  stdio: 'inherit' 
});

// Step 4: Clean up
console.log('🔄 Restoring original package.json...');
copyFileSync(backupPath, packageJsonPath);

// Remove backup file
console.log('🗑️ Removing backup file...');
unlinkSync(backupPath);

console.log('✅ Package process completed successfully!');
