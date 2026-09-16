import type {
  ComparisonMetric,
  PresenterStep,
  RetrievalRun,
  RoutingRunResponse,
  RoutingResponse,
  RoutingStrategy,
  RoutingTaskOption,
  RoutingTaskRun,
  SendLessResponse,
} from "./apiTypes.js";
import "./styles.css";

type TabId = "send-less" | "routing";

const tabLabels: Record<TabId, string> = {
  "send-less": "Support Agent",
  routing: "Buy Selectively",
};

const defaultSupportQuestion =
  "A production database has remained above 90% CPU for ten minutes, and replication lag is now above 30 seconds. According to the operational runbook, what should the on-call engineer do?";

type AppState = {
  activeTab: TabId;
  efficientMode: boolean;
  questionText: string;
  routingTaskId: string;
  routingStrategy: RoutingStrategy;
  sendLess?: SendLessResponse;
  routing?: RoutingResponse;
  routingRun?: RoutingRunResponse;
  loading: Partial<Record<TabId, boolean>>;
  errors: Partial<Record<TabId, string>>;
};

const state: AppState = {
  activeTab: "send-less",
  efficientMode: false,
  questionText: defaultSupportQuestion,
  routingTaskId: "extract-ticket-priority",
  routingStrategy: "routed",
  loading: {},
  errors: {},
};

let supportRequestId = 0;
let routingRequestId = 0;

function app(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("App root not found");
  return root;
}

async function loadActiveTab(): Promise<void> {
  const tabId = state.activeTab;
  if (tabId === "send-less") return;
  if (tabId === "routing" && state.routing) return;

  state.loading[tabId] = true;
  state.errors[tabId] = undefined;
  render();

  try {
    if (tabId === "routing") {
      state.routing = await fetchJson<RoutingResponse>("/api/routing");
    }
  } catch (error) {
    state.errors[tabId] = error instanceof Error ? error.message : String(error);
  } finally {
    state.loading[tabId] = false;
    render();
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(readErrorMessage(body) ?? response.statusText);
  }

  return body as T;
}

function readErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("error" in body)) {
    return undefined;
  }

  const { error } = body as { error?: unknown };
  return typeof error === "string" ? error : undefined;
}

function setActiveTab(tabId: TabId): void {
  state.activeTab = tabId;
  render();
  loadActiveTab().catch((error: unknown) => {
    state.errors[tabId] = error instanceof Error ? error.message : String(error);
    render();
  });
}

function setEfficientMode(enabled: boolean): void {
  supportRequestId += 1;
  state.efficientMode = enabled;
  state.sendLess = undefined;
  state.errors["send-less"] = undefined;
  state.loading["send-less"] = false;
  render();
}

function setQuestionText(question: string): void {
  state.questionText = question;
}

function setRoutingTask(taskId: string): void {
  routingRequestId += 1;
  state.routingTaskId = taskId;
  state.routingRun = undefined;
  state.errors.routing = undefined;
  state.loading.routing = false;
  render();
}

function setRoutingStrategy(strategy: RoutingStrategy): void {
  routingRequestId += 1;
  state.routingStrategy = strategy;
  state.routingRun = undefined;
  state.errors.routing = undefined;
  state.loading.routing = false;
  render();
}

