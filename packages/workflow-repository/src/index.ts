/**
 * @fileoverview Main entry point for the ExtremeXP workflow repository library.
 * Exports all public APIs for workflow management including models, interfaces,
 * repository implementations, and manager classes.
 */

// Core models
export { WorkflowMetadata } from './models/WorkflowMetadata.js';
export { WorkflowAttachment } from './models/WorkflowAttachment.js';
export { WorkflowItem, WorkflowContent } from './models/WorkflowItem.js';
export { RepositoryConfig, WorkflowSearchOptions } from './models/RepositoryConfig.js';
export { User, UserRole, UserCredentials, AuthToken, CreateUserRequest } from './models/User.js';

// Interfaces
export { IWorkflowRepository, WorkflowTreeNode } from './interfaces/IWorkflowRepository.js';
export {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  UploadWorkflowRequest,
  UpdateWorkflowRequest,
  SearchWorkflowRequest,
  WorkflowListResponse,
  TreeResponse,
  TagsResponse,
  AuthorsResponse,
} from './interfaces/ApiTypes.js';

// Repository implementations
export { LocalWorkflowRepository } from './repositories/LocalWorkflowRepository.js';
export { RemoteWorkflowRepository } from './repositories/RemoteWorkflowRepository.js';

// Manager
export { WorkflowRepositoryManager } from './managers/WorkflowRepositoryManager.js';
