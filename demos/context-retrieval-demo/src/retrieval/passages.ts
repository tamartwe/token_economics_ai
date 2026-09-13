import { countTokens } from "../metrics/tokens.js";
import type { RerankedDocument } from "../types.js";

const passageKeywords = [
  "production database",
  "cpu",
  "replication lag",
  "batch workloads",
  "expensive queries",
  "#db-incidents",
  "database owner",
  "escalate",
];

export type ExtractedPassage = {
  title: string;
  updatedAt: string;
  passage: string;
};

export function extractRelevantPassages(
  documents: RerankedDocument[],
  tokenBudget: number,
): ExtractedPassage[] {
  const passages: ExtractedPassage[] = [];
  const seen = new Set<string>();
  let usedTokens = 0;

  for (const document of documents) {
    const sentences = splitSentences(document.content)
      .filter((sentence) => isRelevant(sentence))
      .slice(0, 5);
    const passage = sentences.join(" ");
    const normalized = passage.toLowerCase();

    if (passage && !seen.has(normalized)) {
      const candidate = {
        title: document.title,
        updatedAt: document.metadata.updatedAt,
        passage,
      };
      const candidateTokens = countTokens(formatPassage(candidate));

      if (usedTokens + candidateTokens <= tokenBudget) {
        usedTokens += candidateTokens;
        seen.add(normalized);
        passages.push(candidate);
      }
    }
  }

  return passages;
}

export function formatPassage(passage: ExtractedPassage): string {
  return `Title: ${passage.title}\nUpdated: ${passage.updatedAt}\nRelevant passage: ${passage.passage}`;
}

function isRelevant(sentence: string): boolean {
  const normalized = sentence.toLowerCase();
  return passageKeywords.some((keyword) => normalized.includes(keyword));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
