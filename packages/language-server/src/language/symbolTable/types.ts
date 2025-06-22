import {
  DataNameReadContext,
  TaskConfigurationBodyContext,
  TaskNameReadContext,
  WorkflowNameReadContext,
} from '@extremexp/core/src/language/generated/XXPParser.js';

export enum ChainPartType {
  Data,
  Task,
}

export type ReadNameContext = DataNameReadContext | TaskNameReadContext | WorkflowNameReadContext;
export type ScopedParserRuleContext = TaskConfigurationBodyContext;
