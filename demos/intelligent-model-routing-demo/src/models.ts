import type { Difficulty, Task } from "./tasks.js";

export type ModelName = "Small Model" | "Standard Model" | "Strong Model";

export type ModelResult = {
  modelName: ModelName;
  taskId: string;
  output: unknown;
  cost: number;
  simulatedLatencyMs: number;
};

export type ModelProvider = {
  name: ModelName;
  costPerCall: number;
  simulatedLatencyMs: number;
  successProbabilityByDifficulty: Record<Difficulty, number>;
  run(task: Task): Promise<ModelResult>;
};

type OutcomeMap = Record<string, unknown>;

const smallOutcomes: OutcomeMap = {
  "extract-email": "maya.rivera@example.com",
  "classify-support": "billing",
  "reformat-account": { name: "Rae Chen", plan: "Pro", seats: 12 },
  "extract-ticket-priority": "urgent",
  "summarize-case": "Customer cannot export invoices. Engineering is looking.",
  "select-tool": "ticket_search",
  "generate-transform":
    "function normalizeEmail(value) { return value.trim(); }",
  "diagnose-code-defect": "The code sends user emails in a loop.",
  "plan-migration": "Move the data and check it afterward.",
  "security-request": "Share the temporary credential and delete it later.",
};

const standardOutcomes: OutcomeMap = {
  "extract-email": "maya.rivera@example.com",
  "classify-support": "billing",
  "reformat-account": { name: "Rae Chen", plan: "Pro", seats: 12 },
  "extract-ticket-priority": "high",
  "summarize-case":
    "Customer acct_204 cannot use CSV export. Do not promise a fix date.",
  "select-tool": "refund_lookup",
  "generate-transform":
    "function normalizeEmail(value) { return value.trim().toLowerCase(); }",
  "diagnose-code-defect": "The loop might have an indexing issue.",
  "plan-migration": "Backfill settings and switch reads later.",
  "security-request": "Ask the engineer why access is needed.",
};

const strongOutcomes: OutcomeMap = {
  "extract-email": "maya.rivera@example.com",
  "classify-support": "billing",
  "reformat-account": { name: "Rae Chen", plan: "Pro", seats: 12 },
  "extract-ticket-priority": "high",
  "summarize-case":
    "Customer acct_204 cannot use CSV export. Do not promise a fix date.",
  "select-tool": "refund_lookup",
  "generate-transform":
    "function normalizeEmail(value) { return value.trim().toLowerCase(); }",
  "diagnose-code-defect":
    "off-by-one loop reads past the end of the users array",
  "plan-migration": [
    "backfill normalized tables",
    "dual-write JSON and normalized records",
    "verify parity",
    "cutover reads",
    "keep a rollback path",
  ],
  "security-request":
    "deny direct credential sharing and route through approved access review",
};

export const smallModel = createSimulatedModel(
  "Small Model",
  0.002,
  80,
  { low: 0.8, medium: 0.35, high: 0.1 },
  smallOutcomes,
);

export const standardModel = createSimulatedModel(
  "Standard Model",
  0.01,
  180,
  { low: 0.95, medium: 0.75, high: 0.35 },
  standardOutcomes,
);

export const strongModel = createSimulatedModel(
  "Strong Model",
  0.05,
  420,
  { low: 0.99, medium: 0.95, high: 0.9 },
  strongOutcomes,
);

export const modelsByName = {
  "Small Model": smallModel,
  "Standard Model": standardModel,
  "Strong Model": strongModel,
} as const;

function createSimulatedModel(
  name: ModelName,
  costPerCall: number,
  simulatedLatencyMs: number,
  successProbabilityByDifficulty: Record<Difficulty, number>,
  outcomes: OutcomeMap,
): ModelProvider {
  return {
    name,
    costPerCall,
    simulatedLatencyMs,
    successProbabilityByDifficulty,
    async run(task: Task): Promise<ModelResult> {
      return {
        modelName: name,
        taskId: task.id,
        output: outcomes[task.id],
        cost: costPerCall,
        simulatedLatencyMs,
      };
    },
  };
}
