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
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext'
      }
    }]
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/types/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Test timeout
  testTimeout: 30000
};
