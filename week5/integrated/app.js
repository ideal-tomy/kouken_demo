const integratedState = {
  masterData: {
    candidates: [],
    p0Records: [],
    evidenceCatalog: [],
    meetingScenarios: [],
    nudgeRules: null,
    finalDecisionRecords: [],
    auditSeedEvents: [],
    analyticsSeed: null,
    reportTemplates: null,
  },
  session: {
    selectedCandidateId: null,
    currentPhase: "PreCheck",
    activeTab: "meeting",
    lastActionAt: null,
  },
  meeting: {
    eventLog: [],
    nudgeLog: [],
    speakerDurations: {},
    timeline: [],
  },
  decision: {
    unlockApproved: false,
  },
  audit: {
    events: [],
  },
  analytics: {
    snapshot: null,
    generatedReport: null,
  },
  ui: {
    drilldownTarget: "participation_equity",
  },
};

function byId(id) { return document.getElementById(id); }

function simpleHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return `H-${h.toString(16).toUpperCase()}`;
}

function calcRecordHash(r) {
  const tags = (r.contextTags || []).join("|");
  const raw = `${r.candidateId}|${r.humanOutcome}|${r.deltaReason}|${tags}|${r.lockVersion}`;
  return simpleHash(raw);
}

async function loadData() {
  const [
    candidateRes, p0Res, evidenceRes, meetingRes, nudgeRes,
    finalRes, auditRes, analyticsRes, templateRes, criteriaRes,
  ] = await Promise.all([
    fetch("../../mock/candidate_index.json"),
    fetch("../../mock/ai_first_pass.json"),
    fetch("../../mock/evidence_catalog.json"),
    fetch("../../mock/meeting_transcript.json"),
    fetch("../../mock/nudge_rules.json"),
    fetch("../../mock/final_decisions.json"),
    fetch("../../mock/audit_log.json"),
    fetch("../../mock/post_meeting_analytics.json"),
    fetch("../../mock/report_templates.json"),
    fetch("../../AI判定基準_仮.md"),
  ]);
  integratedState.masterData.candidates = (await candidateRes.json()).candidates;
  integratedState.masterData.p0Records = (await p0Res.json()).records;
  integratedState.masterData.evidenceCatalog = (await evidenceRes.json()).evidence;
  integratedState.masterData.meetingScenarios = (await meetingRes.json()).scenarios;
  integratedState.masterData.nudgeRules = (await nudgeRes.json()).thresholds;
  integratedState.masterData.finalDecisionRecords = (await finalRes.json()).records;
  integratedState.masterData.auditSeedEvents = (await auditRes.json()).events;
  integratedState.masterData.analyticsSeed = await analyticsRes.json();
  integratedState.masterData.reportTemplates = await templateRes.json();
  integratedState.audit.events = structuredClone(integratedState.masterData.auditSeedEvents);
  integratedState.criteriaMd = await criteriaRes.text();
}

function dispatchEvent(type, payload = {}) {
  integratedState.session.lastActionAt = new Date().toISOString();
  if (type === "candidate_selected") integratedState.session.currentPhase = "PreCheck";
  if (type === "meeting_started") integratedState.session.currentPhase = "MeetingLive";
  if (type === "finalize" || type === "unlock_request" || type === "unlock_approved" || type === "edit_after_unlock") {
    integratedState.session.currentPhase = "FinalizeLock";
  }
  if (type === "analytics_recomputed") integratedState.session.currentPhase = "PostAnalytics";
  if (type === "report_generated") integratedState.session.currentPhase = "AutoReport";
  integratedState.meeting.eventLog.push({ type, payload, at: integratedState.session.lastActionAt });
  if (integratedState.meeting.eventLog.length > 120) integratedState.meeting.eventLog.shift();
  renderPhaseStepper();
  renderEventLog();
}

function currentCandidate() {
  return integratedState.masterData.candidates.find((c) => c.candidateId === integratedState.session.selectedCandidateId);
}
function currentP0() {
  return integratedState.masterData.p0Records.find((r) => r.candidateId === integratedState.session.selectedCandidateId);
}
function currentRecord() {
  return integratedState.masterData.finalDecisionRecords.find((r) => r.candidateId === integratedState.session.selectedCandidateId);
}

