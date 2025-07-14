/**
 * @fileoverview Express router for experiment-related API endpoints.
 * Provides REST API for experiment execution, monitoring, and artifact management.
 */

import { Router, Request, Response } from 'express';

import { ExperimentService } from '../services/ExperimentService.js';
import { WebSocketManager } from '../services/WebSocketManager.js';
import {
  StartExperimentRequest,
  StartExperimentResponse,
  GenerateArtifactRequest,
  GenerateArtifactResponse,
} from '../types/server.types.js';

/**
 * Creates Express router with experiment-related routes.
 * 
 * @param experimentService - Service for managing experiment execution
 * @param wsManager - WebSocket manager for real-time updates
 * @returns Configured Express router with all experiment endpoints
 */
export function createExperimentRoutes(
  experimentService: ExperimentService,
  wsManager: WebSocketManager
): Router {
  const router = Router();

  // Start a new experiment
  router.post('/run', async (req: Request, res: Response): Promise<void> => {
    try {
      const { artifactPath, experimentId: providedId, resume } = req.body as StartExperimentRequest;

      if (!artifactPath) {
        res.status(400).json({
          error: 'Missing required field: artifactPath',
        });
        return;
      }

      // Validate artifact before starting
      const validation = await experimentService.validateArtifact(artifactPath);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Invalid artifact',
          validation,
        });
        return;
      }

      const experimentId = await experimentService.startExperiment(artifactPath, {
        ...(providedId && { experimentId: providedId }),
        resume: resume ?? false,
        onProgress: progress => {
          wsManager.emitProgress(experimentId, progress);
        },
        onInputRequired: request => {
          wsManager.emitUserInputRequest(experimentId, request);
        },
        onComplete: result => {
          wsManager.emitExperimentComplete(experimentId, result);
        },
        onError: error => {
          wsManager.emitExperimentError(experimentId, error);
        },
      });

      const response: StartExperimentResponse = {
        experimentId,
        status: resume ? 'resumed' : 'started',
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start experiment',
        message: (error as Error).message,
      });
    }
  });

  // Get experiment status
  router.get(
    '/:experimentId/status',
    async (req: Request<{ experimentId: string }>, res: Response): Promise<void> => {
      try {
        const { experimentId } = req.params;
        const status = await experimentService.getExperimentStatus(experimentId);

        if (!status) {
          res.status(404).json({
            error: 'Experiment not found',
          });
          return;
        }

        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get experiment status',
          message: (error as Error).message,
        });
      }
    }
  );

  // Terminate experiment
  router.post(
    '/:experimentId/terminate',
    async (req: Request<{ experimentId: string }>, res: Response): Promise<void> => {
      try {
        const { experimentId } = req.params;
        const terminated = await experimentService.terminateExperiment(experimentId);

        if (!terminated) {
          res.status(404).json({
            error: 'Experiment not found or not running',
          });
          return;
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to terminate experiment',
          message: (error as Error).message,
        });
      }
    }
  );

  // Submit user input
  router.post(
    '/:experimentId/input',
    async (req: Request<{ experimentId: string }>, res: Response): Promise<void> => {
      try {
        const { requestId, value } = req.body;

        if (!requestId || value === undefined) {
          res.status(400).json({
            error: 'Missing required fields: requestId, value',
          });
          return;
        }

        const success = experimentService.submitUserInput({
          requestId,
          value,
        });

        if (!success) {
          res.status(404).json({
            error: 'Input request not found or expired',
          });
          return;
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to submit user input',
          message: (error as Error).message,
        });
      }
    }
  );

  // Get experiment history
  router.get(
    '/:experimentId/history',
    async (req: Request<{ experimentId: string }>, res: Response): Promise<void> => {
      try {
        const { experimentId } = req.params;
        const { limit, offset, spaceId, taskId } = req.query;

        const parsedLimit = limit ? parseInt(limit as string) : undefined;
        const parsedOffset = offset ? parseInt(offset as string) : undefined;

        const historyOptions: {
          limit?: number;
          offset?: number;
          spaceId?: string;
          taskId?: string;
        } = {};

        if (parsedLimit !== undefined) historyOptions.limit = parsedLimit;
        if (parsedOffset !== undefined) historyOptions.offset = parsedOffset;
        if (spaceId) historyOptions.spaceId = spaceId as string;
        if (taskId) historyOptions.taskId = taskId as string;

        const history = await experimentService.getExperimentHistory(experimentId, historyOptions);

        res.json({
          experimentId,
          tasks: history,
          total: history.length,
          hasMore: false, // Would be determined by actual implementation
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get experiment history',
          message: (error as Error).message,
        });
      }
    }
  );

  // Get all active experiments
  router.get('/active', async (req: Request, res: Response): Promise<void> => {
    try {
      const experiments = experimentService.getActiveExperiments();
      res.json({ experiments });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get active experiments',
        message: (error as Error).message,
      });
    }
  });

  // Generate artifact from ESPACE file
  router.post('/generate-artifact', async (req: Request, res: Response): Promise<void> => {
    try {
      const { espacePath, outputPath, validateOnly } = req.body as GenerateArtifactRequest;

      if (!espacePath) {
        res.status(400).json({
          error: 'Missing required field: espacePath',
        });
        return;
      }

      if (validateOnly) {
        // Just validate without generating
        const validation = await experimentService.validateArtifact(espacePath);
        const response: GenerateArtifactResponse = {
          success: validation.isValid,
          validation,
        };
        res.json(response);
        return;
      }

      const result = await experimentService.generateArtifact(espacePath, outputPath);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate artifact',
        message: (error as Error).message,
      });
    }
  });

  // Validate artifact
  router.post('/validate-artifact', async (req: Request, res: Response): Promise<void> => {
    try {
      const { artifactPath } = req.body;

      if (!artifactPath) {
        res.status(400).json({
          error: 'Missing required field: artifactPath',
        });
        return;
      }

      const validation = await experimentService.validateArtifact(artifactPath);
      res.json(validation);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to validate artifact',
        message: (error as Error).message,
      });
    }
  });

  return router;
}