async function sendSupportQuestion(): Promise<void> {
  const question = state.questionText.trim();
  if (!question) {
    state.errors["send-less"] = "Question must not be empty.";
    render();
    return;
  }

  supportRequestId += 1;
  const requestId = supportRequestId;
  state.loading["send-less"] = true;
  state.errors["send-less"] = undefined;
  render();

  try {
    const response = await fetchJson<SendLessResponse>("/api/send-less", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (requestId !== supportRequestId) return;

    state.sendLess = response;
    state.questionText = state.sendLess.question;
  } catch (error) {
    if (requestId !== supportRequestId) return;

    state.errors["send-less"] =
      error instanceof Error ? error.message : String(error);
  } finally {
    if (requestId === supportRequestId) {
      state.loading["send-less"] = false;
      render();
    }
  }
}

async function runSelectedRoutingTask(): Promise<void> {
  if (!state.routingTaskId) {
    state.errors.routing = "Choose a task before running the demo.";
    render();
    return;
  }

  routingRequestId += 1;
  const requestId = routingRequestId;
  state.loading.routing = true;
  state.errors.routing = undefined;
  render();

  try {
    const response = await fetchJson<RoutingRunResponse>("/api/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: state.routingTaskId,
        strategy: state.routingStrategy,
      }),
    });
    if (requestId !== routingRequestId) return;

    state.routingRun = response;
  } catch (error) {
    if (requestId !== routingRequestId) return;

    state.errors.routing = error instanceof Error ? error.message : String(error);
  } finally {
    if (requestId === routingRequestId) {
      state.loading.routing = false;
      render();
    }
  }
}

function metricRows(metrics: ComparisonMetric[]): string {
  return metrics
    .map(
      (metric) => `<tr>
        <th scope="row">${escapeHtml(metric.label)}</th>
        <td>${escapeHtml(metric.baseline)}</td>
        <td>${escapeHtml(metric.optimized)}</td>
        <td><span class="change">${escapeHtml(metric.change)}</span></td>
      </tr>`,
    )
    .join("");
}

function stepCards(steps: PresenterStep[]): string {
  return steps
    .map(
      (step, index) => `<li class="step step-${step.status}">
        <span class="step-index">${index + 1}</span>
        <div>
          <strong>${escapeHtml(step.label)}</strong>
          <p>${escapeHtml(step.detail)}</p>
        </div>
      </li>`,
    )
    .join("");
}

function tabButton(tabId: TabId): string {
  const selected = tabId === state.activeTab;
  return `<button
    class="tab ${selected ? "tab-active" : ""}"
    type="button"
    data-tab="${tabId}"
    aria-pressed="${selected}"
  >
    ${tabLabels[tabId]}
  </button>`;
}

function renderStatus(tabId: TabId): string {
  const error = state.errors[tabId];
  if (error) {
    return `<section class="notice notice-error">
      <strong>Could not run demo</strong>
      <p>${escapeHtml(error)}</p>
    </section>`;
  }

  if (state.loading[tabId]) {
    return `<section class="notice">
      <strong>Running the real demo code...</strong>
      <p>The browser is waiting for the local Express API.</p>
    </section>`;
  }

  return "";
}

function renderInlineStatus(tabId: TabId): string {
  const error = state.errors[tabId];
  if (error) {
    return `<section class="notice notice-error notice-inline">
      <strong>Could not run demo</strong>
      <p>${escapeHtml(error)}</p>
    </section>`;
  }

  if (state.loading[tabId]) {
    return `<section class="notice notice-inline">
      <strong>Running the real demo code...</strong>
      <p>The browser is waiting for the local Express API.</p>
    </section>`;
  }

  return "";
}

function renderShell(content: string): void {
  app().innerHTML = `<section class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Token Economics AI</p>
        <h1>Live Demo Console</h1>
      </div>
      <nav class="tabs" aria-label="Demo selection">
        ${tabButton("send-less")}
        ${tabButton("routing")}
      </nav>
    </header>
    ${content}
  </section>`;

  attachHandlers();
}

