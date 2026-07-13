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

const C = globalThis.SoulKaleidoscopeCore;
const Profile = globalThis.SoulKaleidoscopeProfile;
const Report = globalThis.SoulKaleidoscopeReport;
const engine = C.createEngine(rows);
const fixtures = JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8"));
const snglData = JSON.parse(readFileSync("data/sngl/numbers.v1.json", "utf8"));
const positionData = JSON.parse(readFileSync("data/sngl/positions.v1.json", "utf8"));
JSON.parse(readFileSync("schemas/soul-profile.schema.json", "utf8"));

const checks = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ name, actual, expected, pass });
}

function makeInput(source) {
  const [hour, minute] = source.birthTime.split(":").map(Number);
  return {
    name: source.name,
    solarBirth: C.parseDateString(source.solarBirthDate),
    queryDate: source.queryDate,
    query: C.parseDateString(source.queryDate),
    lunarBirth: { ...source.lunarBirth },
    time: {
      inputHour: hour,
      calculationHour: C.normalizeHourForCalculation(hour),
      minute
    }
  };
}

const coreSelfTest = engine.runSelfTests();
check("核心內建自檢通過", coreSelfTest.ok, true);
check("核心內建自檢數量", coreSelfTest.total, 27);

for (const fixture of fixtures.cases) {
  const input = makeInput(fixture.input);
  const result = engine.calculateAll(input);
  const expected = fixture.expected;
  const prefix = fixture.id;

  check(`${prefix} 查詢農曆`, C.formatLunarDate(result.queryLunar), expected.queryLunar);
  if (expected.calculationHour !== undefined) check(`${prefix} 計算時數`, input.time.calculationHour, expected.calculationHour);
  if (expected.annualLunarBirthdayGregorian) check(`${prefix} 本農曆年生日對應`, result.lunarFlow.birthdayGregorianDate, expected.annualLunarBirthdayGregorian);

  for (const [key, value] of Object.entries(expected.solarFlow || {})) check(`${prefix} solarFlow.${key}`, result.solarFlow[key], value);
  for (const [key, value] of Object.entries(expected.lunarFlow || {})) check(`${prefix} lunarFlow.${key}`, result.lunarFlow[key], value);

  if (expected.solarSoulChains) check(`${prefix} 國曆五階段主數`, result.solarSoul.map((item) => item.chain), expected.solarSoulChains);
  if (expected.lunarSoulChains) check(`${prefix} 農曆五階段主數`, result.lunarSoul.map((item) => item.chain), expected.lunarSoulChains);
  if (expected.lunarPrimaryLevel) check(`${prefix} 農曆主命數靈魂等級`, result.lunarSoul[2].level, expected.lunarPrimaryLevel);
  for (const [key, value] of Object.entries(expected.solarHorse || {})) check(`${prefix} solarHorse.${key}`, result.solarHorse[key], value);
  for (const [key, value] of Object.entries(expected.lunarHorse || {})) check(`${prefix} lunarHorse.${key}`, result.lunarHorse[key], value);

  const profile = Profile.build({
    input,
    result,
    engineVersion: C.VERSION,
    generatedAt: "2026-07-12T00:00:00.000Z"
  });
  const profileValidation = Profile.validate(profile);
  check(`${prefix} 統一資料模型驗證`, profileValidation.ok, true);
  check(`${prefix} 統一資料模型國曆主數`, profile.numerology.solar.primaryNumber, result.solarSoul[2].final);
  check(`${prefix} 統一資料模型農曆主數`, profile.numerology.lunar.primaryNumber, result.lunarSoul[2].final);

  const report = Report.generate(profile, snglData, positionData);
  check(`${prefix} SNGL 基礎段落數`, report.sections.length, 4);
  check(`${prefix} 流年位格段落數`, report.annualSections.length, 4);
  check(`${prefix} 雙曆年度總結`, Boolean(report.annualSummary?.clientText), true);
  check(`${prefix} SNGL 數字資料版本`, report.dataVersion, snglData.version);
  check(`${prefix} SNGL 位格資料版本`, report.positionDataVersion, positionData.version);
  check(`${prefix} SNGL 報告無空白代碼`, [...report.sections, ...report.annualSections, report.annualSummary].every((section) => Boolean(section?.code && section?.clientText)), true);
}

const reviewInput = makeInput(fixtures.cases[0].input);
const reviewResult = engine.calculateAll(reviewInput);
reviewResult.lunarFlow.flowYear = "";
reviewResult.lunarFlow.needsReview = true;
const reviewProfile = Profile.build({
  input: reviewInput,
  result: reviewResult,
  engineVersion: C.VERSION,
  generatedAt: "2026-07-12T00:00:00.000Z"
});
const reviewReport = Report.generate(reviewProfile, snglData, positionData);
check("需人工確認時略過空白農曆流年段落", reviewReport.sections.some((section) => section.role === "annual-lunar"), false);
check("需人工確認時略過農曆流年位格整合", reviewReport.annualSections.some((section) => section.role === "annual-position-lunar"), false);
check("需人工確認報告保留標記", reviewReport.needsReview, true);
check("需人工確認仍保留雙曆年度總結", Boolean(reviewReport.annualSummary), true);

check("SNGL 0～9 資料完整", Object.keys(snglData.numbers).sort(), ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
check("位格 1～9 資料完整", Object.keys(positionData.positions).sort(), ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
check("統一模型版本", Profile.SCHEMA_VERSION, "1.0.0");
check("SNGL 報告引擎版本", Report.VERSION, "1.1.0");

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Regression suite failed ${checks.length - failed.length}/${checks.length}`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}`);
  process.exit(1);
}

console.log(`Regression suite passed ${checks.length}/${checks.length}.`);
console.log(`Core self-tests passed ${coreSelfTest.passed}/${coreSelfTest.total}.`);
console.log(`Profile schema ${Profile.SCHEMA_VERSION}; SNGL report ${Report.VERSION}; number data ${snglData.version}; position data ${positionData.version}.`);
