import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const APP_VERSION = packageJson.version;
const ENGINE_VERSION = packageJson.engineVersion || APP_VERSION;
const UI_VERSION = APP_VERSION;
const requiredFiles = [
  "public/index.html",
  "public/style.css",
  "public/layout-fix.css",
  "public/case-manager.css",
  "public/core.js",
  "public/profile-model.js",
  "public/sngl-report.js",
  "public/case-store.js",
  "public/case-ui.js",
  "public/script.js",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/icon.svg",
  "data/sngl/numbers.v1.json",
  "schemas/soul-profile.schema.json",
  "tests/fixtures/regression-cases.json",
  "tests/run-regression-tests.js",
  "tests/run-case-store-tests.js"
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

const snglData = JSON.parse(readFileSync("data/sngl/numbers.v1.json", "utf8"));
const expectedNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
if (JSON.stringify(Object.keys(snglData.numbers || {}).sort()) !== JSON.stringify(expectedNumbers)) {
  throw new Error("SNGL number database must contain exactly 0 through 9");
}
const snglOutput = [
  "/* Generated from data/sngl/numbers.v1.json during Cloudflare build. */",
  `globalThis.SNGL_DATA = ${JSON.stringify(snglData)};`,
  "if (typeof module !== \"undefined\" && module.exports) module.exports = globalThis.SNGL_DATA;",
  ""
].join("\n");
writeFileSync("public/sngl-data.js", snglOutput, "utf8");

const indexHtml = readFileSync("public/index.html", "utf8");
const scriptText = readFileSync("public/script.js", "utf8");
const profileText = readFileSync("public/profile-model.js", "utf8");
const reportText = readFileSync("public/sngl-report.js", "utf8");
const caseStoreText = readFileSync("public/case-store.js", "utf8");
const caseUiText = readFileSync("public/case-ui.js", "utf8");
const swText = readFileSync("public/sw.js", "utf8");
JSON.parse(readFileSync("schemas/soul-profile.schema.json", "utf8"));
JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8"));

const sourceChecks = [
  [indexHtml.includes(`v${UI_VERSION}`), `index.html version must include v${UI_VERSION}`],
  [indexHtml.includes(`name="app-version" content="${APP_VERSION}"`), "index.html app-version metadata is inconsistent"],
  [indexHtml.includes(`layout-fix.css?v=${UI_VERSION}`), "index.html layout stylesheet version is inconsistent"],
  [indexHtml.includes(`case-manager.css?v=${UI_VERSION}`), "case manager stylesheet version is inconsistent"],
  [!indexHtml.includes('id="summaryBirthdayStatus"'), "birthday status card must remain removed"],
  [!indexHtml.includes('id="summarySolarBirthdayDate"'), "annual Gregorian birthday card must remain removed"],
  [!indexHtml.includes('id="summaryLunarBirthdayDate"'), "annual lunar birthday card must remain removed"],
  [indexHtml.includes('id="caseSearch"'), "case search field is missing"],
  [indexHtml.includes('id="caseList"'), "case list is missing"],
  [indexHtml.includes('id="saveNewCaseBtn"'), "save-new case action is missing"],
  [indexHtml.includes('id="overwriteCaseBtn"'), "overwrite case action is missing"],
  [indexHtml.includes('id="deleteCaseBtn"'), "delete case action is missing"],
  [indexHtml.includes('id="exportCasesBtn"'), "case export action is missing"],
  [indexHtml.includes('id="importCasesBtn"'), "case import action is missing"],
  [indexHtml.includes('<script src="profile-model.js"></script>'), "profile model script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-data.js"></script>'), "SNGL data script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-report.js"></script>'), "SNGL report script is missing from index.html"],
  [indexHtml.includes('<script src="case-store.js"></script>'), "case store script is missing from index.html"],
  [indexHtml.includes('<script src="case-ui.js"></script>'), "case UI script is missing from index.html"],
  [scriptText.includes("SoulKaleidoscopeProfile"), "script.js does not use canonical profile model"],
  [scriptText.includes("SoulKaleidoscopeReport"), "script.js does not use SNGL report engine"],
  [caseStoreText.includes('soul-kaleidoscope.case-store'), "case store key is inconsistent"],
  [caseStoreText.includes("SCHEMA_VERSION = 1"), "case store schema version is inconsistent"],
  [caseUiText.includes("addFromProfile"), "case UI does not save canonical profiles"],
  [caseUiText.includes('mode: "merge"'), "case UI import must default to merge"],
  [swText.includes(`soul-kaleidoscope-v${UI_VERSION}`), "service worker cache version is inconsistent"],
  [swText.includes('"./case-manager.css"'), "service worker does not cache case manager styles"],
  [swText.includes('"./case-store.js"'), "service worker does not cache case store"],
  [swText.includes('"./case-ui.js"'), "service worker does not cache case UI"]
];

const failedSourceChecks = sourceChecks.filter(([pass]) => !pass).map(([, message]) => message);
if (failedSourceChecks.length) throw new Error(`Static source validation failed:\n${failedSourceChecks.join("\n")}`);

new Function(scriptText);
new Function(profileText);
new Function(reportText);
new Function(caseStoreText);
new Function(caseUiText);
runInThisContext(lunarOutput, { filename: "generated-lunar-data.js" });
runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
runInThisContext(profileText, { filename: "public/profile-model.js" });
runInThisContext(reportText, { filename: "public/sngl-report.js" });
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
console.log(`Generated public/sngl-data.js version ${snglData.version}.`);
console.log(`Static source validation passed ${sourceChecks.length}/${sourceChecks.length}.`);
console.log(`Formula regression passed ${regression.passed}/${regression.total}.`);
console.log(`Prepared Soul Kaleidoscope app v${APP_VERSION} (engine ${ENGINE_VERSION}).`);
