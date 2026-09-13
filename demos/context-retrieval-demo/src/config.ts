import "dotenv/config";

export type DemoConfig = {
  offline: boolean;
  noPause: boolean;
  answerModel: string;
  embeddingModel: string;
  inputTokenPricePer1M: number;
  outputTokenPricePer1M: number;
  contextTokenBudget: number;
  apiKey?: string;
};

export function parseArgs(
  argv: string[],
): Pick<DemoConfig, "offline" | "noPause"> {
  return {
    offline: argv.includes("--offline"),
    noPause: argv.includes("--no-pause"),
  };
}

export function loadConfig(argv = process.argv.slice(2)): DemoConfig {
  const args = parseArgs(argv);
  const config: DemoConfig = {
    ...args,
    apiKey: process.env.OPENAI_API_KEY,
    answerModel: process.env.OPENAI_ANSWER_MODEL ?? "gpt-4o-mini",
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    inputTokenPricePer1M: readNumber("INPUT_TOKEN_PRICE_PER_1M", 0.15),
    outputTokenPricePer1M: readNumber("OUTPUT_TOKEN_PRICE_PER_1M", 0.6),
    contextTokenBudget: readNumber("CONTEXT_TOKEN_BUDGET", 1200),
  };

  validateConfig(config);
  return config;
}

function readNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `${name} must be a non-negative number. Received: ${value}`,
    );
  }

  return parsed;
}

function validateConfig(config: DemoConfig): void {
  if (!config.offline && !config.apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for live mode. Add it to .env, or run `npm run demo -- --offline`.",
    );
  }

  if (!config.answerModel.trim()) {
    throw new Error("OPENAI_ANSWER_MODEL must not be empty.");
  }

  if (!config.embeddingModel.trim()) {
    throw new Error("OPENAI_EMBEDDING_MODEL must not be empty.");
  }

  if (config.contextTokenBudget <= 0) {
    throw new Error("CONTEXT_TOKEN_BUDGET must be greater than zero.");
  }
}
