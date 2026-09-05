import type { OperationalDocument } from "./data/documents.js";

export type EmbeddedDocument = OperationalDocument & {
  embedding: number[];
};

export type RetrievedDocument = EmbeddedDocument & {
  similarity: number;
  selectionReason: string;
};

export type RerankedDocument = RetrievedDocument & {
  keywordScore: number;
  freshnessScore: number;
  hybridScore: number;
};

export type ModeName = "baseline" | "optimized";

export type DemoMetrics = {
  mode: ModeName;
  retrievedTitles: string[];
  retrievedReasons: string[];
  retrievedCount: number;
  context: string;
  contextPreview: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  answer: string;
};
