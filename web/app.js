"use strict";

const CATEGORY_LABELS = {
  refund_return: "退款退货", logistics: "物流配送", device_issue: "设备故障",
  account_activation: "账号激活", payment_invoice: "支付发票", complaint_feedback: "投诉建议",
  unknown: "待确认",
};
const STATUS_LABELS = {
  new: "新建", triaged: "已分诊", in_progress: "处理中", waiting_customer: "等待客户",
  awaiting_human: "待人工", resolved: "已解决", closed: "已关闭",
};
const REASON_LABELS = {
  low_confidence: "分类置信度不足", knowledge_gap: "知识库依据不足", tool_failure: "工单 API 调用失败",
  sensitive_safety: "涉及人身与设备安全", sensitive_privacy: "涉及隐私数据",
  sensitive_payment_fraud: "涉及支付欺诈", sensitive_legal: "涉及法律风险",
};
const SAMPLES = {
  refund: { subject: "不是物流问题，是退款未到账", description: "不是物流问题，而是订单 ORD-20260831011 的退款一直没到账，金额 399 元。", failure: false },
  rag: { subject: "设备无法开机", description: "Watch X2 今天突然黑屏，使用原装充电器 30 分钟后仍然无法开机。", failure: false },
  sensitive: { subject: "充电时设备冒烟", description: "Phone Z5 充电时冒烟并有起火风险，我已经停止使用。", failure: false },
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const percent = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : "—";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `请求失败（${response.status}）`);
    error.status = response.status;
    error.code = payload?.error?.code || "REQUEST_FAILED";
    throw error;
  }
  return payload;
}

