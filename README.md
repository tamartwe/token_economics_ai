# token_economics_ai

Two small, presentation-ready TypeScript demos for explaining AI workflow economics.

## Browser UI

The repo includes a small local UI for presenting the two demos side by side.

```bash
npm run ui
```

Build the UI with:

```bash
npm run ui:build
```

## Demos

- `demos/context-retrieval-demo`: shows how better retrieval reduces context size without reducing answer quality.
- `demos/intelligent-model-routing-demo`: shows how route, verify, and escalate workflows reduce cost per successful task.

## Setup

Use Node 22 or newer.

```bash
npm install
```

## Run

```bash
npm run demo:retrieval
npm run demo:routing
```

The retrieval demo also supports live OpenAI calls when `OPENAI_API_KEY` is configured:

```bash
npm run demo:retrieval:live
```

The routing demo is deterministic and simulated by default:

```bash
npm --workspace intelligent-model-routing-demo run demo -- --step
npm --workspace intelligent-model-routing-demo run demo -- --task extraction
```

## Verify

```bash
npm run typecheck
npm test
```
