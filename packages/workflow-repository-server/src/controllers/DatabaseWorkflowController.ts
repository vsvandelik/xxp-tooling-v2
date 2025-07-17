/**
 * Database-based workflow controller for handling HTTP API requests.
 * Provides comprehensive REST API endpoints for workflow management using
 * database storage for metadata and filesystem for content.
 */

import {
  ApiResponse,
  UploadWorkflowRequest,
  UpdateWorkflowRequest,
  SearchWorkflowRequest,
  WorkflowListResponse,
  TreeResponse,
  TagsResponse,
  AuthorsResponse,
  WorkflowSearchOptions,
} from '@extremexp/workflow-repository';
import { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { UserService } from '../services/UserService.js';
import { DatabaseWorkflowStorageService } from '../services/DatabaseWorkflowStorageService.js';

/**
 * Controller class handling all workflow-related HTTP API endpoints with database storage.
 * Provides comprehensive workflow management functionality including CRUD operations,
 * file uploads, search capabilities, and metadata discovery.
 */
export class DatabaseWorkflowController {
  /** Multer instance for handling file uploads */
  private upload = multer({ storage: multer.memoryStorage() });

  /**
   * Creates a new database workflow controller.
   *
   * @param storageService - Service for database workflow storage operations
   * @param userService - Service for user authentication and authorization
   */
  constructor(
    private storageService: DatabaseWorkflowStorageService,
    private userService: UserService
  ) {}

  /**
   * Lists workflows with optional search and filtering.
   *
   * @param req - Express request object with optional query parameters
   * @param res - Express response object
   */
  listWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: SearchWorkflowRequest = req.query;

      // Create search options object, only including defined properties
      const searchOptions: WorkflowSearchOptions = {
        ...(query.query !== undefined && { query: query.query }),
        ...(query.tags !== undefined && { tags: query.tags }),
        ...(query.author !== undefined && { author: query.author }),
        ...(query.path !== undefined && { path: query.path }),
        ...(query.limit !== undefined && { limit: parseInt(query.limit.toString()) }),
        ...(query.offset !== undefined && { offset: parseInt(query.offset.toString()) }),
      };

      const workflows = await this.storageService.searchWorkflows(searchOptions);

      const response: ApiResponse<WorkflowListResponse> = {
        success: true,
        data: {
          workflows: [...workflows],
          total: workflows.length,
          offset: query.offset ? parseInt(query.offset.toString()) : 0,
          limit: query.limit ? parseInt(query.limit.toString()) : workflows.length,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Retrieves metadata for a specific workflow.
   *
   * @param req - Express request object with workflow ID in params
   * @param res - Express response object
   */
  getWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const workflow = await this.storageService.getWorkflowMetadata(id);

      if (!workflow) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: workflow,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Downloads a complete workflow as a ZIP archive.
   *
   * @param req - Express request object with workflow ID in params
   * @param res - Express response object with ZIP content
   */
  downloadWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const zipBuffer = await this.storageService.createWorkflowZip(id);

      if (!zipBuffer) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found',
        };
        res.status(404).json(response);
        return;
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="workflow-${id}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Downloads a specific file from a workflow.
   *
   * @param req - Express request object with workflow ID and file path
   * @param res - Express response object with file content
   */
  downloadWorkflowFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, '*': filePath } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow ID is required',
        };
        res.status(400).json(response);
        return;
      }
      if (!filePath) {
        const response: ApiResponse = {
          success: false,
          error: 'File path is required',
        };
        res.status(400).json(response);
        return;
      }

      // This would need to be implemented in the storage service
      // For now, return not implemented
      const response: ApiResponse = {
        success: false,
        error: 'File download not implemented yet',
      };
      res.status(501).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Uploads a new workflow to the repository.
   * Handles file upload, validation, conflict detection, and storage.
   */
  uploadWorkflow = [
    multer({ storage: multer.memoryStorage() }).single('workflow'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          const response: ApiResponse = {
            success: false,
            error: 'No file uploaded',
          };
          res.status(400).json(response);
          return;
        }

        const extracted = await this.storageService.extractWorkflowFromZip(req.file.buffer);
        if (!extracted) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid workflow file',
          };
          res.status(400).json(response);
          return;
        }

        const uploadRequest: UploadWorkflowRequest = req.body;

        if (!(await this.storageService.validateWorkflowPath(uploadRequest.path))) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid workflow path',
          };
          res.status(400).json(response);
          return;
        }

        // Check for existing workflow
        const existingCheck = await this.storageService.checkForExistingWorkflow(
          uploadRequest.path,
          uploadRequest.name
        );

        if (existingCheck.exists) {
          const requestId = (req.headers['x-request-id'] as string) || uuidv4();
          const canOverride = await this.storageService.canOverrideWorkflow(
            existingCheck.id!,
            requestId
          );

          if (!canOverride) {
            const response: ApiResponse = {
              success: false,
              error:
                `Workflow "${uploadRequest.name}" already exists at path "${uploadRequest.path}". ` +
                `Send a confirmation request with X-Request-Id header to override.`,
              data: {
                existingWorkflowId: existingCheck.id,
                requestId: requestId,
              },
            };
            res.status(409).json(response); // 409 Conflict
            return;
          }

          // User confirmed override, update instead of create
          const metadata = await this.storageService.updateWorkflow(existingCheck.id!, extracted.content, {
            description: uploadRequest.description,
            author: req.user?.username || uploadRequest.author,
            tags: uploadRequest.tags,
          });

          const response: ApiResponse = {
            success: true,
            data: metadata,
            message: 'Workflow updated successfully (replaced existing)',
          };

          res.json(response);
          return;
        }

        // New workflow, proceed with upload
        const metadata = await this.storageService.storeWorkflow(uploadRequest.path, extracted.content, {
          name: uploadRequest.name,
          description: uploadRequest.description,
          author: req.user?.username || uploadRequest.author,
          tags: uploadRequest.tags,
          path: uploadRequest.path,
          mainFile: uploadRequest.mainFile,
        });

        const response: ApiResponse = {
          success: true,
          data: metadata,
          message: 'Workflow uploaded successfully',
        };

        res.status(201).json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        res.status(500).json(response);
      }
    },
  ];

  /**
   * Confirms permission to override an existing workflow.
   *
   * @param req - Express request object with workflowId and requestId
   * @param res - Express response object
   */
  confirmOverride = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId, requestId } = req.body;

      if (!workflowId || !requestId) {
        const response: ApiResponse = {
          success: false,
          error: 'workflowId and requestId are required',
        };
        res.status(400).json(response);
        return;
      }

      this.storageService.setOverridePermission(workflowId, requestId, true);

      const response: ApiResponse = {
        success: true,
        message:
          'Override permission granted. You can now upload the workflow with the same X-Request-Id header.',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Updates an existing workflow's content and/or metadata.
   * Handles both file uploads and metadata-only updates.
   */
  updateWorkflow = [
    multer({ storage: multer.memoryStorage() }).single('workflow'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        if (!id) {
          const response: ApiResponse = {
            success: false,
            error: 'Workflow ID is required',
          };
          res.status(400).json(response);
          return;
        }

        const updateRequest: UpdateWorkflowRequest = req.body;

        let content: any = undefined;
        if (req.file) {
          const extracted = await this.storageService.extractWorkflowFromZip(req.file.buffer);
          if (!extracted) {
            const response: ApiResponse = {
              success: false,
              error: 'Invalid workflow file',
            };
            res.status(400).json(response);
            return;
          }
          content = extracted.content;
        } else {
          // For metadata-only updates, we need to get existing content
          // This would require implementing getWorkflowContent in the storage service
          const response: ApiResponse = {
            success: false,
            error: 'Metadata-only updates not implemented yet',
          };
          res.status(501).json(response);
          return;
        }

        const metadata = await this.storageService.updateWorkflow(id, content, updateRequest);

        const response: ApiResponse = {
          success: true,
          data: metadata,
          message: 'Workflow updated successfully',
        };

        res.json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        res.status(500).json(response);
      }
    },
  ];

  /**
   * Deletes a workflow from the repository.
   *
   * @param req - Express request object with workflow ID in params
   * @param res - Express response object
   */
  deleteWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await this.storageService.deleteWorkflow(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Workflow deleted successfully',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Retrieves the hierarchical tree structure of workflows.
   *
   * @param req - Express request object with optional path parameter
   * @param res - Express response object with tree structure
   */
  getTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const path = req.params['*'] || '';
      const tree = await this.storageService.getTreeStructure(path);

      const response: ApiResponse<TreeResponse> = {
        success: true,
        data: { tree },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Retrieves all available workflow tags.
   *
   * @param req - Express request object
   * @param res - Express response object with tags array
   */
  getTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const tags = await this.storageService.getAllTags();

      const response: ApiResponse<TagsResponse> = {
        success: true,
        data: { tags },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Retrieves all workflow authors.
   *
   * @param req - Express request object
   * @param res - Express response object with authors array
   */
  getAuthors = async (req: Request, res: Response): Promise<void> => {
    try {
      const authors = await this.storageService.getAllAuthors();

      const response: ApiResponse<AuthorsResponse> = {
        success: true,
        data: { authors },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Searches workflows based on various criteria.
   *
   * @param req - Express request object with search parameters
   * @param res - Express response object with search results
   */
  searchWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: SearchWorkflowRequest = req.query;

      // Create search options object, only including defined properties
      const searchOptions: WorkflowSearchOptions = {
        ...(query.query !== undefined && { query: query.query }),
        ...(query.tags !== undefined && { tags: query.tags }),
        ...(query.author !== undefined && { author: query.author }),
        ...(query.path !== undefined && { path: query.path }),
        ...(query.limit !== undefined && { limit: parseInt(query.limit.toString()) }),
        ...(query.offset !== undefined && { offset: parseInt(query.offset.toString()) }),
      };

      const workflows = await this.storageService.searchWorkflows(searchOptions);

      const response: ApiResponse<WorkflowListResponse> = {
        success: true,
        data: {
          workflows: [...workflows],
          total: workflows.length,
          offset: query.offset ? parseInt(query.offset.toString()) : 0,
          limit: query.limit ? parseInt(query.limit.toString()) : workflows.length,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };

  /**
   * Retrieves the owner/author of a specific workflow.
   *
   * @param req - Express request object with workflow ID in params
   * @returns Promise resolving to owner username or null if not found
   */
  getWorkflowOwner = async (req: Request): Promise<string | null> => {
    const { id } = req.params;
    if (!id) {
      return null;
    }
    return await this.storageService.getWorkflowOwner(id);
  };

  /**
   * Adds one or more attachments to an existing workflow.
   * Supports multiple file uploads up to 20 files.
   */
  addAttachment = [
    multer({ storage: multer.memoryStorage() }).array('attachments', 20),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        if (!id) {
          const response: ApiResponse = {
            success: false,
            error: 'Workflow ID is required',
          };
          res.status(400).json(response);
          return;
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          const response: ApiResponse = {
            success: false,
            error: 'No files uploaded',
          };
          res.status(400).json(response);
          return;
        }

        // This would need to be implemented in the storage service
        const response: ApiResponse = {
          success: false,
          error: 'Add attachment not implemented yet',
        };
        res.status(501).json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        res.status(500).json(response);
      }
    },
  ];

  /**
   * Removes a specific attachment from a workflow.
   *
   * @param req - Express request object with workflow ID and file name
   * @param res - Express response object
   */
  deleteAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, fileName } = req.params;
      if (!id || !fileName) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow ID and file name are required',
        };
        res.status(400).json(response);
        return;
      }

      // This would need to be implemented in the storage service
      const response: ApiResponse = {
        success: false,
        error: 'Delete attachment not implemented yet',
      };
      res.status(501).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  };
}