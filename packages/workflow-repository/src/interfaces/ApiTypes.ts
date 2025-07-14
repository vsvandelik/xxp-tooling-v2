/**
 * API type definitions for workflow repository HTTP operations.
 * Defines request and response structures for REST API communication
 * between clients and workflow repository servers.
 */

import { User } from '../models/User.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';

import { WorkflowTreeNode } from './IWorkflowRepository.js';

/**
 * Standard API response wrapper for all HTTP endpoints.
 * Provides consistent structure for success/error responses.
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  readonly success: boolean;
  /** Response data payload (present on success) */
  readonly data?: T;
  /** Error message (present on failure) */
  readonly error?: string;
  /** Additional message or status information */
  readonly message?: string;
}

/**
 * Request payload for user authentication.
 */
export interface LoginRequest {
  /** Username for authentication */
  readonly username: string;
  /** Password for authentication */
  readonly password: string;
}

/**
 * Response payload for successful authentication.
 */
export interface LoginResponse {
  /** JWT token for subsequent API requests */
  readonly token: string;
  /** Token expiration timestamp */
  readonly expiresAt: string;
  /** Authenticated user information */
  readonly user: User;
}

/**
 * Request payload for uploading a new workflow.
 */
export interface UploadWorkflowRequest {
  /** Target path for the workflow in the repository */
  readonly path: string;
  /** Human-readable name of the workflow */
  readonly name: string;
  /** Detailed description of the workflow */
  readonly description: string;
  /** Author or creator of the workflow */
  readonly author: string;
  /** Array of tags for categorization */
  readonly tags: string[];
  /** Name of the main workflow file */
  readonly mainFile: string;
}

/**
 * Request payload for updating an existing workflow.
 * All fields are optional to support partial updates.
 */
export interface UpdateWorkflowRequest {
  /** Updated workflow name */
  readonly name?: string;
  /** Updated workflow description */
  readonly description?: string;
  /** Updated workflow tags */
  readonly tags?: string[];
}

/**
 * Request parameters for searching workflows.
 * Supports text search, filtering, and pagination.
 */
export interface SearchWorkflowRequest {
  /** Text query to search in workflow names and descriptions */
  readonly query?: string;
  /** Array of tags to filter by */
  readonly tags?: string[];
  /** Author name to filter by */
  readonly author?: string;
  /** Path prefix to filter by */
  readonly path?: string;
  /** Maximum number of results to return */
  readonly limit?: number;
  /** Number of results to skip (for pagination) */
  readonly offset?: number;
}

export interface WorkflowListResponse {
  readonly workflows: WorkflowMetadata[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
}

export interface TreeResponse {
  readonly tree: WorkflowTreeNode;
}

export interface TagsResponse {
  readonly tags: string[];
}

export interface AuthorsResponse {
  readonly authors: string[];
}
