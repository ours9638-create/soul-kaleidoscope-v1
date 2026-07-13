import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../../src/core/lunar-calendar-data.js";

const rows = Object.entries(LUNAR_CALENDAR_1940_2035).map(([solarDate, lunarValue]) => {
  const isLeap = lunarValue.endsWith("L");
  const [year, month, day] = lunarValue.replace(/L$/, "").split("-").map(Number);
  return [solarDate, year, month, day, isLeap ? 1 : 0];
});

globalThis.LUNAR_DATA = rows;
runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
runInThisContext(readFileSync("public/profile-model.js", "utf8"), { filename: "public/profile-model.js" });
runInThisContext(readFileSync("public/sngl-report.js", "utf8"), { filename: "public/sngl-report.js" });
runInThisContext(readFileSync("public/report-model.js", "utf8"), { filename: "public/report-model.js" });

const C = globalThis.SoulKaleidoscopeCore;
const Profile = globalThis.SoulKaleidoscopeProfile;
const Report = globalThis.SoulKaleidoscopeReport;
const ReportModel = globalThis.SoulKaleidoscopeReportModel;
const engine = C.createEngine(rows);
const fixtures = JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8"));
const snglData = JSON.parse(readFileSync("data/sngl/numbers.v1.json", "utf8"));
const positionData = JSON.parse(readFileSync("data/sngl/positions.v1.json", "utf8"));

const checks = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ name, actual, expected, pass });
}
function expectError(name, fn) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  check(name, failed, true);
}

function makeInput(source) {
  const [hour, minute] = source.birthTime.split(":").map(Number);
  return {
    name: source.name,
    solarBirth: C.parseDateString(source.solarBirthDate),
    queryDate: source.queryDate,
    query: C.parseDateString(source.queryDate),
    lunarBirth: { ...source.lunarBirth },
    time: { inputHour: hour, calculationHour: C.normalizeHourForCalculation(hour), minute }
  };
}

const fixture = fixtures.cases[0];
const input = makeInput(fixture.input);
const result = engine.calculateAll(input);
const profile = Profile.build({
  input,
  result,
  engineVersion: C.VERSION,
  generatedAt: "2026-07-12T00:00:00.000Z"
});
profile.outputs.report = Report.generate(profile, snglData, positionData);

const full = ReportModel.build(profile, {
  mode: "full",
  notes: { overview: "整體觀察", focus: "當期重點", recommendations: "補充建議" }
});
check("報告模型版本", ReportModel.VERSION, "1.1.1");
check("完整版模式", full.mode, "full");
check("完整版標籤", full.modeLabel, "完整版");
check("基本資料六欄", full.basicInfo.length, 6);
check("國農曆摘要兩列", full.summaryRows.length, 2);
check("SNGL 基礎四段", full.interpretations.length, 4);
check("流年位格四段", full.annualInterpretations.length, 4);
check("雙曆年度總結", full.annualSummary.title, "雙曆年度能量總結");
check("國曆五階段", full.stages.solar.length, 5);
check("農曆五階段", full.stages.lunar.length, 5);
check("國曆結構七欄", full.structures.solar.length, 7);
check("農曆結構七欄", full.structures.lunar.length, 7);
check("國曆日月綻放正式名稱", full.structures.solar[2].label, "國曆日月綻放");
check("陰曆日月綻放正式名稱", full.structures.lunar[2].label, "陰曆日月綻放");
check("國曆日月綻放完整鏈", full.structures.solar[2].value, "33/6");
check("陰曆日月綻放完整鏈", full.structures.lunar[2].value, "28/10/1");
check("完整版顯示流年位格", full.visibility.annual, true);
check("完整版顯示五階段", full.visibility.stages, true);
check("完整版顯示結構", full.visibility.structure, true);
check("筆記正規化", full.notes.focus, "當期重點");
check("位格資料版本", full.versions.positionData, "1.0.0");

const quick = ReportModel.build(profile, { mode: "quick" });
check("快速版保留流年位格", quick.visibility.annual, true);
check("快速版隱藏五階段", quick.visibility.stages, false);
check("快速版隱藏結構", quick.visibility.structure, false);
check("快速版保留解讀", quick.visibility.interpretations, true);

const teacher = ReportModel.build(profile, { mode: "teacher" });
check("老師版模式", teacher.mode, "teacher");
check("老師版顯示結構", teacher.visibility.structure, true);

const custom = ReportModel.build(profile, { mode: "quick", visibility: { annual: false, stages: true, notes: false } });
check("自訂隱藏流年位格", custom.visibility.annual, false);
check("自訂顯示覆蓋模式", custom.visibility.stages, true);
check("自訂隱藏筆記", custom.visibility.notes, false);

const quickText = ReportModel.plainText(quick);
check("快速版文字包含個案", quickText.includes(profile.subject.name), true);
check("快速版文字包含流年位格", quickText.includes("【流年位格解讀】"), true);
check("快速版文字不含五階段標題", quickText.includes("【五階段靈魂數字】"), false);

const fullText = ReportModel.plainText(full);
check("完整版文字包含靈魂數字標題", fullText.includes("【靈魂數字頻率解讀】"), true);
check("完整版文字包含五階段", fullText.includes("【五階段靈魂數字】"), true);
check("完整版文字包含筆記", fullText.includes("整體觀察：整體觀察"), true);
check("完整版文字包含國曆日月綻放鏈", fullText.includes("國曆日月綻放 33/6"), true);
check("完整版文字包含陰曆日月綻放鏈", fullText.includes("陰曆日月綻放 28/10/1"), true);

const teacherText = ReportModel.plainText(teacher);
check("老師版包含技術資料", teacherText.includes("技術資料：SNGL.NUMBER."), true);
check("老師版包含位格技術資料", teacherText.includes("SNGL.POSITION."), true);
check("老師版包含版本", teacherText.includes("Report View 1.1.1"), true);

expectError("缺少 Profile 被拒絕", () => ReportModel.build(null));
expectError("缺少 SNGL 報告被拒絕", () => ReportModel.build({ ...profile, outputs: { report: null } }));
expectError("缺少流年位格段落被拒絕", () => ReportModel.build({ ...profile, outputs: { report: { ...profile.outputs.report, annualSections: null } } }));

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Report model tests failed ${checks.length - failed.length}/${checks.length}`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}`);
  process.exit(1);
}

console.log(`Report model tests passed ${checks.length}/${checks.length}.`);
console.log(`Report view model ${ReportModel.VERSION}; modes ${Object.keys(ReportModel.MODES).join(", ")}; annual position data ${positionData.version}.`);
