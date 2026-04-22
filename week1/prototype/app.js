const state = {
  candidates: [],
  p0Records: [],
  evidence: [],
  selectedCandidateId: null,
  evidenceFilter: "ALL",
};

const views = {
  top: document.getElementById("view-top"),
  p0: document.getElementById("view-p0"),
  evidence: document.getElementById("view-evidence"),
};

function showView(name) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[name].classList.add("active");
}

async function loadData() {
  const [candidateRes, p0Res, evidenceRes] = await Promise.all([
    fetch("../../mock/candidate_index.json"),
    fetch("../../mock/ai_first_pass.json"),
    fetch("../../mock/evidence_catalog.json"),
  ]);
  const candidateJson = await candidateRes.json();
  const p0Json = await p0Res.json();
  const evidenceJson = await evidenceRes.json();

  state.candidates = candidateJson.candidates;
  state.p0Records = p0Json.records;
  state.evidence = evidenceJson.evidence;
}

function byId(id) {
  return document.getElementById(id);
}

function riskTag(level) {
  if (level === "high") return "tag tag-err";
  if (level === "medium") return "tag tag-warn";
  return "tag";
}

function renderTopFilters() {
  const divisions = [...new Set(state.candidates.map((c) => c.division))];
  const select = byId("filter-division");
  divisions.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
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
      <button data-id="${c.candidateId}" style="margin-top:10px">P0詳細を見る</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      state.selectedCandidateId = c.candidateId;
      renderP0();
      showView("p0");
    });
    grid.appendChild(card);
  });
}

function formatScoreBars(scores) {
  return Object.entries(scores)
    .map(([k, v]) => `<div>${k}: <strong>${v}</strong></div>`)
    .join("");
}

function renderP0() {
  const id = state.selectedCandidateId;
  const candidate = state.candidates.find((c) => c.candidateId === id);
  const p0 = state.p0Records.find((r) => r.candidateId === id);
  if (!candidate || !p0) return;

  byId("p0-header").innerHTML = `
    <h2>${candidate.name} (${candidate.candidateId})</h2>
    <div class="muted">${candidate.division} / ${candidate.grade}</div>
    <div style="margin-top:8px">
      <span class="tag tag-accent">${p0.recommendedOutcome}</span>
      <span class="tag">${p0.confidence} (${p0.confidenceScore})</span>
    </div>
  `;

  byId("chart-overall").innerHTML = `
    <h4>総合評価（簡易）</h4>
    <div class="muted">Performance: ${p0.nineBoxAI.performance} / Potential: ${p0.nineBoxAI.potential}</div>
  `;
  byId("chart-360").innerHTML = `
    <h4>360度（簡易）</h4>
    <div class="muted">賞賛・建設的・懸念はEvidenceで確認</div>
  `;
  byId("chart-9axis").innerHTML = `
    <h4>9軸スコア</h4>
    ${formatScoreBars(p0.competencyScores)}
  `;

  const strengths = p0.explainTrace.slice(0, 2);
  const concerns = p0.riskFlags.slice(0, 2);
  const checkPoint = p0.openQuestionsForCalibration[0] || "会議で文脈確認";
  byId("p0-ai").innerHTML = `
    <p>${p0.summary}</p>
    <h4>強み（2）</h4>
    <ul>${strengths.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h4>懸念（2）</h4>
    <ul>${concerns.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h4>要確認（1）</h4>
    <ul><li>${checkPoint}</li></ul>
    <p class="muted">AIは意思決定支援。最終決裁は人間が実施。</p>
  `;

  byId("p0-risks").innerHTML = `
    ${p0.riskFlags.map((r) => `<span class="tag tag-warn">${r}</span>`).join("")}
    <h4>根拠ID</h4>
    <div class="mono">${p0.evidenceRefs.join("<br/>")}</div>
  `;
}

function renderEvidenceTabs() {
  const tabsHost = byId("evidence-tabs");
  const tabs = ["ALL", "KPI", "360", "Meeting", "ProjectArtifact", "ManagerReview", "PeerReview", "ClientFeedback", "Knowledge", "Training"];
  tabsHost.innerHTML = "";
  tabs.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = `tab ${state.evidenceFilter === t ? "active" : ""}`;
    btn.textContent = t;
    btn.addEventListener("click", () => {
      state.evidenceFilter = t;
      renderEvidenceTabs();
      renderEvidenceList();
    });
    tabsHost.appendChild(btn);
  });
}

function renderEvidenceList() {
  const id = state.selectedCandidateId;
  const p0 = state.p0Records.find((r) => r.candidateId === id);
  if (!p0) return;
  const ids = new Set(p0.evidenceRefs);
  let list = state.evidence.filter((e) => ids.has(e.evidenceId));
  if (state.evidenceFilter !== "ALL") {
    list = list.filter((e) => e.sourceType === state.evidenceFilter);
  }
  byId("evidence-list").innerHTML = list
    .map(
      (e) => `
      <div class="list-item">
        <div><strong>${e.title}</strong> <span class="tag">${e.sourceType}</span></div>
        <div class="muted">${e.snippet}</div>
        <div class="mono">${e.evidenceId}</div>
        <div class="muted">freshness: ${e.freshness} / confidence: ${e.confidence}</div>
      </div>`
    )
    .join("");
}

function bindEvents() {
  ["filter-division", "filter-outcome", "filter-risk"].forEach((id) =>
    byId(id).addEventListener("change", renderTop)
  );
  byId("back-to-top").addEventListener("click", () => showView("top"));
  byId("open-evidence").addEventListener("click", () => {
    renderEvidenceTabs();
    renderEvidenceList();
    showView("evidence");
  });
  byId("back-to-p0").addEventListener("click", () => showView("p0"));
}

async function init() {
  try {
    await loadData();
    renderTopFilters();
    renderTop();
    bindEvents();
  } catch (e) {
    document.body.innerHTML = `<pre>Failed to load mock data: ${e.message}</pre>`;
  }
}

init();
