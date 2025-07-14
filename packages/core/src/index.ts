/**
 * Core library for ExtremeXP language processing.
 * Exports ANTLR-generated parsers, lexers, and utilities for ESPACE and XXP languages.
 */

// Export ESPACE language components
export { ESPACEParser } from './language/generated/ESPACEParser.js';
export { ESPACELexer } from './language/generated/ESPACELexer.js';
export { ESPACEVisitor } from './language/generated/ESPACEVisitor.js';
export { ESPACEListener } from './language/generated/ESPACEListener.js';

export {
  ExperimentHeaderContext as EspaceExperimentHeaderContext,
  ExperimentBodyContext as EspaceExperimentBodyContext,
  SpaceDeclarationContext as EspaceSpaceDeclarationContext,
  SpaceHeaderContext as EspaceSpaceHeaderContext,
  SpaceBodyContext as EspaceSpaceBodyContext,
  StrategyStatementContext as EspaceStrategyStatementContext,
  ParamDefinitionContext as EspaceParamDefinitionContext,
  ControlBlockContext as EspaceControlBlockContext,
  ControlBodyContext as EspaceControlBodyContext,
  SimpleTransitionContext as EspaceSimpleTransitionContext,
  ConditionalTransitionContext as EspaceConditionalTransitionContext,
  DataDefinitionContext as EspaceDataDefinitionContext,
  TaskConfigurationContext as EspaceTaskConfigurationContext,
  ParamAssignmentContext as EspaceParamAssignmentContext,
  WorkflowNameReadContext as EspaceWorkflowNameReadContext,
  TaskNameReadContext as EspaceTaskNameReadContext,
  SpaceNameReadContext as EspaceSpaceNameReadContext,
  TaskConfigurationBodyContext as EspaceTaskConfigurationBodyContext,
  EnumFunctionContext as EspaceEnumFunctionContext,
  RangeFunctionContext as EspaceRangeFunctionContext,
  ExpressionContext as EspaceExpressionContext,
} from './language/generated/ESPACEParser.js';

// Export XXP language components
export { XXPParser } from './language/generated/XXPParser.js';
export { XXPLexer } from './language/generated/XXPLexer.js';
export { XXPVisitor } from './language/generated/XXPVisitor.js';
export { XXPListener } from './language/generated/XXPListener.js';

export {
  DataDefinitionContext as XxpDataDefinitionContext,
  TaskConfigurationContext as XxpTaskConfigurationContext,
  TaskConfigurationBodyContext as XxpTaskConfigurationBodyContext,
  ParamAssignmentContext as XxpParamAssignmentContext,
  WorkflowNameReadContext as XxpWorkflowNameReadContext,
  TaskNameReadContext as XxpTaskNameReadContext,
  WorkflowHeaderContext as XxpWorkflowHeaderContext,
  WorkflowBodyContext as XxpWorkflowBodyContext,
  TaskDefinitionContext as XxpTaskDefinitionContext,
  ImplementationContext as XxpImplementationContext,
  InputStatementContext as XxpInputStatementContext,
  OutputStatementContext as XxpOutputStatementContext,
  DataNameReadContext as XxpDataNameReadContext,
  FileNameStringContext as XxpFileNameStringContext,
} from './language/generated/XXPParser.js';

// Export utility functions
export { workflowNameToFileName } from './utils/naming.js';
