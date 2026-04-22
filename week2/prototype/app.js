const state = {
  candidates: [],
  p0Records: [],
  evidence: [],
  meetingScenarios: [],
  nudgeRules: null,
  selectedCandidateId: null,
  evidenceFilter: "ALL",
  eventLog: [],
  nudgeLog: [],
  speakerDurations: {},
  activeScenario: null,
  lastNudgeSec: -999,
};

const views = {
  top: document.getElementById("view-top"),
  p0: document.getElementById("view-p0"),
  evidence: document.getElementById("view-evidence"),
  meeting: document.getElementById("view-meeting"),
};

function byId(id) { return document.getElementById(id); }
function showView(name) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[name].classList.add("active");
}

async function loadData() {
  const [candidateRes, p0Res, evidenceRes, meetingRes, rulesRes] = await Promise.all([
    fetch("../../mock/candidate_index.json"),
    fetch("../../mock/ai_first_pass.json"),
    fetch("../../mock/evidence_catalog.json"),
    fetch("../../mock/meeting_transcript.json"),
    fetch("../../mock/nudge_rules.json"),
  ]);
  state.candidates = (await candidateRes.json()).candidates;
  state.p0Records = (await p0Res.json()).records;
  state.evidence = (await evidenceRes.json()).evidence;
  state.meetingScenarios = (await meetingRes.json()).scenarios;
  state.nudgeRules = (await rulesRes.json()).thresholds;
}

function appendLog(type, payload) {
  state.eventLog.push({ type, at: new Date().toISOString(), ...payload });
  renderEventLog();
}

function riskTag(level) {
  if (level === "high") return "tag tag-err";
  if (level === "medium") return "tag tag-warn";
  return "tag";
}

function renderTopFilters() {
  const divisions = [...new Set(state.candidates.map((c) => c.division))];
  const sel = byId("filter-division");
  divisions.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    sel.appendChild(o);
  });
}

function getFilteredCandidates() {
  const division = byId("filter-division").value;
  const outcome = byId("filter-outcome").value;
  const risk = byId("filter-risk").value;
  return state.candidates.filter((c) => {
    if (division && c.division !== division) return false;
    if (outcome && c.recommendedOutcome !== outcome) return false;
    if (risk && c.riskLevel !== risk) return false;
    return true;
  });
}

