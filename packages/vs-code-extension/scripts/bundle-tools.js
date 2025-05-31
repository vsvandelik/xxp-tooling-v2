#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

function validateToolExists(tool) {
  const distPath = path.join(tool.packagePath, 'dist');
  const entryPath = path.join(distPath, tool.entryPoint);
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build directory not found for ${tool.name}: ${distPath}\nMake sure to run 'npm run build' first.`);
  }
  
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry point not found for ${tool.name}: ${entryPath}`);
  }
  
  return true;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionRoot = path.join(__dirname, '..');
const bundledToolsDir = path.join(extensionRoot, 'bundled-tools');
const packagesDir = path.join(extensionRoot, '../../packages');

const tools = [
  {
    name: 'artifact-generator',
    entryPoint: 'cli.js',
    packagePath: path.join(packagesDir, 'artifact-generator'),
  },
  {
    name: 'experiment-runner-server',
    entryPoint: 'server.js',
    packagePath: path.join(packagesDir, 'experiment-runner-server'),
  },
];

async function bundleTools() {
  console.log('Bundling tools for VS Code extension...');
  
  // Validate all tools exist before bundling
  console.log('Validating tools...');
  for (const tool of tools) {
    try {
      validateToolExists(tool);
      console.log(`✓ ${tool.name} validated`);
    } catch (error) {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    }
  }
  
  // Clean bundled tools directory
  if (fs.existsSync(bundledToolsDir)) {
    fs.rmSync(bundledToolsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(bundledToolsDir, { recursive: true });

  for (const tool of tools) {
    console.log(`Bundling ${tool.name}...`);
    
    const toolBundleDir = path.join(bundledToolsDir, tool.name);
    fs.mkdirSync(toolBundleDir, { recursive: true });

    // Copy built files
    const distDir = path.join(tool.packagePath, 'dist');
    copyRecursively(distDir, toolBundleDir);

    // Copy package.json for dependency information
    const packageJsonPath = path.join(tool.packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      fs.copyFileSync(packageJsonPath, path.join(toolBundleDir, 'package.json'));
    }

    console.log(`✓ ${tool.name} bundled successfully`);
  }

  console.log('All tools bundled successfully!');
  console.log(`Bundle location: ${bundledToolsDir}`);
}

function copyRecursively(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursively(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bundleTools().catch(console.error);
}