function renderPhaseStepper() {
  const phases = ["PreCheck", "MeetingLive", "FinalizeLock", "PostAnalytics", "AutoReport"];
  byId("phase-stepper").innerHTML = phases.map((p) => `<div class="phase-item ${integratedState.session.currentPhase === p ? "active" : ""}">${p}</div>`).join("");
}

function renderCandidateSelect() {
  const sel = byId("candidate-select");
  sel.innerHTML = integratedState.masterData.candidates.map((c) => `<option value="${c.candidateId}">${c.candidateId} ${c.name}</option>`).join("");
  integratedState.session.selectedCandidateId = integratedState.masterData.candidates[0]?.candidateId || null;
  sel.value = integratedState.session.selectedCandidateId;
}

function renderScenarioSelect() {
  byId("scenario-select").innerHTML = integratedState.masterData.meetingScenarios
    .map((s) => `<option value="${s.scenarioId}">${s.scenarioId}: ${s.name}</option>`)
    .join("");
}

function renderSidePanel() {
  const c = currentCandidate();
  const p0 = currentP0();
  const r = currentRecord();
  if (!c || !p0 || !r) return;

  byId("candidate-summary").innerHTML = `
    <div><strong>${c.name}</strong> (${c.candidateId})</div>
    <div class="muted">${c.division} / ${c.grade}</div>
    <div class="chip">${p0.recommendedOutcome}</div>
    <div class="chip">confidence ${p0.confidenceScore}</div>
    <div class="chip">lockVersion ${r.lockVersion}</div>`;

  const alerts = [];
  if (r.finalizedFlag) alerts.push("確定済み（通常編集不可）");
  if (integratedState.decision.unlockApproved) alerts.push("例外解除承認中（セッション限定）");
  const expected = calcRecordHash(r);
  if (r.recordHash !== expected) alerts.push("hash warning: 整合性要確認");
  byId("alert-list").innerHTML = alerts.length ? alerts.map((a) => `<div class="chip">${a}</div>`).join("") : "<div class='muted'>重大アラートなし</div>";

  byId("next-actions").innerHTML = `
    <ul>
      <li>会議では未発言者率が高い区間を優先議題化</li>
      <li>乖離大ケースは判定理由をテンプレ化</li>
      <li>解除申請理由のカテゴリを標準化</li>
    </ul>`;
}

function resetMeetingPanel() {
  integratedState.meeting.nudgeLog = [];
  integratedState.meeting.speakerDurations = {};
  integratedState.meeting.timeline = [];
  byId("timeline").innerHTML = "";
  byId("nudge-panel").innerHTML = "<span class='muted'>ナッジ待機中</span>";
  byId("agenda-progress").textContent = "-";
  byId("speaker-balance").textContent = "-";
  byId("silence-ratio").textContent = "-";
}

function appendAudit(eventType, reason, beforeSnapshot, afterSnapshot, actorId = "demo_user") {
  integratedState.audit.events.push({
    eventType,
    actorId,
    eventAt: new Date().toISOString(),
    candidateId: integratedState.session.selectedCandidateId,
    reason,
    beforeSnapshot,
    afterSnapshot,
  });
}

function updateMeetingMetrics(utterance, totalSpeakers) {
  const s = integratedState.meeting.speakerDurations;
  s[utterance.speakerId] = (s[utterance.speakerId] || 0) + utterance.durationSec;
  const durations = Object.values(s).sort((a, b) => b - a);
  const total = durations.reduce((a, b) => a + b, 0) || 1;
  const top3 = durations.slice(0, 3).reduce((a, b) => a + b, 0);
  const top3Ratio = top3 / total;
  const silenceCount = Math.max(0, totalSpeakers - Object.keys(s).length);
  const silenceRatio = silenceCount / totalSpeakers;
  byId("speaker-balance").textContent = `Top3発言比率: ${(top3Ratio * 100).toFixed(1)}%`;
  byId("silence-ratio").textContent = `未発言者率: ${(silenceRatio * 100).toFixed(1)}%`;
  dispatchEvent("speaker_turn_changed", { speakerId: utterance.speakerId, sec: utterance.durationSec });
  return { top3Ratio, silenceRatio };
}