function renderSendLess(data?: SendLessResponse): string {
  let run: RetrievalRun | undefined;
  if (data) {
    run = state.efficientMode ? data.optimized : data.baseline;
  }
  const modeLabel = state.efficientMode
    ? "Efficient retrieval"
    : "Baseline retrieval";
  const status = renderInlineStatus("send-less");

  return `<section class="agent-layout">
    <section class="agent-panel">
      <div class="agent-header">
        <div>
          <p class="eyebrow">Technical Support Agent</p>
          <h2>Production Database Triage</h2>
          <p>The same support question is answered by the same demo code. The checkbox changes the retrieval strategy.</p>
        </div>
        <label class="toggle">
          <input type="checkbox" id="efficient-mode" ${state.efficientMode ? "checked" : ""} />
          <span>Efficient mode</span>
        </label>
      </div>

      <article class="message message-user">
        <form class="question-form" id="question-form">
          <label for="support-question">Support question</label>
          <textarea id="support-question" rows="4">${escapeHtml(state.questionText)}</textarea>
          <div class="question-actions">
            <span>POST /api/send-less</span>
            <button type="submit">${state.loading["send-less"] ? "Sending..." : "Send"}</button>
          </div>
        </form>
      </article>

      ${status}

      ${run && data ? `<article class="message message-agent">
        <div class="message-title">
          <span>${modeLabel}</span>
          <strong>${run.success ? "Verified answer" : "Needs review"}</strong>
        </div>
        <small>Answered question: ${escapeHtml(data.question)}</small>
        <p>${escapeHtml(run.answer)}</p>
      </article>` : `<article class="message message-agent message-empty">
        <div class="message-title">
          <span>No server response yet</span>
          <strong>Waiting for Send</strong>
        </div>
        <p>Press Send to call the local Express API and run the retrieval demo against this question.</p>
      </article>`}
    </section>

    <aside class="run-panel">
      ${run ? `<div class="panel-heading">
        <span>Live run</span>
        <h3>${modeLabel}</h3>
      </div>
      ${runStats(run)}
      <div class="mini-section">
        <span>Retrieved documents</span>
        <ol>${run.retrievedTitles
          .map(
            (title, index) => `<li>
              <strong>${escapeHtml(title)}</strong>
              <p>${escapeHtml(run.retrievedReasons[index] ?? "")}</p>
            </li>`,
          )
          .join("")}</ol>
      </div>` : `<div class="panel-heading">
        <span>Live run</span>
        <h3>Ready</h3>
      </div>
      <div class="empty-run">
        <strong>No retrieval has run yet.</strong>
        <p>The metrics and retrieved documents will appear here after Send.</p>
      </div>`}
    </aside>

    ${run ? `<section class="panel context-panel">
      <div class="panel-heading">
        <span>Context sent to model</span>
        <h3>${state.efficientMode ? "Relevant passages" : "Full records and payloads"}</h3>
      </div>
      <pre>${escapeHtml(run.contextPreview)}</pre>
    </section>` : ""}

    ${data ? `<section class="content-grid">
      <article class="panel metrics-panel">
        <div class="panel-heading">
          <span>Economics</span>
          <h3>Baseline vs Efficient Mode</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">${escapeHtml(data.baselineLabel)}</th>
              <th scope="col">${escapeHtml(data.optimizedLabel)}</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>${metricRows(data.metrics)}</tbody>
        </table>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <span>Flow</span>
          <h3>What Efficient Mode Does</h3>
        </div>
        <ol class="steps">${stepCards(data.steps)}</ol>
      </article>
    </section>` : ""}

    ${data ? renderTakeaway(data.takeaway) : ""}
  </section>`;
}

