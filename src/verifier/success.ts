import { requiredActions } from "../data/documents.js";

export type VerificationResult = {
  success: boolean;
  matchedActions: string[];
  missingActions: string[];
};

export function verifyAnswer(answer: string): VerificationResult {
  const normalized = normalize(answer);
  const matchedActions: string[] = [];
  const missingActions: string[] = [];

  for (const action of requiredActions) {
    const hasVerb = action.terms.some((term) =>
      normalized.includes(normalize(term)),
    );
    const hasSubject = action.subjects.some((subject) =>
      normalized.includes(normalize(subject)),
    );
    const hasCondition =
      !("conditionTerms" in action) ||
      action.conditionTerms.some((term) =>
        normalized.includes(normalize(term)),
      );

    if (hasVerb && hasSubject && hasCondition) {
      matchedActions.push(action.description);
    } else {
      missingActions.push(action.description);
    }
  }

  return {
    success: missingActions.length === 0,
    matchedActions,
    missingActions,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
