export type Metric = {
  label: string;
  baseline: string;
  optimized: string;
  change: string;
};

export type Step = {
  label: string;
  detail: string;
  status: "neutral" | "pass" | "warn";
};

export type DemoPanel = {
  eyebrow: string;
  title: string;
  subtitle: string;
  command: string;
  codePath: string;
  codePointer: string;
  metrics: Metric[];
  baselineLabel: string;
  optimizedLabel: string;
  steps: Step[];
  takeaway: string;
};

export const sendLessDemo: DemoPanel = {
  eyebrow: "Demo 1",
  title: "Send Less",
  subtitle: "Same retrieval task. Less context. Same correct answer.",
  command: "npm run demo:retrieval",
  codePath: "demos/context-retrieval-demo/src/context/builders.ts",
  codePointer:
    "Compare buildBaselineContext with buildOptimizedContext.",
  baselineLabel: "Baseline retrieval",
  optimizedLabel: "Optimized context",
  metrics: [
    {
      label: "Retrieved chunks",
      baseline: "10",
      optimized: "3",
      change: "-70%",
    },
    {
      label: "Context shape",
      baseline: "Full records",
      optimized: "Relevant passages",
      change: "filtered",
    },
    {
      label: "Input tokens",
      baseline: "high",
      optimized: "lower",
      change: "down",
    },
    {
      label: "Answer correctness",
      baseline: "PASS",
      optimized: "PASS",
      change: "same",
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
    "The optimization is primarily better retrieval, supported by filtering and passage extraction.",
};

export const routingDemo: DemoPanel = {
  eyebrow: "Demo 2",
  title: "Buy Intelligence Selectively",
  subtitle: "Same task set. Different models. Verified outcomes.",
  command:
    "npm run demo --workspace intelligent-model-routing-demo -- --task extraction",
  codePath: "demos/intelligent-model-routing-demo/src/strategies/routed.ts",
  codePointer:
    "Show routeTask, runAndValidate, and one escalation to strongModel.",
  baselineLabel: "Strongest always",
  optimizedLabel: "Route · verify · escalate",
  metrics: [
    {
      label: "Initial model",
      baseline: "Strong",
      optimized: "Small / Standard / Strong",
      change: "selective",
    },
    {
      label: "Validation",
      baseline: "implicit",
      optimized: "required",
      change: "safer",
    },
    {
      label: "Escalations",
      baseline: "none",
      optimized: "only on failure",
      change: "targeted",
    },
    {
      label: "Cost per success",
      baseline: "premium",
      optimized: "lower",
      change: "down",
    },
  ],
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
