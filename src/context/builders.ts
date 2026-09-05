import { demoQuestion } from "../data/documents.js";
import { countTokens } from "../metrics/tokens.js";
import { filterByMetadata } from "../retrieval/filter.js";
import {
  extractRelevantPassages,
  formatPassage,
} from "../retrieval/passages.js";
import { rerankCandidates } from "../retrieval/rerank.js";
import { vectorSearch } from "../retrieval/vectorSearch.js";
import type {
  EmbeddedDocument,
  RerankedDocument,
  RetrievedDocument,
} from "../types.js";

export type BuiltContext<T extends RetrievedDocument = RetrievedDocument> = {
  retrieved: T[];
  context: string;
};

export function buildBaselineContext(
  documents: EmbeddedDocument[],
  queryEmbedding: number[],
): BuiltContext {
  const retrieved = vectorSearch(documents, queryEmbedding, 10);
  const context = retrieved
    .map(
      (document, index) => `--- Retrieved chunk ${index + 1} ---
title: ${document.title}
id: ${document.id}
metadata: ${JSON.stringify(document.metadata)}
owner: ${document.owner}
ticketRef: ${document.ticketRef}
payload: ${JSON.stringify(document.payload)}
fullContent: ${document.content}`,
    )
    .join("\n\n");

  return { retrieved, context };
}

export function buildOptimizedContext(
  documents: EmbeddedDocument[],
  queryEmbedding: number[],
  contextTokenBudget: number,
): BuiltContext<RerankedDocument> {
  const filtered = filterByMetadata(documents, {
    environment: "production",
    service: "database",
  });
  const candidates = vectorSearch(
    filtered,
    queryEmbedding,
    Math.min(6, filtered.length),
  );
  const reranked = rerankCandidates(candidates, demoQuestion);
  const top = reranked.slice(0, 3);
  const passages = extractRelevantPassages(top, contextTokenBudget);

  const context = passages.map(formatPassage).join("\n\n");
  if (countTokens(context) > contextTokenBudget) {
    throw new Error(
      `Optimized context exceeded token budget: ${countTokens(context)} > ${contextTokenBudget}`,
    );
  }

  return { retrieved: top, context };
}

export function buildPrompt(context: string): string {
  return `Question:
${demoQuestion}

Retrieved context:
${context}

Answer with the required on-call actions only.`;
}
