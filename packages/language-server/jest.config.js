/** @type {import('jest').Config} */
export default {
  displayName: '@extremexp/language-server',
  
  // Use ts-jest preset for TypeScript
  preset: 'ts-jest/presets/default-esm',
  
  // Set test environment
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
    '<rootDir>/dist/'
  ],
  
  // Module name mapping for internal imports
  moduleNameMapper: {
    '^@extremexp/core$': '<rootDir>/../core/src/index.ts',
    '^@extremexp/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@extremexp/language-server$': '<rootDir>/src/index.ts',
    '^@extremexp/language-server/(.*)$': '<rootDir>/src/$1',
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
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
