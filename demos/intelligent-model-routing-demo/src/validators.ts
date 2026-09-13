import vm from "node:vm";
import type { Task } from "./tasks.js";

export type ValidationResult = {
  passed: boolean;
  reason: string;
};

export function validateTaskResult(
  task: Task,
  output: unknown,
): ValidationResult {
  switch (task.type) {
    case "extraction":
    case "classification":
    case "tool_selection":
    case "diagnosis":
    case "security_review":
      return validateExactText(task.expectedResult, output);
    case "structured_reformat":
      return validateJson(task.expectedResult, output);
    case "summary":
      return validateSummary(task.expectedResult, output);
    case "code_generation":
      return validateGeneratedCode(task.expectedResult, output);
    case "migration_plan":
      return validateRequiredSteps(task.expectedResult, output);
    default:
      return {
        passed: false,
        reason: `No validator configured for ${task.type}`,
      };
  }
}

function validateExactText(
  expected: unknown,
  output: unknown,
): ValidationResult {
  if (typeof expected !== "string" || typeof output !== "string") {
    return {
      passed: false,
      reason: "expected and output must both be strings",
    };
  }

  const passed = normalize(output) === normalize(expected);
  return {
    passed,
    reason: passed
      ? "exact expected value matched"
      : `expected "${expected}", got "${output}"`,
  };
}

function validateJson(expected: unknown, output: unknown): ValidationResult {
  const passed = JSON.stringify(expected) === JSON.stringify(output);
  return {
    passed,
    reason: passed
      ? "structured output matched"
      : "structured output did not match schema",
  };
}

function validateSummary(expected: unknown, output: unknown): ValidationResult {
  const rules = expected as {
    requiredFacts: string[];
    forbiddenFacts: string[];
  };
  const text = String(output);
  const missing = rules.requiredFacts.filter((fact) => !text.includes(fact));
  const forbidden = rules.forbiddenFacts.filter((fact) =>
    text.toLowerCase().includes(fact.toLowerCase()),
  );

  if (missing.length > 0) {
    return {
      passed: false,
      reason: `missing required facts: ${missing.join(", ")}`,
    };
  }

  if (forbidden.length > 0) {
    return {
      passed: false,
      reason: `included forbidden facts: ${forbidden.join(", ")}`,
    };
  }

  return {
    passed: true,
    reason: "required facts preserved and forbidden facts avoided",
  };
}

function validateGeneratedCode(
  expected: unknown,
  output: unknown,
): ValidationResult {
  const rules = expected as {
    samples: Array<{ input: string; output: string }>;
  };
  if (typeof output !== "string") {
    return { passed: false, reason: "generated code was not a string" };
  }

  const match = output.match(
    /function\s+normalizeEmail\s*\([^)]*\)\s*\{[\s\S]*\}/,
  );
  if (!match) {
    return { passed: false, reason: "missing normalizeEmail function" };
  }

  try {
    const context = vm.createContext({});
    const script = new vm.Script(`${match[0]}; normalizeEmail;`);
    const fn = script.runInContext(context, { timeout: 100 }) as (
      value: string,
    ) => string;

    const failed = rules.samples.find(
      (sample) => fn(sample.input) !== sample.output,
    );
    if (failed) {
      return {
        passed: false,
        reason: `sample failed for "${failed.input}"`,
      };
    }

    return { passed: true, reason: "generated function passed sample tests" };
  } catch (error) {
    return {
      passed: false,
      reason: `generated code failed to run: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function validateRequiredSteps(
  expected: unknown,
  output: unknown,
): ValidationResult {
  const rules = expected as { requiredSteps: string[] };
  const text = Array.isArray(output) ? output.join(" ") : String(output);
  const missing = rules.requiredSteps.filter(
    (step) => !text.toLowerCase().includes(step.toLowerCase()),
  );

  return {
    passed: missing.length === 0,
    reason:
      missing.length === 0
        ? "all required migration steps present"
        : `missing steps: ${missing.join(", ")}`,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
