import assert from "node:assert/strict";
import test from "node:test";
import { buildOptimizedContext } from "../src/context/builders.js";
import { demoQuestion, documents } from "../src/data/documents.js";
import { deterministicKeywordEmbedding } from "../src/data/keywordVector.js";
import { filterByMetadata } from "../src/retrieval/filter.js";
import { rerankCandidates } from "../src/retrieval/rerank.js";
import { cosineSimilarity } from "../src/retrieval/similarity.js";
import { vectorSearch } from "../src/retrieval/vectorSearch.js";
import type { EmbeddedDocument } from "../src/types.js";
import { verifyAnswer } from "../src/verifier/success.js";

const embeddedDocuments: EmbeddedDocument[] = documents.map((document) => ({
  ...document,
  embedding: deterministicKeywordEmbedding(
    `${document.title}\n${document.content}`,
  ),
}));
const queryEmbedding = deterministicKeywordEmbedding(demoQuestion);

test("cosine similarity handles identical, orthogonal, and zero vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), 0);
});

test("metadata filtering keeps only production database documents", () => {
  const filtered = filterByMetadata(embeddedDocuments, {
    service: "database",
    environment: "production",
  });

  assert.ok(filtered.length >= 3);
  assert.ok(
    filtered.every(
      (document) =>
        document.metadata.service === "database" &&
        document.metadata.environment === "production",
    ),
  );
});

test("reranking prefers the authoritative production database runbook", () => {
  const candidates = vectorSearch(embeddedDocuments, queryEmbedding, 10);
  const reranked = rerankCandidates(candidates, demoQuestion);

  assert.equal(reranked[0].id, "prod-db-cpu-lag-runbook");
  assert.ok(reranked[0].hybridScore >= reranked[1].hybridScore);
});

test("optimized context keeps three chunks and stays within token budget", () => {
  const result = buildOptimizedContext(embeddedDocuments, queryEmbedding, 320);

  assert.equal(result.retrieved.length, 3);
  assert.match(result.context, /stop nonessential batch workloads/i);
  assert.match(result.context, /escalate to the database owner/i);
  assert.doesNotMatch(result.context, /payload:/i);
});

test("deterministic verifier requires all operational actions", () => {
  const passing =
    "Stop nonessential batch workloads, inspect currently running expensive queries, notify the #db-incidents database incident channel, and escalate to the database owner if replication lag continues.";
  const failing = "The on-call engineer should look at the dashboard and wait.";

  assert.equal(verifyAnswer(passing).success, true);
  assert.equal(verifyAnswer(failing).success, false);
});
