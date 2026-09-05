import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { demoQuestion, documents } from "../data/documents.js";
import { deterministicKeywordEmbedding } from "../data/keywordVector.js";
import type { DemoConfig } from "../config.js";
import type { EmbeddedDocument } from "../types.js";
import { withRetry } from "./retry.js";

type OfflineEmbeddings = Record<string, number[]>;
type LiveEmbeddingCache = Record<string, number[]>;

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const offlineEmbeddingPath = path.join(
  rootDir,
  "src/data/offline-embeddings.json",
);

export type EmbeddingProvider = {
  embedText(key: string, text: string): Promise<number[]>;
};

export async function createEmbeddingProvider(
  config: DemoConfig,
): Promise<EmbeddingProvider> {
  if (config.offline) return createOfflineEmbeddingProvider();
  return createLiveEmbeddingProvider(config);
}

export async function loadEmbeddedDocuments(
  provider: EmbeddingProvider,
): Promise<EmbeddedDocument[]> {
  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      embedding: await provider.embedText(document.id, document.content),
    })),
  );
}

export async function embedDemoQuestion(
  provider: EmbeddingProvider,
): Promise<number[]> {
  return provider.embedText("__question__", demoQuestion);
}

export function generateOfflineEmbeddings(): OfflineEmbeddings {
  return Object.fromEntries([
    ["__question__", deterministicKeywordEmbedding(demoQuestion)],
    ...documents.map((document) => [
      document.id,
      deterministicKeywordEmbedding(`${document.title}\n${document.content}`),
    ]),
  ]);
}

async function createOfflineEmbeddingProvider(): Promise<EmbeddingProvider> {
  const raw = await readFile(offlineEmbeddingPath, "utf8");
  const embeddings = JSON.parse(raw) as OfflineEmbeddings;
  const expectedKeys = [
    "__question__",
    ...documents.map((document) => document.id),
  ];
  const missing = expectedKeys.filter((key) => !Array.isArray(embeddings[key]));

  if (missing.length > 0) {
    throw new Error(
      `Offline embeddings are missing keys: ${missing.join(
        ", ",
      )}. Regenerate src/data/offline-embeddings.json.`,
    );
  }

  return {
    async embedText(key: string) {
      const embedding = embeddings[key];
      if (!embedding) throw new Error(`No offline embedding found for ${key}`);
      return embedding;
    },
  };
}

async function createLiveEmbeddingProvider(
  config: DemoConfig,
): Promise<EmbeddingProvider> {
  const client = new OpenAI({ apiKey: config.apiKey });
  const cachePath = path.join(
    rootDir,
    ".cache",
    `embeddings-${slug(config.embeddingModel)}.json`,
  );
  const cache = await readCache(cachePath);

  return {
    async embedText(key: string, text: string) {
      const cacheKey = `${config.embeddingModel}:${key}:${hash(text)}`;
      const cached = cache[cacheKey];
      if (cached) return cached;

      const response = await withRetry(
        () =>
          client.embeddings.create({
            model: config.embeddingModel,
            input: text,
          }),
        `Embedding request for ${key}`,
      );
      const embedding = response.data[0]?.embedding;
      if (!embedding)
        throw new Error(
          `Embedding response for ${key} did not include a vector.`,
        );

      cache[cacheKey] = embedding;
      await writeCache(cachePath, cache);
      return embedding;
    },
  };
}

async function readCache(cachePath: string): Promise<LiveEmbeddingCache> {
  try {
    return JSON.parse(await readFile(cachePath, "utf8")) as LiveEmbeddingCache;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeCache(
  cachePath: string,
  cache: LiveEmbeddingCache,
): Promise<void> {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-");
}
