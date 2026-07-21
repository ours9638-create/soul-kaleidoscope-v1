(function (global) {
  "use strict";

  const VERSION = "1.2.0";
  const MODES = Object.freeze({
    quick: "快速版",
    full: "完整版",
    teacher: "老師版"
  });
  const SECTION_IDS = Object.freeze(["basic", "summary", "interpretations", "annual", "stages", "structure", "notes"]);
  const DEFAULT_VISIBILITY = Object.freeze({
    quick: Object.freeze({ basic: true, summary: true, interpretations: true, annual: true, stages: false, structure: false, notes: true }),
    full: Object.freeze({ basic: true, summary: true, interpretations: true, annual: true, stages: true, structure: true, notes: true }),
    teacher: Object.freeze({ basic: true, summary: true, interpretations: true, annual: true, stages: true, structure: true, notes: true })
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const text = (value, fallback = "—") => value === null || value === undefined || value === "" ? fallback : String(value);
  const slashDate = (value) => text(value).replaceAll("-", "/");
  const pad2 = (value) => String(Number(value)).padStart(2, "0");

  function normalizeMode(mode) {
    return Object.hasOwn(MODES, mode) ? mode : "full";
  }

  function normalizeVisibility(mode, visibility = {}) {
    const normalizedMode = normalizeMode(mode);
    return Object.fromEntries(SECTION_IDS.map((id) => [id, visibility[id] === undefined ? DEFAULT_VISIBILITY[normalizedMode][id] : Boolean(visibility[id])]));
  }

  function normalizeNotes(notes = {}) {
    return {
      overview: String(notes.overview || ""),
      focus: String(notes.focus || ""),
      recommendations: String(notes.recommendations || "")
    };
  }

  function validateProfile(profile) {
    const errors = [];
    if (!profile || typeof profile !== "object") return { ok: false, errors: ["報告資料必須是物件"] };
    if (!profile.subject?.name) errors.push("缺少個案姓名");
    if (!profile.source?.solarBirthDate) errors.push("缺少國曆生日");
    if (!profile.source?.lunarBirth) errors.push("缺少農曆生日");
    if (!["known", "unknown"].includes(profile.source?.birthTimeStatus)) errors.push("出生時間狀態不完整");
    if (profile.source?.birthTimeStatus === "known" && !profile.source?.birthTime) errors.push("缺少出生時間");
    if (!profile.source?.queryDate) errors.push("缺少查詢日期");
    if (!Array.isArray(profile.numerology?.solar?.soulStages) || profile.numerology.solar.soulStages.length !== 5) errors.push("國曆五階段資料不完整");
    if (!Array.isArray(profile.numerology?.lunar?.soulStages) || profile.numerology.lunar.soulStages.length !== 5) errors.push("農曆五階段資料不完整");
    if (!profile.outputs?.report || !Array.isArray(profile.outputs.report.sections)) errors.push("SNGL 報告資料不完整");
    if (!Array.isArray(profile.outputs?.report?.annualSections)) errors.push("流年位格解讀資料不完整");
    return { ok: errors.length === 0, errors };
  }

  function stageRows(stages) {
    return stages.map((stage) => ({
      label: text(stage.label),
      source: stage.status === "unavailable" ? "未提供" : text(stage.source),
      chain: stage.status === "unavailable" ? "—" : text(stage.chain),
      level: stage.status === "unavailable" ? "—" : text(stage.level),
      final: stage.status === "unavailable" ? null : stage.final ?? Number(String(stage.chain || "").split("/").at(-1)),
      status: stage.status || "available"
    }));
  }

  function horseRows(horse, calendar) {
    const dayMoonLabel = calendar === "solar" ? "國曆日月綻放" : "陰曆日月綻放";
    return [
      { label: "貴人數", value: horse?.noble },
      { label: "日座數", value: horse?.daySeat },
      { label: dayMoonLabel, value: horse?.dayMoonChain || horse?.dayMoon },
      { label: "第一木馬", value: horse?.first },
      { label: "第二木馬", value: horse?.second },
      { label: "第三木馬", value: horse?.third },
      { label: "第四木馬", value: horse?.fourth }
    ].map((row) => ({ ...row, value: text(row.value) }));
  }

  function build(profile, options = {}) {
    const validation = validateProfile(profile);
    if (!validation.ok) throw new Error(`報告模型驗證失敗：${validation.errors.join("、")}`);

    const mode = normalizeMode(options.mode || "full");
    const visibility = normalizeVisibility(mode, options.visibility);
    const notes = normalizeNotes(options.notes);
    const source = profile.source;
    const lunarBirth = source.lunarBirth;
    const solar = profile.numerology.solar;
    const lunar = profile.numerology.lunar;
    const report = profile.outputs.report;
    const birthTimeUnknown = source.birthTimeStatus === "unknown";
    const warnings = [];
    if (birthTimeUnknown) warnings.push("出生時間未知：本報告不計算時、分兩階段，且未以 00:00 或其他推定時間代替。");
    if (report.needsReview || profile.calendar?.lunar?.needsReview) warnings.push("農曆年度資料含需人工確認項目，正式交付前請再次核對。");

    return {
      version: VERSION,
      mode,
      modeLabel: MODES[mode],
      visibility,
      notes,
      subjectName: profile.subject.name,
      generatedAt: report.generatedAt || profile.meta.generatedAt,
      basicInfo: [
        { label: "姓名", value: profile.subject.name },
        { label: "國曆生日", value: slashDate(source.solarBirthDate) },
        { label: "農曆生日", value: `${lunarBirth.year}/${pad2(lunarBirth.month)}/${pad2(lunarBirth.day)}${lunarBirth.leap ? "（閏月）" : ""}` },
        { label: "出生時間", value: birthTimeUnknown ? "未知（時、分不計算）" : source.calculationHour === 24 ? `${source.birthTime}（計算時數 24）` : source.birthTime },
        { label: "查詢日期", value: slashDate(source.queryDate) },
        { label: "查詢日農曆", value: profile.calendar?.queryLunar ? `${profile.calendar.queryLunar.year}/${pad2(profile.calendar.queryLunar.month)}/${pad2(profile.calendar.queryLunar.day)}` : "—" }
      ],
      summaryRows: [
        {
          calendar: "國曆",
          primary: text(solar.soulStages?.[2]?.chain),
          flowYear: text(solar.flow?.flowYear),
          position: text(solar.flow?.position),
          flowMonth: text(solar.flow?.flowMonth),
          flowDay: text(solar.flow?.flowDay)
        },
        {
          calendar: "農曆",
          primary: text(lunar.soulStages?.[2]?.chain),
          flowYear: text(lunar.flow?.flowYear),
          position: text(lunar.flow?.position),
          flowMonth: text(lunar.flow?.flowMonth),
          flowDay: text(lunar.flow?.flowDay)
        }
      ],
      interpretations: clone(report.sections),
      annualInterpretations: clone(report.annualSections || []),
      annualSummary: report.annualSummary ? clone(report.annualSummary) : null,
      stages: {
        solar: stageRows(solar.soulStages),
        lunar: stageRows(lunar.soulStages)
      },
      structures: {
        solar: horseRows(solar.horse, "solar"),
        lunar: horseRows(lunar.horse, "lunar")
      },
      warnings,
      versions: {
        profile: text(profile.meta?.schemaVersion),
        engine: text(profile.meta?.engineVersion),
        report: text(report.version),
        data: text(report.dataVersion),
        positionData: text(report.positionDataVersion),
        view: VERSION
      }
    };
  }

  function appendInterpretationLines(lines, section, mode) {
    lines.push(`${section.title}｜${section.chain}`);
    if (mode === "quick") {
      lines.push(section.clientText || `${section.theme}。${section.action}`);
    } else {
      lines.push(`頻率觀察：${section.observation}`);
      lines.push(`成熟展現：${section.mature}`);
      lines.push(`失衡提醒：${section.imbalance}`);
      lines.push(`行動建議：${section.action}`);
      if (mode === "teacher") lines.push(`技術資料：${section.code}｜角色 ${section.role}｜幾何 ${section.geometry}｜配色 ${(section.colors || []).join("、") || "—"}`);
    }
    lines.push("");
  }

  function plainText(view, options = {}) {
    if (!view || typeof view !== "object") throw new TypeError("純文字報告缺少 Report View Model");
    const mode = normalizeMode(options.mode || view.mode);
    const visibility = normalizeVisibility(mode, options.visibility || view.visibility);
    const notes = normalizeNotes(options.notes || view.notes);
    const lines = [
      "靈魂萬花筒個案報告",
      `報告版本：${MODES[mode]}`,
      `個案：${view.subjectName}`,
      ""
    ];

    if (visibility.basic) {
      lines.push("【基本資料】");
      for (const item of view.basicInfo) lines.push(`${item.label}：${item.value}`);
      lines.push("");
    }

    if (visibility.summary) {
      lines.push("【國曆／農曆｜當期能量總覽】");
      for (const row of view.summaryRows) {
        lines.push(`${row.calendar}：主命數 ${row.primary}｜流年 ${row.flowYear}｜今年位格 ${row.position}｜流月 ${row.flowMonth}｜流日 ${row.flowDay}`);
      }
      lines.push("");
    }

    if (visibility.interpretations) {
      lines.push("【靈魂數字頻率解讀】");
      for (const section of view.interpretations) appendInterpretationLines(lines, section, mode);
    }

    if (visibility.annual) {
      lines.push("【流年位格解讀】");
      for (const section of view.annualInterpretations || []) appendInterpretationLines(lines, section, mode);
      if (view.annualSummary) appendInterpretationLines(lines, view.annualSummary, mode);
    }

    if (visibility.stages) {
      lines.push("【五階段靈魂數字】");
      for (const [label, rows] of [["國曆", view.stages.solar], ["農曆", view.stages.lunar]]) {
        lines.push(`${label}：${rows.map((row) => `${row.label} ${row.chain}（${row.level}）`).join("；")}`);
      }
      lines.push("");
    }

    if (visibility.structure) {
      lines.push("【靈魂數字結構】");
      for (const [label, rows] of [["國曆", view.structures.solar], ["農曆", view.structures.lunar]]) {
        lines.push(`${label}：${rows.map((row) => `${row.label} ${row.value}`).join("｜")}`);
      }
      lines.push("");
    }

    if (visibility.notes) {
      lines.push("【個案補充】");
      lines.push(`整體觀察：${notes.overview || "—"}`);
      lines.push(`當期重點：${notes.focus || "—"}`);
      lines.push(`補充建議：${notes.recommendations || "—"}`);
      lines.push("");
    }

    if (view.warnings?.length) {
      lines.push("【核對提醒】");
      lines.push(...view.warnings);
      lines.push("");
    }

    lines.push(`版本：Soul Profile ${view.versions.profile}｜引擎 ${view.versions.engine}｜SNGL Report ${view.versions.report}｜SNGL Data ${view.versions.data}｜Position Data ${view.versions.positionData}｜Report View ${view.versions.view}`);
    return lines.join("\n").trim();
  }

  global.SoulKaleidoscopeReportModel = {
    VERSION,
    MODES,
    SECTION_IDS,
    DEFAULT_VISIBILITY,
    normalizeMode,
    normalizeVisibility,
    normalizeNotes,
    validateProfile,
    build,
    plainText
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeReportModel;
})(globalThis);
