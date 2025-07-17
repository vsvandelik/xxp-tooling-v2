/**
 * Main entry point for the ExtremeXP workflow repository server.
 * Exports core server components including the main server class, services,
 * middleware, and controllers for workflow repository management.
 */

// Original file-based implementation
export { WorkflowRepositoryServer, ServerConfig } from './server/WorkflowRepositoryServer.js';
export { UserService } from './services/UserService.js';
export { WorkflowStorageService } from './services/WorkflowStorageService.js';
export { AuthenticationMiddleware } from './middleware/AuthenticationMiddleware.js';
export { WorkflowController } from './controlers/WorkflowController.js';

// New database-based implementation
export {
  DatabaseWorkflowRepositoryServer,
  DatabaseServerConfig,
} from './server/DatabaseWorkflowRepositoryServer.js';
export { DatabaseWorkflowStorageService } from './services/DatabaseWorkflowStorageService.js';
export { DatabaseWorkflowController } from './controllers/DatabaseWorkflowController.js';
export {
  IWorkflowDatabase,
  WorkflowRecord,
  WorkflowTreeRecord,
} from './database/IWorkflowDatabase.js';
export { SqliteWorkflowDatabase } from './database/SqliteWorkflowDatabase.js';
