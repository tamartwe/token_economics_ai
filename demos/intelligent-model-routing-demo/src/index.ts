import {
  printComparison,
  printFixedSummary,
  printIntro,
  printRoutedTrace,
} from "./output.js";
import { runFixedStrongest } from "./strategies/fixed.js";
import { runRoutedStrategy } from "./strategies/routed.js";
import { selectTasks, tasks } from "./tasks.js";

type CliOptions = {
  fixedOnly: boolean;
  routedOnly: boolean;
  step: boolean;
  taskType?: string;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const selectedTasks = selectTasks(options.taskType);

  if (selectedTasks.length === 0) {
    throw new Error(
      `No tasks matched "${options.taskType}". Try extraction, summary, or a task id.`,
    );
  }

  printIntro();

  const shouldRunFixed = !options.routedOnly && !options.taskType;
  const shouldRunRouted = !options.fixedOnly;
  const fixed = shouldRunFixed
    ? await runFixedStrongest(selectedTasks)
    : undefined;
  const routed = shouldRunRouted
    ? await runRoutedStrategy(selectedTasks)
    : undefined;

  if (fixed) printFixedSummary(fixed);

  if (routed) {
    console.log("\nStrategy B: Route -> Verify -> Escalate");
    for (const run of routed.runs) {
      const task = tasks.find((candidate) => candidate.id === run.taskId);
      if (!task) throw new Error(`Task not found for run ${run.taskId}`);
      await printRoutedTrace(task, run, options.step);
    }
  }

  printComparison(fixed, routed);
}

export function parseArgs(argv: string[]): CliOptions {
  const taskIndex = argv.indexOf("--task");
  const taskType = taskIndex >= 0 ? argv[taskIndex + 1] : undefined;

  return {
    fixedOnly: argv.includes("--fixed-only"),
    routedOnly: argv.includes("--routed-only"),
    step: argv.includes("--step"),
    taskType,
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