function renderNudge(type, reasonText, sec) {
  byId("nudge-panel").innerHTML = `
    <div>
      <div><strong>${type} nudge</strong></div>
      <div class="muted">${reasonText}</div>
      <button id="accept-nudge">採用</button>
      <button id="dismiss-nudge">見送り</button>
    </div>`;
  dispatchEvent("nudge_shown", { type, reasonText, sec });
  integratedState.meeting.nudgeLog.push({ type, decision: "shown", sec });
  byId("accept-nudge").addEventListener("click", () => {
    integratedState.meeting.nudgeLog.push({ type, decision: "accepted", sec });
    dispatchEvent("nudge_accepted", { type, sec });
    byId("nudge-panel").innerHTML = "<span class='chip'>採用済み</span>";
  });
  byId("dismiss-nudge").addEventListener("click", () => {
    integratedState.meeting.nudgeLog.push({ type, decision: "dismissed", sec });
    dispatchEvent("nudge_dismissed", { type, sec });
    byId("nudge-panel").innerHTML = "<span class='chip'>見送り</span>";
  });
}

function maybeNudge(scenario, utterance, metrics, lastNudgeSecRef) {
  const t = integratedState.masterData.nudgeRules;
  if (utterance.startedAtSec - lastNudgeSecRef.value < t.nudgeCooldownSec) return;
  const agreeCount = scenario.utterances.filter((x) => x.seq <= utterance.seq && x.stance === "agree").length;
  const altCount = scenario.utterances.filter((x) => x.seq <= utterance.seq && x.stance === "alternative").length;
  if (metrics.top3Ratio > t.dominanceTop3Ratio) {
    renderNudge("participation", `Top3比率 ${(metrics.top3Ratio * 100).toFixed(1)}%`, utterance.startedAtSec);
    lastNudgeSecRef.value = utterance.startedAtSec;
    return;
  }
  if (metrics.silenceRatio > t.silenceParticipantRatio) {
    renderNudge("participation", `未発言者率 ${(metrics.silenceRatio * 100).toFixed(1)}%`, utterance.startedAtSec);
    lastNudgeSecRef.value = utterance.startedAtSec;
    return;
  }
  if (altCount < t.alternativeViewMinCount && agreeCount >= 3) {
    renderNudge("diversity", `agree:${agreeCount}/alternative:${altCount}`, utterance.startedAtSec);
    lastNudgeSecRef.value = utterance.startedAtSec;
  }
}

function runScenario() {
  resetMeetingPanel();
  const scenarioId = byId("scenario-select").value;
  const scenario = integratedState.masterData.meetingScenarios.find((s) => s.scenarioId === scenarioId);
  if (!scenario) return;
  dispatchEvent("meeting_started", { scenarioId });
  byId("agenda-progress").textContent = `${scenario.name} / 議題 ${scenario.agenda.length}件`;
  const speakers = [...new Set(scenario.utterances.map((u) => u.speakerId))].length;
  const timeline = byId("timeline");
  const lastNudgeSecRef = { value: -999 };
  scenario.utterances.forEach((u) => {
    const row = document.createElement("div");
    row.className = "log-line";
    row.innerHTML = `<strong>#${u.seq} ${u.speakerName}</strong> <span class="chip">${u.stance}</span><div class="muted">${u.content}</div>`;
    timeline.appendChild(row);
    const metrics = updateMeetingMetrics(u, speakers);
    maybeNudge(scenario, u, metrics, lastNudgeSecRef);
  });
  recomputeAnalytics();
}

function renderFinalizePanel() {
  const r = currentRecord();
  if (!r) return;
  byId("ai-human-summary").innerHTML = `
    <div>AI案: <strong>${r.aiOutcome}</strong></div>
    <div>Human現値: <strong>${r.humanOutcome}</strong></div>
    <div>lockVersion: ${r.lockVersion}</div>`;
  byId("human-outcome").value = r.humanOutcome;
  byId("delta-reason").value = r.deltaReason || "";
  byId("context-tags").value = (r.contextTags || []).join(",");
  byId("finalize-status").textContent = r.finalizedFlag ? `Finalized by ${r.finalizedBy} at ${r.finalizedAt}` : "未確定";
  byId("lock-state").textContent = r.finalizedFlag ? "LOCKED" : "UNLOCKED";
  byId("request-unlock").disabled = !r.finalizedFlag;

  const readOnly = r.finalizedFlag && !integratedState.decision.unlockApproved;
  ["human-outcome", "delta-reason", "context-tags", "decider"].forEach((id) => { byId(id).disabled = readOnly; });
  byId("finalize").disabled = readOnly;

  const expected = calcRecordHash(r);
  const ok = expected === r.recordHash;
  byId("hash-status").innerHTML = `<div>recordHash: <code>${r.recordHash}</code></div><div>expected: <code>${expected}</code></div><div>${ok ? "整合性OK" : "整合性Warning"}</div>`;
  byId("tamper-banner").classList.toggle("hidden", ok);
  const history = integratedState.audit.events.filter((a) => a.candidateId === r.candidateId);
  byId("audit-log").innerHTML = history.map((h) => `<div class="log-line"><div>${h.eventType} / ${h.eventAt}</div><div class="muted">${h.reason}</div></div>`).join("");
}

