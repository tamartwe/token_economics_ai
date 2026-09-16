import {
  buildBaselineContext,
  buildOptimizedContext,
  buildPrompt,
} from "context-retrieval-demo/src/context/builders.js";
import { demoQuestion } from "context-retrieval-demo/src/data/documents.js";
import {
  answerQuestion,
  systemInstructions,
} from "context-retrieval-demo/src/llm/answer.js";
import {
  createEmbeddingProvider,
  loadEmbeddedDocuments,
} from "context-retrieval-demo/src/llm/embeddings.js";
import { deterministicKeywordEmbedding } from "context-retrieval-demo/src/data/keywordVector.js";
import { estimateCost } from "context-retrieval-demo/src/metrics/cost.js";
import { countTokens } from "context-retrieval-demo/src/metrics/tokens.js";
import { verifyAnswer } from "context-retrieval-demo/src/verifier/success.js";
import type { DemoConfig } from "context-retrieval-demo/src/config.js";
import type {
  DemoMetrics,
  ModeName,
  RetrievedDocument,
} from "context-retrieval-demo/src/types.js";
import { runFixedStrongest } from "intelligent-model-routing-demo/src/strategies/fixed.js";
import { runRoutedStrategy } from "intelligent-model-routing-demo/src/strategies/routed.js";
import {
  selectTasks,
  tasks,
  type Task,
} from "intelligent-model-routing-demo/src/tasks.js";
import {
  taskCost,
  type StrategyResult,
  type TaskRun,
} from "intelligent-model-routing-demo/src/metrics.js";
import type {
  RoutingResponse,
  RoutingRunResponse,
  RoutingSummary,
  RoutingStrategy,
  RoutingTaskOption,
  RoutingTaskRun,
  SendLessResponse,
} from "./apiTypes.js";

const offlineConfig: DemoConfig = {
  offline: true,
  noPause: true,
  answerModel: "offline-deterministic",
  embeddingModel: "offline-keyword-vector",
  inputTokenPricePer1M: Number(process.env.INPUT_TOKEN_PRICE_PER_1M ?? 0.15),
  outputTokenPricePer1M: Number(process.env.OUTPUT_TOKEN_PRICE_PER_1M ?? 0.6),
  contextTokenBudget: Number(process.env.CONTEXT_TOKEN_BUDGET ?? 1200),
};

export async function runSendLessDemo(
  question = demoQuestion,
): Promise<SendLessResponse> {
  const provider = await createEmbeddingProvider(offlineConfig);
  const embeddedDocuments = await loadEmbeddedDocuments(provider);
  const queryEmbedding = deterministicKeywordEmbedding(question);

  const baseline = await runRetrievalMode("baseline", () =>
    buildBaselineContext(embeddedDocuments, queryEmbedding),
    question,
  );
  const optimized = await runRetrievalMode("optimized", () =>
    buildOptimizedContext(
      embeddedDocuments,
      queryEmbedding,
      offlineConfig.contextTokenBudget,
      question,
    ),
    question,
  );

  return {
    generatedAt: new Date().toISOString(),
    question,
    command: "npm run demo:retrieval",
    codePath: "demos/context-retrieval-demo/src/context/builders.ts",
    codePointer: "Compare buildBaselineContext with buildOptimizedContext.",
    baselineLabel: "Baseline retrieval",
    optimizedLabel: "Optimized context",
    baseline,
    optimized,
    metrics: [
      {
        label: "Retrieved chunks",
        baseline: String(baseline.retrievedCount),
        optimized: String(optimized.retrievedCount),
        change: percentChange(baseline.retrievedCount, optimized.retrievedCount),
      },
      {
        label: "Input tokens",
        baseline: formatNumber(baseline.inputTokens),
        optimized: formatNumber(optimized.inputTokens),
        change: percentChange(baseline.inputTokens, optimized.inputTokens),
      },
      {
        label: "Estimated cost",
        baseline: formatCurrency(baseline.estimatedCost),
        optimized: formatCurrency(optimized.estimatedCost),
        change: percentChange(baseline.estimatedCost, optimized.estimatedCost),
      },
      {
        label: "Answer correctness",
        baseline: baseline.success ? "PASS" : "FAIL",
        optimized: optimized.success ? "PASS" : "FAIL",
        change: baseline.success === optimized.success ? "same" : "changed",
      },
    ],
    steps: [
      {
        label: "Filter",
        detail: "Keep production database documents before retrieval.",
        status: "pass",
      },
      {
        label: "Retrieve",
        detail: "Search a smaller candidate pool instead of all documents.",
        status: "neutral",
      },
      {
        label: "Rerank",
        detail: "Prefer the authoritative runbook and fresh incident context.",
        status: "neutral",
      },
      {
        label: "Extract",
        detail: "Send only relevant passages, not full chunks and payloads.",
        status: "pass",
      },
    ],
    takeaway:
      "This run is primarily better retrieval, supported by filtering and passage extraction.",
  };
}

