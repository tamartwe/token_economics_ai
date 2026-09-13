import {
  smallModel,
  standardModel,
  strongModel,
  type ModelProvider,
} from "./models.js";
import type { Task } from "./tasks.js";

export type RouteDecision = {
  model: ModelProvider;
  reason: string;
  uncertainty: "low" | "medium" | "high";
};

export function routeTask(task: Task): RouteDecision {
  if (task.difficulty === "high" || task.risk === "high") {
    return {
      model: strongModel,
      reason: "high difficulty or high risk routes directly to strongest model",
      uncertainty: "low",
    };
  }

  if (task.difficulty === "medium" || task.risk === "medium") {
    return {
      model: standardModel,
      reason: "medium difficulty or medium risk uses standard model first",
      uncertainty: task.type === "code_generation" ? "medium" : "low",
    };
  }

  return {
    model: smallModel,
    reason: "low difficulty and low risk uses small model first",
    uncertainty: task.type === "extraction" ? "low" : "medium",
  };
}
