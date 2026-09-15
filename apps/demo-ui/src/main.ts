import { routingDemo, sendLessDemo, type DemoPanel } from "./demoData.js";
import "./styles.css";

type TabId = "send-less" | "routing";

const demos: Record<TabId, DemoPanel> = {
  "send-less": sendLessDemo,
  routing: routingDemo,
};

const tabLabels: Record<TabId, string> = {
  "send-less": "Send Less",
  routing: "Buy Selectively",
};

let activeTab: TabId = "send-less";

function app(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("App root not found");
  return root;
}

function setActiveTab(tabId: TabId): void {
  activeTab = tabId;
  render();
}

function metricRows(demo: DemoPanel): string {
  return demo.metrics
    .map(
      (metric) => `<tr>
        <th scope="row">${metric.label}</th>
        <td>${metric.baseline}</td>
        <td>${metric.optimized}</td>
        <td><span class="change">${metric.change}</span></td>
      </tr>`,
    )
    .join("");
}

function stepCards(demo: DemoPanel): string {
  return demo.steps
    .map(
      (step, index) => `<li class="step step-${step.status}">
        <span class="step-index">${index + 1}</span>
        <div>
          <strong>${step.label}</strong>
          <p>${step.detail}</p>
        </div>
      </li>`,
    )
    .join("");
}

function tabButton(tabId: TabId): string {
  const selected = tabId === activeTab;
  return `<button
    class="tab ${selected ? "tab-active" : ""}"
    type="button"
    data-tab="${tabId}"
    aria-pressed="${selected}"
  >
    ${tabLabels[tabId]}
  </button>`;
}

function attachTabHandlers(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab as TabId;
      setActiveTab(tabId);
    });
  });
}

function render(): void {
  const demo = demos[activeTab];

  app().innerHTML = `<section class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Token Economics AI</p>
        <h1>Presentation Demo Console</h1>
      </div>
      <nav class="tabs" aria-label="Demo selection">
        ${tabButton("send-less")}
        ${tabButton("routing")}
      </nav>
    </header>

    <section class="hero">
      <div>
        <p class="eyebrow">${demo.eyebrow}</p>
        <h2>${demo.title}</h2>
        <p>${demo.subtitle}</p>
      </div>
      <div class="command-block">
        <span>Run</span>
        <code>${demo.command}</code>
      </div>
    </section>

    <section class="comparison" aria-label="Comparison metrics">
      <article class="lane lane-muted">
        <span>Before</span>
        <h3>${demo.baselineLabel}</h3>
      </article>
      <article class="lane lane-accent">
        <span>After</span>
        <h3>${demo.optimizedLabel}</h3>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel metrics-panel">
        <div class="panel-heading">
          <span>Economics</span>
          <h3>What Changes</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Before</th>
              <th scope="col">After</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>${metricRows(demo)}</tbody>
        </table>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <span>Flow</span>
          <h3>Presenter Beats</h3>
        </div>
        <ol class="steps">${stepCards(demo)}</ol>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel code-panel">
        <div class="panel-heading">
          <span>Code Pointer</span>
          <h3>${demo.codePath}</h3>
        </div>
        <p>${demo.codePointer}</p>
      </article>

      <article class="takeaway">
        <span>Takeaway</span>
        <p>${demo.takeaway}</p>
      </article>
    </section>
  </section>`;

  attachTabHandlers();
}

render();
