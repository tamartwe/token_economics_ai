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

Recommended live flow:

1. Switch to the `Buy Selectively` tab.
2. Select `Extract ticket priority`.
3. Select `Route, verify, escalate`.
4. Press `Run`.
5. Show the result card directly under the task and strategy controls. This is
   the trace: attempt 1 uses the small model and fails validation; attempt 2
   uses the strong model and passes.
6. Point to the right-side economics panel: model calls, escalations, total
   cost, cost per success, and final status.
7. Switch to `Strongest always` and press `Run` again. Explain that this is
   simpler, but it buys the premium model immediately.

Presenter line:

```text
The optimization is not "always use a small model." It is "start as cheaply as
possible, validate the result, and buy the stronger model only when validation
says it matters."
```

Then open:

```text
apps/demo-ui/src/server.ts
apps/demo-ui/src/demoApi.ts
demos/intelligent-model-routing-demo/src/router.ts
demos/intelligent-model-routing-demo/src/strategies/fixed.ts
demos/intelligent-model-routing-demo/src/strategies/routed.ts
```

Backend code to show:

- `apps/demo-ui/src/server.ts`: show `GET /api/routing` for the task catalog
  and reference comparison, then `POST /api/routing` for the selected
  task/strategy run.
- `apps/demo-ui/src/demoApi.ts`: show `runRoutingTaskDemo`; it chooses the
  selected task, runs either fixed-strongest or routed strategy, and returns
  UI-ready JSON. Then show `routingMetrics` and `mapRoutingRun`.
- `demos/intelligent-model-routing-demo/src/router.ts`: show `routeTask`; it
  decides the starting model from difficulty and risk.
- `demos/intelligent-model-routing-demo/src/strategies/routed.ts`: show
  `runRoutedStrategy` and `runAndValidate`; this is the route, validate, and
  single-escalation workflow.
- `demos/intelligent-model-routing-demo/src/strategies/fixed.ts`: show
  `runFixedStrongest`; this is the baseline that always buys the strongest
  model before validation.

Run the short escalation example:

```bash
npm run demo --workspace intelligent-model-routing-demo -- --task extraction
```

Then run the full comparison:

```bash
npm run demo:routing
```
