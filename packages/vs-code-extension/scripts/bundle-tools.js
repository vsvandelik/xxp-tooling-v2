#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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
    if (fs.existsSync(distDir)) {
      copyRecursively(distDir, toolBundleDir);
    } else {
      console.warn(`Warning: dist directory not found for ${tool.name}. Make sure to build packages first.`);
    }

    // Copy package.json for dependency information
    const packageJsonPath = path.join(tool.packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      fs.copyFileSync(packageJsonPath, path.join(toolBundleDir, 'package.json'));
    }

    // Copy node_modules if they exist and are needed
    const nodeModulesPath = path.join(tool.packagePath, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const targetNodeModules = path.join(toolBundleDir, 'node_modules');
      copyRecursively(nodeModulesPath, targetNodeModules);
    }
  }

  console.log('Tools bundled successfully!');
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