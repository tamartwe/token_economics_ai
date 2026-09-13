import assert from "node:assert/strict";
import test from "node:test";
import { summarizeStrategy } from "../src/metrics.js";
import { runRoutedStrategy } from "../src/strategies/routed.js";
import { selectTasks, tasks } from "../src/tasks.js";

test("failed validation triggers exactly one escalation", async () => {
  const [task] = selectTasks("extraction");
  const result = await runRoutedStrategy([task]);
  const run = result.runs[0];

  assert.equal(run.attempts.length, 2);
  assert.equal(run.escalated, true);
  assert.equal(run.attempts[0].modelName, "Small Model");
  assert.equal(run.attempts[1].modelName, "Strong Model");
});

test("successful validation does not trigger escalation", async () => {
  const task = tasks.find((candidate) => candidate.id === "extract-email");
  assert.ok(task);

  const result = await runRoutedStrategy([task]);
  const run = result.runs[0];

  assert.equal(run.attempts.length, 1);
  assert.equal(run.escalated, false);
});

test("failed attempts are included in total workflow cost", async () => {
  const [task] = selectTasks("extraction");
  const result = await runRoutedStrategy([task]);

  assert.equal(result.summary.totalCost, 0.052);
  assert.equal(result.summary.modelCalls, 2);
});

test("cost per successful task is calculated correctly", () => {
  const summary = summarizeStrategy([
    {
      taskId: "a",
      taskLabel: "Task A",
      attempts: [
        {
          modelName: "Small Model",
          taskId: "a",
          output: "bad",
          cost: 0.002,
          simulatedLatencyMs: 80,
          validationPassed: false,
          validationReason: "failed",
        },
        {
          modelName: "Strong Model",
          taskId: "a",
          output: "good",
          cost: 0.05,
          simulatedLatencyMs: 420,
          validationPassed: true,
          validationReason: "passed",
        },
      ],
      escalated: true,
      success: true,
      initialRouteReason: "test",
    },
  ]);

  assert.equal(summary.costPerSuccessfulTask, 0.052);
});

test("demo routed results are deterministic", async () => {
  const first = await runRoutedStrategy(tasks);
  const second = await runRoutedStrategy(tasks);

  assert.deepEqual(second, first);
});