export async function runRoutingDemo(): Promise<RoutingResponse> {
  const selectedTasks = selectTasks();
  const fixed = await runFixedStrongest(selectedTasks);
  const routed = await runRoutedStrategy(selectedTasks);
  const highlightedRun =
    routed.runs.find((run) => run.escalated) ?? routed.runs[0];

  if (!highlightedRun) throw new Error("Routing demo produced no runs.");

  return {
    generatedAt: new Date().toISOString(),
    command:
      "npm run demo --workspace intelligent-model-routing-demo -- --task extraction",
    codePath: "demos/intelligent-model-routing-demo/src/strategies/routed.ts",
    codePointer:
      "Show routeTask, runAndValidate, and one escalation to strongModel.",
    baselineLabel: "Strongest always",
    optimizedLabel: "Route · verify · escalate",
    tasks: tasks.map(mapTaskOption),
    fixedSummary: fixed.summary,
    routedSummary: routed.summary,
    highlightedRun: mapRoutingRun(highlightedRun),
    routedRuns: routed.runs.map(mapRoutingRun),
    metrics: routingMetrics(fixed.summary, routed.summary),
    steps: [
      {
        label: "Route",
        detail: "Pick a starting model from task difficulty and risk.",
        status: "neutral",
      },
      {
        label: "Verify",
        detail: "Check the actual result against task-specific validators.",
        status: "pass",
      },
      {
        label: "Escalate",
        detail: "If validation fails, retry once with the strong model.",
        status: "warn",
      },
      {
        label: "Measure",
        detail: "Include failed cheap attempts in total workflow cost.",
        status: "pass",
      },
    ],
    takeaway:
      "Do not avoid strong models. Spend strong-model tokens where they change the outcome.",
  };
}

export async function runRoutingTaskDemo(
  taskId: string,
  strategy: RoutingStrategy,
): Promise<RoutingRunResponse> {
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error(`Unknown routing task: ${taskId}`);

  const result =
    strategy === "strongest"
      ? await runFixedStrongest([task])
      : await runRoutedStrategy([task]);
  const run = result.runs[0];

  if (!run) throw new Error("Routing demo produced no run.");

  return {
    generatedAt: new Date().toISOString(),
    strategy,
    strategyLabel: strategyLabel(strategy),
    task: mapTaskOption(task),
    run: mapRoutingRun(run),
    summary: result.summary,
    command:
      strategy === "strongest"
        ? "npm run demo:routing"
        : "npm run demo --workspace intelligent-model-routing-demo -- --task extraction",
    codePath:
      strategy === "strongest"
        ? "demos/intelligent-model-routing-demo/src/strategies/fixed.ts"
        : "demos/intelligent-model-routing-demo/src/strategies/routed.ts",
    codePointer:
      strategy === "strongest"
        ? "Show runFixedStrongest: every task uses strongModel, then validation measures success."
        : "Show routeTask, runAndValidate, and one escalation to strongModel when validation fails.",
    steps: routingRunSteps(strategy, result, run),
    takeaway:
      strategy === "strongest"
        ? "The strongest model is simple and reliable, but it buys premium intelligence even when the task is easy."
        : "Routing is only safe because every cheaper attempt is validated before the workflow stops.",
  };
}

