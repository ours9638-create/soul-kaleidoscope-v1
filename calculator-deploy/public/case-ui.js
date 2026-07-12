(() => {
  "use strict";

  const CaseStore = window.SoulKaleidoscopeCaseStore;
  const appVersion = document.querySelector('meta[name="app-version"]')?.content || "unknown";
  const $ = (id) => document.getElementById(id);
  const form = $("calcForm");
  const searchInput = $("caseSearch");
  const listNode = $("caseList");
  const countNode = $("caseCount");
  const currentNode = $("currentCaseText");
  const backupNode = $("lastBackupText");
  const noticeNode = $("caseNotice");
  const saveNewButton = $("saveNewCaseBtn");
  const overwriteButton = $("overwriteCaseBtn");
  const deleteButton = $("deleteCaseBtn");
  const exportButton = $("exportCasesBtn");
  const importButton = $("importCasesBtn");
  const importInput = $("importCasesInput");
  const LAST_BACKUP_KEY = "soul-kaleidoscope.case-store.last-backup";

  if (!CaseStore || !form || !listNode) return;

  let store = null;
  let currentCaseId = null;
  let storageAvailable = true;

  function showNotice(message, error = false) {
    noticeNode.textContent = message;
    noticeNode.classList.toggle("is-error", error);
  }

  function setControlsEnabled(enabled) {
    [searchInput, saveNewButton, exportButton, importButton].forEach((node) => { if (node) node.disabled = !enabled; });
    updateSelectionControls(enabled);
  }

  function updateSelectionControls(baseEnabled = storageAvailable) {
    overwriteButton.disabled = !baseEnabled || !currentCaseId;
    deleteButton.disabled = !baseEnabled || !currentCaseId;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function renderBackupStatus() {
    const value = localStorage.getItem(LAST_BACKUP_KEY);
    backupNode.textContent = value ? `最後備份：${formatDateTime(value)}` : "尚未匯出備份";
  }

  function renderList() {
    if (!store) return;
    const database = store.load();
    const records = CaseStore.searchRecords(database.records, searchInput.value);
    countNode.textContent = `本機 ${database.records.length} 筆`;
    listNode.replaceChildren();

    if (records.length === 0) {
      const empty = document.createElement("p");
      empty.className = "case-empty";
      empty.textContent = database.records.length === 0 ? "尚未儲存個案。" : "找不到符合條件的個案。";
      listNode.append(empty);
      updateSelectionControls();
      return;
    }

    for (const record of records) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `case-item${record.id === currentCaseId ? " is-selected" : ""}`;
      button.dataset.caseId = record.id;
      button.setAttribute("role", "listitem");

      const name = document.createElement("strong");
      name.className = "case-item__name";
      name.textContent = record.name || "未填姓名";

      const date = document.createElement("span");
      date.className = "case-item__date";
      date.textContent = record.solarBirth;

      const modified = document.createElement("small");
      modified.className = "case-item__modified";
      modified.textContent = `更新：${formatDateTime(record.modifiedAt)}｜建立引擎 ${record.engineVersion}`;

      button.append(name, date, modified);
      listNode.append(button);
    }
    updateSelectionControls();
  }

  function ensureFreshProfile() {
    delete window.__SOUL_PROFILE__;
    form.requestSubmit();
    const profile = window.__SOUL_PROFILE__;
    if (!profile) throw new Error("請先完成有效計算，再儲存個案");
    return profile;
  }

  function fillForm(record) {
    $("name").value = record.name;
    $("solarBirth").value = record.solarBirth;
    $("birthTime").value = record.birthTime;
    $("queryDate").value = record.queryDate;
    $("lunarYear").value = record.lunarBirth.year;
    $("lunarMonth").value = record.lunarBirth.month;
    $("lunarDay").value = record.lunarBirth.day;
    $("lunarLeap").checked = Boolean(record.lunarBirth.leap);
    $("lunarMonth").dispatchEvent(new Event("input", { bubbles: true }));
    $("queryDate").dispatchEvent(new Event("change", { bubbles: true }));
  }

  function loadCase(id) {
    const record = store.find(id);
    if (!record) throw new Error("找不到此個案，資料可能已被刪除");
    fillForm(record);
    delete window.__SOUL_PROFILE__;
    form.requestSubmit();
    if (!window.__SOUL_PROFILE__) throw new Error("個案已載入，但目前版本無法重新計算");
    currentCaseId = record.id;
    currentNode.textContent = `目前個案：${record.name || "未填姓名"}｜${record.solarBirth}`;
    renderList();
    showNotice(`已載入「${record.name || "未填姓名"}」，並使用目前引擎重新計算。`);
    document.querySelector(".input-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saveNewCase() {
    const profile = ensureFreshProfile();
    const record = store.addFromProfile(profile);
    currentCaseId = record.id;
    currentNode.textContent = `目前個案：${record.name || "未填姓名"}｜${record.solarBirth}`;
    renderList();
    showNotice(`已另存「${record.name || "未填姓名"}」。資料只保存在目前瀏覽器。`);
  }

  function overwriteCurrentCase() {
    if (!currentCaseId) throw new Error("請先從個案列表載入一筆紀錄");
    const profile = ensureFreshProfile();
    const record = store.overwriteFromProfile(currentCaseId, profile);
    currentNode.textContent = `目前個案：${record.name || "未填姓名"}｜${record.solarBirth}`;
    renderList();
    showNotice(`已覆寫「${record.name || "未填姓名"}」，原建立時間已保留。`);
  }

  function deleteCurrentCase() {
    if (!currentCaseId) throw new Error("請先選擇要刪除的個案");
    const record = store.find(currentCaseId);
    if (!record) throw new Error("此個案已不存在");
    const confirmed = window.confirm(`確定刪除「${record.name || "未填姓名"}」\n國曆生日：${record.solarBirth}\n\n刪除後無法直接復原，建議先匯出備份。`);
    if (!confirmed) return;
    store.remove(currentCaseId);
    currentCaseId = null;
    currentNode.textContent = "目前未載入個案";
    renderList();
    showNotice(`已刪除「${record.name || "未填姓名"}」。`);
  }

  function downloadBackup() {
    const database = store.load();
    if (database.records.length === 0) throw new Error("目前沒有可匯出的個案");
    const confirmed = window.confirm(`將匯出 ${database.records.length} 筆個案。\n備份檔包含姓名、生日與出生時間，請妥善保存。`);
    if (!confirmed) return;

    const text = store.exportText();
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `soul-kaleidoscope-cases-${day}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const timestamp = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, timestamp);
    renderBackupStatus();
    showNotice(`已匯出 ${database.records.length} 筆個案備份。`);
  }

  async function importBackup(file) {
    if (!file) return;
    const text = await file.text();
    const preview = CaseStore.importDatabase(store.load(), text, { mode: "merge", appVersion });
    const { summary } = preview;
    const confirmed = window.confirm(
      `匯入預覽｜${file.name}\n\n` +
      `新增：${summary.added} 筆\n更新：${summary.updated} 筆\n相同略過：${summary.skipped} 筆\n保留本機較新資料：${summary.conflicts} 筆\n\n` +
      "現有資料不會先被清空。確定合併匯入？"
    );
    if (!confirmed) return;
    store.save(preview.database);
    renderList();
    showNotice(`匯入完成：新增 ${summary.added}、更新 ${summary.updated}、略過 ${summary.skipped}、保留本機較新資料 ${summary.conflicts}。`);
  }

  listNode.addEventListener("click", (event) => {
    const button = event.target.closest("[data-case-id]");
    if (!button) return;
    try { loadCase(button.dataset.caseId); } catch (error) { showNotice(error.message, true); }
  });

  searchInput.addEventListener("input", () => {
    try { renderList(); } catch (error) { showNotice(error.message, true); }
  });
  saveNewButton.addEventListener("click", () => {
    try { saveNewCase(); } catch (error) { showNotice(error.message, true); }
  });
  overwriteButton.addEventListener("click", () => {
    try { overwriteCurrentCase(); } catch (error) { showNotice(error.message, true); }
  });
  deleteButton.addEventListener("click", () => {
    try { deleteCurrentCase(); } catch (error) { showNotice(error.message, true); }
  });
  exportButton.addEventListener("click", () => {
    try { downloadBackup(); } catch (error) { showNotice(error.message, true); }
  });
  importButton.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async () => {
    try { await importBackup(importInput.files?.[0]); } catch (error) { showNotice(`匯入失敗：${error.message}`, true); }
    finally { importInput.value = ""; }
  });
  $("resetBtn")?.addEventListener("click", () => {
    currentCaseId = null;
    currentNode.textContent = "目前未載入個案";
    try { renderList(); } catch (error) { showNotice(error.message, true); }
    showNotice("已清除計算表單；本機個案資料未刪除。");
  });

  try {
    store = CaseStore.createStore({ storage: window.localStorage, appVersion });
    store.load();
    renderList();
    renderBackupStatus();
    showNotice("個案資料僅保存在此裝置；清除網站資料前請先匯出備份。");
  } catch (error) {
    storageAvailable = false;
    setControlsEnabled(false);
    currentNode.textContent = "本機儲存不可用";
    showNotice(`個案管理無法啟用：${error.message}`, true);
  }
})();
