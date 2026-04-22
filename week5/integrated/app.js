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
    replayRunning: false,
    replayScenarioId: null,
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
    aiSummaryExpanded: true,
  },
};

const phaseLabels = {
  PreCheck: "会議前確認",
  MeetingLive: "会議ライブ",
  FinalizeLock: "確定・監査",
  PostAnalytics: "分析",
  AutoReport: "レポート",
};
const phaseToTab = {
  PreCheck: "meeting",
  MeetingLive: "meeting",
  FinalizeLock: "finalize",
  PostAnalytics: "analytics",
  AutoReport: "analytics",
};

function byId(id) { return document.getElementById(id); }

/** ? ボタン用。data-help-key と HELP_TEXTS のキーが一致する必要がある */
const HELP_TEXTS = {
  ai_brief: "AI判定基準を基に、各評価対象者のサマリを確認し、会議や最終判断に向けた意思決定の材料として用いている結果を示しています（人間の最終決裁を置き換えるものではありません）。表現内容は、クライアント側の設定（部署・職階・評価項目の重みづけなど）で変えられます。監査に残る最終判断とAI案の差分（差分理由・文脈・ログ）をナレッジとして蓄積し、学習ループに回すことで、基準のチューニングや改善の有効性を後から検証する想定です。推奨区分に加え、強み・懸念・会議で詰める論点の起点として使います。",
  ai_criteria: "様々な評価基準や評価要素の重みづけと反映ロジックを、事前に登録しておくことで一貫した形で客観的な提案判定を出します。部署別・役職別、360度評価の重みの増減など、クライアント方針に合わせた調整が可能です。監査上の人間最終判断とAI案の差分や、その理由（差分理由・文脈タグ）の蓄積を学習・改善サイクルに戻し、基準の精度向上や、変更（ロールアウト）の有効性の検証に使う、という位置づけのデモです。",
  nudge: "会議中、発言の偏在・未発言者の多さ・同意への偏りなど、条件に合うと表示される短い提言です。会議の公平性・多様性の改善を促します。採用／見送りは監査・分析の入力になります。",
  event_log: "この画面セッション内で起きた主な操作（評価対象者切替、会議シナリオ、ナッジ表示・採用・見送りなど）の履歴です。事後の説明・再現のしやすさ用です。本番は監査システムのイベントと対応づけます。",
  delta_reason: "AI推奨と人間の最終判断が異なる場合に、その理由を必ず残す欄です。納得性・再現性・説明責任の中核で、根拠の薄い最終判断を防ぎます。蓄積された内容は、AI判定基準の精度向上のための学習（フィードバック）やナレッジ化にも反映可能、という想定です。",
  context_tags: "今回の判断の背景（事業文脈・クライアント要因・組織事情など）を短いラベルで付けます。後から同様の文脈の案件を比較・分析しやすくし、数字だけでは見えない解釈の差を扱えます。本項目も、AI判定基準のチューニングや学習に反映し、文脈別の当てはまりを改善する用途を想定しています。",
  lock_unlock: "最終確定後は原則として編集不可（ロック）とし、事後改ざんのリスクを下げます。例外的に変更が必要なときは、理由・影響範囲・承認者を揃えて解除します。高い手続率はルール不備のサインになり得るため、定義の見直し材料にもします。",
  kpi_participation_equity: "会議内の発言機会の公平性を表す指標です。特定の人に発言が偏るほど低くなりやすく、会議の民主性に関心を向けます。閾値や重みは組織方針でカスタマイズ可能、という想定をデモに含めます。",
  kpi_nudge_effectiveness: "出したナッジに対し、採用され実運用上の改善（偏り是正など）に寄与した度合いの目安です。採択率だけが目的ではありません。ナッジ条件や「採用」の定義は設定で変えられます。",
  kpi_explainability: "最終判断に、人間の言葉で根拠（差分理由など）が残っている度合いの目安です。後追いの説得・労使対応・監査での説明しやすさに効きます。",
  kpi_collaboration_quality: "会議内の合意形成の健全さ・建設的な議論の度合いを束ねた品質指標のイメージです。定義式は職能・文化に合わせてカスタマイズ可能、という前提のデモ表現です。",
  kpi_calibration_gap: "AI推奨と人間最終判断の食い違いが、組織として妥当な範囲に収束している度合いの目安です。常にゼロが最適とは限りません。意図的な補正は差分理由に残すことが重要です。",
  chart_participation: "M-01・M-02・M-03は会議回（例示）で、会議を重ねるごとの発言エクイティの推移です。制度・ファシリ・ナッジ導入の定着度を示す想定で、1会議の定義は運用で設定できます。",
  chart_nudge: "種類（participation＝参加・diversity＝多様性・evidence＝根拠促し など）ごとに、ナッジを出した回数（shown）と採用した回数（accepted）を積み上げ表示しています。どの偏りに対する介入を見ているか、運用の効きの目安になります。",
  chart_gap: "評価対象者ごとに、AI案と人間最終の差の大きさを分布として見せています。説明工数が必要な案件の探索や、部門・基準の偏りの発見に使います。",
  chart_audit: "hashIntegrityRate: レコードのハッシュが期待通りの割合。 hashWarnings: 不整合（疑い）件数。 exceptionUnlockRate: 例外解除の発生度合い。 postFinalizeEditRate: 確定後の編集の度合い。高すぎる解除・編集は手続・権限の見直し材料になります。",
  drilldown: "選択中のKPIの数字の裏付けとして、参照すべき記録名・ログ名を一覧します。本番は監査DB・会議記録と接続し、数字と根拠を突合する導線です。",
};