function renderTop() {
  const grid = byId("candidate-grid");
  grid.innerHTML = "";
  getFilteredCandidates().forEach((c) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${c.name}</h4>
      <div class="muted">${c.division} / ${c.grade}</div>
      <div style="margin-top:8px">
        <span class="tag tag-accent">${c.recommendedOutcome}</span>
        <span class="tag">${c.confidence}</span>
        <span class="${riskTag(c.riskLevel)}">risk:${c.riskLevel}</span>
      </div>
      <button data-id="${c.candidateId}" class="mt8">P0詳細を見る</button>`;
    card.querySelector("button").addEventListener("click", () => {
      state.selectedCandidateId = c.candidateId;
      renderP0();
      showView("p0");
    });
    grid.appendChild(card);
  });
}

function renderP0() {
  const id = state.selectedCandidateId;
  const c = state.candidates.find((x) => x.candidateId === id);
  const p0 = state.p0Records.find((x) => x.candidateId === id);
  if (!c || !p0) return;

  byId("p0-header").innerHTML = `
    <h2>${c.name} (${c.candidateId})</h2>
    <div class="muted">${c.division} / ${c.grade}</div>
    <div class="mt8">
      <span class="tag tag-accent">${p0.recommendedOutcome}</span>
      <span class="tag">${p0.confidence} (${p0.confidenceScore})</span>
    </div>`;

  byId("p0-charts").innerHTML = `
    <div>Performance: <strong>${p0.nineBoxAI.performance}</strong></div>
    <div>Potential: <strong>${p0.nineBoxAI.potential}</strong></div>
    <div class="mt8"><strong>9軸（簡易）</strong></div>
    ${Object.entries(p0.competencyScores).map(([k, v]) => `<div>${k}: ${v}</div>`).join("")}
  `;

  byId("p0-ai").innerHTML = `
    <p>${p0.summary}</p>
    <h4>強み（2）</h4><ul>${p0.explainTrace.slice(0,2).map((s)=>`<li>${s}</li>`).join("")}</ul>
    <h4>懸念（2）</h4><ul>${p0.riskFlags.slice(0,2).map((s)=>`<li>${s}</li>`).join("")}</ul>
    <h4>要確認（1）</h4><ul><li>${p0.openQuestionsForCalibration[0] || "会議で確認"}</li></ul>
    <p class="muted">AIは進行支援であり、最終決裁は人間が行う。</p>
  `;

  byId("p0-risks").innerHTML = `
    ${p0.riskFlags.map((r) => `<span class="tag tag-warn">${r}</span>`).join("")}
    <div class="mt8 mono">${p0.evidenceRefs.join("<br/>")}</div>
  `;

  const scenarioSel = byId("scenario-select");
  scenarioSel.innerHTML = "";
  state.meetingScenarios.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.scenarioId;
    o.textContent = `${s.scenarioId}: ${s.name}`;
    scenarioSel.appendChild(o);
  });
}

function renderEvidenceTabs() {
  const host = byId("evidence-tabs");
  const tabs = ["ALL", "KPI", "360", "Meeting", "ProjectArtifact", "ManagerReview", "PeerReview", "ClientFeedback", "Knowledge", "Training"];
  host.innerHTML = "";
  tabs.forEach((t) => {
    const b = document.createElement("button");
    b.className = `tab ${state.evidenceFilter === t ? "active" : ""}`;
    b.textContent = t;
    b.addEventListener("click", () => {
      state.evidenceFilter = t;
      renderEvidenceTabs();
      renderEvidenceList();
    });
    host.appendChild(b);
  });
}

function renderEvidenceList() {
  const p0 = state.p0Records.find((r) => r.candidateId === state.selectedCandidateId);
  if (!p0) return;
  const ids = new Set(p0.evidenceRefs);
  let list = state.evidence.filter((e) => ids.has(e.evidenceId));
  if (state.evidenceFilter !== "ALL") list = list.filter((e) => e.sourceType === state.evidenceFilter);
  byId("evidence-list").innerHTML = list.map((e) => `
    <div class="list-item">
      <div><strong>${e.title}</strong> <span class="tag">${e.sourceType}</span></div>
      <div class="muted">${e.snippet}</div>
      <div class="mono">${e.evidenceId}</div>
      <div class="muted">freshness:${e.freshness} / confidence:${e.confidence}</div>
    </div>`).join("");
}

function resetMeetingState() {
  state.eventLog = [];
  state.nudgeLog = [];
  state.speakerDurations = {};
  state.activeScenario = null;
  state.lastNudgeSec = -999;
  byId("timeline").innerHTML = "";
  byId("nudge-panel").innerHTML = "<div class='muted'>ナッジ待機中</div>";
  byId("speaker-balance").innerHTML = "-";
  byId("silence-ratio").innerHTML = "-";
  byId("agenda-progress").innerHTML = "-";
  renderEventLog();
  renderNineBox();
}

function renderEventLog() {
  byId("event-log").innerHTML = state.eventLog.slice(-12).map((e) =>
    `<div class="log-line"><span class="mono">${e.type}</span> ${e.message || ""}</div>`
  ).join("");
}

function updateMetricsForUtterance(u, totalSpeakers) {
  state.speakerDurations[u.speakerId] = (state.speakerDurations[u.speakerId] || 0) + u.durationSec;
  appendLog("speaker_turn_changed", { message: `${u.speakerName} が発言 (${u.durationSec}s)` });

  const durations = Object.values(state.speakerDurations).sort((a, b) => b - a);
  const total = durations.reduce((a, b) => a + b, 0) || 1;
  const top3 = durations.slice(0, 3).reduce((a, b) => a + b, 0);
  const top3Ratio = top3 / total;
  const silenceCount = Math.max(0, totalSpeakers - Object.keys(state.speakerDurations).length);
  const silenceRatio = silenceCount / totalSpeakers;
  byId("speaker-balance").textContent = `Top3発言比率: ${(top3Ratio * 100).toFixed(1)}%`;
  byId("silence-ratio").textContent = `未発言者率: ${(silenceRatio * 100).toFixed(1)}%`;
  return { top3Ratio, silenceRatio };
}

function showNudge(type, currentSec, reasonText) {
  const templates = {
    participation: "発言が上位者に集中しています。未発言メンバーの視点を確認しますか？",
    diversity: "同意意見が多く、代替視点が不足しています。別角度の論点を追加しますか？",
    evidence: "根拠の明示が不足しています。Evidenceに基づく補足を求めますか？",
  };
  const panel = byId("nudge-panel");
  panel.innerHTML = `
    <div class="list-item">
      <div><strong>${type} nudge</strong></div>
      <div class="muted">${templates[type]}</div>
      <div class="mono">reason: ${reasonText}</div>
      <button id="accept-nudge" class="accent-btn mt8">採用</button>
      <button id="dismiss-nudge" class="mt8">見送り</button>
    </div>`;
  appendLog("nudge_shown", { message: `${type} / ${reasonText}` });
  state.nudgeLog.push({ type, decision: "shown", atSec: currentSec, reason: reasonText });
  state.lastNudgeSec = currentSec;

  byId("accept-nudge").addEventListener("click", () => {
    appendLog("nudge_accepted", { message: `${type} を採用` });
    state.nudgeLog.push({ type, decision: "accepted", atSec: currentSec });
    panel.innerHTML = `<span class="tag tag-ok">採用済み</span>`;
  });
  byId("dismiss-nudge").addEventListener("click", () => {
    appendLog("nudge_dismissed", { message: `${type} を見送り` });
    state.nudgeLog.push({ type, decision: "dismissed", atSec: currentSec });
    panel.innerHTML = `<span class="tag tag-warn">見送り</span>`;
  });
}

function maybeNudge(scenario, u, metrics) {
  const t = state.nudgeRules;
  if (u.startedAtSec - state.lastNudgeSec < t.nudgeCooldownSec) return;
  const agreeCount = scenario.utterances.filter((x) => x.seq <= u.seq && x.stance === "agree").length;
  const alternativeCount = scenario.utterances.filter((x) => x.seq <= u.seq && x.stance === "alternative").length;
  const isAltShort = alternativeCount < t.alternativeViewMinCount && agreeCount >= 3;

  if (metrics.top3Ratio > t.dominanceTop3Ratio) {
    showNudge("participation", u.startedAtSec, `Top3比率 ${(metrics.top3Ratio * 100).toFixed(1)}%`);
    return;
  }
  if (metrics.silenceRatio > t.silenceParticipantRatio) {
    showNudge("participation", u.startedAtSec, `未発言者率 ${(metrics.silenceRatio * 100).toFixed(1)}%`);
    return;
  }
  if (isAltShort) {
    showNudge("diversity", u.startedAtSec, `agree:${agreeCount} / alternative:${alternativeCount}`);
  }
}

function renderNineBox() {
  const p0 = state.p0Records.find((r) => r.candidateId === state.selectedCandidateId);
  if (!p0) return;
  const hp = Number(byId("human-performance").value || p0.nineBoxAI.performance);
  const ht = Number(byId("human-potential").value || p0.nineBoxAI.potential);
  const gap = Math.abs(p0.nineBoxAI.performance - hp) + Math.abs(p0.nineBoxAI.potential - ht);
  byId("ninebox-view").innerHTML = `
    <div>AI位置: (${p0.nineBoxAI.performance}, ${p0.nineBoxAI.potential})</div>
    <div>Human位置: (${hp}, ${ht})</div>
    <div>乖離量: <strong>${gap}</strong></div>`;
}

async function runScenario() {
  resetMeetingState();
  const scenarioId = byId("scenario-select").value;
  const scenario = state.meetingScenarios.find((s) => s.scenarioId === scenarioId);
  if (!scenario) return;
  state.activeScenario = scenario;
  appendLog("agenda_step_changed", { message: `${scenario.name} を開始` });

  const speakers = [...new Set(scenario.utterances.map((u) => u.speakerId))].length;
  byId("agenda-progress").textContent = `${scenario.agenda[0].title} / 残議題 ${scenario.agenda.length}`;
  const timeline = byId("timeline");
  for (const u of scenario.utterances) {
    const line = document.createElement("div");
    line.className = "list-item";
    line.innerHTML = `<strong>#${u.seq} ${u.speakerName}</strong> <span class="tag">${u.stance}</span><div class="muted">${u.content}</div>`;
    timeline.appendChild(line);
    const metrics = updateMetricsForUtterance(u, speakers);
    maybeNudge(scenario, u, metrics);
  }
}

