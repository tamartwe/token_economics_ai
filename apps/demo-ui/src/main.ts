import type {
  ComparisonMetric,
  PresenterStep,
  RetrievalRun,
  RoutingResponse,
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
  sendLess?: SendLessResponse;
  routing?: RoutingResponse;
  loading: Partial<Record<TabId, boolean>>;
  errors: Partial<Record<TabId, string>>;
};

const state: AppState = {
  activeTab: "send-less",
  efficientMode: false,
  questionText: defaultSupportQuestion,
  loading: {},
  errors: {},
};

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
  state.efficientMode = enabled;
  render();
}

function setQuestionText(question: string): void {
  state.questionText = question;
}

async function sendSupportQuestion(): Promise<void> {
  const question = state.questionText.trim();
  if (!question) {
    state.errors["send-less"] = "Question must not be empty.";
    render();
    return;
  }

  state.loading["send-less"] = true;
  state.errors["send-less"] = undefined;
  render();

  try {
    state.sendLess = await fetchJson<SendLessResponse>("/api/send-less", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    state.questionText = state.sendLess.question;
  } catch (error) {
    state.errors["send-less"] =
      error instanceof Error ? error.message : String(error);
  } finally {
    state.loading["send-less"] = false;
    render();
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

    ${data ? renderCodeAndTakeaway(data.codePath, data.codePointer, data.takeaway) : ""}
  </section>`;
}

function renderRouting(data: RoutingResponse): string {
  return `<section>
    <section class="hero">
      <div>
        <p class="eyebrow">Demo 2</p>
        <h2>Buy Intelligence Selectively</h2>
        <p>Same task set. Different model-buying strategies. Verified outcomes from the real routing demo.</p>
      </div>
      <div class="command-block">
        <span>Run</span>
        <code>${escapeHtml(data.command)}</code>
      </div>
    </section>

    <section class="comparison" aria-label="Comparison metrics">
      <article class="lane lane-muted">
        <span>Before</span>
        <h3>${escapeHtml(data.baselineLabel)}</h3>
      </article>
      <article class="lane lane-accent">
        <span>After</span>
        <h3>${escapeHtml(data.optimizedLabel)}</h3>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel metrics-panel">
        <div class="panel-heading">
          <span>Economics</span>
          <h3>Real Strategy Results</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Strongest</th>
              <th scope="col">Routed</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>${metricRows(data.metrics)}</tbody>
        </table>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <span>Escalation trace</span>
          <h3>${escapeHtml(data.highlightedRun.taskLabel)}</h3>
        </div>
        ${routingTrace(data.highlightedRun)}
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel">
        <div class="panel-heading">
          <span>Flow</span>
          <h3>Presenter Beats</h3>
        </div>
        <ol class="steps">${stepCards(data.steps)}</ol>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <span>Summary</span>
          <h3>Routed workflow</h3>
        </div>
        ${summaryStats(data)}
      </article>
    </section>

    ${renderCodeAndTakeaway(data.codePath, data.codePointer, data.takeaway)}
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

function routingTrace(run: RoutingTaskRun): string {
  return `<ol class="attempts">${run.attempts
    .map(
      (attempt, index) => `<li>
        <span class="attempt-index">${index + 1}</span>
        <div>
          <strong>${escapeHtml(attempt.modelName)}</strong>
          <p>${attempt.validationPassed ? "PASS" : "FAIL"} - ${escapeHtml(attempt.validationReason)}</p>
          <code>${escapeHtml(JSON.stringify(attempt.output))}</code>
        </div>
      </li>`,
    )
    .join("")}</ol>`;
}

function summaryStats(data: RoutingResponse): string {
  const rows = [
    ["Verified successes", String(data.routedSummary.successfulTasks)],
    ["Model calls", String(data.routedSummary.modelCalls)],
    ["Escalations", String(data.routedSummary.escalations)],
    ["Total cost", formatCurrency(data.routedSummary.totalCost)],
    ["Cost per success", formatCurrency(data.routedSummary.costPerSuccessfulTask)],
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

function renderCodeAndTakeaway(
  codePath: string,
  codePointer: string,
  takeaway: string,
): string {
  return `<section class="bottom-grid">
    <article class="panel code-panel">
      <div class="panel-heading">
        <span>Code Pointer</span>
        <h3>${escapeHtml(codePath)}</h3>
      </div>
      <p>${escapeHtml(codePointer)}</p>
    </article>

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

  const status = renderStatus(tabId);

  if (status) {
    renderShell(status);
    return;
  }

  if (tabId === "routing" && state.routing) {
    renderShell(renderRouting(state.routing));
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