function helpButtonHtml(helpKey) {
  return `<button type="button" class="help-btn" data-help-key="${helpKey}" aria-label="この指標の説明" title="">?</button>`;
}

function initHelpPopover() {
  const pop = byId("help-popover");
  const textEl = byId("help-popover-text");
  if (!pop || !textEl) return;
  let openTrigger = null;

  function position(trigger) {
    const rect = trigger.getBoundingClientRect();
    const maxW = Math.min(320, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - maxW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - maxW - 12));
    const margin = 8;
    const below = window.innerHeight - rect.bottom;
    const est = 200;
    let top;
    if (below > est + 24) {
      top = rect.bottom + margin;
    } else {
      top = Math.max(12, rect.top - est - margin);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.width = `${maxW}px`;
  }

  function close() {
    pop.classList.add("hidden");
    pop.setAttribute("aria-hidden", "true");
    openTrigger = null;
  }

  function open(trigger) {
    const key = trigger.dataset.helpKey;
    if (!key || !HELP_TEXTS[key]) return;
    textEl.textContent = HELP_TEXTS[key].replaceAll("。", "。\n").trim();
    pop.classList.remove("hidden");
    pop.setAttribute("aria-hidden", "false");
    position(trigger);
    openTrigger = trigger;
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest && t.closest(".help-btn")) {
      e.preventDefault();
      const btn = t.closest(".help-btn");
      if (openTrigger === btn && !pop.classList.contains("hidden")) {
        close();
        return;
      }
      open(btn);
      return;
    }
    if (t.closest && t.closest("#help-popover")) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  const repos = () => { if (openTrigger && !pop.classList.contains("hidden")) position(openTrigger); };
  window.addEventListener("resize", repos);
  window.addEventListener("scroll", repos, true);
}

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
  renderFinalizeBrief();
}

function currentCandidate() {
  return integratedState.masterData.candidates.find((c) => c.candidateId === integratedState.session.selectedCandidateId);
}
function currentP0() {
  return integratedState.masterData.p0Records.find((r) => r.candidateId === integratedState.session.selectedCandidateId);
}
function currentRecord() {
  const id = integratedState.session.selectedCandidateId;
  let record = integratedState.masterData.finalDecisionRecords.find((r) => r.candidateId === id);
  if (record) return record;

  // レコードが存在しない評価対象者は、表示継続のため初期レコードを自動生成する
  const p0 = currentP0();
  const fallbackOutcome = p0?.recommendedOutcome || "Hold";
  record = {
    candidateId: id,
    aiOutcome: fallbackOutcome,
    humanOutcome: fallbackOutcome,
    deltaReason: "",
    contextTags: [],
    deciders: [],
    finalizedFlag: false,
    finalizedAt: null,
    finalizedBy: null,
    lockVersion: 0,
    recordHash: "",
    unlockRequest: null,
    nineBoxHuman: p0?.nineBoxAI
      ? { performance: p0.nineBoxAI.performance, potential: p0.nineBoxAI.potential }
      : { performance: 50, potential: 50 },
  };
  record.recordHash = calcRecordHash(record);
  integratedState.masterData.finalDecisionRecords.push(record);
  return record;
}

