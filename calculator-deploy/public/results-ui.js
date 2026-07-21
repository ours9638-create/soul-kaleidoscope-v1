(() => {
  "use strict";

  const VisualModel = window.SoulKaleidoscopeVisualModel;
  const tabs = [...document.querySelectorAll("[data-result-tab]")];
  const panels = [...document.querySelectorAll("[data-result-view]")];
  const corePanels = [...document.querySelectorAll("[data-result-calendar]")];
  const annualList = document.getElementById("annualInterpretationList");
  const annualStatus = document.getElementById("annualInterpretationStatus");
  const kaleidoscopeBody = document.getElementById("kaleidoscopeRows");
  const kaleidoscopeStatus = document.getElementById("kaleidoscopeStatus");
  const copyButton = document.getElementById("copyKaleidoscopeBtn");
  let currentVisualModel = null;

  function activateTab(name, { scroll = false } = {}) {
    const target = tabs.some((tab) => tab.dataset.resultTab === name) ? name : "overview";
    for (const tab of tabs) {
      const active = tab.dataset.resultTab === target;
      tab.setAttribute("aria-selected", String(active));
      tab.classList.toggle("is-active", active);
      tab.tabIndex = active ? 0 : -1;
    }
    const calendarTarget = target === "solar" || target === "lunar";
    for (const panel of panels) panel.hidden = calendarTarget || panel.dataset.resultView !== target;
    for (const panel of corePanels) panel.classList.toggle("is-focused-calendar", calendarTarget && panel.dataset.resultCalendar === target);
    if (scroll) {
      const destination = calendarTarget
        ? document.querySelector(`[data-result-calendar="${target}"]`)
        : document.getElementById("results");
      destination?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function createAnnualCard(section, featured = false) {
    const article = document.createElement("article");
    article.className = featured ? "annual-card annual-card--featured" : "annual-card";

    const top = document.createElement("div");
    top.className = "annual-card__top";
    const title = document.createElement("h3");
    title.textContent = section.title || "年度解讀";
    const chain = document.createElement("span");
    chain.textContent = section.chain || "—";
    top.append(title, chain);

    const theme = document.createElement("p");
    theme.className = "annual-card__theme";
    theme.textContent = section.theme || "—";

    const body = document.createElement("p");
    body.className = "annual-card__body";
    body.textContent = section.clientText || `${section.observation || ""}${section.action || ""}` || "—";

    article.append(top, theme, body);
    return article;
  }

  function renderAnnual(profile) {
    annualList?.replaceChildren();
    const report = profile?.outputs?.report;
    if (!report) {
      if (annualStatus) annualStatus.textContent = "完成計算後顯示國曆、農曆與雙曆年度整合解讀。";
      return;
    }

    const sections = Array.isArray(report.annualSections) ? report.annualSections : [];
    const cards = sections.map((section) => createAnnualCard(section));
    if (report.annualSummary) cards.push(createAnnualCard(report.annualSummary, true));
    annualList?.replaceChildren(...cards);
    if (annualStatus) annualStatus.textContent = cards.length ? `已建立 ${cards.length} 個年度解讀段落。` : "目前沒有可顯示的年度解讀。";
  }

  function renderKaleidoscope(profile) {
    kaleidoscopeBody?.replaceChildren();
    currentVisualModel = null;
    if (!profile || !VisualModel) {
      if (kaleidoscopeStatus) kaleidoscopeStatus.textContent = "完成計算後建立固定位置核對表。";
      if (copyButton) copyButton.disabled = true;
      return;
    }

    try {
      currentVisualModel = VisualModel.build(profile);
      profile.outputs.soulKaleidoscope = currentVisualModel;
      const rows = currentVisualModel.rows.map((row) => {
        const tr = document.createElement("tr");
        for (const value of [row.position, row.label, row.value, row.source]) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.append(td);
        }
        return tr;
      });
      kaleidoscopeBody?.replaceChildren(...rows);
      if (kaleidoscopeStatus) {
        const timeNote = currentVisualModel.birthTimeStatus === "unknown" ? "｜出生時間未知；本圖僅使用日期與年度資料" : "";
        kaleidoscopeStatus.textContent = `${currentVisualModel.subjectName}｜${currentVisualModel.queryDate}｜${currentVisualModel.birthdayStatus}${timeNote}。圖像生成前請先核對所有位置。`;
      }
      if (copyButton) copyButton.disabled = false;
    } catch (error) {
      if (kaleidoscopeStatus) kaleidoscopeStatus.textContent = error.message || "無法建立靈魂萬花圖核對資料。";
      if (copyButton) copyButton.disabled = true;
    }
  }

  async function copyKaleidoscope() {
    if (!currentVisualModel || !VisualModel) return;
    const text = VisualModel.plainText(currentVisualModel);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    if (kaleidoscopeStatus) kaleidoscopeStatus.textContent = "已複製靈魂萬花圖數字位置核對表。";
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => activateTab(tab.dataset.resultTab, { scroll: ["solar", "lunar"].includes(tab.dataset.resultTab) }));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const nextIndex = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activateTab(tabs[nextIndex].dataset.resultTab);
    });
  }

  for (const trigger of document.querySelectorAll("[data-open-result-tab]")) {
    trigger.addEventListener("click", () => activateTab(trigger.dataset.openResultTab, { scroll: true }));
  }

  copyButton?.addEventListener("click", copyKaleidoscope);

  window.addEventListener("soul-profile-updated", (event) => {
    const profile = event.detail?.profile || null;
    renderAnnual(profile);
    renderKaleidoscope(profile);
  });

  activateTab("overview");
  renderAnnual(window.__SOUL_PROFILE__ || null);
  renderKaleidoscope(window.__SOUL_PROFILE__ || null);
})();