function switchView(view) {
  qsa("[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  qsa(".view-panel").forEach((panel) => { panel.hidden = panel.id !== `${view}-view`; });
  qs("#operations-kpis").hidden = view === "insights";
  if (view === "queue") loadTickets();
  if (view === "insights") loadEvaluation();
}

function handleTabKeydown(event) {
  const tabs = qsa('.view-tabs [role="tab"]');
  const currentIndex = tabs.indexOf(event.currentTarget);
  let nextIndex;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else return;
  event.preventDefault();
  switchView(tabs[nextIndex].dataset.view);
  tabs[nextIndex].focus();
}

function validateForm() {
  const fields = [
    { element: qs("#subject"), message: "请填写工单主题。" },
    { element: qs("#description"), message: "请填写问题描述。" },
  ];
  const errors = [];
  fields.forEach(({ element, message }) => {
    const invalid = !element.value.trim();
    element.setAttribute("aria-invalid", String(invalid));
    qs(`#${element.id}-error`).textContent = invalid ? message : "";
    if (invalid) errors.push({ id: element.id, message });
  });
  const summary = qs("#error-summary");
  if (errors.length) {
    qs("#error-list").innerHTML = errors.map((item) => `<li><a href="#${item.id}">${escapeHtml(item.message)}</a></li>`).join("");
    summary.hidden = false;
    summary.focus();
    return false;
  }
  summary.hidden = true;
  return true;
}

function renderResultLoading() {
  const panel = qs(".result-panel");
  const route = qs("#result-route");
  panel.setAttribute("aria-busy", "true");
  route.textContent = "处理中";
  route.className = "route-badge neutral";
  qs("#result-content").className = "result-loading";
  qs("#result-content").innerHTML = `
    <div class="loading-copy">
      <strong>Agent 正在分析工单</strong>
      <span>正在分类、检索知识并准备工具调用。</span>
    </div>
    <div class="loading-banner skeleton" aria-hidden="true"></div>
    <div class="loading-summary" aria-hidden="true"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>
    <div class="loading-block skeleton" aria-hidden="true"></div>
    <div class="loading-block short skeleton" aria-hidden="true"></div>`;
}

function renderResultFailure(error) {
  qs("#result-route").textContent = "处理失败";
  qs("#result-route").className = "route-badge human";
  qs("#result-content").className = "decision-banner human";
  qs("#result-content").innerHTML = `<strong>无法完成处理</strong><p>${escapeHtml(error.message)} 请确认本地服务正常后再次运行。</p>`;
}

function renderResult(result) {
  const { analysis, answer, decision, tool, trace } = result;
  const route = qs("#result-route");
  route.textContent = decision.handoff ? "已转人工" : "自动处理";
  route.className = `route-badge ${decision.handoff ? "human" : "auto"}`;
  const reasons = decision.reasons.map((reason) => REASON_LABELS[reason] || reason);
  const extracted = Object.entries(analysis.extracted).map(([key, value]) => {
    const labels = { order_id: "订单号", product: "产品型号", amount_yuan: "金额（元）", issue_time: "问题时间", customer_emotion: "客户情绪", contact_masked: "联系方式" };
    return `<div><span>${escapeHtml(labels[key] || key)}</span><strong>${escapeHtml(value ?? "未识别")}</strong></div>`;
  }).join("");
  const citations = answer.citations.length ? answer.citations.map((item) => `
    <details>
      <summary>${escapeHtml(item.id)} · ${escapeHtml(item.title)} · ${percent(item.score)}</summary>
      <div class="citation-body"><p>${escapeHtml(item.snippet)}</p><span class="source-code">${escapeHtml(item.source)}</span></div>
    </details>`).join("") : `<p class="disclaimer">未检索到可靠引用。</p>`;
  const traceHtml = trace.map((item) => `<div class="trace-item"><code>${escapeHtml(item.step)}</code><span class="trace-status">${escapeHtml(item.status)}</span><span>${escapeHtml(item.detail)}</span></div>`).join("");
  const ticket = tool?.ticket;
  qs("#result-content").className = "result-stack";
  qs("#result-content").innerHTML = `
    <div class="decision-banner ${decision.handoff ? "human" : ""}">
      <strong>${decision.handoff ? "需要人工接管" : "已完成自动分诊"}</strong>
      <p>${decision.handoff ? escapeHtml(reasons.join("；")) : "规则、知识引用与工具调用均满足自动处理条件。"}</p>
    </div>
    <div class="result-summary">
      <div class="summary-cell"><span>分类</span><strong>${escapeHtml(analysis.label)}</strong></div>
      <div class="summary-cell"><span>优先级</span><strong class="priority-${escapeHtml(analysis.priority)}">${escapeHtml(analysis.priority)}</strong></div>
      <div class="summary-cell"><span>置信度</span><strong>${percent(analysis.confidence)}</strong></div>
    </div>
    ${ticket ? `<div class="result-section"><h3>工单已创建</h3><div class="source-code">${escapeHtml(ticket.id)} · ${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)} · v${escapeHtml(ticket.version)}</div></div>` : ""}
    <div class="result-section"><h3>知识库回答</h3><div class="answer-box"><p>${escapeHtml(answer.text)}</p></div></div>
    <div class="result-section"><h3>引用来源</h3><div class="citation-list">${citations}</div></div>
    <details class="result-disclosure">
      <summary><span>信息抽取</span><small>${Object.keys(analysis.extracted).length} 个字段</small></summary>
      <div class="disclosure-body"><div class="extracted-list">${extracted}</div></div>
    </details>
    <details class="result-disclosure">
      <summary><span>Agent 工具轨迹</span><small>${trace.length} 个步骤</small></summary>
      <div class="disclosure-body"><div class="trace-list">${traceHtml}</div></div>
    </details>`;
}