function renderPhaseStepper() {
  const phases = ["PreCheck", "MeetingLive", "FinalizeLock", "PostAnalytics", "AutoReport"];
  byId("phase-stepper").innerHTML = phases.map((p) => {
    const gate = phaseGateState(p);
    return `<button class="phase-item ${integratedState.session.currentPhase === p ? "active" : ""} ${gate.allowed ? "" : "disabled"}" data-phase="${p}" ${gate.allowed ? "" : "disabled"}>
      ${phaseLabels[p]}
      <span class="phase-item-label">${gate.label}</span>
    </button>`;
  }).join("");
  byId("phase-stepper").querySelectorAll("[data-phase]").forEach((el) => {
    el.addEventListener("click", () => {
      const p = el.dataset.phase;
      const gate = phaseGateState(p);
      if (!gate.allowed) {
        alert(gate.reason);
        return;
      }
      integratedState.session.currentPhase = p;
      switchTab(phaseToTab[p]);
      renderPhaseStepper();
    });
  });
}

function phaseGateState(phase) {
  const hasMeeting = integratedState.meeting.eventLog.some((e) => e.type === "meeting_started");
  const hasFinalize = integratedState.audit.events.some((e) => e.eventType === "finalize");
  const hasReport = Boolean(integratedState.analytics.generatedReport);
  if (phase === "PreCheck") return { allowed: true, label: "準備", reason: "" };
  if (phase === "MeetingLive") return { allowed: true, label: "実行", reason: "" };
  if (phase === "FinalizeLock") return { allowed: hasMeeting, label: hasMeeting ? "確認可" : "会議後", reason: "先に会議ライブでシナリオ実行してください。" };
  if (phase === "PostAnalytics") return { allowed: hasFinalize, label: hasFinalize ? "確認可" : "確定後", reason: "先に確定・監査で最終確定してください。" };
  return { allowed: hasReport, label: hasReport ? "確認可" : "生成後", reason: "先に分析・レポートで自動レポート生成を実行してください。" };
}

function renderCandidateSelect() {
  const sel = byId("candidate-select");
  sel.innerHTML = integratedState.masterData.candidates.map((c) => `<option value="${c.candidateId}">${c.candidateId} ${c.name}</option>`).join("");
  integratedState.session.selectedCandidateId = integratedState.masterData.candidates[0]?.candidateId || null;
  sel.value = integratedState.session.selectedCandidateId;
}

function renderPersonaStrip() {
  const host = byId("persona-strip-list");
  host.innerHTML = integratedState.masterData.candidates.map((c) => {
    const active = c.candidateId === integratedState.session.selectedCandidateId ? "active" : "";
    return `<button class="persona-btn ${active}" data-candidate-id="${c.candidateId}">
      <div class="avatar">👤</div>
      <div class="mono">${c.candidateId}</div>
      <div>${c.name.split(" ")[0] || c.name}</div>
    </button>`;
  }).join("");
  host.querySelectorAll(".persona-btn").forEach((b) => {
    b.addEventListener("click", () => {
      integratedState.session.selectedCandidateId = b.dataset.candidateId;
      byId("candidate-select").value = b.dataset.candidateId;
      onCandidateChange();
    });
  });
}

