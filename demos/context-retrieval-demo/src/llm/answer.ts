import OpenAI from "openai";
import type { DemoConfig } from "../config.js";
import { offlineResponses } from "../data/offlineResponses.js";
import type { ModeName } from "../types.js";
import { withRetry } from "./retry.js";

export const systemInstructions =
  "You answer operational runbook questions using only the supplied context. Be concise, name the required actions, and do not invent procedures absent from the context.";

export async function answerQuestion(
  mode: ModeName,
  prompt: string,
  config: DemoConfig,
): Promise<string> {
  if (config.offline) return offlineResponses[mode];

  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await withRetry(
    () =>
      client.responses.create({
        model: config.answerModel,
        temperature: 0,
        input: [
          { role: "system", content: systemInstructions },
          { role: "user", content: prompt },
        ],
      }),
    `Answer request for ${mode}`,
  );

  return extractResponseText(response);
}

function extractResponseText(response: unknown): string {
  const candidate = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (candidate.output_text) return candidate.output_text;

  const fallback = candidate.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");

  if (fallback) return fallback;
  throw new Error("Answer response did not include text output.");
}
