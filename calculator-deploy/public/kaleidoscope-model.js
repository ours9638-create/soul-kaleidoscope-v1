(function (global) {
  "use strict";

  const VERSION = "1.0.1";

  function text(value, fallback = "—") {
    return value === null || value === undefined || value === "" ? fallback : String(value);
  }

  function validateProfile(profile) {
    const errors = [];
    if (!profile || typeof profile !== "object") return { ok: false, errors: ["靈魂萬花圖資料必須是物件"] };
    if (!profile.numerology?.solar?.soulStages?.[2]) errors.push("缺少國曆主命數");
    if (!profile.numerology?.solar?.horse) errors.push("缺少國曆貴人與木馬資料");
    if (!profile.numerology?.lunar?.horse) errors.push("缺少農曆貴人與日月綻放資料");
    if (!profile.numerology?.solar?.flow) errors.push("缺少國曆年度資料");
    return { ok: errors.length === 0, errors };
  }

  function build(profile) {
    const validation = validateProfile(profile);
    if (!validation.ok) throw new Error(`靈魂萬花圖模型驗證失敗：${validation.errors.join("、")}`);

    const solar = profile.numerology.solar;
    const lunar = profile.numerology.lunar;
    const horse = solar.horse;

    const rows = [
      { key: "center", position: "中心", label: "主命數", value: text(solar.primaryNumber), source: "國曆主命數" },
      { key: "top", position: "上方", label: "國曆日月綻放", value: text(solar.horse.dayMoonChain || solar.horse.dayMoon), source: "國曆" },
      { key: "topSub", position: "上方副標", label: "陰曆日月綻放", value: text(lunar.horse.dayMoonChain || lunar.horse.dayMoon), source: "農曆" },
      { key: "horse2", position: "左上", label: "木馬（二）", value: text(horse.second), source: "國曆木馬" },
      { key: "horse1", position: "右上", label: "木馬（一）", value: text(horse.first), source: "國曆木馬" },
      { key: "horse3", position: "左下", label: "木馬（三）", value: text(horse.third), source: "國曆木馬" },
      { key: "horse4", position: "右下", label: "木馬（四）", value: text(horse.fourth), source: "國曆木馬" },
      { key: "lunarNoble", position: "左側", label: "陰曆貴人", value: text(lunar.horse.noble), source: "農曆" },
      { key: "solarNoble", position: "右側", label: "陽曆貴人", value: text(solar.horse.noble), source: "國曆" },
      { key: "flowYear", position: "下方", label: "流年", value: text(solar.flow.flowYear), source: "國曆年度" },
      { key: "position", position: "最外圈", label: "今年位格", value: text(solar.flow.position), source: "國曆年度" }
    ];

    return {
      version: VERSION,
      generatedAt: profile.meta?.generatedAt || new Date().toISOString(),
      subjectName: text(profile.subject?.name, "未填姓名"),
      queryDate: text(profile.source?.queryDate),
      birthdayStatus: text(profile.calendar?.solar?.birthdayStatus),
      rows
    };
  }

  function plainText(model) {
    if (!model || !Array.isArray(model.rows)) throw new TypeError("缺少靈魂萬花圖核對資料");
    const lines = [
      "靈魂萬花圖｜數字位置核對表",
      `個案：${model.subjectName}`,
      `查詢日期：${model.queryDate}`,
      `生日狀態：${model.birthdayStatus}`,
      ""
    ];
    for (const row of model.rows) lines.push(`${row.position}｜${row.label}：${row.value}`);
    lines.push("", `模型版本：${model.version}`);
    return lines.join("\n");
  }

  global.SoulKaleidoscopeVisualModel = { VERSION, validateProfile, build, plainText };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeVisualModel;
})(globalThis);
