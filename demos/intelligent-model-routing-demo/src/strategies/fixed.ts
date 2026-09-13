import { strongModel } from "../models.js";
import {
  summarizeStrategy,
  type StrategyResult,
  type TaskRun,
} from "../metrics.js";
import type { Task } from "../tasks.js";
import { validateTaskResult } from "../validators.js";

export async function runFixedStrongest(
  tasks: Task[],
): Promise<StrategyResult> {
  const runs: TaskRun[] = [];

  for (const task of tasks) {
    const result = await strongModel.run(task);
    const validation = validateTaskResult(task, result.output);

    runs.push({
      taskId: task.id,
      taskLabel: task.label,
      attempts: [
        {
          ...result,
          validationPassed: validation.passed,
          validationReason: validation.reason,
        },
      ],
      escalated: false,
      success: validation.passed,
      initialRouteReason: "fixed strategy always uses strongest model",
    });
  }

  return {
    name: "Strongest Always",
    runs,
    summary: summarizeStrategy(runs),
  };
}
