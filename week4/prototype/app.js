const state = {
  analytics: null,
  templates: null,
};

function byId(id) { return document.getElementById(id); }

async function loadData() {
  const [analyticsRes, templatesRes] = await Promise.all([
    fetch("../../mock/post_meeting_analytics.json"),
    fetch("../../mock/report_templates.json"),
  ]);
  state.analytics = await analyticsRes.json();
  state.templates = await templatesRes.json();
}

function renderKpiCards() {
  byId("kpi-cards").innerHTML = state.analytics.kpiCards.map((k) => `
    <div class="kpi-card" data-kpi="${k.id}">
      <div>${k.label}</div>
      <div class="kpi-score">${k.score}</div>
      <div class="${k.delta >= 0 ? "delta-up" : "delta-down"}">${k.delta >= 0 ? "+" : ""}${k.delta}${k.unit}</div>
    </div>`).join("");

  document.querySelectorAll(".kpi-card").forEach((el) => {
    el.addEventListener("click", () => openDrilldown(el.dataset.kpi));
  });
}

function barRow(label, value, max = 100, cls = "") {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return `<div class="bar-row">
    <div>${label}</div>
    <div class="bar-bg"><div class="bar-fill ${cls}" style="width:${width}%"></div></div>
    <div>${value}</div>
  </div>`;
}

function renderParticipationChart() {
  const rows = state.analytics.charts.participationTrend
    .map((d) => barRow(d.meeting, d.value))
    .join("");
  byId("chart-participation").innerHTML = `<div class="bars">${rows}</div>`;
}

function renderNudgeChart() {
  const rows = state.analytics.charts.nudgeStacked
    .map((d) => `
      ${barRow(`${d.type} shown`, d.shown, 10, "info")}
      ${barRow(`${d.type} accepted`, d.accepted, 10)}
      ${barRow(`${d.type} dismissed`, d.dismissed, 10, "warn")}
    `).join("<hr/>");
  byId("chart-nudge").innerHTML = `<div class="bars">${rows}</div>`;
}

function renderGapChart() {
  const rows = state.analytics.charts.aiHumanGapDistribution
    .map((d) => `<div class="bar-row">
      <div><button class="chip gap-btn" data-cid="${d.candidateId}">${d.candidateId}</button></div>
      <div class="bar-bg"><div class="bar-fill warn" style="width:${Math.min(100, d.gap * 3)}%"></div></div>
      <div>${d.gap}</div>
    </div>`).join("");
  byId("chart-gap").innerHTML = `<div class="bars">${rows}</div>`;
  document.querySelectorAll(".gap-btn").forEach((b) => {
    b.addEventListener("click", () => {
      byId("drilldown").innerHTML = `<div>評価対象者 ${b.dataset.cid} の乖離根拠を確認: <span class="mono">final_decisions:${b.dataset.cid}</span></div>`;
    });
  });
}

function renderAuditChart() {
  const a = state.analytics.charts.auditIntegrity;
  byId("chart-audit").innerHTML = `
    <div class="bars">
      ${barRow("hashIntegrityRate", a.hashIntegrityRate)}
      ${barRow("hashWarnings", a.hashWarnings, 10, "warn")}
      ${barRow("exceptionUnlockRate", a.exceptionUnlockRate)}
      ${barRow("postFinalizeEditRate", a.postFinalizeEditRate, 20, "warn")}
    </div>`;
}

function renderInsights() {
  const i = state.analytics.insights;
  byId("insights").innerHTML = `
    <div class="report-section"><strong>強み</strong><ul>${i.strengths.map((x) => `<li>${x}</li>`).join("")}</ul></div>
    <div class="report-section"><strong>課題</strong><ul>${i.risks.map((x) => `<li>${x}</li>`).join("")}</ul></div>
    <div class="report-section"><strong>次アクション</strong><ul>${i.nextActions.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}

function openDrilldown(kpiId) {
  const refs = state.analytics.drilldownRefs[kpiId] || [];
  byId("drilldown").innerHTML = `
    <div><strong>${kpiId}</strong> の根拠参照</div>
    <ul>${refs.map((r) => `<li class="mono">${r}</li>`).join("")}</ul>`;
}

function renderReport() {
  const cards = Object.fromEntries(state.analytics.kpiCards.map((k) => [k.id, k.score]));
  const ai = state.analytics.charts.auditIntegrity;
  const t = state.templates;
  const kpiSummary = t.kpiSummaryTemplate
    .replace("{participation_equity}", cards.participation_equity)
    .replace("{nudge_effectiveness}", cards.nudge_effectiveness)
    .replace("{explainability}", cards.explainability)
    .replace("{collaboration_quality}", cards.collaboration_quality)
    .replace("{calibration_gap}", cards.calibration_gap);
  const governance = t.governanceTemplate
    .replace("{hash_integrity_rate}", ai.hashIntegrityRate)
    .replace("{exception_unlock_rate}", ai.exceptionUnlockRate);

  byId("report-content").innerHTML = `
    <div class="report-section"><strong>Executive Summary</strong><p>${t.executiveSummaryTemplate}</p></div>
    <div class="report-section"><strong>KPI Summary</strong><p>${kpiSummary}</p></div>
    <div class="report-section"><strong>Governance</strong><p>${governance}</p></div>
    <div class="report-section"><strong>Actions</strong><ul>${t.actionsTemplate.map((x) => `<li>${x}</li>`).join("")}</ul></div>
    <div class="report-section"><strong>Reference</strong><p class="mono">auto-generated from post_meeting_analytics.json + report_templates.json</p></div>`;
}

function bindEvents() {
  byId("generate-report").addEventListener("click", () => {
    renderReport();
    byId("report-panel").classList.remove("hidden");
  });
  byId("toggle-report").addEventListener("click", () => {
    byId("report-panel").classList.toggle("hidden");
  });
}

async function init() {
  try {
    await loadData();
    renderKpiCards();
    renderParticipationChart();
    renderNudgeChart();
    renderGapChart();
    renderAuditChart();
    renderInsights();
    bindEvents();
    openDrilldown("participation_equity");
  } catch (e) {
    document.body.innerHTML = `<pre>Failed to load data: ${e.message}</pre>`;
  }
}

init();
