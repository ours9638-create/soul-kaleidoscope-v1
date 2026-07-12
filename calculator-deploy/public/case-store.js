(function (global) {
  "use strict";

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = 1;
  const STORE_KEY = "soul-kaleidoscope.case-store";
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const nowIso = () => new Date().toISOString();

  function createId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return `case-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function validateRecord(record) {
    const errors = [];
    if (!record || typeof record !== "object") return { ok: false, errors: ["個案紀錄必須是物件"] };
    if (!record.id || typeof record.id !== "string") errors.push("id 不可為空");
    if (typeof record.name !== "string") errors.push("name 必須是文字");
    if (!DATE_RE.test(record.solarBirth || "")) errors.push("solarBirth 格式錯誤");
    if (!TIME_RE.test(record.birthTime || "")) errors.push("birthTime 格式錯誤");
    if (!DATE_RE.test(record.queryDate || "")) errors.push("queryDate 格式錯誤");
    if (!record.lunarBirth || typeof record.lunarBirth !== "object") {
      errors.push("lunarBirth 不可為空");
    } else {
      const { year, month, day, leap } = record.lunarBirth;
      if (!Number.isInteger(year) || year < 1900 || year > 2200) errors.push("lunarBirth.year 錯誤");
      if (!Number.isInteger(month) || month < 1 || month > 12) errors.push("lunarBirth.month 錯誤");
      if (!Number.isInteger(day) || day < 1 || day > 30) errors.push("lunarBirth.day 錯誤");
      if (typeof leap !== "boolean") errors.push("lunarBirth.leap 必須為布林值");
    }
    if (!record.engineVersion || typeof record.engineVersion !== "string") errors.push("engineVersion 不可為空");
    if (Number.isNaN(Date.parse(record.createdAt || ""))) errors.push("createdAt 格式錯誤");
    if (Number.isNaN(Date.parse(record.modifiedAt || ""))) errors.push("modifiedAt 格式錯誤");
    return { ok: errors.length === 0, errors };
  }

  function normalizeRecord(record) {
    const normalized = {
      id: String(record.id || ""),
      name: String(record.name ?? ""),
      solarBirth: String(record.solarBirth || record.solarBirthDate || ""),
      birthTime: String(record.birthTime || ""),
      queryDate: String(record.queryDate || ""),
      lunarBirth: {
        year: Number(record.lunarBirth?.year),
        month: Number(record.lunarBirth?.month),
        day: Number(record.lunarBirth?.day),
        leap: Boolean(record.lunarBirth?.leap)
      },
      engineVersion: String(record.engineVersion || "unknown"),
      createdAt: String(record.createdAt || record.modifiedAt || nowIso()),
      modifiedAt: String(record.modifiedAt || record.createdAt || nowIso())
    };
    const validation = validateRecord(normalized);
    if (!validation.ok) throw new Error(`個案資料格式錯誤：${validation.errors.join("、")}`);
    return normalized;
  }

  function createEmptyDatabase({ appVersion = "unknown", exportedAt = nowIso() } = {}) {
    return { schemaVersion: SCHEMA_VERSION, exportedAt, appVersion: String(appVersion), records: [] };
  }

  function migrateDatabase(value, { appVersion = "unknown" } = {}) {
    if (Array.isArray(value)) {
      return {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: nowIso(),
        appVersion,
        records: value.map(normalizeRecord)
      };
    }
    if (!value || typeof value !== "object") throw new Error("備份資料必須是物件或舊版陣列");
    if (value.schemaVersion === SCHEMA_VERSION) {
      return {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: String(value.exportedAt || nowIso()),
        appVersion: String(value.appVersion || appVersion),
        records: (value.records || []).map(normalizeRecord)
      };
    }
    if (value.schemaVersion === 0) {
      return {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: String(value.exportedAt || nowIso()),
        appVersion: String(value.appVersion || appVersion),
        records: (value.records || []).map(normalizeRecord)
      };
    }
    throw new Error(`不支援的個案資料版本：${value.schemaVersion}`);
  }

  function validateDatabase(database) {
    const errors = [];
    if (!database || typeof database !== "object") return { ok: false, errors: ["資料庫必須是物件"] };
    if (database.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion 必須為 ${SCHEMA_VERSION}`);
    if (!Array.isArray(database.records)) errors.push("records 必須是陣列");
    const ids = new Set();
    for (const record of database.records || []) {
      const validation = validateRecord(record);
      if (!validation.ok) errors.push(`${record?.id || "未知 ID"}：${validation.errors.join("、")}`);
      if (ids.has(record.id)) errors.push(`個案 ID 重複：${record.id}`);
      ids.add(record.id);
    }
    return { ok: errors.length === 0, errors };
  }

  function sortRecords(records) {
    return [...records].sort((a, b) => String(b.modifiedAt).localeCompare(String(a.modifiedAt)));
  }

  function searchRecords(records, query) {
    const term = String(query || "").trim().toLowerCase();
    const sorted = sortRecords(records);
    if (!term) return sorted;
    return sorted.filter((record) => record.name.toLowerCase().includes(term) || record.solarBirth.includes(term));
  }

  function recordFromProfile(profile, { id = createId(), timestamp = nowIso(), createdAt = timestamp } = {}) {
    if (!profile?.source || !profile?.meta) throw new Error("儲存個案前必須先完成有效計算");
    return normalizeRecord({
      id,
      name: profile.subject?.name || "未填姓名",
      solarBirth: profile.source.solarBirthDate,
      birthTime: profile.source.birthTime,
      queryDate: profile.source.queryDate,
      lunarBirth: {
        year: profile.source.lunarBirth.year,
        month: profile.source.lunarBirth.month,
        day: profile.source.lunarBirth.day,
        leap: Boolean(profile.source.lunarBirth.leap)
      },
      engineVersion: profile.meta.engineVersion,
      createdAt,
      modifiedAt: timestamp
    });
  }

  function addRecord(database, record) {
    const db = migrateDatabase(database, { appVersion: database?.appVersion });
    const normalized = normalizeRecord(record);
    if (db.records.some((item) => item.id === normalized.id)) throw new Error(`個案 ID 已存在：${normalized.id}`);
    return { ...db, exportedAt: nowIso(), records: sortRecords([...db.records, normalized]) };
  }

  function updateRecord(database, id, replacement) {
    const db = migrateDatabase(database, { appVersion: database?.appVersion });
    const existing = db.records.find((item) => item.id === id);
    if (!existing) throw new Error("找不到要覆寫的個案");
    const normalized = normalizeRecord({ ...replacement, id, createdAt: existing.createdAt });
    return {
      ...db,
      exportedAt: nowIso(),
      records: sortRecords(db.records.map((item) => item.id === id ? normalized : item))
    };
  }

  function deleteRecord(database, id) {
    const db = migrateDatabase(database, { appVersion: database?.appVersion });
    if (!db.records.some((item) => item.id === id)) return db;
    return { ...db, exportedAt: nowIso(), records: db.records.filter((item) => item.id !== id) };
  }

  function exportDatabase(database, { appVersion = database?.appVersion || "unknown", exportedAt = nowIso() } = {}) {
    const db = migrateDatabase(database, { appVersion });
    return JSON.stringify({ ...db, appVersion: String(appVersion), exportedAt, records: sortRecords(db.records) }, null, 2);
  }

  function importDatabase(currentDatabase, payload, { mode = "merge", appVersion = currentDatabase?.appVersion || "unknown" } = {}) {
    const current = migrateDatabase(currentDatabase, { appVersion });
    const parsed = typeof payload === "string" ? JSON.parse(payload) : clone(payload);
    const incoming = migrateDatabase(parsed, { appVersion });
    const validation = validateDatabase(incoming);
    if (!validation.ok) throw new Error(`匯入資料驗證失敗：${validation.errors.join("、")}`);

    if (mode === "replace") {
      return {
        database: { ...incoming, appVersion, exportedAt: nowIso(), records: sortRecords(incoming.records) },
        summary: { added: incoming.records.length, updated: 0, skipped: 0, conflicts: 0, mode }
      };
    }
    if (mode !== "merge") throw new Error(`不支援的匯入模式：${mode}`);

    const map = new Map(current.records.map((record) => [record.id, record]));
    const summary = { added: 0, updated: 0, skipped: 0, conflicts: 0, mode };
    for (const record of incoming.records) {
      const existing = map.get(record.id);
      if (!existing) {
        map.set(record.id, record);
        summary.added += 1;
        continue;
      }
      if (JSON.stringify(existing) === JSON.stringify(record)) {
        summary.skipped += 1;
        continue;
      }
      if (record.modifiedAt > existing.modifiedAt) {
        map.set(record.id, record);
        summary.updated += 1;
      } else {
        summary.conflicts += 1;
      }
    }
    return {
      database: { ...current, appVersion, exportedAt: nowIso(), records: sortRecords([...map.values()]) },
      summary
    };
  }

  function createStore({ storage = global.localStorage, appVersion = "unknown" } = {}) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      throw new Error("目前瀏覽器無法使用本機儲存");
    }

    function save(database) {
      const db = migrateDatabase(database, { appVersion });
      const validation = validateDatabase(db);
      if (!validation.ok) throw new Error(`個案資料庫驗證失敗：${validation.errors.join("、")}`);
      storage.setItem(STORE_KEY, JSON.stringify(db));
      return clone(db);
    }

    function load() {
      const raw = storage.getItem(STORE_KEY);
      if (!raw) return save(createEmptyDatabase({ appVersion }));
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("本機個案資料已損壞，請先保留原資料並從備份還原");
      }
      const migrated = migrateDatabase(parsed, { appVersion });
      const validation = validateDatabase(migrated);
      if (!validation.ok) throw new Error(`本機個案資料驗證失敗：${validation.errors.join("、")}`);
      if (JSON.stringify(parsed) !== JSON.stringify(migrated)) save(migrated);
      return clone(migrated);
    }

    function addFromProfile(profile, options = {}) {
      const database = load();
      const record = recordFromProfile(profile, options);
      save(addRecord(database, record));
      return clone(record);
    }

    function overwriteFromProfile(id, profile, { timestamp = nowIso() } = {}) {
      const database = load();
      const existing = database.records.find((item) => item.id === id);
      if (!existing) throw new Error("目前個案已不存在，請另存為新個案");
      const record = recordFromProfile(profile, { id, timestamp, createdAt: existing.createdAt });
      save(updateRecord(database, id, record));
      return clone(record);
    }

    function remove(id) {
      const database = load();
      return save(deleteRecord(database, id));
    }

    function importText(text, options = {}) {
      const current = load();
      const result = importDatabase(current, text, { ...options, appVersion });
      save(result.database);
      return result;
    }

    return {
      load,
      save,
      addFromProfile,
      overwriteFromProfile,
      remove,
      importText,
      exportText: () => exportDatabase(load(), { appVersion }),
      search: (query) => searchRecords(load().records, query),
      find: (id) => load().records.find((record) => record.id === id) || null
    };
  }

  global.SoulKaleidoscopeCaseStore = {
    VERSION,
    SCHEMA_VERSION,
    STORE_KEY,
    createEmptyDatabase,
    migrateDatabase,
    validateRecord,
    validateDatabase,
    sortRecords,
    searchRecords,
    recordFromProfile,
    addRecord,
    updateRecord,
    deleteRecord,
    exportDatabase,
    importDatabase,
    createStore
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SoulKaleidoscopeCaseStore;
})(globalThis);