async function runRetrievalMode(
  mode: ModeName,
  buildContext: () => { retrieved: RetrievedDocument[]; context: string },
  question: string,
): Promise<DemoMetrics> {
  const started = performance.now();
  const { retrieved, context } = buildContext();
  const prompt = buildPrompt(context, question);
  const answer = await answerQuestion(mode, prompt, offlineConfig);
  const latencyMs = Math.max(1, Math.round(performance.now() - started));
  const inputTokens = countTokens(`${systemInstructions}\n${prompt}`);
  const outputTokens = countTokens(answer);
  const verification = verifyAnswer(answer);

  return {
    mode,
    retrievedTitles: retrieved.map((document) => document.title),
    retrievedReasons: retrieved.map((document) => document.selectionReason),
    retrievedCount: retrieved.length,
    context,
    contextPreview: preview(context),
    inputTokens,
    outputTokens,
    estimatedCost: estimateCost(
      inputTokens,
      outputTokens,
      offlineConfig.inputTokenPricePer1M,
      offlineConfig.outputTokenPricePer1M,
    ),
    latencyMs,
    success: verification.success,
    answer,
  };
}

function routingMetrics(
  fixed: RoutingSummary,
  routed: RoutingSummary,
): RoutingResponse["metrics"] {
  return [
    {
      label: "Model calls",
      baseline: String(fixed.modelCalls),
      optimized: String(routed.modelCalls),
      change: percentChange(fixed.modelCalls, routed.modelCalls),
    },
    {
      label: "Escalations",
      baseline: String(fixed.escalations),
      optimized: String(routed.escalations),
      change: "targeted",
    },
    {
      label: "Total cost",
      baseline: formatCurrency(fixed.totalCost),
      optimized: formatCurrency(routed.totalCost),
      change: percentChange(fixed.totalCost, routed.totalCost),
    },
    {
      label: "Cost per success",
      baseline: formatCurrency(fixed.costPerSuccessfulTask),
      optimized: formatCurrency(routed.costPerSuccessfulTask),
      change: percentChange(
        fixed.costPerSuccessfulTask,
        routed.costPerSuccessfulTask,
      ),
    },
  ];
}

function mapRoutingRun(run: TaskRun): RoutingTaskRun {
  return {
    taskId: run.taskId,
    taskLabel: run.taskLabel,
    initialRouteReason: run.initialRouteReason,
    escalated: run.escalated,
    success: run.success,
    attempts: run.attempts.map((attempt) => ({
      modelName: attempt.modelName,
      output: attempt.output,
      cost: attempt.cost,
      validationPassed: attempt.validationPassed,
      validationReason: attempt.validationReason,
    })),
  };
}

function mapTaskOption(task: Task): RoutingTaskOption {
  return {
    id: task.id,
    label: task.label,
    type: task.type,
    difficulty: task.difficulty,
    risk: task.risk,
    input: task.input,
  };
}

function routingRunSteps(
  strategy: RoutingStrategy,
  result: StrategyResult,
  run: TaskRun,
): RoutingRunResponse["steps"] {
  if (strategy === "strongest") {
    return [
      {
        label: "Choose",
        detail: "Fixed strategy sends the task directly to the strongest model.",
        status: "neutral",
      },
      {
        label: "Verify",
        detail: run.success
          ? "The strongest model output passes the task validator."
          : "The validator still fails, even after buying maximum capability.",
        status: run.success ? "pass" : "warn",
      },
      {
        label: "Measure",
        detail: `The single-task workflow cost is ${formatCurrency(taskCost(run))}.`,
        status: "pass",
      },
    ];
  }

  return [
    {
      label: "Route",
      detail: run.initialRouteReason,
      status: "neutral",
    },
    {
      label: "Verify",
      detail: run.attempts[0]?.validationReason ?? "No validation result.",
      status: run.attempts[0]?.validationPassed ? "pass" : "warn",
    },
    {
      label: "Escalate",
      detail: run.escalated
        ? "Validation failed, so the workflow escalated once to the strong model."
        : "Validation passed, so the workflow stopped without buying the strong model.",
      status: run.escalated ? "warn" : "pass",
    },
    {
      label: "Measure",
      detail: `This run used ${result.summary.modelCalls} model call(s) and cost ${formatCurrency(result.summary.totalCost)}.`,
      status: "pass",
    },
  ];
}

function strategyLabel(strategy: RoutingStrategy): string {
  return strategy === "strongest" ? "Strongest always" : "Route · verify · escalate";
}

function preview(context: string): string {
  return context.length > 700 ? `${context.slice(0, 700)}...` : context;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(6)}`;
}

function percentChange(from: number, to: number): string {
  if (from === 0) return "n/a";
  const change = ((to - from) / from) * 100;
  return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
}
