export type ComparisonMetric = {
  label: string;
  baseline: string;
  optimized: string;
  change: string;
};

export type PresenterStep = {
  label: string;
  detail: string;
  status: "neutral" | "pass" | "warn";
};

export type RetrievalRun = {
  mode: "baseline" | "optimized";
  retrievedCount: number;
  retrievedTitles: string[];
  retrievedReasons: string[];
  contextPreview: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  answer: string;
};

export type SendLessResponse = {
  generatedAt: string;
  question: string;
  command: string;
  codePath: string;
  codePointer: string;
  baselineLabel: string;
  optimizedLabel: string;
  baseline: RetrievalRun;
  optimized: RetrievalRun;
  metrics: ComparisonMetric[];
  steps: PresenterStep[];
  takeaway: string;
};

export type RoutingAttempt = {
  modelName: string;
  output: unknown;
  cost: number;
  validationPassed: boolean;
  validationReason: string;
};

export type RoutingStrategy = "strongest" | "routed";

export type RoutingTaskOption = {
  id: string;
  label: string;
  type: string;
  difficulty: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  input: string;
};

export type RoutingTaskRun = {
  taskId: string;
  taskLabel: string;
  initialRouteReason: string;
  escalated: boolean;
  success: boolean;
  attempts: RoutingAttempt[];
};

export type RoutingSummary = {
  tasksAttempted: number;
  successfulTasks: number;
  modelCalls: number;
  escalations: number;
  totalCost: number;
  costPerAttemptedTask: number;
  costPerSuccessfulTask: number;
};

export type RoutingResponse = {
  generatedAt: string;
  command: string;
  codePath: string;
  codePointer: string;
  baselineLabel: string;
  optimizedLabel: string;
  tasks: RoutingTaskOption[];
  fixedSummary: RoutingSummary;
  routedSummary: RoutingSummary;
  highlightedRun: RoutingTaskRun;
  routedRuns: RoutingTaskRun[];
  metrics: ComparisonMetric[];
  steps: PresenterStep[];
  takeaway: string;
};

export type RoutingRunResponse = {
  generatedAt: string;
  strategy: RoutingStrategy;
  strategyLabel: string;
  task: RoutingTaskOption;
  run: RoutingTaskRun;
  summary: RoutingSummary;
  command: string;
  codePath: string;
  codePointer: string;
  steps: PresenterStep[];
  takeaway: string;
};
