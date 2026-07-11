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
  [indexHtml.includes(`v${UI_VERSION}`), `index.html version must include v${UI_VERSION}`],
  [indexHtml.includes(`layout-fix.css?v=${UI_VERSION}`), "index.html layout stylesheet version is inconsistent"],
  [!indexHtml.includes('id="summaryBirthdayStatus"'), "birthday status card must be removed"],
  [!indexHtml.includes('id="summarySolarBirthdayDate"'), "annual Gregorian birthday card must be removed"],
  [!indexHtml.includes('id="summaryLunarBirthdayDate"'), "annual lunar birthday card must be removed"],
  [!indexHtml.includes("國曆／農曆生日狀態"), "birthday status label still exists"],
  [!indexHtml.includes("本年國曆生日"), "annual Gregorian birthday label still exists"],
  [!indexHtml.includes("本年農曆生日"), "annual lunar birthday label still exists"],
  [!scriptText.includes('"summaryBirthdayStatus"'), "script.js still references birthday status"],
  [!scriptText.includes('"summarySolarBirthdayDate"'), "script.js still references annual Gregorian birthday"],
  [!scriptText.includes('"summaryLunarBirthdayDate"'), "script.js still references annual lunar birthday"],
  [!scriptText.includes("本年農曆生日"), "copy output still includes annual lunar birthday"],
  [swText.includes(`soul-kaleidoscope-v${UI_VERSION}`), "service worker cache version is inconsistent"]
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
console.log(`Prepared Soul Kaleidoscope calculator v${UI_VERSION} (engine ${APP_VERSION}).`);
