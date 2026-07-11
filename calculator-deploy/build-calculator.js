import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const APP_VERSION = packageJson.version;
const requiredFiles = [
  "public/index.html",
  "public/style.css",
  "public/layout-fix.css",
  "public/core.js",
  "public/script.js",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/icon.svg"
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

const indexHtml = readFileSync("public/index.html", "utf8");
const scriptText = readFileSync("public/script.js", "utf8");
const swText = readFileSync("public/sw.js", "utf8");

const sourceChecks = [
  [indexHtml.includes(`v${APP_VERSION}`), `index.html version must include v${APP_VERSION}`],
  [indexHtml.includes(`layout-fix.css?v=${APP_VERSION}`), "index.html layout stylesheet version is inconsistent"],
  [indexHtml.includes('id="summaryBirthdayStatus"'), "combined birthday status card is missing"],
  [!indexHtml.includes('id="summarySolarStatus"') && !indexHtml.includes('id="summaryLunarStatus"'), "old split birthday status cards still exist"],
  [indexHtml.includes('id="summarySolarBirthdayDate"'), "annual Gregorian birthday card is missing"],
  [indexHtml.includes('id="summaryLunarBirthdayDate"'), "annual lunar birthday card is missing"],
  [indexHtml.includes("本年國曆生日") && indexHtml.includes("本年農曆生日"), "annual birthday labels are not separated"],
  [scriptText.includes('"summaryBirthdayStatus"'), "script.js does not use combined birthday status"],
  [!scriptText.includes('"summarySolarStatus"') && !scriptText.includes('"summaryLunarStatus"'), "script.js still references old birthday status ids"],
  [scriptText.includes('"summarySolarBirthdayDate"') && scriptText.includes('"summaryLunarBirthdayDate"'), "script.js does not render separate annual birthday fields"],
  [swText.includes(`soul-kaleidoscope-v${APP_VERSION}`), "service worker cache version is inconsistent"]
];

const failedSourceChecks = sourceChecks.filter(([pass]) => !pass).map(([, message]) => message);
if (failedSourceChecks.length) throw new Error(`Static source validation failed:\n${failedSourceChecks.join("\n")}`);

new Function(scriptText);
runInThisContext(lunarOutput, { filename: "generated-lunar-data.js" });
runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
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
console.log(`Static source validation passed ${sourceChecks.length}/${sourceChecks.length}.`);
console.log(`Formula regression passed ${regression.passed}/${regression.total}.`);
console.log(`Prepared Soul Kaleidoscope calculator v${APP_VERSION}.`);