function finalizeOrEdit() {
  const r = currentRecord();
  if (!r) return;
  const reason = byId("delta-reason").value.trim();
  const decider = byId("decider").value.trim() || "chair_01";
  if (!reason) {
    alert("差分理由は必須です。");
    return;
  }
  const before = structuredClone(r);
  r.humanOutcome = byId("human-outcome").value;
  r.deltaReason = reason;
  r.contextTags = byId("context-tags").value.split(",").map((x) => x.trim()).filter(Boolean);
  r.lockVersion += 1;
  r.recordHash = calcRecordHash(r);
  r.finalizedFlag = true;
  r.finalizedAt = new Date().toISOString();
  r.finalizedBy = decider;
  if (integratedState.decision.unlockApproved) {
    appendAudit("edit_after_unlock", "例外解除後編集", before, structuredClone(r), decider);
    dispatchEvent("edit_after_unlock", { candidateId: r.candidateId });
    integratedState.decision.unlockApproved = false;
  } else {
    appendAudit("finalize", "最終評価確定", before, structuredClone(r), decider);
    dispatchEvent("finalize", { candidateId: r.candidateId });
  }
  recomputeAnalytics();
  renderFinalizePanel();
  renderSidePanel();
}

function requestUnlock() {
  const r = currentRecord();
  if (!r) return;
  byId("unlock-form").classList.remove("hidden");
  appendAudit("unlock_request", "例外解除申請", structuredClone(r), structuredClone(r), "demo_user");
  dispatchEvent("unlock_request", { candidateId: r.candidateId });
}

function approveUnlock() {
  const reason = byId("unlock-reason").value.trim();
  const impact = byId("unlock-impact").value.trim();
  const approver = byId("unlock-approver").value.trim();
  if (!reason || !impact || !approver) {
    alert("解除理由・影響範囲・承認者は必須です。");
    return;
  }
  const r = currentRecord();
  const before = structuredClone(r);
  r.unlockRequest = { reason, impact, approver, approvedAt: new Date().toISOString() };
  appendAudit("unlock_approved", reason, before, structuredClone(r), approver);
  integratedState.decision.unlockApproved = true;
  dispatchEvent("unlock_approved", { candidateId: r.candidateId });
  renderFinalizePanel();
  renderSidePanel();
}

function recomputeAnalytics() {
  const base = structuredClone(integratedState.masterData.analyticsSeed);
  const records = integratedState.masterData.finalDecisionRecords;
  const explainability = Math.round((records.filter((r) => (r.deltaReason || "").length >= 10).length / Math.max(records.length, 1)) * 100);
  const gaps = records.map((r) => {
    if (r.aiOutcome === r.humanOutcome) return 0;
    return 20;
  });
  const avgGap = gaps.reduce((a, b) => a + b, 0) / Math.max(gaps.length, 1);
  const calibrationGap = Math.max(0, Math.round(100 - avgGap));

  const accepted = integratedState.meeting.nudgeLog.filter((x) => x.decision === "accepted").length;
  const shown = integratedState.meeting.nudgeLog.filter((x) => x.decision === "shown").length;
  const nudgeEffectiveness = shown ? Math.round((accepted / shown) * 100) : base.kpiCards.find((k) => k.id === "nudge_effectiveness").score;

  const top3Text = byId("speaker-balance").textContent || "";
  const top3Ratio = Number((top3Text.match(/([\d.]+)%/) || [null, "50"])[1]);
  const participationEquity = Math.max(0, Math.round(100 - Math.max(0, top3Ratio - 50)));

  base.kpiCards = base.kpiCards.map((k) => {
    if (k.id === "explainability") return { ...k, score: explainability };
    if (k.id === "calibration_gap") return { ...k, score: calibrationGap };
    if (k.id === "nudge_effectiveness") return { ...k, score: nudgeEffectiveness };
    if (k.id === "participation_equity") return { ...k, score: participationEquity };
    return k;
  });

  base.charts.auditIntegrity.hashWarnings = records.filter((r) => calcRecordHash(r) !== r.recordHash).length;
  base.charts.auditIntegrity.hashIntegrityRate = Math.round(((records.length - base.charts.auditIntegrity.hashWarnings) / Math.max(records.length, 1)) * 100);
  integratedState.analytics.snapshot = base;
  dispatchEvent("analytics_recomputed", {});
  renderAnalytics();
}

