/** @type {import('jest').Config} */
export default {
  displayName: '@extremexp/vs-code-extension',
  
  // Use ts-jest preset for TypeScript
  preset: 'ts-jest/presets/default-esm',
  
  // Set test environment (Node.js for VS Code extension testing)
  testEnvironment: 'node',
  
  // Root directory for this package
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|ts)',
    '<rootDir>/src/**/*.(test|spec).(js|ts)'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/test-files/' // Ignore sample test files
  ],
  
  // Module name mapping for internal imports
  moduleNameMapper: {
    '^@extremexp/core$': '<rootDir>/../core/src/index.ts',
    '^@extremexp/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@extremexp/artifact-generator$': '<rootDir>/../artifact-generator/src/index.ts',
    '^@extremexp/artifact-generator/(.*)$': '<rootDir>/../artifact-generator/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1' // Map .js extensions to .ts for imports
  },
  
  // Transform configuration
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'node'
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
