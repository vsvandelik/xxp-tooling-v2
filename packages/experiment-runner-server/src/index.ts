/**
 * Main entry point for the ExtremeXP experiment runner server.
 * Exports server components and type definitions for remote experiment execution.
 */

export { ExperimentRunnerServer } from './server.js';
export { ExperimentService } from './services/ExperimentService.js';
export { WebSocketManager } from './services/WebSocketManager.js';
export { createExperimentRoutes } from './routes/experimentRoutes.js';

export {
  ServerConfig,
  StartExperimentRequest,
  StartExperimentResponse,
  UserInputRequest,
  UserInputResponse,
  ExperimentProgress,
  TaskHistoryItem,
  ExperimentHistoryRequest,
  ExperimentHistoryResponse,
  ValidationResult,
  GenerateArtifactRequest,
  GenerateArtifactResponse,
  ActiveExperiment
} from './types/server.types.js';