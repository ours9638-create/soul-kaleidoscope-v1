(() => {
  "use strict";

  const PREFIX = "soul-kaleidoscope.report-preview.";
  const Model = window.SoulKaleidoscopeReportModel;
  const $ = (id) => document.getElementById(id);
  const loading = $("reportLoading");
  const errorPanel = $("reportError");
  const errorText = $("reportErrorText");
  const content = $("reportContent");
  const editor = $("reportEditor");
  const modeSelect = $("reportModeSelect");
  const printButton = $("printReportBtn");
  const copyButton = $("copyReportBtn");
  const clearButton = $("clearReportBtn");
  const saveButton = $("saveReportDraftBtn");
  const resetButton = $("resetReportDraftBtn");
  const draftStatus = $("reportDraftStatus");
  const toastNode = $("reportToast");
  const overviewInput = $("reportOverviewInput");
  const focusInput = $("reportFocusInput");
  const recommendationsInput = $("reportRecommendationsInput");
  const toggleInputs = [...document.querySelectorAll("[data-section-toggle]")];

  let token = "";
  let storageKey = "";
  let payload = null;
  let state = null;
  let view = null;
  let saveTimer = null;

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    editor.hidden = true;
    errorText.textContent = message;
    errorPanel.hidden = false;
  }

  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastNode.classList.remove("show"), 2200);
  }

  function text(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : String(value);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function createInfoItem(item) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = item.label;
    dd.textContent = item.value;
    wrap.append(dt, dd);
    return wrap;
  }

  function createSummaryRow(row) {
    const tr = document.createElement("tr");
    const values = [row.calendar, row.primary, row.flowYear, row.position, row.flowMonth, row.flowDay];
    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = text(value);
      tr.append(cell);
    });
    return tr;
  }

  function createInterpretationCard(section) {
    const card = document.createElement("article");
    card.className = "interpretation-card";

    const top = document.createElement("div");
    top.className = "interpretation-card__top";
    const title = document.createElement("h3");
    title.textContent = section.title;
    const chain = document.createElement("span");
    chain.className = "interpretation-card__chain";
    chain.textContent = section.chain;
    top.append(title, chain);

    const theme = document.createElement("p");
    theme.className = "interpretation-theme";
    theme.textContent = section.number === null || section.number === undefined
      ? text(section.theme)
      : `${section.number}｜${section.theme}`;

    const clientText = document.createElement("p");
    clientText.className = "quick-client-text";
    clientText.textContent = section.clientText || `${section.observation}${section.action}`;

    card.append(top, theme, clientText);
    const blocks = [
      ["頻率觀察", section.observation],
      ["成熟展現", section.mature],
      ["失衡提醒", section.imbalance],
      ["行動建議", section.action]
    ];
    for (const [label, value] of blocks) {
      const block = document.createElement("div");
      block.className = "interpretation-block report-detail";
      const h4 = document.createElement("h4");
      const p = document.createElement("p");
      h4.textContent = label;
      p.textContent = text(value);
      block.append(h4, p);
      card.append(block);
    }

    const meta = document.createElement("div");
    meta.className = "interpretation-meta teacher-only";
    const colors = Array.isArray(section.colors) && section.colors.length ? section.colors.join("、") : "—";
    meta.textContent = `SNGL：${text(section.code)}｜角色：${text(section.role)}｜幾何：${text(section.geometry)}｜配色：${colors}`;
    card.append(meta);
    return card;
  }

  function createStageRow(row) {
    const tr = document.createElement("tr");
    for (const value of [row.label, row.source, row.chain, row.level]) {
      const td = document.createElement("td");
      td.textContent = text(value);
      tr.append(td);
    }
    return tr;
  }

  function createStructureCard(label, rows) {
    const card = document.createElement("article");
    card.className = "horse-card";
    const title = document.createElement("h3");
    title.textContent = label;
    const values = document.createElement("div");
    values.className = "horse-values";
    for (const row of rows) {
      const item = document.createElement("div");
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = row.label;
      strong.textContent = text(row.value);
      item.append(span, strong);
      values.append(item);
    }
    card.append(title, values);
    return card;
  }

  function renderWarnings() {
    const node = $("reportWarnings");
    node.replaceChildren();
    if (!view.warnings.length) {
      node.hidden = true;
      return;
    }
    const title = document.createElement("strong");
    title.textContent = "正式交付前請核對";
    const list = document.createElement("ul");
    for (const warning of view.warnings) {
      const item = document.createElement("li");
      item.textContent = warning;
      list.append(item);
    }
    node.append(title, list);
    node.hidden = false;
  }

  function renderNotesOutput() {
    $("noteOverviewOutput").textContent = state.notes.overview || "—";
    $("noteFocusOutput").textContent = state.notes.focus || "—";
    $("noteRecommendationsOutput").textContent = state.notes.recommendations || "—";
  }

  function applyVisibility() {
    for (const section of document.querySelectorAll("[data-report-section]")) {
      section.hidden = !state.visibility[section.dataset.reportSection];
    }
  }

  function syncControls() {
    modeSelect.value = state.mode;
    for (const checkbox of toggleInputs) checkbox.checked = Boolean(state.visibility[checkbox.dataset.sectionToggle]);
    overviewInput.value = state.notes.overview;
    focusInput.value = state.notes.focus;
    recommendationsInput.value = state.notes.recommendations;
  }

  function render() {
    view = Model.build(payload.profile, state);
    document.body.dataset.reportMode = state.mode;
    $("reportModeLabel").textContent = view.modeLabel;
    $("reportSubject").textContent = view.subjectName;
    $("reportGeneratedAt").textContent = `報告產生：${formatDateTime(payload.createdAt || view.generatedAt)}`;

    $("basicInfo").replaceChildren(...view.basicInfo.map(createInfoItem));
    $("numerologySummary").replaceChildren(...view.summaryRows.map(createSummaryRow));
    $("reportSections").replaceChildren(...view.interpretations.map(createInterpretationCard));
    const annualItems = [...view.annualInterpretations, ...(view.annualSummary ? [view.annualSummary] : [])];
    $("annualSections").replaceChildren(...annualItems.map(createInterpretationCard));
    $("solarStages").replaceChildren(...view.stages.solar.map(createStageRow));
    $("lunarStages").replaceChildren(...view.stages.lunar.map(createStageRow));
    $("horseCards").replaceChildren(
      createStructureCard("國曆靈魂數字結構", view.structures.solar),
      createStructureCard("農曆靈魂數字結構", view.structures.lunar)
    );
    renderNotesOutput();
    renderWarnings();
    applyVisibility();
    syncControls();

    $("reportVersions").textContent = [
      `報告版本 ${view.modeLabel}`,
      `Soul Profile ${view.versions.profile}`,
      `計算引擎 ${view.versions.engine}`,
      `SNGL Report ${view.versions.report}`,
      `SNGL Data ${view.versions.data}`,
      `Position Data ${view.versions.positionData}`,
      `Report View ${view.versions.view}`,
      "本報告依目前已核准資料產生。"
    ].join("｜");

    loading.hidden = true;
    errorPanel.hidden = true;
    editor.hidden = false;
    content.hidden = false;
    document.title = `${view.subjectName}｜${view.modeLabel}｜靈魂萬花筒報告`;
  }

  function currentStateFromInputs() {
    state.notes = Model.normalizeNotes({
      overview: overviewInput.value,
      focus: focusInput.value,
      recommendations: recommendationsInput.value
    });
  }

  function saveDraft({ announce = true } = {}) {
    if (!payload || !state) return;
    currentStateFromInputs();
    payload.draft = {
      version: 1,
      mode: state.mode,
      visibility: { ...state.visibility },
      notes: { ...state.notes },
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    draftStatus.textContent = `已儲存 ${formatDateTime(payload.draft.updatedAt)}`;
    draftStatus.classList.remove("is-dirty");
    if (announce) toast("報告草稿已儲存");
  }

  function scheduleSave() {
    currentStateFromInputs();
    renderNotesOutput();
    draftStatus.textContent = "尚未儲存";
    draftStatus.classList.add("is-dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { saveDraft({ announce: false }); } catch { draftStatus.textContent = "自動儲存失敗"; }
    }, 700);
  }

  async function copyPlainText() {
    currentStateFromInputs();
    const latestView = Model.build(payload.profile, state);
    const reportText = Model.plainText(latestView, state);
    try {
      await navigator.clipboard.writeText(reportText);
      toast("已複製目前報告內容");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = reportText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      toast(copied ? "已複製目前報告內容" : "無法存取剪貼簿");
    }
  }

  function loadState() {
    const draft = payload.draft || {};
    const mode = Model.normalizeMode(draft.mode || "full");
    return {
      mode,
      visibility: Model.normalizeVisibility(mode, draft.visibility),
      notes: Model.normalizeNotes(draft.notes)
    };
  }

  token = decodeURIComponent(location.hash.slice(1));
  if (!token || !/^[A-Za-z0-9_-]{8,120}$/.test(token)) {
    showError("報告識別碼不存在或格式不正確，請回到計算器重新產生。");
    return;
  }

  storageKey = `${PREFIX}${token}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error("找不到此報告，可能已清除或由其他瀏覽器建立。");
    payload = JSON.parse(raw);
    if (!payload?.profile?.source || !payload?.profile?.numerology) throw new Error("報告資料格式不完整。");
    if (Number(payload.expiresAt) && Date.now() > Number(payload.expiresAt)) {
      localStorage.removeItem(storageKey);
      throw new Error("此報告預覽已超過 24 小時，請回到計算器重新產生。");
    }
    if (!Model) throw new Error("報告模型未正確載入，請重新整理或查看部署紀錄。");
    state = loadState();
    render();
    draftStatus.textContent = payload.draft?.updatedAt ? `已儲存 ${formatDateTime(payload.draft.updatedAt)}` : "尚未修改";
  } catch (error) {
    showError(error.message || "報告資料無法讀取。");
    return;
  }

  modeSelect.addEventListener("change", () => {
    state.mode = Model.normalizeMode(modeSelect.value);
    state.visibility = Model.normalizeVisibility(state.mode);
    render();
    scheduleSave();
  });

  for (const checkbox of toggleInputs) {
    checkbox.addEventListener("change", () => {
      state.visibility[checkbox.dataset.sectionToggle] = checkbox.checked;
      applyVisibility();
      scheduleSave();
    });
  }

  [overviewInput, focusInput, recommendationsInput].forEach((input) => input.addEventListener("input", scheduleSave));

  saveButton.addEventListener("click", () => {
    try { saveDraft(); } catch (error) { toast(error?.name === "QuotaExceededError" ? "本機儲存空間不足" : "無法儲存報告草稿"); }
  });

  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("確定重設報告模式、段落與補充文字？原計算結果不會刪除。");
    if (!confirmed) return;
    state = {
      mode: "full",
      visibility: Model.normalizeVisibility("full"),
      notes: Model.normalizeNotes()
    };
    delete payload.draft;
    localStorage.setItem(storageKey, JSON.stringify(payload));
    render();
    draftStatus.textContent = "已重設";
    toast("報告設定已重設");
  });

  copyButton.addEventListener("click", copyPlainText);
  printButton.addEventListener("click", () => {
    try { saveDraft({ announce: false }); } catch { /* 列印仍可繼續 */ }
    window.print();
  });
  clearButton.addEventListener("click", () => {
    const confirmed = window.confirm("確定清除此報告預覽與草稿？清除後重新整理將無法再顯示。");
    if (!confirmed) return;
    localStorage.removeItem(storageKey);
    location.href = "./";
  });
})();
