# intelligent-model-routing-demo

A small presentation-ready TypeScript CLI demo showing how an AI workflow can reduce cost by buying intelligence selectively: route tasks by difficulty and risk, verify every result, and escalate once only when verification fails.

## Economic Principle

The cheapest model call is not always the cheapest workflow. This demo measures:

- Total workflow cost
- Verified successful tasks
- Cost per attempted task
- Cost per successful task

Failed attempts remain in the total cost. If a small model fails and the workflow escalates, the final task cost includes both calls.

## Architecture

- `src/tasks.ts`: deterministic demo tasks across low, medium, and high complexity.
- `src/models.ts`: simulated `smallModel`, `standardModel`, and `strongModel` behind a `ModelProvider` interface.
- `src/router.ts`: simple routing policy based on difficulty and risk.
- `src/validators.ts`: task-specific deterministic verification.
- `src/strategies/`: strongest-always and route/verify/escalate workflows.
- `src/metrics.ts`: workflow cost and success calculations.
- `src/output.ts`: readable CLI output for live presentation.

## Routing

The router intentionally stays simple:

- Low difficulty and low risk -> small model
- Medium difficulty or medium risk -> standard model
- High difficulty or high risk -> strong model

The routed strategy validates every result. If a small or standard model fails validation, it escalates exactly once to the strong model.

## Why Verification Matters

Routing only works economically if the workflow can tell whether the cheaper attempt succeeded. Validators use exact checks, required-fact checks, schema checks, and small executable checks where useful.

## Run

```bash
npm install
npm run demo
```

Presenter controls:

```bash
npm run demo -- --step
npm run demo -- --task extraction
npm run demo:fixed
npm run demo:routed
npm test
```

`--step` pauses between routed tasks and waits for Enter. `--task extraction` runs the short escalation example: the small model returns an incorrect priority, validation fails, the workflow escalates to the strong model, and both calls are included in cost.

## Expected Demo Flow

The CLI starts with:

```text
BUY INTELLIGENCE SELECTIVELY

Strategy A: Strongest model for every task
Strategy B: Route -> Verify -> Escalate
```

It first runs the strongest-model baseline, then prints a compact execution trace for intelligent routing. The final table compares tasks attempted, verified successes, model calls, escalations, total cost, cost per attempted task, and cost per successful task.

Model prices, latencies, and outcomes are illustrative and deterministic for presentation reliability.
