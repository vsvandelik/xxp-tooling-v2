export interface LogEntry {
  time: string;
  message: string;
}

export interface TaskHistoryItem {
  taskId: string;
  spaceId: string;
  status: 'completed' | 'failed' | 'running';
  parameters: Record<string, string>;
  outputs: Record<string, string>;
}

export interface ProgressData {
  percentage: number;
  completedSpaces: number;
  totalSpaces: number;
  completedTasks: number;
  totalTasks: number;
}

export interface WebviewState {
  experimentName: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'terminated' | 'idle';
  progress: ProgressData;
  currentSpace: string;
  currentTask: string;
  logs: LogEntry[];
  history: TaskHistoryItem[];
  showLogs: boolean;
  showHistory: boolean;
  userInputRequest?: {
    requestId: string;
    prompt: string;
  } | undefined;
}

export const createInitialWebviewState = (): WebviewState => ({
  experimentName: 'Waiting for experiment...',
  status: 'initializing',
  progress: {
    percentage: 0,
    completedSpaces: 0,
    totalSpaces: 0,
    completedTasks: 0,
    totalTasks: 0,
  },
  currentSpace: '-',
  currentTask: '-',
  logs: [],
  history: [],
  showLogs: false,
  showHistory: false,
});
