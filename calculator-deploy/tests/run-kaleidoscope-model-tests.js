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
runInThisContext(readFileSync("public/kaleidoscope-model.js", "utf8"), { filename: "public/kaleidoscope-model.js" });

const C = globalThis.SoulKaleidoscopeCore;
const Profile = globalThis.SoulKaleidoscopeProfile;
const Visual = globalThis.SoulKaleidoscopeVisualModel;
const engine = C.createEngine(rows);
const fixture = JSON.parse(readFileSync("tests/fixtures/regression-cases.json", "utf8")).cases.find((item) => item.id === "case-1991-09-23");
const [hour, minute] = fixture.input.birthTime.split(":").map(Number);
const input = {
  name: fixture.input.name,
  solarBirth: C.parseDateString(fixture.input.solarBirthDate),
  queryDate: fixture.input.queryDate,
  query: C.parseDateString(fixture.input.queryDate),
  lunarBirth: { ...fixture.input.lunarBirth },
  time: { inputHour: hour, calculationHour: C.normalizeHourForCalculation(hour), minute }
};
const result = engine.calculateAll(input);
const profile = Profile.build({ input, result, engineVersion: C.VERSION, generatedAt: "2026-07-13T00:00:00.000Z" });
const model = Visual.build(profile);
const byKey = Object.fromEntries(model.rows.map((row) => [row.key, row]));

const checks = [];
function check(name, actual, expected) {
  checks.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) });
}
function expectError(name, fn) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  check(name, failed, true);
}

check("模型版本", Visual.VERSION, "1.0.0");
check("固定位置數量", model.rows.length, 11);
check("中心主命數", byKey.center.value, "7");
check("上方國曆日月綻放", byKey.top.value, "5");
check("上方副標陰曆日月綻放", byKey.topSub.value, "6");
check("左上木馬二", byKey.horse2.value, "3");
check("右上木馬一", byKey.horse1.value, "4");
check("左下木馬三", byKey.horse3.value, "1");
check("右下木馬四", byKey.horse4.value, "7");
check("左側陰曆貴人", byKey.lunarNoble.value, "6");
check("右側陽曆貴人", byKey.solarNoble.value, "3");
check("下方流年", byKey.flowYear.value, "23/5");
check("最外圈今年位格", byKey.position.value, "8");
check("純文字包含位置", Visual.plainText(model).includes("最外圈｜今年位格：8"), true);
check("純文字不含 Joanna", Visual.plainText(model).includes("Joanna"), false);
expectError("缺少 Profile 被拒絕", () => Visual.build(null));

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Kaleidoscope model tests failed ${checks.length - failed.length}/${checks.length}`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}`);
  process.exit(1);
}

console.log(`Kaleidoscope model tests passed ${checks.length}/${checks.length}.`);
console.log(`Soul Kaleidoscope visual model ${Visual.VERSION}; fixed positions ${model.rows.length}.`);