function bindEvents() {
  ["filter-division", "filter-outcome", "filter-risk"].forEach((id) => byId(id).addEventListener("change", renderTop));
  byId("back-to-top").addEventListener("click", () => showView("top"));
  byId("open-evidence").addEventListener("click", () => {
    renderEvidenceTabs();
    renderEvidenceList();
    showView("evidence");
  });
  byId("back-to-p0").addEventListener("click", () => showView("p0"));
  byId("start-meeting").addEventListener("click", () => {
    resetMeetingState();
    showView("meeting");
  });
  byId("back-to-p0-from-meeting").addEventListener("click", () => showView("p0"));
  byId("run-scenario").addEventListener("click", runScenario);
  byId("reset-meeting").addEventListener("click", resetMeetingState);
  byId("human-performance").addEventListener("input", renderNineBox);
  byId("human-potential").addEventListener("input", renderNineBox);
  byId("save-gap").addEventListener("click", () => {
    const reason = byId("gap-reason").value.trim();
    if (!reason) {
      alert("乖離理由を入力してください。");
      return;
    }
    appendLog("ninebox_gap_saved", { message: reason });
    byId("gap-reason").value = "";
  });
}

async function init() {
  try {
    await loadData();
    renderTopFilters();
    renderTop();
    bindEvents();
  } catch (e) {
    document.body.innerHTML = `<pre>Failed to load data: ${e.message}</pre>`;
  }
}

init();
