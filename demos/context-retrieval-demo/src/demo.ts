import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { loadConfig } from "./config.js";
import {
  buildBaselineContext,
  buildOptimizedContext,
  buildPrompt,
} from "./context/builders.js";
import { demoQuestion } from "./data/documents.js";
import { answerQuestion, systemInstructions } from "./llm/answer.js";
import {
  createEmbeddingProvider,
  embedDemoQuestion,
  loadEmbeddedDocuments,
} from "./llm/embeddings.js";
import { estimateCost } from "./metrics/cost.js";
import { countTokens } from "./metrics/tokens.js";
import { color } from "./terminal/colors.js";
import type { DemoConfig } from "./config.js";
import type { DemoMetrics, ModeName, RetrievedDocument } from "./types.js";
import { verifyAnswer } from "./verifier/success.js";

async function main(): Promise<void> {
  const config = loadConfig();

  header("Retrieval Context Economics Demo");
  console.log(
    `Mode: ${config.offline ? "offline deterministic" : "live OpenAI"}`,
  );
  console.log(`Question: ${demoQuestion}\n`);

  const provider = await createEmbeddingProvider(config);
  const embeddedDocuments = await loadEmbeddedDocuments(provider);
  const queryEmbedding = await embedDemoQuestion(provider);

  const baseline = await runMode("baseline", config, () =>
    buildBaselineContext(embeddedDocuments, queryEmbedding),
  );
  printModeResult(baseline);

  if (!config.noPause) {
    await pause("\nPress Enter to run the optimized retrieval path...");
  }

  const optimized = await runMode("optimized", config, () =>
    buildOptimizedContext(
      embeddedDocuments,
      queryEmbedding,
      config.contextTokenBudget,
    ),
  );
  printModeResult(optimized);

  printComparison(baseline, optimized);
}

async function runMode(
  mode: ModeName,
  config: DemoConfig,
  buildContext: () => { retrieved: RetrievedDocument[]; context: string },
): Promise<DemoMetrics> {
  const started = performance.now();
  const { retrieved, context } = buildContext();
  const prompt = buildPrompt(context);
  const answer = await answerQuestion(mode, prompt, config);
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
      config.inputTokenPricePer1M,
      config.outputTokenPricePer1M,
    ),
    latencyMs,
    success: verification.success,
    answer,
  };
}

function printModeResult(metrics: DemoMetrics): void {
  header(metrics.mode === "baseline" ? "Baseline Run" : "Optimized Run");
  console.log(color.bold("Retrieved document titles"));
  metrics.retrievedTitles.forEach((title, index) => {
    console.log(`${index + 1}. ${title}`);
  });

  console.log(`\n${color.bold("Why selected")}`);
  metrics.retrievedTitles.forEach((title, index) => {
    console.log(`${index + 1}. ${title}: ${metrics.retrievedReasons[index]}`);
  });

  console.log(`\nRetrieved chunks: ${formatNumber(metrics.retrievedCount)}`);
  console.log(`\n${color.bold("Context preview")}`);
  console.log(color.dim(metrics.contextPreview));
  console.log(`\nInput tokens: ${formatNumber(metrics.inputTokens)}`);
  console.log(`Output tokens: ${formatNumber(metrics.outputTokens)}`);
  console.log(`Estimated cost: ${formatCurrency(metrics.estimatedCost)}`);
  console.log(`Latency: ${formatNumber(metrics.latencyMs)} ms`);
  console.log(
    `Success: ${metrics.success ? color.green("PASS") : color.red("FAIL")}`,
  );
  console.log(`\n${color.bold("Answer")}\n${metrics.answer}\n`);
}

function printComparison(baseline: DemoMetrics, optimized: DemoMetrics): void {
  header("Comparison");
  const rows = [
    [
      "Retrieved chunks",
      baseline.retrievedCount,
      optimized.retrievedCount,
      percentChange(baseline.retrievedCount, optimized.retrievedCount),
    ],
    [
      "Input tokens",
      formatNumber(baseline.inputTokens),
      formatNumber(optimized.inputTokens),
      percentChange(baseline.inputTokens, optimized.inputTokens),
    ],
    [
      "Output tokens",
      formatNumber(baseline.outputTokens),
      formatNumber(optimized.outputTokens),
      percentChange(baseline.outputTokens, optimized.outputTokens),
    ],
    [
      "Estimated cost",
      formatCurrency(baseline.estimatedCost),
      formatCurrency(optimized.estimatedCost),
      percentChange(baseline.estimatedCost, optimized.estimatedCost),
    ],
    [
      "Latency",
      `${formatNumber(baseline.latencyMs)} ms`,
      `${formatNumber(optimized.latencyMs)} ms`,
      percentChange(baseline.latencyMs, optimized.latencyMs),
    ],
    [
      "Task success",
      baseline.success ? "PASS" : "FAIL",
      optimized.success ? "PASS" : "FAIL",
      baseline.success === optimized.success ? "same" : "changed",
    ],
  ] as const;

  const widths = [22, 16, 16, 12];
  console.log(formatRow(["Metric", "Baseline", "Optimized", "Change"], widths));
  console.log(
    formatRow(
      ["-".repeat(18), "-".repeat(10), "-".repeat(10), "-".repeat(8)],
      widths,
    ),
  );
  rows.forEach((row) => console.log(formatRow(row.map(String), widths)));
}

function header(label: string): void {
  console.log(color.cyan(color.bold(`\n=== ${label} ===`)));
}

async function pause(message: string): Promise<void> {
  const rl = readline.createInterface({ input, output });
  await rl.question(color.yellow(message));
  rl.close();
}

function preview(context: string): string {
  return context.length > 900 ? `${context.slice(0, 900)}...` : context;
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

function formatRow(values: readonly string[], widths: number[]): string {
  return values.map((value, index) => value.padEnd(widths[index])).join("");
}

main().catch((error: unknown) => {
  console.error(
    color.red(error instanceof Error ? error.message : String(error)),
  );
  process.exitCode = 1;
});
