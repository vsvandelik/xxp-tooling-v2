/** @type {import('jest').Config} */
export default {
  // Root configuration that discovers all package configurations
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/artifact-generator', 
    '<rootDir>/packages/experiment-runner', 
    '<rootDir>/packages/vs-code-extension'
  ],
  
  // Global coverage settings
  collectCoverage: false, // Coverage is handled per project
  coverageDirectory: '<rootDir>/coverage',
  
  // Verbose output for better debugging
  verbose: true
};
