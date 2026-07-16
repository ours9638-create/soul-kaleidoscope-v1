import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";
import { DEFAULT_FEATURE_FLAGS } from "./src/runtime/feature-flags.js";
import { createRuntimeDatasetProvider } from "./src/runtime/runtime-manifest-loader.js";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const APP_VERSION = packageJson.version;
const ENGINE_VERSION = packageJson.engineVersion || APP_VERSION;
const UI_VERSION = APP_VERSION;
const requiredFiles = [
  "public/index.html",
  "public/style.css",
  "public/layout-fix.css",
  "public/case-manager.css",
  "public/brand-theme.css",
  "public/results-ui.css",
  "public/assets/cosmic-background.webp",
  "public/assets/sacred-geometry.webp",
  "public/assets/icons/home.svg",
  "public/assets/icons/calculator.svg",
  "public/assets/icons/analysis.svg",
  "public/assets/icons/cases.svg",
  "public/assets/icons/report.svg",
  "public/assets/icons/chevron-right.svg",
  "public/assets/icons/LICENSE-tabler-icons.txt",
  "public/results-ui.js",
  "public/kaleidoscope-model.js",
  "public/report.html",
  "public/report.css",
  "public/report-brand.css",
  "public/report-model.js",
  "public/report.js",
  "public/report-preview.js",
  "public/core.js",
  "public/profile-model.js",
  "public/sngl-report.js",
  "public/case-store.js",
  "public/case-ui.js",
  "public/script.js",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/icon.svg",
  "scripts/preview-static.js",
  "data/sngl/numbers.v1.json",
  "data/sngl/positions.v1.json",
  "schemas/soul-profile.schema.json",
  "tests/fixtures/regression-cases.json",
  "tests/run-regression-tests.js",
  "tests/run-case-store-tests.js",
  "tests/run-report-model-tests.js",
  "tests/run-kaleidoscope-model-tests.js"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing required deployment file: ${file}`);
}

mkdirSync("public", { recursive: true });

const rows = Object.entries(LUNAR_CALENDAR_1940_2035).map(([solarDate, lunarValue]) => {
  const isLeap = lunarValue.endsWith("L");
  const [year, month, day] = lunarValue.replace(/L$/, "").split("-").map(Number);
  return [solarDate, year, month, day, isLeap ? 1 : 0];
});

const lunarOutput = [
  "/* Generated from src/core/lunar-calendar-data.js during Cloudflare build. */",
  `globalThis.LUNAR_DATA = ${JSON.stringify(rows)};`,
  "if (typeof module !== \"undefined\" && module.exports) module.exports = globalThis.LUNAR_DATA;",
  ""
].join("\n");
writeFileSync("public/lunar-data.js", lunarOutput, "utf8");

function loadLegacyPublishedDatasets() {
  return {
    manifestId: "legacy-approved-consumer-baseline",
    schemaVersion: null,
    datasets: {
      "number-topic": {
        data: JSON.parse(readFileSync("data/sngl/numbers.v1.json", "utf8")),
        artifactPath: "data/sngl/numbers.v1.json",
        hashValue: null,
        approvalBaseline: "approved-consumer-baseline"
      },
      position: {
        data: JSON.parse(readFileSync("data/sngl/positions.v1.json", "utf8")),
        artifactPath: "data/sngl/positions.v1.json",
        hashValue: null,
        approvalBaseline: "approved-consumer-baseline"
      }
    }
  };
}

const runtimeDatasetProvider = createRuntimeDatasetProvider({
  rootDir: process.cwd(),
  manifestPath: "data/runtime/manifest.v1.json",
  legacyLoader: loadLegacyPublishedDatasets
});
const runtimeDatasetResolution = runtimeDatasetProvider.load(DEFAULT_FEATURE_FLAGS);
const snglData = runtimeDatasetResolution.snapshot.datasets["number-topic"].data;
const positionData = runtimeDatasetResolution.snapshot.datasets.position.data;
const expectedNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const expectedPositions = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
if (JSON.stringify(Object.keys(snglData.numbers || {}).sort()) !== JSON.stringify(expectedNumbers)) {
  throw new Error("SNGL number database must contain exactly 0 through 9");
}
if (JSON.stringify(Object.keys(positionData.positions || {}).sort()) !== JSON.stringify(expectedPositions)) {
  throw new Error("SNGL position database must contain exactly 1 through 9");
}
const snglOutput = [
  "/* Generated from data/sngl/numbers.v1.json and positions.v1.json during Cloudflare build. */",
  `globalThis.SNGL_DATA = ${JSON.stringify(snglData)};`,
  `globalThis.POSITION_DATA = ${JSON.stringify(positionData)};`,
  "if (typeof module !== \"undefined\" && module.exports) module.exports = { SNGL_DATA: globalThis.SNGL_DATA, POSITION_DATA: globalThis.POSITION_DATA };",
  ""
].join("\n");
writeFileSync("public/sngl-data.js", snglOutput, "utf8");

const indexHtml = readFileSync("public/index.html", "utf8");
const reportHtml = readFileSync("public/report.html", "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
const scriptText = readFileSync("public/script.js", "utf8");
const resultsUiText = readFileSync("public/results-ui.js", "utf8");
const visualModelText = readFileSync("public/kaleidoscope-model.js", "utf8");
const profileText = readFileSync("public/profile-model.js", "utf8");
const reportEngineText = readFileSync("public/sngl-report.js", "utf8");
const reportModelText = readFileSync("public/report-model.js", "utf8");
const caseStoreText = readFileSync("public/case-store.js", "utf8");
const caseUiText = readFileSync("public/case-ui.js", "utf8");
const reportPreviewText = readFileSync("public/report-preview.js", "utf8");
const reportPageText = readFileSync("public/report.js", "utf8");
const swText = readFileSync("public/sw.js", "utf8");
JSON.parse(readFileSync("schemas/soul-profile.schema.json", "utf8"));
JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8"));

const sourceChecks = [
  [packageJson.scripts?.dev === "node scripts/preview-static.js", "local preview script is inconsistent"],
  [indexHtml.includes(`v${UI_VERSION}`), `index.html version must include v${UI_VERSION}`],
  [indexHtml.includes(`name="app-version" content="${APP_VERSION}"`), "index.html app-version metadata is inconsistent"],
  [indexHtml.includes(`layout-fix.css?v=${UI_VERSION}`), "index.html layout stylesheet version is inconsistent"],
  [indexHtml.includes(`case-manager.css?v=${UI_VERSION}`), "case manager stylesheet version is inconsistent"],
  [indexHtml.includes(`brand-theme.css?v=${UI_VERSION}`), "brand theme stylesheet version is inconsistent"],
  [indexHtml.includes(`results-ui.css?v=${UI_VERSION}`), "results UI stylesheet version is inconsistent"],
  [indexHtml.includes('assets/sacred-geometry.webp'), "brand sacred geometry asset is missing from index.html"],
  [readFileSync("public/brand-theme.css", "utf8").includes('assets/cosmic-background.webp'), "cosmic background asset is missing from brand theme"],
  [indexHtml.includes(`kaleidoscope-model.js?v=${UI_VERSION}`), "kaleidoscope model script is missing"],
  [indexHtml.includes(`results-ui.js?v=${UI_VERSION}`), "results UI script is missing"],
  [manifest.description.includes(`v${APP_VERSION}`), "PWA manifest version is inconsistent"],
  [indexHtml.includes("靈魂數字"), "canonical term 靈魂數字 is missing"],
  [indexHtml.includes("國曆日月綻放"), "canonical term 國曆日月綻放 is missing"],
  [indexHtml.includes("陰曆日月綻放"), "canonical term 陰曆日月綻放 is missing"],
  [!indexHtml.includes("生命數字"), "deprecated term 生命數字 must not appear in the app"],
  [!indexHtml.includes("內頻"), "deprecated term 內頻 must not appear in the app"],
  [!indexHtml.includes("Joanna"), "Joanna example must be removed from the public app"],
  [indexHtml.includes("例如：個案 A 或 1991-09"), "neutral case search example is missing"],
  [!indexHtml.includes('id="summaryBirthdayStatus"'), "birthday status card must remain removed"],
  [!indexHtml.includes('id="summarySolarBirthdayDate"'), "annual Gregorian birthday card must remain removed"],
  [!indexHtml.includes('id="summaryLunarBirthdayDate"'), "annual lunar birthday card must remain removed"],
  [indexHtml.includes('role="tablist"'), "result tab list is missing"],
  [indexHtml.includes('data-result-tab="overview"'), "overview result tab is missing"],
  [indexHtml.includes('data-result-tab="solar"'), "solar result tab is missing"],
  [indexHtml.includes('data-result-tab="lunar"'), "lunar result tab is missing"],
  [indexHtml.includes('data-result-tab="annual"'), "annual result tab is missing"],
  [indexHtml.includes('data-result-tab="kaleidoscope"'), "kaleidoscope result tab is missing"],
  [indexHtml.includes('id="annualInterpretationList"'), "annual interpretation view is missing"],
  [indexHtml.includes('id="kaleidoscopeRows"'), "kaleidoscope verification table is missing"],
  [indexHtml.includes('id="copyKaleidoscopeBtn"'), "kaleidoscope copy action is missing"],
  [indexHtml.includes('id="caseSearch"'), "case search field is missing"],
  [indexHtml.includes('id="caseList"'), "case list is missing"],
  [indexHtml.includes('id="saveNewCaseBtn"'), "save-new case action is missing"],
  [indexHtml.includes('id="overwriteCaseBtn"'), "overwrite case action is missing"],
  [indexHtml.includes('id="deleteCaseBtn"'), "delete case action is missing"],
  [indexHtml.includes('id="exportCasesBtn"'), "case export action is missing"],
  [indexHtml.includes('id="importCasesBtn"'), "case import action is missing"],
  [indexHtml.includes('id="openReportBtn"'), "open report action is missing"],
  [indexHtml.includes('<script src="profile-model.js"></script>'), "profile model script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-data.js"></script>'), "SNGL data script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-report.js"></script>'), "SNGL report script is missing from index.html"],
  [indexHtml.includes('<script src="case-store.js"></script>'), "case store script is missing from index.html"],
  [indexHtml.includes('<script src="case-ui.js"></script>'), "case UI script is missing from index.html"],
  [indexHtml.includes(`report-preview.js?v=${UI_VERSION}`), "report preview script is missing from index.html"],
  [reportHtml.includes('id="reportApp"'), "report page root is missing"],
  [reportHtml.includes('id="reportModeSelect"'), "report mode selector is missing"],
  [reportHtml.includes('data-section-toggle="annual"'), "annual interpretation toggle is missing"],
  [reportHtml.includes('id="annualSections"'), "annual interpretation output is missing"],
  [reportHtml.includes("流年位格解讀"), "annual interpretation heading is missing"],
  [reportHtml.includes("靈魂數字頻率解讀"), "canonical report interpretation heading is missing"],
  [reportHtml.includes('id="printReportBtn"'), "report print action is missing"],
  [reportHtml.includes('id="copyReportBtn"'), "report copy action is missing"],
  [reportHtml.includes('id="saveReportDraftBtn"'), "report draft save action is missing"],
  [reportHtml.includes('id="clearReportBtn"'), "report clear action is missing"],
  [reportHtml.includes(`report.css?v=${UI_VERSION}`), "report stylesheet version is inconsistent"],
  [reportHtml.includes(`report-brand.css?v=${UI_VERSION}`), "report brand stylesheet version is inconsistent"],
  [reportHtml.includes(`report-model.js?v=${UI_VERSION}`), "report model version is inconsistent"],
  [reportHtml.includes(`report.js?v=${UI_VERSION}`), "report script version is inconsistent"],
  [scriptText.includes("SoulKaleidoscopeProfile"), "script.js does not use canonical profile model"],
  [scriptText.includes("SoulKaleidoscopeReport"), "script.js does not use SNGL report engine"],
  [scriptText.includes("POSITION_DATA"), "script.js does not load annual position data"],
  [scriptText.includes("soul-profile-updated"), "script.js does not publish profile updates"],
  [resultsUiText.includes("activateTab"), "results UI does not manage tabs"],
  [resultsUiText.includes("annualInterpretationList"), "results UI does not render annual interpretations"],
  [resultsUiText.includes("SoulKaleidoscopeVisualModel"), "results UI does not use the canonical kaleidoscope model"],
  [visualModelText.includes('position: "中心"'), "kaleidoscope center position is missing"],
  [visualModelText.includes('label: "木馬（二）"'), "kaleidoscope horse two position is missing"],
  [visualModelText.includes('label: "陰曆貴人"'), "kaleidoscope lunar noble position is missing"],
  [visualModelText.includes('label: "今年位格"'), "kaleidoscope annual position is missing"],
  [reportEngineText.includes("annualSections"), "SNGL report engine does not generate annual sections"],
  [reportEngineText.includes("annualSummary"), "SNGL report engine does not generate dual annual summary"],
  [reportModelText.includes('"annual"'), "report view model does not expose annual visibility"],
  [reportModelText.includes("陰曆日月綻放"), "report view model does not use canonical lunar day-moon label"],
  [reportPageText.includes('$("annualSections")'), "report page does not render annual interpretations"],
  [caseStoreText.includes('soul-kaleidoscope.case-store'), "case store key is inconsistent"],
  [caseStoreText.includes("SCHEMA_VERSION = 1"), "case store schema version is inconsistent"],
  [caseUiText.includes("addFromProfile"), "case UI does not save canonical profiles"],
  [caseUiText.includes('mode: "merge"'), "case UI import must default to merge"],
  [reportPreviewText.includes('soul-kaleidoscope.report-preview.'), "report preview storage prefix is missing"],
  [reportPreviewText.includes("window.__SOUL_PROFILE__"), "report preview does not read canonical Soul Profile"],
  [reportPreviewText.includes("window.open"), "report preview does not open a new tab"],
  [reportPreviewText.includes("expiresAt"), "report preview expiry is missing"],
  [reportPageText.includes("window.print"), "report page print action is missing"],
  [reportPageText.includes("localStorage.removeItem"), "report page clear action is missing"],
  [swText.includes(`soul-kaleidoscope-v${UI_VERSION}`), "service worker cache version is inconsistent"],
  [swText.includes('"./brand-theme.css"'), "service worker does not cache brand theme"],
  [swText.includes('"./results-ui.css"'), "service worker does not cache results styles"],
  [swText.includes('"./assets/cosmic-background.webp"'), "service worker does not cache cosmic background"],
  [swText.includes('"./assets/sacred-geometry.webp"'), "service worker does not cache sacred geometry"],
  [swText.includes('"./assets/icons/home.svg"'), "service worker does not cache home icon"],
  [swText.includes('"./assets/icons/calculator.svg"'), "service worker does not cache calculator icon"],
  [swText.includes('"./assets/icons/analysis.svg"'), "service worker does not cache analysis icon"],
  [swText.includes('"./assets/icons/cases.svg"'), "service worker does not cache cases icon"],
  [swText.includes('"./assets/icons/report.svg"'), "service worker does not cache report icon"],
  [swText.includes('"./assets/icons/chevron-right.svg"'), "service worker does not cache chevron icon"],
  [swText.includes('"./results-ui.js"'), "service worker does not cache results UI"],
  [swText.includes('"./kaleidoscope-model.js"'), "service worker does not cache kaleidoscope model"],
  [swText.includes('"./case-manager.css"'), "service worker does not cache case manager styles"],
  [swText.includes('"./case-store.js"'), "service worker does not cache case store"],
  [swText.includes('"./case-ui.js"'), "service worker does not cache case UI"],
  [swText.includes('"./report.html"'), "service worker does not cache report page"],
  [swText.includes('"./report.css"'), "service worker does not cache report styles"],
  [swText.includes('"./report-brand.css"'), "service worker does not cache report brand theme"],
  [swText.includes('"./report-model.js"'), "service worker does not cache report model"],
  [swText.includes('"./report.js"'), "service worker does not cache report renderer"],
  [swText.includes('"./report-preview.js"'), "service worker does not cache report preview bridge"]
];

const failedSourceChecks = sourceChecks.filter(([pass]) => !pass).map(([, message]) => message);
if (failedSourceChecks.length) throw new Error(`Static source validation failed:\n${failedSourceChecks.join("\n")}`);

new Function(scriptText);
new Function(resultsUiText);
new Function(visualModelText);
new Function(profileText);
new Function(reportEngineText);
new Function(reportModelText);
new Function(caseStoreText);
new Function(caseUiText);
new Function(reportPreviewText);
new Function(reportPageText);
runInThisContext(lunarOutput, { filename: "generated-lunar-data.js" });
runInThisContext(snglOutput, { filename: "generated-sngl-data.js" });
runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
runInThisContext(profileText, { filename: "public/profile-model.js" });
runInThisContext(reportEngineText, { filename: "public/sngl-report.js" });
runInThisContext(reportModelText, { filename: "public/report-model.js" });
runInThisContext(visualModelText, { filename: "public/kaleidoscope-model.js" });
const engine = globalThis.SoulKaleidoscopeCore.createEngine(globalThis.LUNAR_DATA);
const regression = engine.runSelfTests();

if (regression.version !== ENGINE_VERSION) {
  throw new Error(`Engine version mismatch: package expects ${ENGINE_VERSION}, core reports ${regression.version}`);
}
if (!regression.ok) {
  const detail = regression.failed.map((test) => `${test.name}: ${test.actual} !== ${test.expected}`).join("\n");
  throw new Error(`Formula regression failed (${regression.passed}/${regression.total})\n${detail}`);
}

console.log(`Generated public/lunar-data.js with ${rows.length} rows.`);
console.log(`Generated public/sngl-data.js with number data ${snglData.version} and position data ${positionData.version}.`);
console.log(`Soul Kaleidoscope visual model ${globalThis.SoulKaleidoscopeVisualModel.VERSION}.`);
console.log(`Static source validation passed ${sourceChecks.length}/${sourceChecks.length}.`);
console.log(`Formula regression passed ${regression.passed}/${regression.total}.`);
console.log(`Prepared Soul Kaleidoscope app v${APP_VERSION} (engine ${ENGINE_VERSION}).`);
