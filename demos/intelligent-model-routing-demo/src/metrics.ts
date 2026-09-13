import type { ModelResult } from "./models.js";

export type AttemptRecord = ModelResult & {
  validationPassed: boolean;
  validationReason: string;
};

export type TaskRun = {
  taskId: string;
  taskLabel: string;
  attempts: AttemptRecord[];
  escalated: boolean;
  success: boolean;
  initialRouteReason: string;
};

export type StrategyResult = {
  name: string;
  runs: TaskRun[];
  summary: StrategyMetrics;
};

export type StrategyMetrics = {
  tasksAttempted: number;
  successfulTasks: number;
  modelCalls: number;
  escalations: number;
  totalCost: number;
  costPerAttemptedTask: number;
  costPerSuccessfulTask: number;
};

export function summarizeStrategy(runs: TaskRun[]): StrategyMetrics {
  const tasksAttempted = runs.length;
  const successfulTasks = runs.filter((run) => run.success).length;
  const modelCalls = runs.reduce(
    (total, run) => total + run.attempts.length,
    0,
  );
  const escalations = runs.filter((run) => run.escalated).length;
  const totalCost = roundCurrency(
    runs.reduce(
      (total, run) =>
        total +
        run.attempts.reduce(
          (taskTotal, attempt) => taskTotal + attempt.cost,
          0,
        ),
      0,
    ),
  );

  return {
    tasksAttempted,
    successfulTasks,
    modelCalls,
    escalations,
    totalCost,
    costPerAttemptedTask: divideCost(totalCost, tasksAttempted),
    costPerSuccessfulTask: divideCost(totalCost, successfulTasks),
  };
}

export function taskCost(run: TaskRun): number {
  return roundCurrency(
    run.attempts.reduce((total, attempt) => total + attempt.cost, 0),
  );
}

function divideCost(totalCost: number, count: number): number {
  return count === 0 ? 0 : roundCurrency(totalCost / count);
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}
