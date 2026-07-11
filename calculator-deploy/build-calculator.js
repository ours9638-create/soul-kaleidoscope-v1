import { mkdirSync, writeFileSync } from "node:fs";
import { LUNAR_CALENDAR_1940_2035 } from "../src/core/lunar-calendar-data.js";

mkdirSync("public", { recursive: true });

const rows = Object.entries(LUNAR_CALENDAR_1940_2035).map(([solarDate, lunarValue]) => {
  const isLeap = lunarValue.endsWith("L");
  const [year, month, day] = lunarValue.replace(/L$/, "").split("-").map(Number);
  return [solarDate, year, month, day, isLeap ? 1 : 0];
});

const output = [
  "/* Generated from src/core/lunar-calendar-data.js during Cloudflare build. */",
  `const LUNAR_DATA = ${JSON.stringify(rows)};`,
  "if (typeof module !== \"undefined\" && module.exports) module.exports = LUNAR_DATA;",
  ""
].join("\n");

writeFileSync("public/lunar-data.js", output, "utf8");
console.log(`Generated public/lunar-data.js with ${rows.length} rows.`);
