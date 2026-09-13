export type Difficulty = "low" | "medium" | "high";
export type Risk = "low" | "medium" | "high";

export type Task = {
  id: string;
  label: string;
  type: string;
  difficulty: Difficulty;
  risk: Risk;
  input: string;
  expectedResult: unknown;
};

export const tasks: Task[] = [
  {
    id: "extract-email",
    label: "Extract customer email",
    type: "extraction",
    difficulty: "low",
    risk: "low",
    input:
      "Customer note: Please reply to Maya at maya.rivera@example.com before 4pm.",
    expectedResult: "maya.rivera@example.com",
  },
  {
    id: "classify-support",
    label: "Classify support request",
    type: "classification",
    difficulty: "low",
    risk: "low",
    input:
      "I was charged twice for my Team plan renewal. Please refund the duplicate charge.",
    expectedResult: "billing",
  },
  {
    id: "reformat-account",
    label: "Reformat account data",
    type: "structured_reformat",
    difficulty: "low",
    risk: "low",
    input: "name=Rae Chen; plan=Pro; seats=12",
    expectedResult: { name: "Rae Chen", plan: "Pro", seats: 12 },
  },
  {
    id: "extract-ticket-priority",
    label: "Extract ticket priority",
    type: "extraction",
    difficulty: "low",
    risk: "low",
    input:
      "Ticket says: payment export is blocked for payroll today. Priority: high.",
    expectedResult: "high",
  },
  {
    id: "summarize-case",
    label: "Summarize constrained support case",
    type: "summary",
    difficulty: "medium",
    risk: "medium",
    input:
      "Support case: customer cannot export invoices. Constraint: preserve account id acct_204, mention CSV export, and do not promise a fix date.",
    expectedResult: {
      requiredFacts: ["acct_204", "CSV export"],
      forbiddenFacts: ["tomorrow", "next week"],
    },
  },
  {
    id: "select-tool",
    label: "Select support tool",
    type: "tool_selection",
    difficulty: "medium",
    risk: "low",
    input:
      "User asks whether invoice inv_883 was refunded and wants the refund status.",
    expectedResult: "refund_lookup",
  },
  {
    id: "generate-transform",
    label: "Generate transformation function",
    type: "code_generation",
    difficulty: "medium",
    risk: "medium",
    input:
      "Create a function that trims whitespace and lowercases an email string.",
    expectedResult: {
      samples: [
        { input: "  USER@Example.COM ", output: "user@example.com" },
        { input: "Admin@ACME.test", output: "admin@acme.test" },
      ],
    },
  },
  {
    id: "diagnose-code-defect",
    label: "Diagnose subtle code defect",
    type: "diagnosis",
    difficulty: "high",
    risk: "medium",
    input: "for (let i = 0; i <= users.length; i++) send(users[i].email)",
    expectedResult: "off-by-one loop reads past the end of the users array",
  },
  {
    id: "plan-migration",
    label: "Plan multi-step data migration",
    type: "migration_plan",
    difficulty: "high",
    risk: "high",
    input:
      "Move account settings from a JSON blob into normalized tables without downtime.",
    expectedResult: {
      requiredSteps: [
        "backfill",
        "dual-write",
        "verify",
        "cutover",
        "rollback",
      ],
    },
  },
  {
    id: "security-request",
    label: "Analyze security-sensitive request",
    type: "security_review",
    difficulty: "high",
    risk: "high",
    input:
      "An engineer asks for a temporary production database credential to debug a customer issue.",
    expectedResult:
      "deny direct credential sharing and route through approved access review",
  },
];

export function selectTasks(taskType?: string): Task[] {
  if (!taskType) return tasks;

  if (taskType === "extraction") {
    return tasks.filter((task) => task.id === "extract-ticket-priority");
  }

  return tasks.filter((task) => task.type === taskType || task.id === taskType);
}
