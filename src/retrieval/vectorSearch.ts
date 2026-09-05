import type { EmbeddedDocument, RetrievedDocument } from "../types.js";
import { cosineSimilarity } from "./similarity.js";

export function vectorSearch(
  documents: EmbeddedDocument[],
  queryEmbedding: number[],
  limit: number,
): RetrievedDocument[] {
  return documents
    .map((document) => {
      const similarity = cosineSimilarity(queryEmbedding, document.embedding);
      return {
        ...document,
        similarity,
        selectionReason: `embedding similarity ${similarity.toFixed(3)}`,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