function renderRouting(data: RoutingResponse): string {
  const status = renderInlineStatus("routing");
  const selectedTask =
    data.tasks.find((task) => task.id === state.routingTaskId) ?? data.tasks[0];
  const run = state.routingRun;

  return `<section class="agent-layout routing-layout">
    <section class="agent-panel">
      <div class="agent-header">
        <div>
          <p class="eyebrow">Model Routing Workbench</p>
          <h2>Buy Intelligence Selectively</h2>
          <p>Pick one task, choose a buying strategy, then run the real TypeScript routing workflow.</p>
        </div>
      </div>

      <form class="routing-form" id="routing-form">
        <div class="mini-section">
          <span>Strategy</span>
          <div class="strategy-grid">
            ${strategyOption(
              "strongest",
              "Strongest always",
              "Send every task directly to the premium model.",
            )}
            ${strategyOption(
              "routed",
              "Route, verify, escalate",
              "Start cheaper when risk allows, then validate.",
            )}
          </div>
        </div>

        <div class="mini-section">
          <span>Task inbox</span>
          <div class="task-list">${taskCards(data.tasks)}</div>
        </div>

        <div class="question-actions routing-actions">
          <span>POST /api/routing</span>
          <button type="submit">${state.loading.routing ? "Running..." : "Run"}</button>
        </div>
      </form>

      ${status}

      ${run ? `<article class="message message-agent">
        <div class="message-title">
          <span>${escapeHtml(run.strategyLabel)}</span>
          <strong>${run.run.success ? "Verified success" : "Needs review"}</strong>
        </div>
        <small>${escapeHtml(run.task.label)} · ${escapeHtml(run.task.type)}</small>
        ${routingTrace(run.run)}
      </article>` : `<article class="message message-agent message-empty">
        <div class="message-title">
          <span>No routing run yet</span>
          <strong>Waiting for Run</strong>
        </div>
        <p>Choose a task and strategy, then press Run to call the local Express API.</p>
      </article>`}
    </section>

    <aside class="run-panel">
      ${run ? `<div class="panel-heading">
        <span>Live run</span>
        <h3>${escapeHtml(run.strategyLabel)}</h3>
      </div>
      ${routingRunStats(run)}
      <div class="mini-section">
        <span>Selected task</span>
        <div class="empty-run">
          <strong>${escapeHtml(run.task.label)}</strong>
          <p>${escapeHtml(run.task.input)}</p>
        </div>
      </div>` : `<div class="panel-heading">
        <span>Ready</span>
        <h3>${escapeHtml(selectedTask?.label ?? "Choose a task")}</h3>
      </div>
      <div class="empty-run">
        <strong>No model call has run yet.</strong>
        <p>${escapeHtml(selectedTask?.input ?? "Select a task from the inbox.")}</p>
      </div>`}
    </aside>

    ${run ? `<section class="content-grid routing-results">
      <article class="panel">
        <div class="panel-heading">
          <span>Flow</span>
          <h3>What Happened</h3>
        </div>
        <ol class="steps">${stepCards(run.steps)}</ol>
      </article>

      <article class="panel metrics-panel">
        <div class="panel-heading">
          <span>Reference</span>
          <h3>Full Demo Comparison</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">${escapeHtml(data.baselineLabel)}</th>
              <th scope="col">${escapeHtml(data.optimizedLabel)}</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>${metricRows(data.metrics)}</tbody>
        </table>
      </article>
    </section>

    ${renderTakeaway(run.takeaway)}` : ""}
  </section>`;
}

function runStats(run: RetrievalRun): string {
  const stats = [
    ["Retrieved chunks", String(run.retrievedCount)],
    ["Input tokens", formatNumber(run.inputTokens)],
    ["Estimated cost", formatCurrency(run.estimatedCost)],
    ["Latency", `${formatNumber(run.latencyMs)} ms`],
    ["Success", run.success ? "PASS" : "FAIL"],
  ];

  return `<dl class="stats">${stats
    .map(
      ([label, value]) => `<div>
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>`,
    )
    .join("")}</dl>`;
}

function strategyOption(
  strategy: RoutingStrategy,
  label: string,
  detail: string,
): string {
  const selected = strategy === state.routingStrategy;
  return `<label class="strategy-option ${selected ? "strategy-selected" : ""}">
    <input
      type="radio"
      name="routing-strategy"
      value="${strategy}"
      ${selected ? "checked" : ""}
    />
    <strong>${escapeHtml(label)}</strong>
    <span>${escapeHtml(detail)}</span>
  </label>`;
}

