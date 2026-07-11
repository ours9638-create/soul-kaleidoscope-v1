import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

const APP_VERSION = "2.1.3";

mkdirSync("public", { recursive: true });

const rows = Object.entries(LUNAR_CALENDAR_1940_2035).map(([solarDate, lunarValue]) => {
  const isLeap = lunarValue.endsWith("L");
  const [year, month, day] = lunarValue.replace(/L$/, "").split("-").map(Number);
  return [solarDate, year, month, day, isLeap ? 1 : 0];
});

const output = [
  "/* Generated from src/core/lunar-calendar-data.js during Cloudflare build. */",
  `globalThis.LUNAR_DATA = ${JSON.stringify(rows)};`,
  "if (typeof module !== \"undefined\" && module.exports) module.exports = globalThis.LUNAR_DATA;",
  ""
].join("\n");

writeFileSync("public/lunar-data.js", output, "utf8");

const indexPath = "public/index.html";
const layoutStyle = `<link rel="stylesheet" href="layout-fix.css?v=${APP_VERSION}" />`;
let indexHtml = readFileSync(indexPath, "utf8");
if (!indexHtml.includes("layout-fix.css")) {
  indexHtml = indexHtml.replace(
    '<link rel="stylesheet" href="style.css" />',
    '<link rel="stylesheet" href="style.css" />\n  ' + layoutStyle
  );
} else {
  indexHtml = indexHtml.replace(/<link rel="stylesheet" href="layout-fix\.css[^\"]*" \/>/, layoutStyle);
}
indexHtml = indexHtml.replace(/<span class="version-pill">v[^<]+<\/span>/, `<span class="version-pill">v${APP_VERSION}</span>`);
writeFileSync(indexPath, indexHtml, "utf8");

console.log(`Generated public/lunar-data.js with ${rows.length} rows.`);
console.log(`Injected layout-fix.css v${APP_VERSION} into public/index.html.`);
console.log(`Prepared Soul Kaleidoscope calculator v${APP_VERSION}.`);
