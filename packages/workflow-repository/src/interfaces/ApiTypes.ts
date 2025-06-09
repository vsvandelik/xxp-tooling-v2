import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { WorkflowTreeNode } from './IWorkflowRepository.js';
import { User } from '../models/User.js';

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly token: string;
  readonly expiresAt: string;
  readonly user: User;
}

export interface UploadWorkflowRequest {
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly version: string;
  readonly tags: string[];
  readonly mainFile: string;
}

export interface UpdateWorkflowRequest {
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
  readonly tags?: string[];
}

export interface SearchWorkflowRequest {
  readonly query?: string;
  readonly tags?: string[];
  readonly author?: string;
  readonly path?: string;
  readonly limit?: number;
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