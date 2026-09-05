import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOfflineEmbeddings } from "../llm/embeddings.js";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const outputPath = path.join(rootDir, "src/data/offline-embeddings.json");

await writeFile(
  outputPath,
  `${JSON.stringify(generateOfflineEmbeddings(), null, 2)}\n`,
);
console.log(`Wrote ${outputPath}`);
