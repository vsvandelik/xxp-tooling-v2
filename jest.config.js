/** @type {import('jest').Config} */
export default {
  // Root configuration that discovers all package configurations
  projects: [
    '<rootDir>/packages/artifact-generator', 
    '<rootDir>/packages/core',
    '<rootDir>/packages/experiment-runner',
    '<rootDir>/packages/experiment-runner-server', 
    '<rootDir>/packages/language-server',
    '<rootDir>/packages/vs-code-extension',
    '<rootDir>/packages/workflow-repository',
    '<rootDir>/packages/workflow-repository-server',
  ],

  // Global coverage settings
  collectCoverage: false, // Coverage is handled per project
  coverageDirectory: '<rootDir>/coverage',
  
  // Verbose output for better debugging
  verbose: true
};
