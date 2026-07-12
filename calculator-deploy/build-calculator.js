import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const APP_VERSION = packageJson.version;
const UI_VERSION = `${APP_VERSION}-r3`;
const requiredFiles = [
  "public/index.html",
  "public/style.css",
  "public/layout-fix.css",
  "public/core.js",
  "public/profile-model.js",
  "public/sngl-report.js",
  "public/script.js",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/icon.svg",
  "data/sngl/numbers.v1.json",
  "schemas/soul-profile.schema.json",
  "tests/fixtures/regression-cases.json",
  "tests/run-regression-tests.js"
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
const swText = readFileSync("public/sw.js", "utf8");
JSON.parse(readFileSync("schemas/soul-profile.schema.json", "utf8"));
JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8"));

const sourceChecks = [
  [indexHtml.includes(`v${UI_VERSION}`), `index.html version must include v${UI_VERSION}`],
  [indexHtml.includes(`layout-fix.css?v=${UI_VERSION}`), "index.html layout stylesheet version is inconsistent"],
  [!indexHtml.includes('id="summaryBirthdayStatus"'), "birthday status card must be removed"],
  [!indexHtml.includes('id="summarySolarBirthdayDate"'), "annual Gregorian birthday card must be removed"],
  [!indexHtml.includes('id="summaryLunarBirthdayDate"'), "annual lunar birthday card must be removed"],
  [!indexHtml.includes("國曆／農曆生日狀態"), "birthday status label still exists"],
  [!indexHtml.includes("本年國曆生日"), "annual Gregorian birthday label still exists"],
  [!indexHtml.includes("本年農曆生日"), "annual lunar birthday label still exists"],
  [indexHtml.includes('<script src="profile-model.js"></script>'), "profile model script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-data.js"></script>'), "SNGL data script is missing from index.html"],
  [indexHtml.includes('<script src="sngl-report.js"></script>'), "SNGL report script is missing from index.html"],
  [scriptText.includes("SoulKaleidoscopeProfile"), "script.js does not use canonical profile model"],
  [scriptText.includes("SoulKaleidoscopeReport"), "script.js does not use SNGL report engine"],
  [!scriptText.includes('"summaryBirthdayStatus"'), "script.js still references birthday status"],
  [!scriptText.includes('"summarySolarBirthdayDate"'), "script.js still references annual Gregorian birthday"],
  [!scriptText.includes('"summaryLunarBirthdayDate"'), "script.js still references annual lunar birthday"],
  [!scriptText.includes("本年農曆生日"), "copy output still includes annual lunar birthday"],
  [swText.includes(`soul-kaleidoscope-v${UI_VERSION}`), "service worker cache version is inconsistent"],
  [swText.includes('"./profile-model.js"'), "service worker does not cache profile model"],
  [swText.includes('"./sngl-data.js"'), "service worker does not cache SNGL data"],
  [swText.includes('"./sngl-report.js"'), "service worker does not cache SNGL report engine"]
];

const failedSourceChecks = sourceChecks.filter(([pass]) => !pass).map(([, message]) => message);
if (failedSourceChecks.length) throw new Error(`Static source validation failed:\n${failedSourceChecks.join("\n")}`);

new Function(scriptText);
new Function(profileText);
new Function(reportText);
runInThisContext(lunarOutput, { filename: "generated-lunar-data.js" });
runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
runInThisContext(profileText, { filename: "public/profile-model.js" });
runInThisContext(reportText, { filename: "public/sngl-report.js" });
const engine = globalThis.SoulKaleidoscopeCore.createEngine(globalThis.LUNAR_DATA);
const regression = engine.runSelfTests();

if (regression.version !== APP_VERSION) {
  throw new Error(`Version mismatch: package ${APP_VERSION}, core ${regression.version}`);
}

if (!regression.ok) {
  const detail = regression.failed.map((test) => `${test.name}: ${test.actual} !== ${test.expected}`).join("\n");
  throw new Error(`Formula regression failed (${regression.passed}/${regression.total})\n${detail}`);
}

console.log(`Generated public/lunar-data.js with ${rows.length} rows.`);
console.log(`Generated public/sngl-data.js version ${snglData.version}.`);
console.log(`Static source validation passed ${sourceChecks.length}/${sourceChecks.length}.`);
console.log(`Formula regression passed ${regression.passed}/${regression.total}.`);
console.log(`Prepared Soul Kaleidoscope calculator v${UI_VERSION} (engine ${APP_VERSION}).`);
