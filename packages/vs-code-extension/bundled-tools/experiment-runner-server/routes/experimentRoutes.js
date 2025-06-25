import { Router } from 'express';
export function createExperimentRoutes(experimentService, wsManager) {
    const router = Router();
    router.post('/run', async (req, res) => {
        try {
            const { artifactPath, experimentId: providedId, resume } = req.body;
            if (!artifactPath) {
                res.status(400).json({
                    error: 'Missing required field: artifactPath',
                });
                return;
            }
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
            const response = {
                experimentId,
                status: resume ? 'resumed' : 'started',
            };
            res.json(response);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to start experiment',
                message: error.message,
            });
        }
    });
    router.get('/:experimentId/status', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get experiment status',
                message: error.message,
            });
        }
    });
    router.post('/:experimentId/terminate', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to terminate experiment',
                message: error.message,
            });
        }
    });
    router.post('/:experimentId/input', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to submit user input',
                message: error.message,
            });
        }
    });
    router.get('/:experimentId/history', async (req, res) => {
        try {
            const { experimentId } = req.params;
            const { limit, offset, spaceId, taskId } = req.query;
            const parsedLimit = limit ? parseInt(limit) : undefined;
            const parsedOffset = offset ? parseInt(offset) : undefined;
            const historyOptions = {};
            if (parsedLimit !== undefined)
                historyOptions.limit = parsedLimit;
            if (parsedOffset !== undefined)
                historyOptions.offset = parsedOffset;
            if (spaceId)
                historyOptions.spaceId = spaceId;
            if (taskId)
                historyOptions.taskId = taskId;
            const history = await experimentService.getExperimentHistory(experimentId, historyOptions);
            res.json({
                experimentId,
                tasks: history,
                total: history.length,
                hasMore: false,
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get experiment history',
                message: error.message,
            });
        }
    });
    router.get('/active', async (req, res) => {
        try {
            const experiments = experimentService.getActiveExperiments();
            res.json({ experiments });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get active experiments',
                message: error.message,
            });
        }
    });
    router.post('/generate-artifact', async (req, res) => {
        try {
            const { espacePath, outputPath, validateOnly } = req.body;
            if (!espacePath) {
                res.status(400).json({
                    error: 'Missing required field: espacePath',
                });
                return;
            }
            if (validateOnly) {
                const validation = await experimentService.validateArtifact(espacePath);
                const response = {
                    success: validation.isValid,
                    validation,
                };
                res.json(response);
                return;
            }
            const result = await experimentService.generateArtifact(espacePath, outputPath);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to generate artifact',
                message: error.message,
            });
        }
    });
    router.post('/validate-artifact', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to validate artifact',
                message: error.message,
            });
        }
    });
    return router;
}
//# sourceMappingURL=experimentRoutes.js.map