function taskCards(tasks: RoutingTaskOption[]): string {
  return tasks
    .map((task) => {
      const selected = task.id === state.routingTaskId;
      return `<label class="task-card ${selected ? "task-selected" : ""}">
        <input
          type="radio"
          name="routing-task"
          value="${escapeHtml(task.id)}"
          ${selected ? "checked" : ""}
        />
        <span>${escapeHtml(task.type.replace(/_/g, " "))}</span>
        <strong>${escapeHtml(task.label)}</strong>
        <p>${escapeHtml(task.input)}</p>
        <div class="task-meta">
          <em>Difficulty: ${escapeHtml(task.difficulty)}</em>
          <em>Risk: ${escapeHtml(task.risk)}</em>
        </div>
      </label>`;
    })
    .join("");
}

function routingRunStats(data: RoutingRunResponse): string {
  const rows = [
    ["Model calls", String(data.summary.modelCalls)],
    ["Escalations", String(data.summary.escalations)],
    ["Total cost", formatCurrency(data.summary.totalCost)],
    ["Cost per success", formatCurrency(data.summary.costPerSuccessfulTask)],
    ["Final status", data.run.success ? "PASS" : "FAIL"],
  ];

  return `<dl class="stats">${rows
    .map(
      ([label, value]) => `<div>
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>`,
    )
    .join("")}</dl>`;
}

function routingTrace(run: RoutingTaskRun): string {
  return `<ol class="attempts">${run.attempts
    .map(
      (attempt, index) => `<li>
        <span class="attempt-index">${index + 1}</span>
        <div>
          <strong>${escapeHtml(attempt.modelName)}</strong>
          <p>${attempt.validationPassed ? "PASS" : "FAIL"} - ${escapeHtml(attempt.validationReason)} · ${formatCurrency(attempt.cost)}</p>
          <code>${escapeHtml(JSON.stringify(attempt.output))}</code>
        </div>
      </li>`,
    )
    .join("")}</ol>`;
}

function renderTakeaway(takeaway: string): string {
  return `<section class="bottom-grid single-takeaway">
    <article class="takeaway">
      <span>Takeaway</span>
      <p>${escapeHtml(takeaway)}</p>
    </article>
  </section>`;
}

function render(): void {
  const tabId = state.activeTab;

  if (tabId === "send-less") {
    renderShell(renderSendLess(state.sendLess));
    return;
  }

  if (tabId === "routing" && state.routing) {
    renderShell(renderRouting(state.routing));
    return;
  }

  const status = renderStatus(tabId);

  if (status) {
    renderShell(status);
    return;
  }

  renderShell(renderStatus(tabId));
}

function attachHandlers(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab as TabId;
      setActiveTab(tabId);
    });
  });

  document
    .querySelector<HTMLInputElement>("#efficient-mode")
    ?.addEventListener("change", (event) => {
      setEfficientMode((event.currentTarget as HTMLInputElement).checked);
    });

  document
    .querySelector<HTMLTextAreaElement>("#support-question")
    ?.addEventListener("input", (event) => {
      setQuestionText((event.currentTarget as HTMLTextAreaElement).value);
    });

  document
    .querySelector<HTMLFormElement>("#question-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      sendSupportQuestion().catch((error: unknown) => {
        state.errors["send-less"] =
          error instanceof Error ? error.message : String(error);
        render();
      });
    });

  document
    .querySelectorAll<HTMLInputElement>('input[name="routing-strategy"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        setRoutingStrategy(input.value as RoutingStrategy);
      });
    });

  document
    .querySelectorAll<HTMLInputElement>('input[name="routing-task"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        setRoutingTask(input.value);
      });
    });

  document
    .querySelector<HTMLFormElement>("#routing-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      runSelectedRoutingTask().catch((error: unknown) => {
        state.errors.routing =
          error instanceof Error ? error.message : String(error);
        render();
      });
    });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(6)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

render();
loadActiveTab().catch((error: unknown) => {
  state.errors[state.activeTab] =
    error instanceof Error ? error.message : String(error);
  render();
});
