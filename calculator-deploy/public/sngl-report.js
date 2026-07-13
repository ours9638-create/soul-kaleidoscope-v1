(function (global) {
  "use strict";

  const VERSION = "1.1.0";

  const finalNumber = (chain) => {
    const text = String(chain || "").trim();
    return text ? Number(text.split("/").at(-1)) : null;
  };

  function getEntry(number, data) {
    const entry = data?.numbers?.[String(number)];
    if (!entry) throw new Error(`SNGL 缺少數字 ${number} 的資料`);
    return entry;
  }

  function getPositionEntry(position, data) {
    const entry = data?.positions?.[String(position)];
    if (!entry) throw new Error(`SNGL 缺少今年位格 ${position} 的資料`);
    return entry;
  }

  function makeSection({ id, title, role, chain, number, data }) {
    const entry = getEntry(number, data);
    return {
      id,
      type: "number",
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

  function makePositionSection({ id, title, role, position, positionData, numberData }) {
    const entry = getPositionEntry(position, positionData);
    const numberEntry = getEntry(position, numberData);
    return {
      id,
      type: "position",
      role,
      title,
      code: `SNGL.POSITION.${position}`,
      number: position,
      chain: String(position),
      theme: entry.title,
      observation: `${entry.phase}${entry.observation}`,
      mature: entry.mature,
      imbalance: entry.imbalance,
      action: entry.action,
      geometry: numberEntry.geometry,
      colors: [...numberEntry.colors],
      clientText: `${title}位於 ${position} 的「${entry.title}」階段。${entry.phase}${entry.observation}${entry.mature}${entry.imbalance}${entry.action}`
    };
  }

  function makeCombinedSection({ id, title, role, flowChain, position, numberData, positionData }) {
    const flowNumber = finalNumber(flowChain);
    if (flowNumber === null || position === null || position === undefined || position === "") return null;
    const flowEntry = getEntry(flowNumber, numberData);
    const positionEntry = getPositionEntry(position, positionData);
    return {
      id,
      type: "flow-position",
      role,
      title,
      code: `SNGL.ANNUAL.${flowNumber}.POSITION.${position}`,
      number: flowNumber,
      position: Number(position),
      chain: `${flowChain} × 位格 ${position}`,
      theme: `${flowEntry.title} × ${positionEntry.title}`,
      observation: `流年 ${flowChain} 帶出「${flowEntry.title}」的年度主題；今年位格 ${position} 顯示能量正運作在「${positionEntry.title}」階段。${positionEntry.phase}`,
      mature: `${flowEntry.mature}${positionEntry.mature}`,
      imbalance: `${flowEntry.imbalance}${positionEntry.imbalance}`,
      action: `${flowEntry.action}${positionEntry.action}`,
      geometry: flowEntry.geometry,
      colors: [...flowEntry.colors],
      clientText: `${title}顯示：年度主題為 ${flowEntry.title}，目前運作位置為 ${positionEntry.title}。${positionEntry.phase}${flowEntry.core}${positionEntry.observation}${flowEntry.action}${positionEntry.action}`
    };
  }

  function makeAnnualSummary({ solarFlow, solarPosition, lunarFlow, lunarPosition, numberData, positionData }) {
    const solarNumber = finalNumber(solarFlow);
    const lunarNumber = finalNumber(lunarFlow);
    if (solarNumber === null && lunarNumber === null) return null;

    const solarFlowEntry = solarNumber === null ? null : getEntry(solarNumber, numberData);
    const lunarFlowEntry = lunarNumber === null ? null : getEntry(lunarNumber, numberData);
    const solarPositionEntry = solarPosition === null || solarPosition === undefined || solarPosition === "" ? null : getPositionEntry(solarPosition, positionData);
    const lunarPositionEntry = lunarPosition === null || lunarPosition === undefined || lunarPosition === "" ? null : getPositionEntry(lunarPosition, positionData);
    const samePosition = solarPositionEntry && lunarPositionEntry && Number(solarPosition) === Number(lunarPosition);

    const external = solarFlowEntry
      ? `國曆流年 ${solarFlow} 可作為外在事件與行動節奏的參考，主題為「${solarFlowEntry.title}」${solarPositionEntry ? `，目前位於「${solarPositionEntry.title}」階段` : ""}。`
      : "國曆流年資料尚未完整。";
    const internal = lunarFlowEntry
      ? `農曆流年 ${lunarFlow} 可作為內在感受與整合節奏的參考，主題為「${lunarFlowEntry.title}」${lunarPositionEntry ? `，目前位於「${lunarPositionEntry.title}」階段` : ""}。`
      : "農曆流年資料仍需人工確認。";

    return {
      id: "dual-annual-summary",
      type: "annual-summary",
      role: "annual-dual",
      title: "雙曆年度能量總結",
      code: "SNGL.ANNUAL.DUAL",
      number: null,
      chain: `國曆 ${solarFlow || "—"}／位格 ${solarPosition ?? "—"}｜農曆 ${lunarFlow || "—"}／位格 ${lunarPosition ?? "—"}`,
      theme: samePosition ? `雙曆共同進入「${solarPositionEntry.title}」階段` : "外在節奏與內在節奏的協調",
      observation: `${external}${internal}`,
      mature: samePosition
        ? `兩組位格一致時，可把「${solarPositionEntry.title}」視為本年度主要運作位置，讓外在安排與內在調整使用同一套優先順序。`
        : "成熟運作時，能分辨外在需要推進的事項與內在需要整理的感受，再讓兩者逐步對齊。",
      imbalance: "失衡時可能出現外在推進速度與內在承受程度不同步，或只處理事件而忽略感受，也可能只停留在感受而缺少行動。",
      action: samePosition
        ? solarPositionEntry.action
        : "分別寫下今年外在要完成的一件事與內在要調整的一件事，確認兩者是否互相支持。",
      geometry: "雙曆年度交會",
      colors: [],
      clientText: `${external}${internal}${samePosition ? `兩組位格一致，年度重點可聚焦在「${solarPositionEntry.title}」。${solarPositionEntry.action}` : "今年需要同時照顧外在行動與內在整合，避免兩種節奏彼此拉扯。"}`
    };
  }

  function appendNumberSection(sections, config) {
    const number = finalNumber(config.chain);
    if (number === null) return;
    sections.push(makeSection({ ...config, number }));
  }

  function appendAnnualSection(sections, section) {
    if (section) sections.push(section);
  }

  function generate(profile, data = global.SNGL_DATA, positionData = global.POSITION_DATA) {
    if (!profile) throw new TypeError("SNGL 報告缺少統一個案資料");
    if (!data?.numbers) throw new TypeError("SNGL 數字資料尚未載入");
    if (!positionData?.positions) throw new TypeError("SNGL 位格資料尚未載入");

    const solarStages = profile.numerology.solar.soulStages;
    const lunarStages = profile.numerology.lunar.soulStages;
    const solarPrimary = solarStages[2];
    const lunarPrimary = lunarStages[2];
    const solarFlow = profile.numerology.solar.flow;
    const lunarFlow = profile.numerology.lunar.flow;

    const sections = [];
    appendNumberSection(sections, {
      id: "solar-primary",
      title: "國曆主命數",
      role: "core-solar",
      chain: solarPrimary.chain,
      data
    });
    appendNumberSection(sections, {
      id: "lunar-primary",
      title: "農曆主命數",
      role: "core-lunar",
      chain: lunarPrimary.chain,
      data
    });
    appendNumberSection(sections, {
      id: "solar-flow-year",
      title: "國曆流年",
      role: "annual-solar",
      chain: solarFlow.flowYear,
      data
    });
    appendNumberSection(sections, {
      id: "lunar-flow-year",
      title: "農曆流年",
      role: "annual-lunar",
      chain: lunarFlow.flowYear,
      data
    });

    const annualSections = [];
    if (solarFlow.position !== null && solarFlow.position !== undefined && solarFlow.position !== "") {
      appendAnnualSection(annualSections, makePositionSection({
        id: "solar-position",
        title: "國曆今年位格",
        role: "position-solar",
        position: solarFlow.position,
        positionData,
        numberData: data
      }));
    }
    if (lunarFlow.position !== null && lunarFlow.position !== undefined && lunarFlow.position !== "") {
      appendAnnualSection(annualSections, makePositionSection({
        id: "lunar-position",
        title: "農曆今年位格",
        role: "position-lunar",
        position: lunarFlow.position,
        positionData,
        numberData: data
      }));
    }
    appendAnnualSection(annualSections, makeCombinedSection({
      id: "solar-flow-position",
      title: "國曆流年 × 位格整合",
      role: "annual-position-solar",
      flowChain: solarFlow.flowYear,
      position: solarFlow.position,
      numberData: data,
      positionData
    }));
    appendAnnualSection(annualSections, makeCombinedSection({
      id: "lunar-flow-position",
      title: "農曆流年 × 位格整合",
      role: "annual-position-lunar",
      flowChain: lunarFlow.flowYear,
      position: lunarFlow.position,
      numberData: data,
      positionData
    }));

    const annualSummary = makeAnnualSummary({
      solarFlow: solarFlow.flowYear,
      solarPosition: solarFlow.position,
      lunarFlow: lunarFlow.flowYear,
      lunarPosition: lunarFlow.position,
      numberData: data,
      positionData
    });

    return {
      version: VERSION,
      dataVersion: data.version,
      positionDataVersion: positionData.version,
      language: data.language,
      tone: data.tone,
      generatedAt: profile.meta.generatedAt,
      subjectName: profile.subject.name,
      sections,
      annualSections,
      annualSummary,
      needsReview: Boolean(profile.calendar.lunar.needsReview),
      summary: [...sections, ...annualSections, ...(annualSummary ? [annualSummary] : [])]
        .map((section) => `${section.title} ${section.chain}：${section.theme}`)
        .join("；")
    };
  }

  global.SoulKaleidoscopeReport = { VERSION, generate, finalNumber };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeReport;
})(globalThis);
