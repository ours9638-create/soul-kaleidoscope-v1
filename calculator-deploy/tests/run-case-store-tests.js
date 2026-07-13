import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";

runInThisContext(readFileSync("public/case-store.js", "utf8"), { filename: "public/case-store.js" });
const Store = globalThis.SoulKaleidoscopeCaseStore;

const checks = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ name, actual, expected, pass });
}
function expectError(name, fn) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  check(name, failed, true);
}
function profile(name, solarBirth = "1989-05-28") {
  return {
    meta: { engineVersion: "2.2.1" },
    subject: { name },
    source: {
      solarBirthDate: solarBirth,
      birthTime: "15:17",
      queryDate: "2026-07-05",
      lunarBirth: { year: 1989, month: 4, day: 24, leap: false }
    }
  };
}
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    snapshot: () => Object.fromEntries(map.entries())
  };
}

const empty = Store.createEmptyDatabase({ appVersion: "2.7.0", exportedAt: "2026-07-12T00:00:00.000Z" });
check("空資料庫初始化", empty.records.length, 0);
check("空資料庫 schema", empty.schemaVersion, 1);

const recordA = Store.recordFromProfile(profile("測試 A"), {
  id: "case-a",
  timestamp: "2026-07-12T01:00:00.000Z"
});
let db = Store.addRecord(empty, recordA);
check("新增一筆", db.records.length, 1);

const recordB = Store.recordFromProfile(profile("測試 A"), {
  id: "case-b",
  timestamp: "2026-07-12T02:00:00.000Z"
});
db = Store.addRecord(db, recordB);
check("同名新增兩筆", db.records.map((record) => record.id).sort(), ["case-a", "case-b"]);

const overwritten = Store.recordFromProfile(profile("測試 A 更新"), {
  id: "case-a",
  timestamp: "2026-07-12T03:00:00.000Z",
  createdAt: recordA.createdAt
});
db = Store.updateRecord(db, "case-a", overwritten);
const updatedA = db.records.find((record) => record.id === "case-a");
check("覆寫保留 createdAt", updatedA.createdAt, recordA.createdAt);
check("覆寫更新 modifiedAt", updatedA.modifiedAt, "2026-07-12T03:00:00.000Z");

db = Store.deleteRecord(db, "case-b");
check("刪除指定 ID", db.records.map((record) => record.id), ["case-a"]);

const recordC = Store.recordFromProfile(profile("範例個案 C", "1991-09-23"), {
  id: "case-c",
  timestamp: "2026-07-12T04:00:00.000Z"
});
db = Store.addRecord(db, recordC);
check("搜尋姓名", Store.searchRecords(db.records, "範例個案").map((record) => record.id), ["case-c"]);
check("搜尋生日", Store.searchRecords(db.records, "1991-09").map((record) => record.id), ["case-c"]);
check("修改時間排序", Store.sortRecords(db.records).map((record) => record.id), ["case-c", "case-a"]);

const exported = Store.exportDatabase(db, { appVersion: "2.7.0", exportedAt: "2026-07-12T05:00:00.000Z" });
const importedReplace = Store.importDatabase(Store.createEmptyDatabase({ appVersion: "2.7.0" }), exported, { mode: "replace", appVersion: "2.7.0" });
check("匯出再匯入筆數一致", importedReplace.database.records.length, db.records.length);
check("匯出再匯入資料一致", importedReplace.database.records, Store.sortRecords(db.records));

expectError("無效 JSON 被拒絕", () => Store.importDatabase(db, "{not-json", { mode: "merge" }));
expectError("不支援 schema 被拒絕", () => Store.importDatabase(db, { schemaVersion: 99, records: [] }, { mode: "merge" }));
expectError("缺少 records 陣列被拒絕", () => Store.importDatabase(db, { schemaVersion: 1, appVersion: "2.7.0" }, { mode: "merge" }));
expectError("無效日曆日期被拒絕", () => Store.addRecord(empty, { ...recordA, id: "invalid-date", solarBirth: "2026-02-30" }));
expectError("查詢日早於生日被拒絕", () => Store.addRecord(empty, { ...recordA, id: "invalid-order", solarBirth: "2026-07-06", queryDate: "2026-07-05" }));

const storage = memoryStorage();
const browserStore = Store.createStore({ storage, appVersion: "2.7.0" });
browserStore.save(db);
const beforeFailedImport = storage.snapshot();
expectError("匯入失敗會拋錯", () => browserStore.importText("{broken"));
check("匯入失敗不改變原資料", storage.snapshot(), beforeFailedImport);

const oldVersionStorage = memoryStorage();
oldVersionStorage.setItem(Store.STORE_KEY, JSON.stringify({ ...db, appVersion: "2.3.0" }));
const upgradedStore = Store.createStore({ storage: oldVersionStorage, appVersion: "2.7.0" });
check("本機資料庫 appVersion 自動升級", upgradedStore.load().appVersion, "2.7.0");

let hundred = Store.createEmptyDatabase({ appVersion: "2.7.0" });
for (let index = 0; index < 100; index += 1) {
  const item = Store.recordFromProfile(profile(`個案 ${index}`, `1991-09-${String((index % 28) + 1).padStart(2, "0")}`), {
    id: `bulk-${index}`,
    timestamp: `2026-07-12T${String(Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}:00.000Z`
  });
  hundred = Store.addRecord(hundred, item);
}
check("100 筆資料保存", hundred.records.length, 100);
check("100 筆搜尋", Store.searchRecords(hundred.records, "個案 99").length, 1);

const legacy = {
  schemaVersion: 0,
  appVersion: "2.2.0",
  records: [{
    id: "legacy-1",
    name: "舊資料",
    solarBirthDate: "1989-05-28",
    birthTime: "15:17",
    queryDate: "2026-07-05",
    lunarBirth: { year: 1989, month: 4, day: 24, leap: false },
    engineVersion: "2.2.0",
    createdAt: "2026-07-01T00:00:00.000Z",
    modifiedAt: "2026-07-01T00:00:00.000Z"
  }]
};
const migrated = Store.migrateDatabase(legacy, { appVersion: "2.7.0" });
check("舊 schema 遷移", migrated.schemaVersion, 1);
check("舊欄位 solarBirthDate 遷移", migrated.records[0].solarBirth, "1989-05-28");

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Case store tests failed ${checks.length - failed.length}/${checks.length}`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}`);
  process.exit(1);
}

console.log(`Case store tests passed ${checks.length}/${checks.length}.`);
console.log(`Case store schema ${Store.SCHEMA_VERSION}; module ${Store.VERSION}.`);
