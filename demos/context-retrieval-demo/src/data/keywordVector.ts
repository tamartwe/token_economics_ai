const dimensions = [
  ["database", "db", "replication", "replica", "lag", "wal", "primary"],
  ["cpu", "saturation", "above", "90", "load", "expensive", "queries"],
  ["production", "prod", "#db-incidents", "incident", "on-call", "owner"],
  ["batch", "etl", "analytics", "backfills", "workloads", "nonessential"],
  ["kubernetes", "node", "pod", "cluster", "cordon", "compute"],
  ["auth", "authentication", "login", "identity", "tokens", "signing"],
  ["api", "latency", "cache", "request", "errors", "concurrency"],
  ["deploy", "deployment", "rollback", "release", "artifact", "version"],
  ["security", "credential", "privilege", "unauthorized", "escalation"],
  ["staging", "development", "sandbox", "test", "synthetic"],
  ["backup", "snapshot", "storage", "object", "schedule"],
  ["connection", "pool", "leak", "connections"],
];

export function deterministicKeywordEmbedding(text: string): number[] {
  const normalized = text.toLowerCase();
  const vector = dimensions.map((terms) =>
    terms.reduce((score, term) => {
      const pattern = new RegExp(
        `\\b${escapeRegExp(term.toLowerCase())}\\b`,
        "g",
      );
      return score + (normalized.match(pattern)?.length ?? 0);
    }, 0),
  );

  const magnitude = Math.hypot(...vector);
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
