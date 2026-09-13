# token_economics_ai

A small TypeScript and Node.js live demo showing how better retrieval can reduce an AI agent's context without reducing answer quality.

## What It Demonstrates

The demo asks the same operational question in two modes:

1. **Baseline** retrieves the top 10 vector-similar chunks with full metadata and complete payloads.
2. **Optimized** filters to production database docs, reranks with an explainable hybrid score, extracts only relevant passages, and enforces a context-token budget.

Both modes use the same question, answer model, system instructions, temperature, and deterministic success verifier. Only retrieval and context construction differ.

## Setup

```bash
npm install
cp .env.example .env
```

For live mode, fill in `OPENAI_API_KEY`. You can change the answer model, embedding model, and token prices in `.env`.

## Run

Offline mode uses checked-in deterministic fixture embeddings and checked-in model responses:

```bash
npm run demo -- --offline --no-pause
```

Live mode uses OpenAI for embeddings and answers. Embeddings are cached in `.cache/embeddings.json`.

```bash
npm run demo
```

To skip the presenter pause:

```bash
npm run demo -- --no-pause
```

## Verify

```bash
npm run format
npm run typecheck
npm test
```

## Key Files

- `src/data/documents.ts`: fictional operational documents and the demo question.
- `src/data/offline-embeddings.json`: deterministic checked-in fixture embeddings.
- `src/retrieval/`: vector search, metadata filtering, reranking, and passage extraction.
- `src/context/`: baseline and optimized prompt context builders.
- `src/llm/`: OpenAI calls, local embedding cache, retries, and offline responses.
- `src/verifier/`: deterministic PASS/FAIL checker for required actions.
- `src/demo.ts`: terminal demo orchestration and comparison table.
