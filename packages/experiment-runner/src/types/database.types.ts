/**
 * Database type definitions for experiment data persistence.
 * Defines interfaces for all database records used in experiment storage
 * including runs, executions, and data mappings.
 */

export interface RunRecord {
  id: string;
  experiment_name: string;
  experiment_version: string;
  artifact_path: string;
  artifact_hash: string;
  start_time: number;
  end_time?: number;
  status: string;
  current_space?: string;
  current_param_set?: number;
  current_task?: string;
  total_spaces: number;
}

export interface SpaceExecutionRecord {
  run_id: string;
  space_id: string;
  status: string;
  start_time?: number;
  end_time?: number;
  total_param_sets: number;
  total_tasks: number;
}

export interface ParamSetExecutionRecord {
  run_id: string;
  space_id: string;
  param_set_index: number;
  params_hash: string;
  status: string;
  start_time?: number;
  end_time?: number;
}

export interface TaskExecutionRecord {
  run_id: string;
  space_id: string;
  param_set_index: number;
  task_id: string;
  status: string;
  start_time?: number;
  end_time?: number;
  output_dir?: string;
  error_message?: string;
}

export interface DataMappingRecord {
  run_id: string;
  space_id: string;
  param_set_index: number;
  data_name: string;
  data_value: string;
}