/** 評価対象者を変えたとき: 会議ライブをリセットし、確定/分析の一時表示を捨て、会議ライブタブで再開する */
function onCandidateChange() {
  integratedState.analytics.generatedReport = null;
  byId("report-panel")?.classList.add("hidden");
  byId("report-modal")?.classList.add("hidden");
  const reportContent = byId("report-content");
  const reportModalBody = byId("report-modal-body");
  if (reportContent) reportContent.innerHTML = "";
  if (reportModalBody) reportModalBody.innerHTML = "";
  byId("audit-log")?.classList.add("hidden");
  const unlockReason = byId("unlock-reason");
  const unlockImpact = byId("unlock-impact");
  const unlockApprover = byId("unlock-approver");
  if (unlockReason) unlockReason.value = "";
  if (unlockImpact) unlockImpact.value = "";
  if (unlockApprover) unlockApprover.value = "";

  resetMeetingPanel();
  integratedState.decision.unlockApproved = false;
  byId("unlock-form").classList.add("hidden");
  switchTab("meeting");
  dispatchEvent("candidate_selected", { candidateId: integratedState.session.selectedCandidateId });
  renderPersonaStrip();
  renderSidePanel();
  integratedState.ui.aiSummaryExpanded = true;
  renderAiSummaryBlock();
  renderAiSummaryAccordion();
  renderFinalizePanel();
  recomputeAnalytics();
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
    <div class="avatar">👤</div>
    <div><strong>${c.name}</strong> (${c.candidateId})</div>
    <div class="muted">${c.division} / ${c.grade}</div>
    <div class="chip">${outcomeJa(p0.recommendedOutcome)}</div>
    <div class="chip">信頼度 ${p0.confidenceScore}</div>
    <div class="chip">lockVersion ${r.lockVersion}</div>`;

  const overall = {
    perf: Math.round((p0.nineBoxAI.performance || 50) * 0.4),
    feedback: Math.round((p0.confidenceScore || 60) * 0.3),
    competency: Math.round(avg(Object.values(p0.competencyScores || {})) * 0.2),
    org: 100 - Math.round((p0.nineBoxAI.performance || 50) * 0.4) - Math.round((p0.confidenceScore || 60) * 0.3) - Math.round(avg(Object.values(p0.competencyScores || {})) * 0.2),
  };
  const riskCount = (p0.riskFlags || []).length;
  const feedback = {
    praise: Math.max(35, Math.min(75, 65 - riskCount * 4)),
    constructive: Math.max(15, Math.min(45, 25 + riskCount * 3)),
    concern: Math.max(5, Math.min(30, 10 + riskCount * 2)),
  };
  const aiPerf = p0.nineBoxAI.performance || 50;
  const aiPot = p0.nineBoxAI.potential || 50;
  const humanPerf = r.nineBoxHuman?.performance ?? aiPerf;
  const humanPot = r.nineBoxHuman?.potential ?? aiPot;
  byId("candidate-visuals").innerHTML = `
    <div class="viz-grid">
      <div class="viz-card">
        <div class="donut" style="background: conic-gradient(var(--accent) 0 ${overall.perf}%, #5aa9ff ${overall.perf}% ${overall.perf + overall.feedback}%, #37c871 ${overall.perf + overall.feedback}% ${overall.perf + overall.feedback + overall.competency}%, #5a5c67 ${overall.perf + overall.feedback + overall.competency}% 100%)"></div>
        <div class="donut-label">総合構成</div>
        <ul class="legend-list">
          <li>黄: 実績</li>
          <li>青: 360評価</li>
          <li>緑: コンピテンシー</li>
          <li>灰: 組織貢献</li>
        </ul>
      </div>
      <div class="viz-card">
        <div class="donut" style="background: conic-gradient(#37c871 0 ${feedback.praise}%, #5aa9ff ${feedback.praise}% ${feedback.praise + feedback.constructive}%, #ffb020 ${feedback.praise + feedback.constructive}% 100%)"></div>
        <div class="donut-label">360評価</div>
        <ul class="legend-list">
          <li>緑: 賞賛</li>
          <li>青: 建設的</li>
          <li>橙: 懸念</li>
        </ul>
      </div>
      <div class="viz-card radar">
        ${renderRadarSvg(p0.competencyScores || {})}
        <div class="donut-label">9軸レーダー</div>
        <ul class="legend-list"><li>外側に近いほど評価が高い</li></ul>
      </div>
      <div class="viz-card">
        <div class="ninebox-mini">
          <div class="dot-ai" style="left:${aiPerf}%; top:${100 - aiPot}%;" title="AI"></div>
          <div class="dot-human" style="left:${humanPerf}%; top:${100 - humanPot}%;" title="Human"></div>
        </div>
        <div class="donut-label">9-Box（黄:AI / 緑:Human）</div>
        <ul class="legend-list"><li>右上に近いほど高評価</li></ul>
      </div>
    </div>`;

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

function renderFinalizeBrief() {
  const c = currentCandidate();
  const p0 = currentP0();
  const r = currentRecord();
  if (!c || !p0 || !r) return;
  const latest = integratedState.meeting.eventLog[integratedState.meeting.eventLog.length - 1];
  const nudgeAccepted = integratedState.meeting.nudgeLog.filter((x) => x.decision === "accepted").length;
  const nudgeDismissed = integratedState.meeting.nudgeLog.filter((x) => x.decision === "dismissed").length;
  const expected = calcRecordHash(r);
  const hashOk = expected === r.recordHash;
  const concerns = (p0.riskFlags || []).slice(0, 2);
  const topics = (p0.openQuestionsForCalibration || []).slice(0, 3);

  byId("finalize-brief-header").innerHTML = `
    <div><strong>${c.name}</strong>（${c.candidateId}） / ${c.division} / ${c.grade}</div>
    <div class="muted">現在フェーズ: ${phaseLabels[integratedState.session.currentPhase]} / 直近操作: ${latest ? latest.type : "なし"}</div>`;
  byId("brief-meeting-summary").innerHTML = `
    <ul>
      <li>発言偏在: ${byId("speaker-balance")?.textContent || "-"}</li>
      <li>未発言者: ${byId("silence-ratio")?.textContent || "-"}</li>
      <li>会議論点: ${topics[0] || "主要論点を会議で確認"}</li>
    </ul>`;
  byId("brief-ai-summary").innerHTML = `
    <div>推奨判定: <strong>${outcomeJa(p0.recommendedOutcome)}</strong> / 信頼度: ${p0.confidence}</div>
    <div class="muted">懸念: ${concerns.join(" / ") || "特記事項なし"}</div>`;
  byId("brief-nudge-summary").innerHTML = `
    <div>採用: <strong>${nudgeAccepted}</strong> 件 / 見送り: <strong>${nudgeDismissed}</strong> 件</div>
    <div class="muted">この評価対象者の会議運営ログとして監査へ記録</div>`;
  byId("brief-audit-status").innerHTML = `
    <div>ロック状態: <strong>${r.finalizedFlag ? "確定済み" : "未確定"}</strong></div>
    <div>hash整合: <strong>${hashOk ? "OK" : "要確認"}</strong></div>
    <div class="muted">例外解除: ${integratedState.decision.unlockApproved ? "承認中" : "なし"}</div>`;
}

function showToast(message) {
  const el = byId("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add("hidden"), 2200);
}

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + Number(b || 0), 0) / nums.length;
}

function outcomeJa(v) {
  if (v === "Promote") return "昇進推奨";
  if (v === "Hold") return "据え置き";
  return "育成優先";
}

function renderRadarSvg(scores) {
  const keys = Object.keys(scores).slice(0, 9);
  const values = keys.map((k) => Number(scores[k] || 0));
  if (!keys.length) return "<div class='muted'>データなし</div>";
  const cx = 60; const cy = 60; const r = 46;
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    const rr = (v / 100) * r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
  const axis = values.map((_, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="#5a5c67" stroke-width="1"/>`;
  }).join("");
  return `<svg viewBox="0 0 120 120"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#5a5c67" stroke-width="1"/>${axis}<polygon points="${pts}" fill="rgba(255,230,0,0.35)" stroke="#ffe600" stroke-width="2"/></svg>`;
}

