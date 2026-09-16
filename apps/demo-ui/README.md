# demo-ui

A small local browser UI backed by an Express API. The UI calls the actual
TypeScript demo logic and renders the current results.

## Run

From the repo root:

```bash
npm install
npm run ui
```

Open the local URL printed by the server, usually:

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

For `Support Agent`, show the technical support question first. Press `Send`
with `Efficient mode` off to run baseline retrieval. Then turn `Efficient mode`
on; the previous response clears, and nothing runs until `Send` is pressed
again. The answer, retrieved documents, context preview, token count, and cost
are returned by `POST /api/send-less`.

Then open:

```text
demos/context-retrieval-demo/src/context/builders.ts
```

Point to `buildBaselineContext` and `buildOptimizedContext`, then run:

```bash
npm run demo:retrieval
```

For `Buy Intelligence Selectively`, choose a task, choose either `Strongest
always` or `Route, verify, escalate`, then press `Run`. The execution trace and
economics panel are returned by `POST /api/routing`; the task list and reference
comparison come from `GET /api/routing`.

Then open:

```text
apps/demo-ui/src/server.ts
apps/demo-ui/src/demoApi.ts
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
