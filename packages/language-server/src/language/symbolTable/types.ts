import {
  DataNameReadContext,
  TaskConfigurationBodyContext,
  TaskNameReadContext,
  WorkflowNameReadContext,
} from '@extremexp/core';

export enum ChainPartType {
  Data,
  Task,
}

export type ReadNameContext = DataNameReadContext | TaskNameReadContext | WorkflowNameReadContext;
export type ScopedParserRuleContext = TaskConfigurationBodyContext;
