import type { EmbeddedDocument } from "../types.js";

export function filterByMetadata(
  documents: EmbeddedDocument[],
  metadata: { service: string; environment: string },
): EmbeddedDocument[] {
  return documents.filter(
    (document) =>
      document.metadata.service === metadata.service &&
      document.metadata.environment === metadata.environment,
  );
}
