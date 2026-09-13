import { strongModel } from "../models.js";
import {
  summarizeStrategy,
  type AttemptRecord,
  type StrategyResult,
  type TaskRun,
} from "../metrics.js";
import { routeTask } from "../router.js";
import type { Task } from "../tasks.js";
import { validateTaskResult } from "../validators.js";

export async function runRoutedStrategy(
  tasks: Task[],
): Promise<StrategyResult> {
  const runs: TaskRun[] = [];

  for (const task of tasks) {
    const route = routeTask(task);
    const firstAttempt = await runAndValidate(task, route.model);
    const attempts = [firstAttempt];
    let escalated = false;

    if (
      !firstAttempt.validationPassed &&
      route.model.name !== strongModel.name
    ) {
      escalated = true;
      attempts.push(await runAndValidate(task, strongModel));
    }

    runs.push({
      taskId: task.id,
      taskLabel: task.label,
      attempts,
      escalated,
      success: attempts.at(-1)?.validationPassed ?? false,
      initialRouteReason: route.reason,
    });
  }

  return {
    name: "Intelligent Routing",
    runs,
    summary: summarizeStrategy(runs),
  };
}

async function runAndValidate(
  routedTask: Task,
  model: {
    run(
      task: Task,
    ): Promise<Omit<AttemptRecord, "validationPassed" | "validationReason">>;
  },
): Promise<AttemptRecord> {
  const result = await model.run(routedTask);
  const validation = validateTaskResult(routedTask, result.output);
  return {
    ...result,
    validationPassed: validation.passed,
    validationReason: validation.reason,
  };
}
