import type { RetrievedDocument, RerankedDocument } from "../types.js";

const importantKeywords = [
  "production",
  "database",
  "cpu",
  "replication",
  "lag",
  "batch",
  "expensive",
  "queries",
  "incident",
  "owner",
];

export function rerankCandidates(
  candidates: RetrievedDocument[],
  question: string,
): RerankedDocument[] {
  const queryTerms = new Set(
    tokenize(question).filter((term) => term.length > 2),
  );

  return candidates
    .map((candidate) => {
      const keywordScore = keywordOverlap(candidate.content, queryTerms);
      const freshnessScore = freshness(candidate.metadata.updatedAt);
      const hybridScore =
        candidate.similarity * 0.6 + keywordScore * 0.3 + freshnessScore * 0.1;

      return {
        ...candidate,
        keywordScore,
        freshnessScore,
        hybridScore,
        selectionReason: `hybrid=${hybridScore.toFixed(3)} similarity=${candidate.similarity.toFixed(
          3,
        )} keyword=${keywordScore.toFixed(3)} freshness=${freshnessScore.toFixed(3)}`,
      };
    })
    .sort((a, b) => b.hybridScore - a.hybridScore);
}

function keywordOverlap(text: string, queryTerms: Set<string>): number {
  const documentTerms = new Set(tokenize(text));
  let matches = 0;

  for (const term of queryTerms) {
    if (documentTerms.has(term) || importantKeywords.includes(term)) {
      matches += documentTerms.has(term) ? 1 : 0;
    }
  }

  return queryTerms.size === 0 ? 0 : matches / queryTerms.size;
}

function freshness(updatedAt: string): number {
  const newest = Date.parse("2026-08-31");
  const oldest = Date.parse("2026-03-01");
  const current = Date.parse(updatedAt);
  return Math.max(0, Math.min(1, (current - oldest) / (newest - oldest)));
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9#-]+/g) ?? [];
}
