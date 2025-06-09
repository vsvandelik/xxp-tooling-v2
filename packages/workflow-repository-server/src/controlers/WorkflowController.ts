import { Request, Response } from 'express';
import multer from 'multer';
import { WorkflowStorageService } from '../services/WorkflowStorageService.js';
import { UserService } from '../services/UserService.js';
import {
  ApiResponse,
  UploadWorkflowRequest,
  UpdateWorkflowRequest,
  SearchWorkflowRequest,
  WorkflowListResponse,
  TreeResponse,
  TagsResponse,
  AuthorsResponse
} from './ApiTypes.js';

export class WorkflowController {
  private upload = multer({ storage: multer.memoryStorage() });

  constructor(
    private storageService: WorkflowStorageService,
    private userService: UserService
  ) {}

  listWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: SearchWorkflowRequest = req.query;
      const repository = this.storageService.getRepository();
      
      const workflows = await repository.search({
        query: query.query,
        tags: query.tags,
        author: query.author,
        path: query.path,
        limit: query.limit ? parseInt(query.limit.toString()) : undefined,
        offset: query.offset ? parseInt(query.offset.toString()) : undefined
      });

      const response: ApiResponse<WorkflowListResponse> = {
        success: true,
        data: {
          workflows: [...workflows],
          total: workflows.length,
          offset: query.offset ? parseInt(query.offset.toString()) : 0,
          limit: query.limit ? parseInt(query.limit.toString()) : workflows.length
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  getWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const repository = this.storageService.getRepository();
      const workflow = await repository.get(id);

      if (!workflow) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: workflow.metadata
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  downloadWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const zipBuffer = await this.storageService.createWorkflowZip(id);

      if (!zipBuffer) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found'
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
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  downloadWorkflowFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, '*': filePath } = req.params;
      const repository = this.storageService.getRepository();
      const content = await repository.getContent(id);

      if (!content) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found'
        };
        res.status(404).json(response);
        return;
      }

      const workflow = await repository.get(id);
      if (!workflow) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow metadata not found'
        };
        res.status(404).json(response);
        return;
      }

      if (filePath === workflow.metadata.mainFile) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(content.mainFile);
        return;
      }

      const attachmentBuffer = content.attachments.get(filePath);
      if (!attachmentBuffer) {
        const response: ApiResponse = {
          success: false,
          error: 'File not found'
        };
        res.status(404).json(response);
        return;
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(attachmentBuffer);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  uploadWorkflow = [
    multer({ storage: multer.memoryStorage() }).single('workflow'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          const response: ApiResponse = {
            success: false,
            error: 'No file uploaded'
          };
          res.status(400).json(response);
          return;
        }

        const extracted = await this.storageService.extractWorkflowFromZip(req.file.buffer);
        if (!extracted) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid workflow file'
          };
          res.status(400).json(response);
          return;
        }

        const uploadRequest: UploadWorkflowRequest = req.body;
        
        if (!await this.storageService.validateWorkflowPath(uploadRequest.path)) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid workflow path'
          };
          res.status(400).json(response);
          return;
        }

        const repository = this.storageService.getRepository();
        const metadata = await repository.upload(uploadRequest.path, extracted.content, {
          name: uploadRequest.name,
          description: uploadRequest.description,
          author: req.user?.username || uploadRequest.author,
          version: uploadRequest.version,
          tags: uploadRequest.tags,
          path: uploadRequest.path,
          mainFile: uploadRequest.mainFile
        });

        const response: ApiResponse = {
          success: true,
          data: metadata,
          message: 'Workflow uploaded successfully'
        };

        res.status(201).json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(response);
      }
    }
  ];

  updateWorkflow = [
    multer({ storage: multer.memoryStorage() }).single('workflow'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        const updateRequest: UpdateWorkflowRequest = req.body;
        const repository = this.storageService.getRepository();

        let content: any = undefined;
        if (req.file) {
          const extracted = await this.storageService.extractWorkflowFromZip(req.file.buffer);
          if (!extracted) {
            const response: ApiResponse = {
              success: false,
              error: 'Invalid workflow file'
            };
            res.status(400).json(response);
            return;
          }
          content = extracted.content;
        } else {
          const existingContent = await repository.getContent(id);
          if (!existingContent) {
            const response: ApiResponse = {
              success: false,
              error: 'Workflow not found'
            };
            res.status(404).json(response);
            return;
          }
          content = existingContent;
        }

        const metadata = await repository.update(id, content, updateRequest);

        const response: ApiResponse = {
          success: true,
          data: metadata,
          message: 'Workflow updated successfully'
        };

        res.json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(response);
      }
    }
  ];

  deleteWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const repository = this.storageService.getRepository();
      const deleted = await repository.delete(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          error: 'Workflow not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Workflow deleted successfully'
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  getTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const path = req.params['*'] || '';
      const repository = this.storageService.getRepository();
      const tree = await repository.getTreeStructure(path);

      const response: ApiResponse<TreeResponse> = {
        success: true,
        data: { tree }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  getTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const tags = await this.storageService.getAllTags();

      const response: ApiResponse<TagsResponse> = {
        success: true,
        data: { tags }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  getAuthors = async (req: Request, res: Response): Promise<void> => {
    try {
      const authors = await this.storageService.getAllAuthors();

      const response: ApiResponse<AuthorsResponse> = {
        success: true,
        data: { authors }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  searchWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: SearchWorkflowRequest = req.query;
      const repository = this.storageService.getRepository();
      
      const workflows = await repository.search({
        query: query.query,
        tags: query.tags,
        author: query.author,
        path: query.path,
        limit: query.limit ? parseInt(query.limit.toString()) : undefined,
        offset: query.offset ? parseInt(query.offset.toString()) : undefined
      });

      const response: ApiResponse<WorkflowListResponse> = {
        success: true,
        data: {
          workflows: [...workflows],
          total: workflows.length,
          offset: query.offset ? parseInt(query.offset.toString()) : 0,
          limit: query.limit ? parseInt(query.limit.toString()) : workflows.length
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  };

  getWorkflowOwner = async (req: Request): Promise<string | null> => {
    const { id } = req.params;
    return await this.storageService.getWorkflowOwner(id);
  };
}