function resetMeetingPanel() {
  integratedState.meeting.nudgeLog = [];
  integratedState.meeting.speakerDurations = {};
  integratedState.meeting.timeline = [];
  integratedState.meeting.eventLog = [];
  integratedState.meeting.replayRunning = false;
  integratedState.meeting.replayScenarioId = null;
  integratedState.session.currentPhase = "PreCheck";
  byId("timeline").innerHTML = "";
  byId("nudge-panel").innerHTML = "<span class='muted'>ナッジ待機中</span>";
  byId("agenda-progress").textContent = "-";
  byId("speaker-balance").textContent = "-";
  byId("silence-ratio").textContent = "-";
  const runBtn = byId("run-scenario");
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.textContent = "シナリオ実行";
  }
  renderEventLog();
  renderPhaseStepper();
  renderFinalizeBrief();
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
    appendAudit("nudge_accepted", `${type}を採用`, null, { type, sec }, "facilitator_demo");
    byId("nudge-panel").innerHTML = "<span class='chip'>採用済み</span>";
    showToast(`${integratedState.session.selectedCandidateId} ${type}採用 -> 監査/分析へ反映`);
    recomputeAnalytics();
    renderFinalizePanel();
    renderFinalizeBrief();
  });
  byId("dismiss-nudge").addEventListener("click", () => {
    integratedState.meeting.nudgeLog.push({ type, decision: "dismissed", sec });
    dispatchEvent("nudge_dismissed", { type, sec });
    appendAudit("nudge_dismissed", `${type}を見送り`, null, { type, sec }, "facilitator_demo");
    byId("nudge-panel").innerHTML = "<span class='chip'>見送り</span>";
    showToast(`${integratedState.session.selectedCandidateId} ${type}見送り -> 監査/分析へ反映`);
    recomputeAnalytics();
    renderFinalizePanel();
    renderFinalizeBrief();
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

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function runScenario() {
  if (integratedState.meeting.replayRunning) return;
  resetMeetingPanel();
  const scenarioId = byId("scenario-select").value;
  const scenario = integratedState.masterData.meetingScenarios.find((s) => s.scenarioId === scenarioId);
  if (!scenario) return;
  integratedState.meeting.replayRunning = true;
  integratedState.meeting.replayScenarioId = scenarioId;
  byId("run-scenario").disabled = true;
  byId("run-scenario").textContent = "再生中...";
  dispatchEvent("meeting_started", { scenarioId });
  byId("agenda-progress").textContent = `${scenario.name} / 議題 ${scenario.agenda.length}件`;
  const speakers = [...new Set(scenario.utterances.map((u) => u.speakerId))].length;
  const timeline = byId("timeline");
  const lastNudgeSecRef = { value: -999 };
  for (const u of scenario.utterances) {
    const row = document.createElement("div");
    row.className = "log-line";
    row.innerHTML = `<strong>#${u.seq} ${u.speakerName}</strong> <span class="chip">${u.stance}</span><div class="muted">${u.content}</div>`;
    timeline.appendChild(row);
    const metrics = updateMeetingMetrics(u, speakers);
    maybeNudge(scenario, u, metrics, lastNudgeSecRef);
    await sleep(2000);
  }
  integratedState.meeting.replayRunning = false;
  byId("run-scenario").disabled = false;
  byId("run-scenario").textContent = "シナリオ実行";
  recomputeAnalytics();
  renderPhaseStepper();
}

function renderFinalizePanel() {
  const r = currentRecord();
  if (!r) return;
  byId("ai-human-summary").innerHTML = `
    <div><strong>評価対象者:</strong> ${currentCandidate()?.name || "-"}（${r.candidateId}）</div>
    <div>AI案: <strong>${outcomeJa(r.aiOutcome)} (${r.aiOutcome})</strong></div>
    <div>現在値: <strong>${outcomeJa(r.humanOutcome)} (${r.humanOutcome})</strong></div>
    <div>lockVersion: ${r.lockVersion}</div>`;
  byId("human-outcome").value = r.humanOutcome;
  byId("delta-reason").value = r.deltaReason || "";
  byId("context-tags").value = (r.contextTags || []).join(",");
  byId("decider").value = r.finalizedBy || "";
  byId("finalize-status").textContent = r.finalizedFlag ? `確定済み: ${r.finalizedBy} / ${r.finalizedAt}` : "未確定";
  byId("lock-state").textContent = r.finalizedFlag ? "ロック状態" : "未ロック";
  byId("request-unlock").disabled = !r.finalizedFlag;

  const readOnly = r.finalizedFlag && !integratedState.decision.unlockApproved;
  ["human-outcome", "delta-reason", "context-tags", "decider"].forEach((id) => { byId(id).disabled = readOnly; });
  byId("finalize").disabled = readOnly;

  const expected = calcRecordHash(r);
  const ok = expected === r.recordHash;
  byId("hash-status").innerHTML = `<div>記録ハッシュ: <code>${r.recordHash}</code></div><div>照合値: <code>${expected}</code></div><div>${ok ? "整合性OK" : "整合性要確認"}</div>`;
  byId("tamper-banner").classList.toggle("hidden", ok);
  const history = integratedState.audit.events.filter((a) => a.candidateId === r.candidateId);
  byId("audit-log").innerHTML = history.map((h) => `<div class="log-line"><div>${h.eventType} / ${h.eventAt}</div><div class="muted">${h.reason}</div></div>`).join("");
  const nudgeHist = integratedState.audit.events.filter((e) => e.candidateId === r.candidateId && (e.eventType === "nudge_accepted" || e.eventType === "nudge_dismissed"));
  byId("nudge-audit-log").innerHTML = nudgeHist.length
    ? nudgeHist.map((h) => `<div class="log-line"><span class="mono">${h.eventType}</span> ${h.reason}</div>`).join("")
    : "<div class='muted'>まだ記録なし</div>";
  const tName = currentCandidate()?.name || "-";
  const ft = byId("finalize-title-text");
  const at = byId("audit-title-text");
  if (ft) ft.textContent = `最終判断（${tName}）`;
  if (at) at.textContent = `ロック・例外解除（${tName}）`;
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
  renderFinalizeBrief();
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
  renderFinalizeBrief();
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
      <div class="kpi-card-title"><span>${k.label}</span>${helpButtonHtml(`kpi_${k.id}`)}</div>
      <div class="kpi-score">${k.score}</div>
      <div class="${k.delta >= 0 ? "delta-up" : "delta-down"}">${k.delta >= 0 ? "+" : ""}${k.delta}${k.unit}</div>
      <div class="hint">${kpiHint(k.id)}</div>
    </div>`).join("");
  document.querySelectorAll(".kpi-card").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest(".help-btn")) return;
      openDrilldown(el.dataset.kpi);
    });
  });

  byId("chart-participation").innerHTML = s.charts.participationTrend.map((d) => barRow(d.meeting, d.value)).join("");
  byId("chart-nudge").innerHTML = s.charts.nudgeStacked.map((d) => `${barRow(`${d.type} shown`, d.shown, 10)}${barRow(`${d.type} accepted`, d.accepted, 10, "ok")}`).join("");
  byId("chart-gap").innerHTML = s.charts.aiHumanGapDistribution.map((d) => `<div class="bar-row"><div><button class="chip gap-btn" data-cid="${d.candidateId}">${d.candidateId}</button></div><div class="bar-bg"><div class="bar-fill warn" style="width:${Math.min(100, d.gap * 3)}%"></div></div><div>${d.gap}</div></div>`).join("");
  document.querySelectorAll(".gap-btn").forEach((b) => b.addEventListener("click", () => {
    byId("drilldown").innerHTML = `<div>評価対象者 ${b.dataset.cid} の根拠: <span class="mono">final_decisions:${b.dataset.cid}</span></div>`;
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

function kpiHint(id) {
  const map = {
    participation_equity: "発言の偏りが小さいほど高評価",
    nudge_effectiveness: "ナッジ採用後の改善度",
    explainability: "根拠付きで説明できる割合",
    collaboration_quality: "議論の質と合意形成の健全性",
    calibration_gap: "AIと最終判断の差の収束度",
  };
  return map[id] || "";
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

  const c = currentCandidate();
  const p0 = currentP0();
  const r = currentRecord();
  const nudgeAccepted = integratedState.meeting.nudgeLog.filter((x) => x.decision === "accepted").length;
  const nudgeDismissed = integratedState.meeting.nudgeLog.filter((x) => x.decision === "dismissed").length;
  const phaseSummary = `${phaseLabels[integratedState.session.currentPhase]}時点`;
  integratedState.analytics.generatedReport = {
    generatedAt: new Date().toISOString(),
    snapshotId: `snapshot-${Date.now()}`,
  };
  const reportHtml = `
    <p><strong>会議概要</strong><br>${c?.name || "-"} / ${phaseSummary}</p>
    <p><strong>結論</strong><br>${t.executiveSummaryTemplate}</p>
    <p><strong>AI総合判定と最終判断</strong><br>AI: ${outcomeJa(p0?.recommendedOutcome)} / 人間最終: ${outcomeJa(r?.humanOutcome)}</p>
    <p><strong>ナッジ採否結果</strong><br>採用 ${nudgeAccepted}件 / 見送り ${nudgeDismissed}件</p>
    <p><strong>根拠（KPI）</strong><br>${kpiSummary}</p>
    <p><strong>監査整合</strong><br>${governance}</p>
    <p><strong>AI判定基準との整合</strong><br>入力→判定→出力→人間補正の順で、差分理由を監査ログに記録。</p>
    <p><strong>改善アクション（提案）</strong></p>
    <ul>
      <li>担当: 評価会議Chair / 期限: 次回会議前 / 効果: 発言偏在-15%</li>
      <li>担当: HRBP / 期限: 2週間 / 効果: 解除申請理由の標準化</li>
      <li>担当: Manager / 期限: 月次 / 効果: 乖離上位案件の再発防止</li>
    </ul>
    <p class="mono">snapshotId: ${integratedState.analytics.generatedReport.snapshotId}</p>`;
  byId("report-content").innerHTML = reportHtml;
  byId("report-panel").classList.remove("hidden");
  byId("report-modal-body").innerHTML = reportHtml;
  byId("report-modal").classList.remove("hidden");
  showToast("自動レポートを生成しました。全文プレビューを表示中");
  dispatchEvent("report_generated", integratedState.analytics.generatedReport);
}

function renderCriteriaSummary() {
  const text = integratedState.criteriaMd || "";
  const lines = text.split("\n").filter((l) => l.startsWith("## ") || l.startsWith("- "));
  byId("criteria-summary").innerHTML = `
    <p><strong>ガードレール:</strong> AIは提案のみ。最終決裁は人間が実施します。</p>
    <div class="grid2">
      <div class="viz-card"><strong>入力</strong><ul><li>定量（売上/粗利/品質）</li><li>定性（360コメント）</li><li>文脈タグ</li></ul></div>
      <div class="viz-card"><strong>判定</strong><ul><li>データ品質確認</li><li>9軸スコア化</li><li>バイアス検知</li></ul></div>
      <div class="viz-card"><strong>出力</strong><ul><li>推奨判定</li><li>信頼度</li><li>強み/懸念/要確認</li></ul></div>
      <div class="viz-card"><strong>人間補正</strong><ul><li>最終判断</li><li>差分理由</li><li>監査ログ</li></ul></div>
    </div>
    <details><summary>基準詳細を表示</summary><ul>${lines.slice(0, 16).map((l) => `<li>${l.replace(/^[-# ]+/, "")}</li>`).join("")}</ul></details>`;
}

function renderAiSummaryBlock() {
  const p0 = currentP0();
  if (!p0) {
    byId("ai-summary-block").innerHTML = "<div class='muted'>評価対象者を選択してください。</div>";
    return;
  }
  const strengths = (p0.explainTrace || []).slice(0, 2);
  const concerns = (p0.riskFlags || []).slice(0, 2);
  const questions = (p0.openQuestionsForCalibration || []).slice(0, 3);
  byId("ai-summary-block").innerHTML = `
    <div><strong>推奨判定:</strong> ${outcomeJa(p0.recommendedOutcome)}（${p0.recommendedOutcome}） / <strong>信頼度:</strong> ${p0.confidence}</div>
    <div class="notice">
      <strong>強み</strong>
      <ul>${strengths.map((x) => `<li>${x}</li>`).join("")}</ul>
      <strong>懸念</strong>
      <ul>${concerns.map((x) => `<li>${x}</li>`).join("")}</ul>
      <strong>会議で議論すべき題目</strong>
      <ul>${questions.map((x) => `<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="muted">AI判定基準の流れ: 入力（定量/定性/文脈）→ 判定（9軸/バイアス）→ 出力（判定/根拠）→ 人間補正（差分理由）。</div>`;
}

function renderAiSummaryAccordion() {
  const btn = byId("toggle-ai-summary");
  const block = byId("ai-summary-block");
  if (!btn || !block) return;
  const expanded = integratedState.ui.aiSummaryExpanded;
  block.classList.toggle("hidden", !expanded);
  btn.textContent = expanded ? "閉じる" : "開く";
}

function renderEventLog() {
  byId("event-log").innerHTML = integratedState.meeting.eventLog.slice(-20).reverse()
    .map((e) => `<div class="log-line"><span class="mono">${e.type}</span> <span class="muted">${e.at}</span></div>`)
    .join("");
}

function switchTab(name) {
  integratedState.session.activeTab = name;
  document.querySelectorAll("#main-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll("#mobile-tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
  byId(`tab-${name}`).classList.add("active");
}

function bindEvents() {
  byId("candidate-select").addEventListener("change", (e) => {
    integratedState.session.selectedCandidateId = e.target.value;
    onCandidateChange();
  });
  document.querySelectorAll("#main-tabs button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  document.querySelectorAll("#mobile-tabbar button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  byId("run-scenario").addEventListener("click", runScenario);
  const resetBtn = byId("reset-meeting");
  if (resetBtn) resetBtn.addEventListener("click", resetMeetingPanel);
  byId("finalize").addEventListener("click", finalizeOrEdit);
  byId("request-unlock").addEventListener("click", requestUnlock);
  byId("approve-unlock").addEventListener("click", approveUnlock);
  byId("show-audit").addEventListener("click", () => byId("audit-log").classList.toggle("hidden"));
  byId("generate-report").addEventListener("click", renderReport);
  byId("close-report-modal").addEventListener("click", () => byId("report-modal").classList.add("hidden"));
  byId("close-report-modal-footer").addEventListener("click", () => byId("report-modal").classList.add("hidden"));
  byId("save-pdf").addEventListener("click", () => window.print());
  byId("print-report").addEventListener("click", () => window.print());
  const aiSummaryBtn = byId("toggle-ai-summary");
  if (aiSummaryBtn) {
    aiSummaryBtn.addEventListener("click", () => {
      integratedState.ui.aiSummaryExpanded = !integratedState.ui.aiSummaryExpanded;
      renderAiSummaryAccordion();
    });
  }
  const toggleBtn = byId("toggle-report");
  if (toggleBtn) toggleBtn.addEventListener("click", () => byId("report-panel").classList.toggle("hidden"));
}

async function init() {
  try {
    await loadData();
    renderCandidateSelect();
    renderPersonaStrip();
    renderScenarioSelect();
    renderPhaseStepper();
    resetMeetingPanel();
    renderSidePanel();
    renderAiSummaryBlock();
    renderAiSummaryAccordion();
    renderFinalizePanel();
    renderFinalizeBrief();
    recomputeAnalytics();
    renderCriteriaSummary();
    bindEvents();
    initHelpPopover();
  } catch (e) {
    document.body.innerHTML = `<pre>Failed to load integrated dashboard: ${e.message}</pre>`;
  }
}

init();
