(function (global) {
  "use strict";

  const VERSION = "2.2.0";

  const pad2 = (n) => String(Number(n)).padStart(2, "0");
  const pad4 = (n) => String(Number(n)).padStart(4, "0");
  const digitSum = (value) => String(value).replace(/\D/g, "").split("").reduce((sum, digit) => sum + Number(digit), 0);
  const reduceMod9 = (n) => Number(n) > 0 ? ((Number(n) - 1) % 9) + 1 : null;

  function chainFromNumber(n) {
    const parts = [Number(n)];
    while (parts.at(-1) >= 10) parts.push(digitSum(parts.at(-1)));
    return parts.join("/");
  }

  const finalFromChain = (chain) => Number(String(chain).split("/").at(-1));
  const parseDateString = (value) => {
    const [year, month, day] = String(value).split("-").map(Number);
    return { year, month, day, dateString: value };
  };
  const formatDateSlash = (value) => value ? value.replaceAll("-", "/") : "—";
  const formatLunarDate = (lunar) => lunar ? `${pad4(lunar.year)}/${pad2(lunar.month)}/${pad2(lunar.day)}${lunar.leap ? "（閏月）" : ""}` : "—";
  const normalizeHourForCalculation = (hour) => Number(hour) === 0 ? 24 : Number(hour);
  const effectiveLunarMonth = (month, leap) => Number(month) + (leap ? 1 : 0);
  const flowValue = (year, month, day) => chainFromNumber(digitSum(`${pad4(year)}${pad2(month)}${pad2(day)}`));

  function soulLevel(birthDigits, chain) {
    const groups = String(chain).split("/");
    const acquired = groups.slice(0, -1).join("").split("");
    const finalDigit = groups.at(-1);
    const acquiredPass = acquired.filter((digit) => birthDigits.includes(digit)).length;
    const finalPass = birthDigits.includes(finalDigit);
    const overConcentrated = "123456789".split("").some((digit) => (birthDigits.match(new RegExp(digit, "g")) || []).length >= 3);

    if (!finalPass && acquiredPass === 0) return 1;
    if (!finalPass && acquiredPass < acquired.length) return 2;
    if (!finalPass) return 3;
    if (acquiredPass === 0) return 4;
    if (acquiredPass < acquired.length) return 5;
    return overConcentrated ? 6 : 7;
  }

  function sequentialSoul(year, month, day, hour, minute) {
    const stages = [["年", year, 4], ["月", month, 2], ["日", day, 2], ["時", hour, 2], ["分", minute, 2]];
    const birthDigits = `${pad4(year)}${pad2(month)}${pad2(day)}`;
    let total = 0;

    return stages.map(([label, value, width]) => {
      total += digitSum(String(Number(value)).padStart(width, "0"));
      const chain = chainFromNumber(total);
      return { label, source: Number(value), chain, final: finalFromChain(chain), level: `${soulLevel(birthDigits, chain)}級` };
    });
  }

  function calculateHorseSet(year, month, day) {
    const yearR = reduceMod9(year);
    const monthR = reduceMod9(month);
    const dayR = reduceMod9(day);
    const first = Math.abs(monthR - dayR);
    const second = Math.abs(dayR - yearR);

    return {
      yearR,
      monthR,
      dayR,
      noble: reduceMod9(reduceMod9(monthR + dayR) + reduceMod9(dayR + yearR)),
      daySeat: dayR,
      dayMoon: reduceMod9(monthR + dayR),
      first,
      second,
      third: Math.abs(first - second),
      fourth: Math.abs(monthR - yearR)
    };
  }

  function createEngine(lunarData) {
    if (!Array.isArray(lunarData) || lunarData.length === 0) throw new TypeError("LUNAR_DATA 不存在或內容為空");

    const bySolar = new Map();
    const byLunar = new Map();

    for (const [solar, year, month, day, leapRaw] of lunarData) {
      const record = { year: Number(year), month: Number(month), day: Number(day), leap: Boolean(leapRaw), date: solar };
      bySolar.set(solar, record);
      byLunar.set(`${record.year}-${record.month}-${record.day}-${record.leap ? 1 : 0}`, solar);
    }

    const getLunarByGregorian = (date) => bySolar.get(date) || null;
    const getGregorianByLunarDate = (year, month, day, leap = false) => byLunar.get(`${Number(year)}-${Number(month)}-${Number(day)}-${leap ? 1 : 0}`) || null;

    function detectLunarLeap({ solarDate, lunarYear, lunarMonth, lunarDay }) {
      const solarLunar = getLunarByGregorian(solarDate);
      if (solarLunar && solarLunar.year === Number(lunarYear) && solarLunar.month === Number(lunarMonth) && solarLunar.day === Number(lunarDay)) {
        return { leap: solarLunar.leap, source: "solar", ambiguous: false };
      }

      const regular = getGregorianByLunarDate(lunarYear, lunarMonth, lunarDay, false);
      const leap = getGregorianByLunarDate(lunarYear, lunarMonth, lunarDay, true);
      if (leap && !regular) return { leap: true, source: "unique-leap", ambiguous: false };
      if (regular && !leap) return { leap: false, source: "unique-regular", ambiguous: false };
      return { leap: false, source: leap && regular ? "ambiguous" : "not-found", ambiguous: Boolean(leap && regular) };
    }

    function calculateFlowSolar(birth, query) {
      const birthdayDate = `${pad4(query.year)}-${pad2(birth.month)}-${pad2(birth.day)}`;
      const passed = query.dateString >= birthdayDate;
      const adoptedYear = passed ? query.year : query.year - 1;
      const ageStep = adoptedYear - birth.year + 1;

      return {
        status: passed ? "已過生日" : "尚未過生日",
        birthdayGregorianDate: birthdayDate,
        adoptedYear,
        position: reduceMod9(ageStep),
        flowYear: flowValue(adoptedYear, birth.month, birth.day),
        flowMonth: flowValue(birth.year, query.month, birth.day),
        flowDay: flowValue(birth.year, birth.month, query.day),
        needsReview: false
      };
    }

    function calculateFlowLunar(birth, query, queryLunar) {
      const calculationMonth = effectiveLunarMonth(birth.month, birth.leap);
      if (!queryLunar || calculationMonth > 12) {
        return { status: "需人工確認", needsReview: true, birthdayGregorianDate: null, position: null, flowYear: "", flowMonth: "", flowDay: "" };
      }

      const birthdayDate = getGregorianByLunarDate(queryLunar.year, calculationMonth, birth.day, false);
      if (!birthdayDate) {
        return { status: "需人工確認", needsReview: true, birthdayGregorianDate: null, position: null, flowYear: "", flowMonth: "", flowDay: "" };
      }

      const passed = query.dateString >= birthdayDate;
      const adoptedYear = passed ? queryLunar.year : queryLunar.year - 1;
      const ageStep = adoptedYear - birth.year + 1;

      return {
        status: passed ? "已過生日" : "尚未過生日",
        birthdayGregorianDate: birthdayDate,
        birthdayLunarYear: queryLunar.year,
        adoptedYear,
        position: reduceMod9(ageStep),
        flowYear: flowValue(adoptedYear, calculationMonth, birth.day),
        flowMonth: flowValue(birth.year, queryLunar.month, birth.day),
        flowDay: flowValue(birth.year, calculationMonth, queryLunar.day),
        needsReview: false
      };
    }

    function calculateAll(input) {
      const queryLunar = getLunarByGregorian(input.queryDate);
      return {
        queryLunar,
        solarFlow: calculateFlowSolar(input.solarBirth, input.query),
        lunarFlow: calculateFlowLunar(input.lunarBirth, input.query, queryLunar),
        solarSoul: sequentialSoul(input.solarBirth.year, input.solarBirth.month, input.solarBirth.day, input.time.calculationHour, input.time.minute),
        lunarSoul: sequentialSoul(input.lunarBirth.year, input.lunarBirth.calculationMonth, input.lunarBirth.day, input.time.calculationHour, input.time.minute),
        solarHorse: calculateHorseSet(input.solarBirth.year, input.solarBirth.month, input.solarBirth.day),
        lunarHorse: calculateHorseSet(input.lunarBirth.year, input.lunarBirth.calculationMonth, input.lunarBirth.day)
      };
    }

    function runSelfTests() {
      const sample = {
        name: "測試",
        solarBirth: parseDateString("1989-05-28"),
        queryDate: "2026-07-05",
        query: parseDateString("2026-07-05"),
        lunarBirth: { year: 1989, month: 4, day: 24, leap: false, calculationMonth: 4 },
        time: { inputHour: 15, calculationHour: 15, minute: 17 }
      };
      const sampleResult = calculateAll(sample);

      const bob = {
        name: "Bob",
        solarBirth: parseDateString("1989-12-28"),
        queryDate: "2026-07-06",
        query: parseDateString("2026-07-06"),
        lunarBirth: { year: 1989, month: 12, day: 1, leap: false, calculationMonth: 12 },
        time: { inputHour: 0, calculationHour: 24, minute: 0 }
      };
      const bobResult = calculateAll(bob);

      const cases = [
        ["農曆換算 2026/07/06", formatLunarDate(getLunarByGregorian("2026-07-06")), "2026/05/22"],
        ["國曆轉農曆 1989/05/28", formatLunarDate(getLunarByGregorian("1989-05-28")), "1989/04/24"],
        ["國曆轉農曆 1989/12/28", formatLunarDate(getLunarByGregorian("1989-12-28")), "1989/12/01"],
        ["跨年農曆生日", getGregorianByLunarDate(2026, 12, 1, false), "2027-01-08"],
        ["凌晨12點", normalizeHourForCalculation(0), 24],
        ["國曆年主數", sampleResult.solarSoul[0].chain, "27/9"],
        ["國曆月主數", sampleResult.solarSoul[1].chain, "32/5"],
        ["國曆主命數", sampleResult.solarSoul[2].chain, "42/6"],
        ["國曆時主數", sampleResult.solarSoul[3].chain, "48/12/3"],
        ["國曆分主數", sampleResult.solarSoul[4].chain, "56/11/2"],
        ["農曆月主數", sampleResult.lunarSoul[1].chain, "31/4"],
        ["農曆主命數", sampleResult.lunarSoul[2].chain, "37/10/1"],
        ["37/10/1 靈魂等級", sampleResult.lunarSoul[2].level, "5級"],
        ["國曆流年", sampleResult.solarFlow.flowYear, "25/7"],
        ["國曆流月", sampleResult.solarFlow.flowMonth, "44/8"],
        ["國曆流日", sampleResult.solarFlow.flowDay, "37/10/1"],
        ["農曆流年", sampleResult.lunarFlow.flowYear, "20/2"],
        ["農曆流月", sampleResult.lunarFlow.flowMonth, "38/11/2"],
        ["農曆流日", sampleResult.lunarFlow.flowDay, "34/7"],
        ["陽曆貴人數", sampleResult.solarHorse.noble, 7],
        ["陰曆貴人數", sampleResult.lunarHorse.noble, 7],
        ["陽曆第一木馬", sampleResult.solarHorse.first, 4],
        ["陰曆第一木馬", sampleResult.lunarHorse.first, 2],
        ["Bob 國曆尚未過生日", bobResult.solarFlow.status, "尚未過生日"],
        ["Bob 農曆尚未過生日", bobResult.lunarFlow.status, "尚未過生日"],
        ["Bob 國曆流年", bobResult.solarFlow.flowYear, "22/4"],
        ["Bob 農曆流年", bobResult.lunarFlow.flowYear, "13/4"]
      ];

      const tests = cases.map(([name, actual, expected]) => ({ name, actual, expected, pass: actual === expected }));
      return {
        version: VERSION,
        total: tests.length,
        passed: tests.filter((test) => test.pass).length,
        failed: tests.filter((test) => !test.pass),
        tests,
        ok: tests.every((test) => test.pass)
      };
    }

    return { getLunarByGregorian, getGregorianByLunarDate, detectLunarLeap, calculateAll, runSelfTests };
  }

  global.SoulKaleidoscopeCore = {
    VERSION,
    pad2,
    pad4,
    parseDateString,
    formatDateSlash,
    formatLunarDate,
    normalizeHourForCalculation,
    effectiveLunarMonth,
    createEngine
  };
})(globalThis);
