(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const C = window.SoulKaleidoscopeCore;
  const Profile = window.SoulKaleidoscopeProfile;
  const ReportEngine = window.SoulKaleidoscopeReport;
  const statusNode = $("systemStatus");
  const statusDetailNode = $("systemStatusDetail");

  if (
    !C || !Profile || !ReportEngine ||
    !Array.isArray(window.LUNAR_DATA) || window.LUNAR_DATA.length === 0 ||
    !window.SNGL_DATA?.numbers || !window.POSITION_DATA?.positions
  ) {
    if (statusNode) {
      statusNode.textContent = "引擎載入失敗";
      statusNode.classList.add("status-pill--error");
    }
    if (statusDetailNode) statusDetailNode.textContent = "核心程式、統一資料模型、SNGL 數字資料、位格資料或農曆資料未正確載入，請重新整理或查看部署紀錄。";
    return;
  }

  const engine = C.createEngine(window.LUNAR_DATA);
  const ids = [
    "calcForm","name","solarBirth","birthTime","queryDate","lunarYear","lunarMonth","lunarDay","lunarLeap",
    "lunarAdjustNote","autoLunarBtn","resetBtn","lookupNotice","queryLunarText","summaryName","summaryQueryDate",
    "summaryQueryLunar","summaryLunarAdjustment","summaryTimeRule","solarBirthdayCell","lunarBirthdayCell",
    "solarFlowYear","solarPosition","solarFlowMonth","solarFlowDay","lunarFlowYear","lunarPosition",
    "lunarFlowMonth","lunarFlowDay","solarDetailTable","lunarDetailTable","solarHorseTable","lunarHorseTable",
    "copyQuickBtn","copyFullBtn","systemStatus","systemStatusDetail","toast"
  ];
  const el = Object.fromEntries(ids.map((id) => [id, $(id)]));
  let lastProfile = null;

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove("show"), 1800);
  }

  function notice(message, error = false) {
    el.lookupNotice.textContent = message;
    el.lookupNotice.classList.toggle("notice--error", error);
  }

  function publishProfile(profile) {
    window.dispatchEvent(new CustomEvent("soul-profile-updated", { detail: { profile } }));
  }

  function fillLunarFromSolar() {
    const lunar = engine.getLunarByGregorian(el.solarBirth.value);
    if (!lunar) {
      notice("此日期超出農曆資料範圍，請人工輸入並確認。", true);
      return false;
    }
    el.lunarYear.value = lunar.year;
    el.lunarMonth.value = lunar.month;
    el.lunarDay.value = lunar.day;
    el.lunarLeap.checked = lunar.leap;
    updateLunarNote();
    notice(`已帶入農曆 ${C.formatLunarDate(lunar)}。`);
    return true;
  }

  function detectLeap() {
    const result = engine.detectLunarLeap({
      solarDate: el.solarBirth.value,
      lunarYear: el.lunarYear.value,
      lunarMonth: el.lunarMonth.value,
      lunarDay: el.lunarDay.value
    });
    el.lunarLeap.checked = result.leap;
    return result;
  }

  function updateLunarNote() {
    const leapInfo = detectLeap();
    const month = Number(el.lunarMonth.value || 0);
    if (!month) {
      el.lunarAdjustNote.textContent = "閏月判斷：—";
      return;
    }
    if (leapInfo.ambiguous) {
      el.lunarAdjustNote.textContent = "閏月判斷：同年月日有一般月與閏月，請以國曆生日重新帶入。";
      return;
    }
    el.lunarAdjustNote.textContent = leapInfo.leap
      ? `閏月判斷：閏${C.pad2(month)}月 → 計算${C.pad2(month + 1)}月`
      : "閏月判斷：未遇閏月";
  }

  function updateQueryLunar() {
    const lunar = engine.getLunarByGregorian(el.queryDate.value);
    const text = C.formatLunarDate(lunar);
    el.queryLunarText.textContent = `當日農曆日期：${text}`;
    el.summaryQueryLunar.textContent = text;
  }

  function readInput() {
    if (!el.solarBirth.value || !el.birthTime.value || !el.queryDate.value) throw new Error("請完整輸入國曆生日、出生時間與查詢日期。");
    if (![el.lunarYear.value, el.lunarMonth.value, el.lunarDay.value].every(Boolean)) throw new Error("農曆生日資料不完整。");
    if (el.queryDate.value < el.solarBirth.value) throw new Error("查詢日期不可早於出生日期。");

    const [hour, minute] = el.birthTime.value.split(":").map(Number);
    const solarBirth = C.parseDateString(el.solarBirth.value);
    const query = C.parseDateString(el.queryDate.value);
    const leapInfo = detectLeap();
    const lunarMonth = Number(el.lunarMonth.value);
    const calculationMonth = C.effectiveLunarMonth(lunarMonth, leapInfo.leap);

    return {
      name: el.name.value.trim() || "未填姓名",
      solarBirth,
      queryDate: el.queryDate.value,
      query,
      lunarBirth: {
        year: Number(el.lunarYear.value), month: lunarMonth, day: Number(el.lunarDay.value),
        leap: leapInfo.leap, calculationMonth
      },
      time: { inputHour: hour, calculationHour: C.normalizeHourForCalculation(hour), minute }
    };
  }

  function renderDetail(table, rows) {
    table.innerHTML = `
      <thead><tr><th></th>${rows.map((row) => `<th>${row.label}</th>`).join("")}</tr></thead>
      <tbody>
        <tr><th>輸入值</th>${rows.map((row) => `<td>${row.source}</td>`).join("")}</tr>
        <tr><th>靈魂數字</th>${rows.map((row) => `<td>${row.chain}</td>`).join("")}</tr>
        <tr><th>靈魂等級</th>${rows.map((row) => `<td>${row.level}</td>`).join("")}</tr>
      </tbody>`;
  }

  function renderHorse(table, value, dayMoonLabel) {
    const labels = ["貴人數","日座數",dayMoonLabel,"第一木馬","第二木馬","第三木馬","第四木馬"];
    const values = [value.noble,value.daySeat,value.dayMoon,value.first,value.second,value.third,value.fourth];
    table.innerHTML = `<thead><tr>${labels.map((label) => `<th>${label}</th>`).join("")}</tr></thead><tbody><tr>${values.map((item) => `<td>${item}</td>`).join("")}</tr></tbody>`;
  }

  function render(profile) {
    const source = profile.source;
    const solar = profile.numerology.solar;
    const lunar = profile.numerology.lunar;
    const lunarBirth = source.lunarBirth;
    const lunarBirthText = `${lunarBirth.year}/${C.pad2(lunarBirth.month)}/${C.pad2(lunarBirth.day)}${lunarBirth.leap ? "（閏月）" : ""}`;

    el.summaryName.textContent = profile.subject.name;
    el.summaryQueryDate.textContent = C.formatDateSlash(source.queryDate);
    el.summaryQueryLunar.textContent = C.formatLunarDate(profile.calendar.queryLunar);
    el.summaryLunarAdjustment.textContent = lunarBirth.leap ? `閏${C.pad2(lunarBirth.month)}月 → 計算${C.pad2(lunarBirth.calculationMonth)}月` : "未遇閏月";
    el.summaryTimeRule.textContent = source.calculationHour === 24 ? `輸入 ${source.birthTime}，計算時數 24` : source.birthTime;

    el.solarBirthdayCell.textContent = C.formatDateSlash(source.solarBirthDate);
    el.lunarBirthdayCell.textContent = lunarBirthText;
    el.solarFlowYear.textContent = solar.flow.flowYear;
    el.solarPosition.textContent = solar.flow.position ?? "—";
    el.solarFlowMonth.textContent = solar.flow.flowMonth;
    el.solarFlowDay.textContent = solar.flow.flowDay;
    el.lunarFlowYear.textContent = lunar.flow.flowYear || "—";
    el.lunarPosition.textContent = lunar.flow.position ?? "—";
    el.lunarFlowMonth.textContent = lunar.flow.flowMonth || "—";
    el.lunarFlowDay.textContent = lunar.flow.flowDay || "—";

    renderDetail(el.solarDetailTable, solar.soulStages);
    renderDetail(el.lunarDetailTable, lunar.soulStages);
    renderHorse(el.solarHorseTable, solar.horse, "國曆日月綻放");
    renderHorse(el.lunarHorseTable, lunar.horse, "陰曆日月綻放");
  }

  function resultText(full = false) {
    if (!lastProfile) return "尚未計算";
    const profile = lastProfile;
    const solar = profile.numerology.solar;
    const lunar = profile.numerology.lunar;
    const lines = [
      `姓名：${profile.subject.name}`,
      `查詢日期：${C.formatDateSlash(profile.source.queryDate)}（農曆 ${C.formatLunarDate(profile.calendar.queryLunar)}）`,
      `國曆：流年 ${solar.flow.flowYear}｜位格 ${solar.flow.position}｜流月 ${solar.flow.flowMonth}｜流日 ${solar.flow.flowDay}`,
      `農曆：流年 ${lunar.flow.flowYear || "—"}｜位格 ${lunar.flow.position ?? "—"}｜流月 ${lunar.flow.flowMonth || "—"}｜流日 ${lunar.flow.flowDay || "—"}`
    ];
    if (full) {
      lines.push(`國曆靈魂數字：${solar.soulStages.map((item) => `${item.label}${item.chain}(${item.level})`).join("、")}`);
      lines.push(`農曆靈魂數字：${lunar.soulStages.map((item) => `${item.label}${item.chain}(${item.level})`).join("、")}`);
      lines.push(`國曆日月綻放：${solar.horse.dayMoon}｜陰曆日月綻放：${lunar.horse.dayMoon}`);
      lines.push(`時間：${el.summaryTimeRule.textContent}`);
      lines.push(`資料版本：模型 ${profile.meta.schemaVersion}｜引擎 ${profile.meta.engineVersion}｜SNGL ${profile.outputs.report.version}｜位格資料 ${profile.outputs.report.positionDataVersion}`);
    }
    return lines.join("\n");
  }

  async function copy(full) {
    if (!lastProfile) return toast("請先計算");
    try {
      await navigator.clipboard.writeText(resultText(full));
      toast(full ? "已複製完整結果" : "已複製快速結果");
    } catch {
      toast("無法存取剪貼簿，請改用 Safari 開啟後重試");
    }
  }

  el.solarBirth.addEventListener("change", fillLunarFromSolar);
  [el.lunarYear, el.lunarMonth, el.lunarDay].forEach((node) => node.addEventListener("input", updateLunarNote));
  el.queryDate.addEventListener("change", updateQueryLunar);
  el.autoLunarBtn.addEventListener("click", fillLunarFromSolar);
  el.copyQuickBtn.addEventListener("click", () => copy(false));
  el.copyFullBtn.addEventListener("click", () => copy(true));

  el.calcForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const input = readInput();
      const result = engine.calculateAll(input);
      const profile = Profile.build({ input, result, engineVersion: C.VERSION });
      const validation = Profile.validate(profile);
      if (!validation.ok) throw new Error(`統一資料模型驗證失敗：${validation.errors.join("、")}`);
      profile.outputs.report = ReportEngine.generate(profile, window.SNGL_DATA, window.POSITION_DATA);
      lastProfile = profile;
      window.__SOUL_PROFILE__ = profile;
      render(profile);
      publishProfile(profile);
      notice("計算完成。統一資料模型、靈魂數字報告、流年位格解讀與萬花圖核對資料已同步建立。");
      toast("計算完成");
    } catch (error) {
      notice(error.message, true);
      toast(error.message);
    }
  });

  el.resetBtn.addEventListener("click", () => {
    el.calcForm.reset();
    lastProfile = null;
    delete window.__SOUL_PROFILE__;
    document.querySelectorAll("#results strong, #results td").forEach((node) => {
      if (!node.closest("table[id]")) node.textContent = "—";
    });
    [el.solarDetailTable, el.lunarDetailTable, el.solarHorseTable, el.lunarHorseTable].forEach((table) => { table.innerHTML = ""; });
    el.queryLunarText.textContent = "當日農曆日期：—";
    updateLunarNote();
    publishProfile(null);
    notice("");
  });

  const test = engine.runSelfTests();
  el.systemStatus.textContent = test.ok ? `引擎自檢通過 ${test.passed}/${test.total}` : `引擎自檢失敗 ${test.passed}/${test.total}`;
  el.systemStatus.classList.toggle("status-pill--error", !test.ok);
  el.systemStatusDetail.textContent = test.ok
    ? `核心規則 ${test.passed}/${test.total} 通過；統一模型 ${Profile.SCHEMA_VERSION}、SNGL 報告 ${ReportEngine.VERSION}、位格資料 ${window.POSITION_DATA.version} 已載入。`
    : test.failed.map((item) => item.name).join("、");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js");
        registration.update();
      } catch {
        // 不影響線上計算；離線快取暫時不可用。
      }
    });
  }
})();
