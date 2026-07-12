(function (global) {
  "use strict";

  const VERSION = "1.0.0";

  const finalNumber = (chain) => Number(String(chain || "").split("/").at(-1));

  function getEntry(number, data) {
    const entry = data?.numbers?.[String(number)];
    if (!entry) throw new Error(`SNGL 缺少數字 ${number} 的資料`);
    return entry;
  }

  function makeSection({ id, title, role, chain, number, data }) {
    const entry = getEntry(number, data);
    return {
      id,
      role,
      title,
      code: `SNGL.NUMBER.${number}`,
      number,
      chain,
      theme: entry.title,
      observation: entry.core,
      mature: entry.mature,
      imbalance: entry.imbalance,
      action: entry.action,
      geometry: entry.geometry,
      colors: [...entry.colors],
      clientText: `${title}呈現 ${number} 的「${entry.title}」頻率。${entry.core}${entry.mature}${entry.imbalance}${entry.action}`
    };
  }

  function generate(profile, data = global.SNGL_DATA) {
    if (!profile) throw new TypeError("SNGL 報告缺少統一個案資料");
    if (!data?.numbers) throw new TypeError("SNGL 數字資料尚未載入");

    const solarStages = profile.numerology.solar.soulStages;
    const lunarStages = profile.numerology.lunar.soulStages;
    const solarPrimary = solarStages[2];
    const lunarPrimary = lunarStages[2];
    const solarFlowYear = profile.numerology.solar.flow.flowYear;
    const lunarFlowYear = profile.numerology.lunar.flow.flowYear;

    const sections = [
      makeSection({
        id: "solar-primary",
        title: "國曆主命數",
        role: "core-solar",
        chain: solarPrimary.chain,
        number: finalNumber(solarPrimary.chain),
        data
      }),
      makeSection({
        id: "lunar-primary",
        title: "農曆主命數",
        role: "core-lunar",
        chain: lunarPrimary.chain,
        number: finalNumber(lunarPrimary.chain),
        data
      }),
      makeSection({
        id: "solar-flow-year",
        title: "國曆流年",
        role: "annual-solar",
        chain: solarFlowYear,
        number: finalNumber(solarFlowYear),
        data
      }),
      makeSection({
        id: "lunar-flow-year",
        title: "農曆流年",
        role: "annual-lunar",
        chain: lunarFlowYear,
        number: finalNumber(lunarFlowYear),
        data
      })
    ];

    return {
      version: VERSION,
      dataVersion: data.version,
      language: data.language,
      tone: data.tone,
      generatedAt: profile.meta.generatedAt,
      subjectName: profile.subject.name,
      sections,
      summary: sections.map((section) => `${section.title} ${section.chain}：${section.theme}`).join("；")
    };
  }

  global.SoulKaleidoscopeReport = { VERSION, generate, finalNumber };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeReport;
})(globalThis);
