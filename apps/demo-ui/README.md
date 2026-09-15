# demo-ui

A small local browser UI for presenting the two token economics demos.

## Run

From the repo root:

```bash
npm install
npm run ui
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run ui:build
```

## How to present

Use the UI as the audience-facing view and keep the terminal/code editor as the
backup view.

For `Send Less`, show the side-by-side before/after comparison first. Then open:

```text
demos/context-retrieval-demo/src/context/builders.ts
```

Point to `buildBaselineContext` and `buildOptimizedContext`, then run:

```bash
npm run demo:retrieval
```

For `Buy Intelligence Selectively`, show the model-routing tab first. Then open:

```text
demos/intelligent-model-routing-demo/src/router.ts
demos/intelligent-model-routing-demo/src/strategies/routed.ts
```

Run the short escalation example:

```bash
npm run demo --workspace intelligent-model-routing-demo -- --task extraction
```

Then run the full comparison:

```bash
npm run demo:routing
```
