(() => {
  "use strict";

  const C = window.SoulKaleidoscopeCore;
  const engine = C.createEngine(window.LUNAR_DATA);
  const $ = (id) => document.getElementById(id);
  const ids = [
    "calcForm","name","solarBirth","birthTime","queryDate","lunarYear","lunarMonth","lunarDay","lunarLeap",
    "lunarAdjustNote","autoLunarBtn","resetBtn","lookupNotice","queryLunarText","summaryName","summaryQueryDate",
    "summaryQueryLunar","summarySolarStatus","summaryLunarStatus","summaryLunarBirthdayDate","summaryLunarAdjustment",
    "summaryTimeRule","solarBirthdayCell","lunarBirthdayCell","solarFlowYear","solarPosition","solarFlowMonth","solarFlowDay",
    "lunarFlowYear","lunarPosition","lunarFlowMonth","lunarFlowDay","solarDetailTable","lunarDetailTable","solarHorseTable",
    "lunarHorseTable","copyQuickBtn","copyFullBtn","systemStatus","systemStatusDetail","toast"
  ];
  const el = Object.fromEntries(ids.map((id) => [id, $(id)]));
  let lastResult = null;

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
      <thead><tr><th></th>${rows.map((r) => `<th>${r.label}</th>`).join("")}</tr></thead>
      <tbody>
        <tr><th>輸入值</th>${rows.map((r) => `<td>${r.source}</td>`).join("")}</tr>
        <tr><th>主數</th>${rows.map((r) => `<td>${r.chain}</td>`).join("")}</tr>
        <tr><th>靈魂等級</th>${rows.map((r) => `<td>${r.level}</td>`).join("")}</tr>
      </tbody>`;
  }

  function renderHorse(table, value) {
    const labels = ["貴人數","日座數","日月數","第一木馬","第二木馬","第三木馬","第四木馬"];
    const values = [value.noble,value.daySeat,value.dayMoon,value.first,value.second,value.third,value.fourth];
    table.innerHTML = `<thead><tr>${labels.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody><tr>${values.map((x) => `<td>${x}</td>`).join("")}</tr></tbody>`;
  }

  function render(input, result) {
    const lunarBirthText = `${input.lunarBirth.year}/${C.pad2(input.lunarBirth.month)}/${C.pad2(input.lunarBirth.day)}${input.lunarBirth.leap ? "（閏月）" : ""}`;
    el.summaryName.textContent = input.name;
    el.summaryQueryDate.textContent = C.formatDateSlash(input.queryDate);
    el.summaryQueryLunar.textContent = C.formatLunarDate(result.queryLunar);
    el.summarySolarStatus.textContent = result.solarFlow.status;
    el.summaryLunarStatus.textContent = result.lunarFlow.status;
    el.summaryLunarBirthdayDate.textContent = result.lunarFlow.birthdayGregorianDate
      ? `農曆 ${result.lunarFlow.birthdayLunarYear}/${C.pad2(input.lunarBirth.calculationMonth)}/${C.pad2(input.lunarBirth.day)} → ${C.formatDateSlash(result.lunarFlow.birthdayGregorianDate)}`
      : "需人工確認";
    el.summaryLunarAdjustment.textContent = input.lunarBirth.leap ? `閏${C.pad2(input.lunarBirth.month)}月 → 計算${C.pad2(input.lunarBirth.calculationMonth)}月` : "未遇閏月";
    el.summaryTimeRule.textContent = input.time.inputHour === 0 ? `輸入 00:${C.pad2(input.time.minute)}，計算時數 24` : `${C.pad2(input.time.inputHour)}:${C.pad2(input.time.minute)}`;

    el.solarBirthdayCell.textContent = C.formatDateSlash(el.solarBirth.value);
    el.lunarBirthdayCell.textContent = lunarBirthText;
    el.solarFlowYear.textContent = result.solarFlow.flowYear;
    el.solarPosition.textContent = result.solarFlow.position ?? "—";
    el.solarFlowMonth.textContent = result.solarFlow.flowMonth;
    el.solarFlowDay.textContent = result.solarFlow.flowDay;
    el.lunarFlowYear.textContent = result.lunarFlow.flowYear || "—";
    el.lunarPosition.textContent = result.lunarFlow.position ?? "—";
    el.lunarFlowMonth.textContent = result.lunarFlow.flowMonth || "—";
    el.lunarFlowDay.textContent = result.lunarFlow.flowDay || "—";

    renderDetail(el.solarDetailTable, result.solarSoul);
    renderDetail(el.lunarDetailTable, result.lunarSoul);
    renderHorse(el.solarHorseTable, result.solarHorse);
    renderHorse(el.lunarHorseTable, result.lunarHorse);
  }

  function resultText(full = false) {
    if (!lastResult) return "尚未計算";
    const { input, result } = lastResult;
    const lines = [
      `姓名：${input.name}`,
      `查詢日期：${C.formatDateSlash(input.queryDate)}（農曆 ${C.formatLunarDate(result.queryLunar)}）`,
      `國曆：流年 ${result.solarFlow.flowYear}｜位格 ${result.solarFlow.position}｜流月 ${result.solarFlow.flowMonth}｜流日 ${result.solarFlow.flowDay}｜${result.solarFlow.status}`,
      `農曆：流年 ${result.lunarFlow.flowYear || "—"}｜位格 ${result.lunarFlow.position ?? "—"}｜流月 ${result.lunarFlow.flowMonth || "—"}｜流日 ${result.lunarFlow.flowDay || "—"}｜${result.lunarFlow.status}`
    ];
    if (full) {
      lines.push(`國曆主數：${result.solarSoul.map((x) => `${x.label}${x.chain}(${x.level})`).join("、")}`);
      lines.push(`農曆主數：${result.lunarSoul.map((x) => `${x.label}${x.chain}(${x.level})`).join("、")}`);
      lines.push(`時間：${el.summaryTimeRule.textContent}`);
    }
    return lines.join("\n");
  }

  async function copy(full) {
    if (!lastResult) return toast("請先計算");
    await navigator.clipboard.writeText(resultText(full));
    toast(full ? "已複製完整結果" : "已複製快速結果");
  }

  el.solarBirth.addEventListener("change", () => { fillLunarFromSolar(); });
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
      lastResult = { input, result };
      render(input, result);
      notice("計算完成。國曆與農曆生日狀態已分別判定。");
      toast("計算完成");
    } catch (error) {
      notice(error.message, true);
      toast(error.message);
    }
  });

  el.resetBtn.addEventListener("click", () => {
    el.calcForm.reset();
    lastResult = null;
    document.querySelectorAll("#resultPanel strong, #resultPanel td").forEach((node) => { if (!node.closest("table[id]")) node.textContent = "—"; });
    [el.solarDetailTable, el.lunarDetailTable, el.solarHorseTable, el.lunarHorseTable].forEach((table) => table.innerHTML = "");
    el.queryLunarText.textContent = "當日農曆日期：—";
    updateLunarNote();
    notice("");
  });

  const test = engine.runSelfTests();
  el.systemStatus.textContent = test.ok ? `引擎自檢通過 ${test.passed}/${test.total}` : `引擎自檢失敗 ${test.passed}/${test.total}`;
  el.systemStatus.classList.toggle("status-pill--error", !test.ok);
  el.systemStatusDetail.textContent = test.ok ? "農曆、凌晨12點、跨年生日與靈魂等級核心案例正常。" : test.failed.map((x) => x.name).join("、");

  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
})();