function barRow(label, value, max = 100, cls = "") {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return `<div class="bar-row"><div>${label}</div><div class="bar-bg"><div class="bar-fill ${cls}" style="width:${width}%"></div></div><div>${value}</div></div>`;
}

function renderAnalytics() {
  const s = integratedState.analytics.snapshot || integratedState.masterData.analyticsSeed;
  if (!s) return;
  byId("kpi-cards").innerHTML = s.kpiCards.map((k) => `
    <div class="kpi-card" data-kpi="${k.id}">
      <div>${k.label}</div>
      <div class="kpi-score">${k.score}</div>
      <div class="${k.delta >= 0 ? "delta-up" : "delta-down"}">${k.delta >= 0 ? "+" : ""}${k.delta}${k.unit}</div>
    </div>`).join("");
  document.querySelectorAll(".kpi-card").forEach((el) => el.addEventListener("click", () => openDrilldown(el.dataset.kpi)));

  byId("chart-participation").innerHTML = s.charts.participationTrend.map((d) => barRow(d.meeting, d.value)).join("");
  byId("chart-nudge").innerHTML = s.charts.nudgeStacked.map((d) => `${barRow(`${d.type} shown`, d.shown, 10)}${barRow(`${d.type} accepted`, d.accepted, 10, "ok")}`).join("");
  byId("chart-gap").innerHTML = s.charts.aiHumanGapDistribution.map((d) => `<div class="bar-row"><div><button class="chip gap-btn" data-cid="${d.candidateId}">${d.candidateId}</button></div><div class="bar-bg"><div class="bar-fill warn" style="width:${Math.min(100, d.gap * 3)}%"></div></div><div>${d.gap}</div></div>`).join("");
  document.querySelectorAll(".gap-btn").forEach((b) => b.addEventListener("click", () => {
    byId("drilldown").innerHTML = `<div>候補者 ${b.dataset.cid} の根拠: <span class="mono">final_decisions:${b.dataset.cid}</span></div>`;
    dispatchEvent("drilldown_opened", { candidateId: b.dataset.cid });
  }));
  byId("chart-audit").innerHTML = [
    barRow("hashIntegrityRate", s.charts.auditIntegrity.hashIntegrityRate),
    barRow("hashWarnings", s.charts.auditIntegrity.hashWarnings, 10, "warn"),
    barRow("exceptionUnlockRate", s.charts.auditIntegrity.exceptionUnlockRate),
    barRow("postFinalizeEditRate", s.charts.auditIntegrity.postFinalizeEditRate, 20, "warn"),
  ].join("");
  byId("insights").innerHTML = `
    <div><strong>強み</strong><ul>${s.insights.strengths.map((x) => `<li>${x}</li>`).join("")}</ul></div>
    <div><strong>課題</strong><ul>${s.insights.risks.map((x) => `<li>${x}</li>`).join("")}</ul></div>
    <div><strong>次アクション</strong><ul>${s.insights.nextActions.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
  openDrilldown(integratedState.ui.drilldownTarget);
}

function openDrilldown(kpiId) {
  const s = integratedState.analytics.snapshot || integratedState.masterData.analyticsSeed;
  const refs = s.drilldownRefs[kpiId] || [];
  integratedState.ui.drilldownTarget = kpiId;
  byId("drilldown").innerHTML = `<div><strong>${kpiId}</strong> の根拠</div><ul>${refs.map((r) => `<li class="mono">${r}</li>`).join("")}</ul>`;
}

function renderReport() {
  const s = integratedState.analytics.snapshot || integratedState.masterData.analyticsSeed;
  const t = integratedState.masterData.reportTemplates;
  const cards = Object.fromEntries(s.kpiCards.map((k) => [k.id, k.score]));
  const audit = s.charts.auditIntegrity;
  const kpiSummary = t.kpiSummaryTemplate
    .replace("{participation_equity}", cards.participation_equity)
    .replace("{nudge_effectiveness}", cards.nudge_effectiveness)
    .replace("{explainability}", cards.explainability)
    .replace("{collaboration_quality}", cards.collaboration_quality)
    .replace("{calibration_gap}", cards.calibration_gap);
  const governance = t.governanceTemplate
    .replace("{hash_integrity_rate}", audit.hashIntegrityRate)
    .replace("{exception_unlock_rate}", audit.exceptionUnlockRate);

  integratedState.analytics.generatedReport = {
    generatedAt: new Date().toISOString(),
    snapshotId: `snapshot-${Date.now()}`,
  };
  byId("report-content").innerHTML = `
    <p><strong>Executive Summary</strong><br>${t.executiveSummaryTemplate}</p>
    <p><strong>KPI Summary</strong><br>${kpiSummary}</p>
    <p><strong>Governance</strong><br>${governance}</p>
    <p><strong>改善アクション（提案）</strong></p>
    <ul>
      <li>担当: 評価会議Chair / 期限: 次回会議前 / 効果: 発言偏在-15%</li>
      <li>担当: HRBP / 期限: 2週間 / 効果: 解除申請理由の標準化</li>
      <li>担当: Manager / 期限: 月次 / 効果: 乖離上位案件の再発防止</li>
    </ul>
    <p class="mono">snapshotId: ${integratedState.analytics.generatedReport.snapshotId}</p>`;
  byId("report-panel").classList.remove("hidden");
  dispatchEvent("report_generated", integratedState.analytics.generatedReport);
}

function renderCriteriaSummary() {
  const text = integratedState.criteriaMd || "";
  const lines = text.split("\n").filter((l) => l.startsWith("## ") || l.startsWith("- "));
  byId("criteria-summary").innerHTML = `
    <div class="muted">AI判定基準_仮.md から重要項目を表示</div>
    <ul>${lines.slice(0, 24).map((l) => `<li>${l.replace(/^[-# ]+/, "")}</li>`).join("")}</ul>
    <p><strong>ガードレール:</strong> AIは支援役であり最終決裁しない。人間の差分理由は監査ログに記録される。</p>`;
}

function renderEventLog() {
  byId("event-log").innerHTML = integratedState.meeting.eventLog.slice(-20).reverse()
    .map((e) => `<div class="log-line"><span class="mono">${e.type}</span> <span class="muted">${e.at}</span></div>`)
    .join("");
}

function switchTab(name) {
  integratedState.session.activeTab = name;
  document.querySelectorAll("#main-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
  byId(`tab-${name}`).classList.add("active");
}

function bindEvents() {
  byId("candidate-select").addEventListener("change", (e) => {
    integratedState.session.selectedCandidateId = e.target.value;
    integratedState.decision.unlockApproved = false;
    byId("unlock-form").classList.add("hidden");
    dispatchEvent("candidate_selected", { candidateId: e.target.value });
    renderSidePanel();
    renderFinalizePanel();
    recomputeAnalytics();
  });
  document.querySelectorAll("#main-tabs button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  byId("run-scenario").addEventListener("click", runScenario);
  byId("reset-meeting").addEventListener("click", resetMeetingPanel);
  byId("finalize").addEventListener("click", finalizeOrEdit);
  byId("request-unlock").addEventListener("click", requestUnlock);
  byId("approve-unlock").addEventListener("click", approveUnlock);
  byId("show-audit").addEventListener("click", () => byId("audit-log").classList.toggle("hidden"));
  byId("generate-report").addEventListener("click", renderReport);
  byId("toggle-report").addEventListener("click", () => byId("report-panel").classList.toggle("hidden"));
}

async function init() {
  try {
    await loadData();
    renderCandidateSelect();
    renderScenarioSelect();
    renderPhaseStepper();
    resetMeetingPanel();
    renderSidePanel();
    renderFinalizePanel();
    recomputeAnalytics();
    renderCriteriaSummary();
    bindEvents();
  } catch (e) {
    document.body.innerHTML = `<pre>Failed to load integrated dashboard: ${e.message}</pre>`;
  }
}

init();
