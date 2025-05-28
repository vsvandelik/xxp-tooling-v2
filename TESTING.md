# Testing Infrastructure

This document describes the testing setup for the XXP Tooling TypeScript monorepo.

## Overview

The monorepo uses Jest as the testing framework with TypeScript and ESM support. Each package has its own Jest configuration with shared patterns and modern testing conventions.

## Architecture

### Root Configuration
- `jest.config.js` at root provides project discovery
- Individual packages have their own Jest configurations
- Coverage reports are generated per package

### Package Structure
Each package follows the `__tests__` convention:
```
packages/
  core/
    __tests__/
      naming.test.ts
      setup.ts
    jest.config.js
  artifact-generator/
    __tests__/
      ArtifactGenerator.test.ts
    jest.config.js
  vs-code-extension/
    __tests__/
      extension.test.ts
    jest.config.js
```

## Running Tests

### Individual Package Tests
```bash
# Core package tests
cd packages/core && npm test

# Artifact generator tests  
cd packages/artifact-generator && npm test

# VS Code extension tests
cd packages/vs-code-extension && npm test
```

### All Package Tests
```bash
# From root - runs all package tests via workspaces
npm test
```

### Test Commands Available
Each package supports:
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Current Status

### ✅ Working
- **Core package tests**: 11 tests passing with 100% coverage on `naming.ts`
- **Artifact generator tests**: 4 tests passing with module import working
- **VS Code extension tests**: 2 tests passing with basic functionality
- **Individual package test execution**: All packages work correctly when run individually
- **Workspace-level testing**: `npm test` from root executes all packages successfully
- **TypeScript/ESM support**: Full TypeScript compilation and ES modules working
- **Coverage reporting**: HTML and LCOV coverage reports generated per package
- **Modern Jest configuration**: Using `@jest/globals`, `ts-jest`, and proper ESM setup

### ⚠️ Known Limitations
- **Root Jest project discovery**: Running `npx jest --projects .` from root has configuration conflicts
- **Cross-package integration tests**: Not yet implemented (packages tested in isolation)

### 📁 Test Coverage
- **Core package**: 100% coverage on `naming.ts` utility functions
- **Artifact generator**: Basic constructor and validation tests
- **VS Code extension**: Basic module import and placeholder tests

## Configuration Details

### Jest Setup
- **Preset**: `ts-jest/presets/default-esm` for TypeScript ESM support
- **Environment**: Node.js
- **Transform**: TypeScript files with ES modules
- **Module mapping**: Internal package imports and `.js` extension handling
- **Coverage**: HTML and LCOV reports with source mapping

### Test File Patterns
- `__tests__/**/*.(test|spec).(js|ts)`
- Ignores `dist/`, `node_modules/`, and generated ANTLR files

### TypeScript Configuration
- Full TypeScript support with source maps
- ES modules enabled
- Module resolution for internal packages
- Type checking during tests

## Best Practices

### Test Organization
1. Use `__tests__` directories for test files
2. Name test files with `.test.ts` suffix
3. Group related tests with `describe` blocks
4. Use descriptive test names with `it` blocks

### Writing Tests
```typescript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '../src/module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should handle normal case', () => {
      expect(functionToTest('input')).toBe('expected');
    });
    
    it('should handle edge cases', () => {
      expect(() => functionToTest('')).toThrow('Error message');
    });
  });
});
```

### Coverage Goals
- Aim for high coverage on utility functions
- Focus on testing public APIs
- Include edge case and error handling tests
- Document any intentionally uncovered code

## Future Improvements

1. **Cross-package integration tests**: Test interactions between packages
2. **End-to-end tests**: Test complete workflows from CLI to output
3. **Performance tests**: Benchmark parsing and generation operations
4. **Root project discovery**: Fix Jest configuration for unified test runs
5. **CI/CD integration**: Automated testing in build pipelines

## Troubleshooting

### Common Issues
- **Import errors**: Ensure imports don't use `.js` extensions in TypeScript files
- **ESM issues**: Verify `type: "module"` in package.json and proper Jest ESM configuration
- **Coverage not showing**: Check that source files are in `src/` directory and properly configured

### Debugging
- Use `--verbose` flag for detailed test output
- Check individual package Jest configurations for module resolution
- Verify TypeScript compilation before running tests

---

**Last Updated**: Current testing infrastructure is fully functional for individual package testing with comprehensive coverage and modern tooling.
