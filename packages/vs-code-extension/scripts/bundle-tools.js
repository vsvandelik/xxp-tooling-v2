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
    name: 'core',
    entryPoint: 'index.js',
    packagePath: path.join(packagesDir, 'core'),
  },
  {
    name: 'artifact-generator',
    entryPoint: 'cli.js',
    packagePath: path.join(packagesDir, 'artifact-generator'),
  },
  {
    name: 'experiment-runner',
    entryPoint: 'index.js',
    packagePath: path.join(packagesDir, 'experiment-runner'),
  },
  {
    name: 'experiment-runner-server',
    entryPoint: 'server.js',
    packagePath: path.join(packagesDir, 'experiment-runner-server'),
  },
  {
    name: 'language-server',
    entryPoint: 'server.js',
    packagePath: path.join(packagesDir, 'language-server'),
  },
  {
    name: 'workflow-repository',
    entryPoint: 'index.js',
    packagePath: path.join(packagesDir, 'workflow-repository'),
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

  // Create unified package.json for all dependencies
  await createUnifiedPackageJson();
  
  // Install dependencies
  await installDependencies();

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

    // Copy node_modules if they exist
    const nodeModulesPath = path.join(tool.packagePath, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const nodeModulesDestPath = path.join(toolBundleDir, 'node_modules');
      copyRecursively(nodeModulesPath, nodeModulesDestPath);
      console.log(`  ✓ node_modules bundled for ${tool.name}`);
    }

    console.log(`✓ ${tool.name} bundled successfully`);
  }

  console.log('All tools bundled successfully!');
  console.log(`Bundle location: ${bundledToolsDir}`);
}

async function installDependencies() {
  console.log('Installing dependencies for bundled tools...');
  
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    const npmInstall = spawn('npm', ['install', '--production'], {
      cwd: bundledToolsDir,
      stdio: 'inherit'
    });
    
    npmInstall.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Dependencies installed successfully');
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
    
    npmInstall.on('error', (error) => {
      reject(error);
    });
  });
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

async function createUnifiedPackageJson() {
  console.log('Creating unified package.json for dependencies...');
  
  const allDependencies = {};
  
  // Collect all dependencies from all tools
  for (const tool of tools) {
    const packageJsonPath = path.join(tool.packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageData.dependencies) {
        Object.assign(allDependencies, packageData.dependencies);
      }
    }
  }
  
  // Filter out internal dependencies (they're bundled separately)
  const externalDependencies = {};
  for (const [name, version] of Object.entries(allDependencies)) {
    if (!name.startsWith('@extremexp/')) {
      externalDependencies[name] = version;
    }
  }
  
  const unifiedPackageJson = {
    name: 'bundled-tools',
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: externalDependencies
  };
  
  const packageJsonPath = path.join(bundledToolsDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(unifiedPackageJson, null, 2));
  
  console.log(`✓ Created unified package.json with ${Object.keys(externalDependencies).length} dependencies`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bundleTools().catch(console.error);
}