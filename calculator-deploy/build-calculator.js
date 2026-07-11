import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

const APP_VERSION = "2.2.0";

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

const indexPath = "public/index.html";
const layoutStyle = `<link rel="stylesheet" href="layout-fix.css?v=${APP_VERSION}" />`;
let indexHtml = readFileSync(indexPath, "utf8");

if (!indexHtml.includes("layout-fix.css")) {
  indexHtml = indexHtml.replace(
    '<link rel="stylesheet" href="style.css" />',
    '<link rel="stylesheet" href="style.css" />\n  ' + layoutStyle
  );
} else {
  indexHtml = indexHtml.replace(/<link rel="stylesheet" href="layout-fix\.css[^"]*" \/>/, layoutStyle);
}

const separateStatusCards = /<div><span>國曆生日狀態<\/span><strong id="summarySolarStatus">—<\/strong><\/div>\s*<div><span>農曆生日狀態<\/span><strong id="summaryLunarStatus">—<\/strong><\/div>/;
const combinedStatusCard = '<div><span>國曆／農曆生日狀態</span><strong id="summaryBirthdayStatus" class="birthday-status-lines">國曆：—&#10;農曆：—</strong></div>';
indexHtml = indexHtml.replace(separateStatusCards, combinedStatusCard);
indexHtml = indexHtml.replace(/<span class="version-pill">v[^<]+<\/span>/, `<span class="version-pill">v${APP_VERSION}</span>`);
writeFileSync(indexPath, indexHtml, "utf8");

const scriptPath = "public/script.js";
let scriptText = readFileSync(scriptPath, "utf8");
scriptText = scriptText.replace(
  '"summaryQueryLunar","summarySolarStatus","summaryLunarStatus","summaryLunarBirthdayDate"',
  '"summaryQueryLunar","summaryBirthdayStatus","summaryLunarBirthdayDate"'
);
scriptText = scriptText.replace(
  /el\.summarySolarStatus\.textContent = result\.solarFlow\.status;\s*el\.summaryLunarStatus\.textContent = result\.lunarFlow\.status;/,
  'el.summaryBirthdayStatus.textContent = `國曆：${result.solarFlow.status}\\n農曆：${result.lunarFlow.status}`;'
);
writeFileSync(scriptPath, scriptText, "utf8");

const layoutPath = "public/layout-fix.css";
let layoutCss = readFileSync(layoutPath, "utf8");
if (!layoutCss.includes(".birthday-status-lines")) {
  layoutCss += "\n\n.birthday-status-lines {\n  white-space: pre-line;\n  line-height: 1.55;\n}\n";
}
writeFileSync(layoutPath, layoutCss, "utf8");

const swPath = "public/sw.js";
let swText = readFileSync(swPath, "utf8");
swText = swText.replace(/const CACHE_NAME = "soul-kaleidoscope-v[^"]+";/, `const CACHE_NAME = "soul-kaleidoscope-v${APP_VERSION}";`);
writeFileSync(swPath, swText, "utf8");

// Build-time formula gate: deployment fails when any confirmed regression case fails.
vm.runInThisContext(lunarOutput, { filename: "generated-lunar-data.js" });
vm.runInThisContext(readFileSync("public/core.js", "utf8"), { filename: "public/core.js" });
const engine = globalThis.SoulKaleidoscopeCore.createEngine(globalThis.LUNAR_DATA);
const regression = engine.runSelfTests();
if (!regression.ok) {
  const detail = regression.failed.map((test) => `${test.name}: ${test.actual} !== ${test.expected}`).join("\n");
  throw new Error(`Formula regression failed (${regression.passed}/${regression.total})\n${detail}`);
}

console.log(`Generated public/lunar-data.js with ${rows.length} rows.`);
console.log(`Formula regression passed ${regression.passed}/${regression.total}.`);
console.log(`Prepared Soul Kaleidoscope calculator v${APP_VERSION}.`);
