const state = {
  records: [],
  audits: [],
  selectedId: null,
  unlockApproved: false,
};

function byId(id) { return document.getElementById(id); }

function simpleHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `H-${h.toString(16).toUpperCase()}`;
}

function calcRecordHash(r) {
  const tags = (r.contextTags || []).join("|");
  const raw = `${r.candidateId}|${r.humanOutcome}|${r.deltaReason}|${tags}|${r.lockVersion}`;
  return simpleHash(raw);
}

async function loadData() {
  const [fdRes, alRes] = await Promise.all([
    fetch("../../mock/final_decisions.json"),
    fetch("../../mock/audit_log.json"),
  ]);
  state.records = (await fdRes.json()).records;
  state.audits = (await alRes.json()).events;
}

function current() {
  return state.records.find((r) => r.candidateId === state.selectedId);
}

function appendAudit(eventType, reason, beforeSnapshot, afterSnapshot, actorId = "demo_user") {
  state.audits.push({
    eventType,
    actorId,
    eventAt: new Date().toISOString(),
    candidateId: state.selectedId,
    reason,
    beforeSnapshot,
    afterSnapshot,
  });
  renderAuditPanel();
}

function renderSelect() {
  const sel = byId("candidate-select");
  sel.innerHTML = "";
  state.records.forEach((r) => {
    const o = document.createElement("option");
    o.value = r.candidateId;
    o.textContent = r.candidateId;
    sel.appendChild(o);
  });
  state.selectedId = sel.value || state.records[0]?.candidateId || null;
}

function renderFinalizeForm() {
  const r = current();
  if (!r) return;
  byId("ai-human-summary").innerHTML = `
    <div>AI案: <strong>${r.aiOutcome}</strong></div>
    <div>現Human値: <strong>${r.humanOutcome}</strong></div>
    <div>lockVersion: ${r.lockVersion}</div>`;
  byId("human-outcome").value = r.humanOutcome;
  byId("delta-reason").value = r.deltaReason || "";
  byId("context-tags").value = (r.contextTags || []).join(",");
  byId("finalize-status").textContent = r.finalizedFlag
    ? `Finalized at ${r.finalizedAt} by ${r.finalizedBy}`
    : "未確定";

  const readOnly = r.finalizedFlag && !state.unlockApproved;
  ["human-outcome", "delta-reason", "context-tags", "decider"].forEach((id) => {
    byId(id).disabled = readOnly;
  });
  byId("finalize").disabled = readOnly;
}

function renderLockPanel() {
  const r = current();
  if (!r) return;
  const status = r.finalizedFlag ? "LOCKED" : "UNLOCKED";
  byId("lock-state").innerHTML = `<div>状態: <strong>${status}</strong></div>`;
  byId("request-unlock").disabled = !r.finalizedFlag;
}

function renderAuditPanel() {
  const r = current();
  if (!r) return;
  const expected = calcRecordHash(r);
  const ok = r.recordHash === expected;
  byId("hash-status").innerHTML = `
    <div>recordHash: <code>${r.recordHash}</code></div>
    <div>expected: <code>${expected}</code></div>
    <div class="${ok ? "ok" : "warn"}">整合性: ${ok ? "OK" : "Warning"}</div>`;
  byId("tamper-banner").classList.toggle("hidden", ok);

  const history = state.audits.filter((a) => a.candidateId === r.candidateId);
  byId("audit-summary").innerHTML = `
    <div>変更履歴件数: <strong>${history.length}</strong></div>
    <div>最終更新者: <strong>${history[history.length - 1]?.actorId || "-"}</strong></div>`;

  byId("audit-log").innerHTML = history.map((h, idx) => `
    <div class="log-line">
      <div><strong>#${idx + 1}</strong> ${h.eventType} / ${h.eventAt}</div>
      <div>reason: ${h.reason}</div>
      <div>before: ${JSON.stringify(h.beforeSnapshot)}</div>
      <div>after: ${JSON.stringify(h.afterSnapshot)}</div>
    </div>`).join("");
}

function refreshAll() {
  state.unlockApproved = false;
  byId("unlock-form").classList.add("hidden");
  renderFinalizeForm();
  renderLockPanel();
  renderAuditPanel();
}

function finalizeRecord() {
  const r = current();
  const decider = byId("decider").value.trim();
  const reason = byId("delta-reason").value.trim();
  if (!decider || !reason) {
    alert("決定者と差分理由は必須です。");
    return;
  }
  const before = structuredClone(r);
  r.humanOutcome = byId("human-outcome").value;
  r.deltaReason = reason;
  r.contextTags = byId("context-tags").value.split(",").map((x) => x.trim()).filter(Boolean);
  r.finalizedFlag = true;
  r.finalizedAt = new Date().toISOString();
  r.finalizedBy = decider;
  r.deciders = Array.from(new Set([...(r.deciders || []), decider]));
  r.lockVersion += 1;
  r.recordHash = calcRecordHash(r);
  appendAudit("finalize", "最終評価を確定", before, structuredClone(r), decider);
  refreshAll();
}

function requestUnlock() {
  const r = current();
  if (!r) return;
  appendAudit("unlock_request", "例外解除申請を開始", structuredClone(r), structuredClone(r), "demo_user");
  byId("unlock-form").classList.remove("hidden");
}

function approveUnlock() {
  const r = current();
  const reason = byId("unlock-reason").value.trim();
  const impact = byId("unlock-impact").value.trim();
  const approver = byId("unlock-approver").value.trim();
  if (!reason || !impact || !approver) {
    alert("解除理由・影響範囲・承認者は必須です。");
    return;
  }
  const before = structuredClone(r);
  r.unlockRequest = {
    reason,
    impact,
    approver,
    approvedAt: new Date().toISOString(),
  };
  state.unlockApproved = true;
  appendAudit("unlock_approved", `例外解除承認: ${reason}`, before, structuredClone(r), approver);
  refreshAll();
}

function editAfterUnlock() {
  const r = current();
  if (!state.unlockApproved) return;
  const before = structuredClone(r);
  r.humanOutcome = byId("human-outcome").value;
  r.deltaReason = byId("delta-reason").value.trim();
  r.contextTags = byId("context-tags").value.split(",").map((x) => x.trim()).filter(Boolean);
  r.lockVersion += 1;
  r.recordHash = calcRecordHash(r);
  appendAudit("edit_after_unlock", "例外解除後の編集", before, structuredClone(r), "demo_editor");
  state.unlockApproved = false;
  refreshAll();
}

function bindEvents() {
  byId("candidate-select").addEventListener("change", (e) => {
    state.selectedId = e.target.value;
    refreshAll();
  });
  byId("reload").addEventListener("click", refreshAll);
  byId("finalize").addEventListener("click", () => {
    const r = current();
    if (r.finalizedFlag && state.unlockApproved) {
      editAfterUnlock();
      return;
    }
    finalizeRecord();
  });
  byId("request-unlock").addEventListener("click", requestUnlock);
  byId("approve-unlock").addEventListener("click", approveUnlock);
  byId("show-audit").addEventListener("click", () => {
    byId("audit-log").classList.toggle("hidden");
  });
}

async function init() {
  try {
    await loadData();
    renderSelect();
    bindEvents();
    refreshAll();
  } catch (e) {
    document.body.innerHTML = `<pre>Failed: ${e.message}</pre>`;
  }
}

init();
