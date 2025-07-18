/**
 * Remote workflow repository implementation for HTTP-based workflow storage.
 * Provides client-side API communication with workflow repository servers,
 * including authentication, workflow management, and content synchronization.
 */

import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  UploadWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowListResponse,
  TreeResponse,
  TagsResponse,
  AuthorsResponse,
} from '../interfaces/ApiTypes.js';
import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { WorkflowSearchOptions } from '../models/RepositoryConfig.js';
import { WorkflowAttachment } from '../models/WorkflowAttachment.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';

/**
 * Remote workflow repository implementation for HTTP-based workflow storage.
 * Provides client-side access to workflow repository servers with automatic
 * authentication, content synchronization, and comprehensive workflow management.
 */
export class RemoteWorkflowRepository implements IWorkflowRepository {
  /** JWT authentication token for API requests */
  private authToken?: string;

  /**
   * Creates a new remote workflow repository client.
   *
   * @param baseUrl - Base URL of the workflow repository server
   * @param username - Optional username for authentication
   * @param password - Optional password for authentication
   */
  constructor(
    private baseUrl: string,
    private username?: string,
    private password?: string
  ) {}

  /**
   * Authenticates with the remote server using provided credentials.
   *
   * @returns Promise resolving to true if authentication succeeded
   * @throws Error if network request fails
   */
  async authenticate(): Promise<boolean> {
    if (!this.username || !this.password) {
      return false;
    }

    try {
      const loginRequest: LoginRequest = {
        username: this.username,
        password: this.password,
      };

      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      const result: ApiResponse<LoginResponse> = await response.json();

      if (result.success && result.data) {
        this.authToken = result.data.token;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Lists workflows from the remote repository.
   *
   * @param path - Optional path to list workflows from
   * @param options - Optional search and filtering options
   * @returns Promise resolving to array of workflow metadata
   * @throws Error if server request fails or returns error
   */
  async list(path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]> {
    const params = new URLSearchParams();

    if (path) params.set('path', path);
    if (options?.query) params.set('query', options.query);
    if (options?.author) params.set('author', options.author);
    if (options?.tags) params.set('tags', options.tags.join(','));
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await this.makeRequest(`/workflows?${params}`);
    const result: ApiResponse<WorkflowListResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to list workflows');
    }

    return result.data.workflows;
  }

  /**
   * Retrieves a complete workflow item including content and attachments.
   *
   * @param id - Unique workflow identifier
   * @returns Promise resolving to workflow item or null if not found
   * @throws Error if server communication fails
   */
  async get(id: string): Promise<WorkflowItem | null> {
    try {
      const metadataResponse = await this.makeRequest(`/workflows/${id}`);
      const metadataResult: ApiResponse<WorkflowMetadata> = await metadataResponse.json();

      if (!metadataResult.success || !metadataResult.data) {
        return null;
      }

      const content = await this.getContent(id);
      if (!content) {
        return null;
      }

      const attachments = await this.loadAttachments(id, metadataResult.data);

      return {
        metadata: metadataResult.data,
        mainFileContent: content.mainFile,
        attachments,
      };
    } catch {
      return null;
    }
  }

  /**
   * Downloads and extracts workflow content from the remote server.
   *
   * @param id - Unique workflow identifier
   * @returns Promise resolving to workflow content or null if not found
   * @throws Error if download or extraction fails
   */
  async getContent(id: string): Promise<WorkflowContent | null> {
    try {
      const response = await this.makeRequest(`/workflows/${id}/content`);

      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(arrayBuffer);

      const manifestFile = zip.file('workflow.json');
      if (!manifestFile) {
        return null;
      }

      const manifestContent = await manifestFile.async('string');
      const metadata = JSON.parse(manifestContent);

      const mainFileContent = await zip.file(metadata.mainFile)?.async('string');
      if (!mainFileContent) {
        return null;
      }

      const attachments = new Map<string, Buffer>();

      for (const [fileName, file] of Object.entries(zip.files)) {
        if (fileName !== 'workflow.json' && fileName !== metadata.mainFile && !file.dir) {
          const content = await file.async('nodebuffer');
          attachments.set(fileName, content);
        }
      }

      return {
        mainFile: mainFileContent,
        attachments,
      };
    } catch {
      return null;
    }
  }

  /**
   * Uploads a new workflow to the remote repository.
   *
   * @param path - Target path for the workflow
   * @param content - Workflow content including main file and attachments
   * @param metadata - Workflow metadata excluding system-generated fields
   * @returns Promise resolving to complete workflow metadata
   * @throws Error if authentication fails or upload is rejected
   */
  async upload(
    path: string,
    content: WorkflowContent,
    metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>
  ): Promise<WorkflowMetadata> {
    await this.ensureAuthenticated();

    const zipBuffer = await this.createWorkflowZip(content, metadata);
    const formData = new FormData();

    formData.append('workflow', new Blob([zipBuffer]), 'workflow.zip');

    const uploadRequest: UploadWorkflowRequest = {
      path,
      name: metadata.name,
      description: metadata.description,
      author: metadata.author,
      tags: [...metadata.tags],
      mainFile: metadata.mainFile,
    };

    Object.entries(uploadRequest).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    const response = await this.makeRequest('/workflows', {
      method: 'POST',
      body: formData,
      skipContentType: true,
    });

    const result: ApiResponse<WorkflowMetadata> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to upload workflow');
    }

    return result.data;
  }

  /**
   * Updates an existing workflow in the remote repository.
   *
   * @param id - Unique workflow identifier
   * @param content - Updated workflow content
   * @param metadata - Partial metadata updates
   * @returns Promise resolving to updated workflow metadata
   * @throws Error if authentication fails or workflow not found
   */
  async update(
    id: string,
    content: WorkflowContent,
    metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>
  ): Promise<WorkflowMetadata> {
    await this.ensureAuthenticated();

    const zipBuffer = await this.createWorkflowZip(content, metadata);
    const formData = new FormData();

    formData.append('workflow', new Blob([zipBuffer]), 'workflow.zip');

    // Create the update request object properly
    const updateRequest: UpdateWorkflowRequest = {
      ...(metadata.name ? { name: metadata.name } : {}),
      ...(metadata.description ? { description: metadata.description } : {}),
      ...(metadata.tags ? { tags: [...metadata.tags] } : {}),
    };

    Object.entries(updateRequest).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    const response = await this.makeRequest(`/workflows/${id}`, {
      method: 'PUT',
      body: formData,
      skipContentType: true,
    });

    const result: ApiResponse<WorkflowMetadata> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update workflow');
    }

    return result.data;
  }