async function submitTicket(event) {
  event.preventDefault();
  if (!validateForm()) return;
  const button = qs("#submit-button");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "Agent 正在处理…";
  renderResultLoading();
  try {
    const payload = {
      subject: qs("#subject").value.trim(), description: qs("#description").value.trim(),
      channel: qs("#channel").value, customer_tier: qs("#customer-tier").value,
      action: "create", simulate_tool_failure: qs("#simulate-failure").checked,
      idempotency_key: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    const result = await api("/api/agent/run", { method: "POST", body: JSON.stringify(payload) });
    renderResult(result);
    await Promise.all([loadMetrics(), loadTickets(false)]);
  } catch (error) {
    renderResultFailure(error);
  } finally {
    qs(".result-panel").removeAttribute("aria-busy");
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.querySelector("span").textContent = "运行 Agent 并创建工单";
  }
}

function ticketRow(ticket) {
  const options = Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${ticket.status === value ? "selected" : ""}>${label}</option>`).join("");
  const feedbackId = `status-feedback-${ticket.id}`;
  return `<tr data-ticket-id="${escapeHtml(ticket.id)}" data-version="${ticket.version}" data-current-status="${escapeHtml(ticket.status)}">
    <td><span class="ticket-id">${escapeHtml(ticket.id)}</span><span class="ticket-subject" title="${escapeHtml(ticket.subject)}">${escapeHtml(ticket.subject)}</span></td>
    <td>${escapeHtml(ticket.category_label)} <strong class="priority-${escapeHtml(ticket.priority)}">${escapeHtml(ticket.priority)}</strong></td>
    <td><select class="ticket-status" aria-label="更新 ${escapeHtml(ticket.id)} 状态" aria-describedby="${escapeHtml(feedbackId)}">${options}</select></td>
    <td>${percent(ticket.category_confidence)}</td><td>${escapeHtml(ticket.updated_at.replace("T", " ").replace("+00:00", " UTC"))}</td>
    <td><div class="row-update"><button type="button" class="row-action" aria-label="保存 ${escapeHtml(ticket.id)} 状态" aria-describedby="${escapeHtml(feedbackId)}">保存状态</button><span class="row-feedback" id="${escapeHtml(feedbackId)}" role="status"></span></div></td>
  </tr>`;
}

async function loadTickets(showError = true) {
  const params = new URLSearchParams();
  if (qs("#status-filter").value) params.set("status", qs("#status-filter").value);
  if (qs("#category-filter").value) params.set("category", qs("#category-filter").value);
  params.set("limit", "50");
  try {
    const payload = await api(`/api/tickets?${params}`);
    qs("#ticket-table-body").innerHTML = payload.tickets.length ? payload.tickets.map(ticketRow).join("") : `<tr><td colspan="6" class="table-empty">暂无符合条件的工单</td></tr>`;
    qs("#queue-count").textContent = String(payload.tickets.length);
  } catch (error) {
    if (showError) qs("#ticket-table-body").innerHTML = `<tr><td colspan="6" class="table-empty">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function updateTicket(button) {
  const row = button.closest("tr");
  const select = qs(".ticket-status", row);
  const feedback = qs(".row-feedback", row);
  const previousStatus = row.dataset.currentStatus;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  select.disabled = true;
  feedback.className = "row-feedback saving";
  feedback.textContent = "正在保存";
  try {
    const payload = await api(`/api/tickets/${encodeURIComponent(row.dataset.ticketId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value, version: Number(row.dataset.version) }),
    });
    row.dataset.version = String(payload.ticket.version);
    row.dataset.currentStatus = payload.ticket.status;
    select.value = payload.ticket.status;
    feedback.className = "row-feedback success";
    feedback.textContent = "状态已保存";
    await loadMetrics();
  } catch (error) {
    select.value = previousStatus;
    feedback.className = "row-feedback error";
    feedback.textContent = error.code === "VERSION_CONFLICT"
      ? `${error.message} 当前选择已恢复。`
      : `${error.message} 当前选择已恢复，请重试。`;
  } finally {
    select.disabled = false;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function renderEvaluation(report) {
  const status = qs("#evaluation-status");
  status.textContent = report.passed ? "全部阈值通过" : "存在未达标指标";
  status.className = `pass-badge ${report.passed ? "" : "failed"}`;
  const items = [
    ["分类准确率", report.metrics.classification_accuracy], ["优先级准确率", report.metrics.priority_accuracy],
    ["信息抽取 F1", report.metrics.extraction_f1], ["引用命中率", report.metrics.citation_hit_rate],
    ["转人工召回率", report.metrics.handoff_recall], ["正常工具成功率", report.metrics.normal_tool_success_rate],
  ];
  qs("#evaluation-metrics").innerHTML = items.map(([label, value]) => `<div><span>${label}</span><strong>${percent(value)}</strong></div>`).join("");
  const comparison = report.before_after;
  qs("#comparison-card").innerHTML = `<h2>错误结果 → 优化结果</h2><p>${escapeHtml(comparison.input)}</p>
    <div class="comparison-grid"><div class="comparison-state before"><span>Baseline</span><strong>${escapeHtml(comparison.before.label)}</strong><small>${escapeHtml(comparison.before.citation_ids.join(" · "))}</small></div>
    <div class="comparison-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5"/></svg></div>
    <div class="comparison-state after"><span>Optimized</span><strong>${escapeHtml(comparison.after.label)}</strong><small>${escapeHtml(comparison.after.citation_ids.join(" · "))}</small></div></div>
    <p class="disclaimer">${escapeHtml(comparison.optimization)} 当前剩余 Bad Case：${report.bad_cases.length} 条。</p>`;
}

async function loadEvaluation() {
  try { renderEvaluation(await api("/api/evaluation/latest")); } catch (error) { qs("#evaluation-status").textContent = error.message; }
}

function updateRoi() {
  const data = Object.fromEntries(new FormData(qs("#roi-form")));
  const volume = Math.max(0, Number(data.monthly_tickets));
  const baseline = Math.max(0, Number(data.baseline_minutes));
  const rate = Math.min(1, Math.max(0, Number(data.automation_rate) / 100));
  const automated = Math.max(0, Number(data.automated_minutes));
  const review = Math.max(0, Number(data.review_minutes));
  const hourly = Math.max(0, Number(data.hourly_cost));
  const newAverage = rate * automated + (1 - rate) * review;
  const hours = Math.max(0, volume * (baseline - newAverage) / 60);
  qs("#roi-hours").textContent = hours.toFixed(1);
  qs("#roi-cost").textContent = Math.round(hours * hourly).toLocaleString("zh-CN");
  qs("#roi-fcr").textContent = "+10";
}

async function loadMetrics() {
  try {
    const payload = await api("/api/metrics");
    const operations = payload.operations;
    qs("#metric-total").textContent = String(operations.total_tickets);
    qs("#metric-awaiting-human").textContent = String(operations.by_status?.awaiting_human || 0);
    qs("#metric-automation").textContent = percent(Math.max(0, 1 - operations.handoff_rate));
    qs("#metric-confidence").textContent = percent(operations.average_confidence);
  } catch { /* health status communicates the problem */ }
}

async function initialize() {
  qsa("[data-view]").forEach((button) => {
    button.tabIndex = button.getAttribute("aria-selected") === "true" ? 0 : -1;
    button.addEventListener("click", () => switchView(button.dataset.view));
    button.addEventListener("keydown", handleTabKeydown);
  });
  qs(".brand").addEventListener("click", () => switchView("workspace"));
  qs("#ticket-form").addEventListener("submit", submitTicket);
  qsa("[data-sample]").forEach((button) => button.addEventListener("click", () => {
    const sample = SAMPLES[button.dataset.sample];
    qs("#subject").value = sample.subject; qs("#description").value = sample.description; qs("#simulate-failure").checked = sample.failure;
    qs("#subject").removeAttribute("aria-invalid"); qs("#description").removeAttribute("aria-invalid"); qs("#error-summary").hidden = true;
  }));
  ["subject", "description"].forEach((id) => qs(`#${id}`).addEventListener("input", (event) => {
    if (event.target.value.trim()) {
      event.target.removeAttribute("aria-invalid");
      qs(`#${id}-error`).textContent = "";
    }
  }));
  qs("#refresh-tickets").addEventListener("click", () => loadTickets());
  qs("#status-filter").addEventListener("change", () => loadTickets());
  qs("#category-filter").addEventListener("change", () => loadTickets());
  qs("#ticket-table-body").addEventListener("click", (event) => { if (event.target.matches(".row-action")) updateTicket(event.target); });
  qs("#ticket-table-body").addEventListener("change", (event) => {
    if (!event.target.matches(".ticket-status")) return;
    const feedback = qs(".row-feedback", event.target.closest("tr"));
    feedback.className = "row-feedback";
    feedback.textContent = "";
  });
  qs("#roi-form").addEventListener("input", updateRoi);
  updateRoi();
  try {
    const health = await api("/api/health");
    const status = qs("#system-status");
    status.className = "system-pill ready";
    status.innerHTML = `<span class="status-dot"></span>本地服务正常 · ${health.ollama_available ? "Ollama 已连接" : "确定性降级模式"}`;
  } catch {
    const status = qs("#system-status"); status.className = "system-pill error"; status.innerHTML = `<span class="status-dot"></span>本地服务未连接`;
  }
  await Promise.all([loadMetrics(), loadTickets(false), loadEvaluation()]);
}

document.addEventListener("DOMContentLoaded", initialize);
