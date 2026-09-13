import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  taskCost,
  type StrategyMetrics,
  type StrategyResult,
  type TaskRun,
} from "./metrics.js";
import type { Task } from "./tasks.js";

const supportsColor = process.stdout.isTTY && process.env.NO_COLOR !== "1";

const color = {
  bold: (value: string) => wrap("\u001b[1m", "\u001b[22m", value),
  dim: (value: string) => wrap("\u001b[2m", "\u001b[22m", value),
  green: (value: string) => wrap("\u001b[32m", "\u001b[39m", value),
  red: (value: string) => wrap("\u001b[31m", "\u001b[39m", value),
  cyan: (value: string) => wrap("\u001b[36m", "\u001b[39m", value),
  yellow: (value: string) => wrap("\u001b[33m", "\u001b[39m", value),
};

export function printIntro(): void {
  console.log(color.bold("\nBUY INTELLIGENCE SELECTIVELY\n"));
  console.log("Strategy A: Strongest model for every task");
  console.log("Strategy B: Route -> Verify -> Escalate");
  console.log(
    color.dim("\nPrices and outcomes are illustrative and deterministic.\n"),
  );
}

export function printFixedSummary(result: StrategyResult): void {
  console.log(
    color.cyan(color.bold("\nStrategy A: Strongest model for every task")),
  );
  console.log(
    `Ran ${result.summary.tasksAttempted} tasks with the strongest model: ${result.summary.successfulTasks}/${result.summary.tasksAttempted} verified successful.`,
  );
  console.log(`Total cost: ${formatCurrency(result.summary.totalCost)}\n`);
}

export async function printRoutedTrace(
  task: Task,
  run: TaskRun,
  step: boolean,
): Promise<void> {
  console.log(color.cyan(color.bold(`\nTask: ${task.label}`)));
  console.log(
    `Difficulty: ${task.difficulty.toUpperCase()} | Risk: ${task.risk.toUpperCase()}`,
  );
  console.log(color.dim(`Policy: ${run.initialRouteReason}`));

  const [firstAttempt, secondAttempt] = run.attempts;
  console.log(`\nROUTE       -> ${firstAttempt.modelName}`);
  printAttempt("RESULT", firstAttempt.output);
  printValidation(firstAttempt.validationPassed, firstAttempt.validationReason);

  if (secondAttempt) {
    console.log(`ESCALATE    -> ${secondAttempt.modelName}`);
    printAttempt("RESULT", secondAttempt.output);
    printValidation(
      secondAttempt.validationPassed,
      secondAttempt.validationReason,
    );
  }

  console.log(`COST        -> ${formatCurrency(taskCost(run))}`);

  if (step) {
    await waitForEnter();
  }
}

export function printComparison(
  fixed: StrategyResult | undefined,
  routed: StrategyResult | undefined,
): void {
  if (!fixed && !routed) return;

  const empty: StrategyMetrics = {
    tasksAttempted: 0,
    successfulTasks: 0,
    modelCalls: 0,
    escalations: 0,
    totalCost: 0,
    costPerAttemptedTask: 0,
    costPerSuccessfulTask: 0,
  };

  const fixedMetrics = fixed?.summary ?? empty;
  const routedMetrics = routed?.summary ?? empty;
  const rows = [
    [
      "Tasks attempted",
      fixedMetrics.tasksAttempted,
      routedMetrics.tasksAttempted,
    ],
    [
      "Verified successful tasks",
      fixedMetrics.successfulTasks,
      routedMetrics.successfulTasks,
    ],
    ["Model calls", fixedMetrics.modelCalls, routedMetrics.modelCalls],
    ["Escalations", fixedMetrics.escalations, routedMetrics.escalations],
    [
      "Total cost",
      formatCurrency(fixedMetrics.totalCost),
      formatCurrency(routedMetrics.totalCost),
    ],
    [
      "Cost per attempted task",
      formatCurrency(fixedMetrics.costPerAttemptedTask),
      formatCurrency(routedMetrics.costPerAttemptedTask),
    ],
    [
      "Cost per successful task",
      formatCurrency(fixedMetrics.costPerSuccessfulTask),
      formatCurrency(routedMetrics.costPerSuccessfulTask),
    ],
  ] as const;

  console.log(color.cyan(color.bold("\nComparison")));
  printTable(rows.map((row) => row.map(String)));
  console.log(color.bold("\nThe goal is not to use the cheapest model."));
  console.log(
    color.bold(
      "The goal is to use the cheapest workflow that reliably succeeds.\n",
    ),
  );
}

function printAttempt(label: string, outputValue: unknown): void {
  console.log(`${label.padEnd(12)}-> ${JSON.stringify(outputValue)}`);
}

function printValidation(passed: boolean, reason: string): void {
  const value = passed ? color.green("PASSED") : color.red("FAILED");
  console.log(`VALIDATION  -> ${value} ${color.dim(`(${reason})`)}`);
}

function printTable(rows: string[][]): void {
  const headers = ["Metric", "Strongest Always", "Intelligent Routing"];
  const widths = [30, 18, 22];
  const line = (left: string, mid: string, right: string) =>
    `${left}${widths.map((width) => "─".repeat(width + 2)).join(mid)}${right}`;
  const row = (values: string[]) =>
    `│ ${values[0].padEnd(widths[0])} │ ${values[1].padEnd(widths[1])} │ ${values[2].padEnd(widths[2])} │`;

  console.log(line("┌", "┬", "┐"));
  console.log(row(headers));
  console.log(line("├", "┼", "┤"));
  rows.forEach((values) => console.log(row(values)));
  console.log(line("└", "┴", "┘"));
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(3)}`;
}

async function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  await rl.question(color.yellow("\nPress Enter to continue..."));
  rl.close();
}

function wrap(open: string, close: string, value: string): string {
  return supportsColor ? `${open}${value}${close}` : value;
}
