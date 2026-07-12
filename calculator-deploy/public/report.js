(() => {
  "use strict";

  const PREFIX = "soul-kaleidoscope.report-preview.";
  const $ = (id) => document.getElementById(id);
  const loading = $("reportLoading");
  const errorPanel = $("reportError");
  const errorText = $("reportErrorText");
  const content = $("reportContent");
  const printButton = $("printReportBtn");
  const clearButton = $("clearReportBtn");

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    errorText.textContent = message;
    errorPanel.hidden = false;
  }

  function slashDate(value) {
    return String(value || "—").replaceAll("-", "/");
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

  function text(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : String(value);
  }

  function createInfoItem(label, value) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = text(value);
    wrap.append(dt, dd);
    return wrap;
  }

  function createSummaryRow(label, data) {
    const tr = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = label;
    tr.append(heading);
    for (const value of data) {
      const td = document.createElement("td");
      td.textContent = text(value);
      tr.append(td);
    }
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
    theme.textContent = `${section.number}｜${section.theme}`;

    const blocks = [
      ["頻率觀察", section.observation],
      ["成熟展現", section.mature],
      ["失衡提醒", section.imbalance],
      ["行動建議", section.action]
    ];

    card.append(top, theme);
    for (const [label, value] of blocks) {
      const block = document.createElement("div");
      block.className = "interpretation-block";
      const h4 = document.createElement("h4");
      const p = document.createElement("p");
      h4.textContent = label;
      p.textContent = text(value);
      block.append(h4, p);
      card.append(block);
    }

    const meta = document.createElement("div");
    meta.className = "interpretation-meta";
    const colors = Array.isArray(section.colors) ? section.colors.join("、") : "—";
    meta.textContent = `SNGL：${text(section.code)}｜幾何：${text(section.geometry)}｜配色：${colors}`;
    card.append(meta);
    return card;
  }

  function createHorseCard(label, horse) {
    const card = document.createElement("article");
    card.className = "horse-card";
    const title = document.createElement("h3");
    title.textContent = label;
    const values = document.createElement("div");
    values.className = "horse-values";
    const rows = [
      ["貴人數", horse?.noble],
      ["日座數", horse?.daySeat],
      ["日月綻放", horse?.dayMoon],
      ["第一木馬", horse?.first],
      ["第二木馬", horse?.second],
      ["第三木馬", horse?.third],
      ["第四木馬", horse?.fourth]
    ];
    for (const [name, value] of rows) {
      const item = document.createElement("div");
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = name;
      strong.textContent = text(value);
      item.append(span, strong);
      values.append(item);
    }
    card.append(title, values);
    return card;
  }

  function render(profile, payload) {
    const source = profile.source;
    const lunarBirth = source.lunarBirth;
    const solar = profile.numerology.solar;
    const lunar = profile.numerology.lunar;
    const report = profile.outputs?.report;

    $("reportSubject").textContent = profile.subject?.name || "未填姓名";
    $("reportGeneratedAt").textContent = `報告產生：${formatDateTime(payload.createdAt || profile.meta?.generatedAt)}`;

    const basic = $("basicInfo");
    basic.replaceChildren(
      createInfoItem("姓名", profile.subject?.name),
      createInfoItem("國曆生日", slashDate(source.solarBirthDate)),
      createInfoItem("農曆生日", `${lunarBirth.year}/${String(lunarBirth.month).padStart(2, "0")}/${String(lunarBirth.day).padStart(2, "0")}${lunarBirth.leap ? "（閏月）" : ""}`),
      createInfoItem("出生時間", source.calculationHour === 24 ? `${source.birthTime}（計算時數 24）` : source.birthTime),
      createInfoItem("查詢日期", slashDate(source.queryDate)),
      createInfoItem("查詢日農曆", profile.calendar?.queryLunar ? `${profile.calendar.queryLunar.year}/${String(profile.calendar.queryLunar.month).padStart(2, "0")}/${String(profile.calendar.queryLunar.day).padStart(2, "0")}` : "—")
    );

    const summary = $("numerologySummary");
    summary.replaceChildren(
      createSummaryRow("國曆", [solar.soulStages?.[2]?.chain, solar.flow?.flowYear, solar.flow?.position, solar.flow?.flowMonth, solar.flow?.flowDay]),
      createSummaryRow("農曆", [lunar.soulStages?.[2]?.chain, lunar.flow?.flowYear, lunar.flow?.position, lunar.flow?.flowMonth, lunar.flow?.flowDay])
    );

    const sections = $("reportSections");
    sections.replaceChildren();
    for (const section of report?.sections || []) sections.append(createInterpretationCard(section));
    if (!report?.sections?.length) {
      const empty = document.createElement("p");
      empty.textContent = "目前沒有可顯示的 SNGL 報告段落。";
      sections.append(empty);
    }

    const horses = $("horseCards");
    horses.replaceChildren(
      createHorseCard("國曆數字結構", solar.horse),
      createHorseCard("農曆數字結構", lunar.horse)
    );

    $("reportVersions").textContent = [
      `Soul Profile ${text(profile.meta?.schemaVersion)}`,
      `計算引擎 ${text(profile.meta?.engineVersion)}`,
      `SNGL Report ${text(report?.version)}`,
      `SNGL Data ${text(report?.dataVersion)}`,
      "本頁為第一版報告預覽，內容依目前已核准資料顯示。"
    ].join("｜");

    loading.hidden = true;
    errorPanel.hidden = true;
    content.hidden = false;
    document.title = `${profile.subject?.name || "個案"}｜靈魂萬花筒報告`;
  }

  const token = decodeURIComponent(location.hash.slice(1));
  if (!token || !/^[A-Za-z0-9_-]{8,120}$/.test(token)) {
    showError("報告識別碼不存在或格式不正確，請回到計算器重新產生。");
    return;
  }

  const storageKey = `${PREFIX}${token}`;
  let payload;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error("找不到此報告，可能已清除或由其他瀏覽器建立。");
    payload = JSON.parse(raw);
    if (!payload?.profile?.source || !payload?.profile?.numerology) throw new Error("報告資料格式不完整。");
    if (Number(payload.expiresAt) && Date.now() > Number(payload.expiresAt)) {
      localStorage.removeItem(storageKey);
      throw new Error("此報告預覽已超過 24 小時，請回到計算器重新產生。");
    }
    render(payload.profile, payload);
  } catch (error) {
    showError(error.message || "報告資料無法讀取。");
  }

  printButton.addEventListener("click", () => window.print());
  clearButton.addEventListener("click", () => {
    const confirmed = window.confirm("確定清除此報告預覽？清除後重新整理將無法再顯示。");
    if (!confirmed) return;
    localStorage.removeItem(storageKey);
    location.href = "./";
  });
})();