  /**
   * Deletes a workflow from the remote repository.
   *
   * @param id - Unique workflow identifier
   * @returns Promise resolving to true if deletion succeeded
   * @throws Error if authentication fails
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureAuthenticated();

    try {
      const response = await this.makeRequest(`/workflows/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a workflow exists in the remote repository.
   *
   * @param id - Unique workflow identifier
   * @returns Promise resolving to true if workflow exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/workflows/${id}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Searches workflows in the remote repository.
   *
   * @param options - Search criteria including query, tags, author, etc.
   * @returns Promise resolving to array of matching workflow metadata
   * @throws Error if server request fails
   */
  async search(options: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]> {
    const params = new URLSearchParams();

    if (options.query) params.set('query', options.query);
    if (options.author) params.set('author', options.author);
    if (options.tags) params.set('tags', options.tags.join(','));
    if (options.path) params.set('path', options.path);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const response = await this.makeRequest(`/search?${params}`);
    const result: ApiResponse<WorkflowListResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to search workflows');
    }

    return result.data.workflows;
  }

  /**
   * Retrieves the hierarchical tree structure of workflows.
   *
   * @param path - Optional path to get tree structure from
   * @returns Promise resolving to workflow tree node
   * @throws Error if server request fails
   */
  async getTreeStructure(path?: string): Promise<WorkflowTreeNode> {
    const url = path ? `/tree/${path}` : '/tree';
    const response = await this.makeRequest(url);
    const result: ApiResponse<TreeResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get tree structure');
    }

    return result.data.tree;
  }

  /**
   * Retrieves all available tags from the remote repository.
   *
   * @returns Promise resolving to array of tag strings
   * @throws Error if server request fails
   */
  async getTags(): Promise<string[]> {
    const response = await this.makeRequest('/tags');
    const result: ApiResponse<TagsResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get tags');
    }

    return result.data.tags;
  }

  /**
   * Retrieves all workflow authors from the remote repository.
   *
   * @returns Promise resolving to array of author names
   * @throws Error if server request fails
   */
  async getAuthors(): Promise<string[]> {
    const response = await this.makeRequest('/authors');
    const result: ApiResponse<AuthorsResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get authors');
    }

    return result.data.authors;
  }

  /**
   * Makes an authenticated HTTP request to the server.
   *
   * @param endpoint - API endpoint path
   * @param options - Request options with optional content type skipping
   * @returns Promise resolving to HTTP response
   * @throws Error if request fails
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit & { skipContentType?: boolean } = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.skipContentType ? {} : { 'Content-Type': 'application/json' }),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401 && this.username && this.password) {
      const authenticated = await this.authenticate();
      if (authenticated) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
        return fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }

  /**
   * Ensures the client is authenticated before making protected requests.
   *
   * @throws Error if authentication fails
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken && this.username && this.password) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Authentication failed');
      }
    }
  }

  /**
   * Creates a ZIP archive containing workflow content and metadata.
   *
   * @param content - Workflow content including main file and attachments
   * @param metadata - Workflow metadata for manifest creation
   * @returns Promise resolving to ZIP buffer
   * @throws Error if ZIP creation fails
   */
  private async createWorkflowZip(content: WorkflowContent, metadata: any): Promise<Buffer> {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    zip.file(metadata.mainFile || 'main.xxp', content.mainFile);

    for (const [fileName, fileContent] of content.attachments) {
      zip.file(fileName, fileContent);
    }

    zip.file(
      'workflow.json',
      JSON.stringify(
        {
          name: metadata.name,
          description: metadata.description,
          author: metadata.author,
          tags: metadata.tags,
          mainFile: metadata.mainFile || 'main.xxp',
        },
        null,
        2
      )
    );

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    return buffer;
  }

  /**
   * Loads attachment metadata for a workflow.
   *
   * @param workflowId - Unique workflow identifier
   * @param metadata - Workflow metadata containing attachment information
   * @returns Promise resolving to array of attachment metadata
   */
  private async loadAttachments(
    workflowId: string,
    metadata: WorkflowMetadata
  ): Promise<readonly WorkflowAttachment[]> {
    if (!metadata.hasAttachments) {
      return [];
    }

    try {
      const content = await this.getContent(workflowId);
      if (!content) {
        return [];
      }

      const attachments: WorkflowAttachment[] = [];

      for (const [fileName] of content.attachments) {
        attachments.push({
          name: fileName,
          path: `${metadata.path}/${fileName}`,
          size: content.attachments.get(fileName)?.length || 0,
          mimeType: this.getMimeType(fileName),
          createdAt: metadata.createdAt,
          modifiedAt: metadata.modifiedAt,
        });
      }

      return attachments;
    } catch {
      return [];
    }
  }

  /**
   * Determines MIME type based on file extension.
   *
   * @param fileName - Name of the file including extension
   * @returns MIME type string or default octet-stream
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      py: 'text/x-python',
      js: 'application/javascript',
      ts: 'application/typescript',
      json: 'application/json',
      txt: 'text/plain',
      md: 'text/markdown',
      xxp: 'application/x-xxp',
      espace: 'application/x-espace',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
