import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKFLOW_DIR = '.workflow';
const SNAPSHOT_FILE = '.workflow/file-snapshot.json';
const SPREADSHEET_SNAPSHOT_FILE = '.workflow/spreadsheet-snapshot.json';
const START_REPORT_FILE = '.workflow/start-report.md';
const ACTIVE_SESSION_FILE = '.workflow/active-session.json';
const SHEETS_REGISTRY_FILE = 'config/google-sheets-registry.json';
const IGNORED_DIRS = new Set(['.git', '.workflow', 'node_modules', 'dist']);
const SPREADSHEET_SCAN_DIR = process.env.SPREADSHEET_SCAN_DIR || path.dirname(ROOT);
const SPREADSHEET_EXTENSIONS = new Set(['.gsheet', '.xlsx', '.xls', '.csv', '.ods']);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function safeHashFile(filePath) {
  try {
    return hashFile(filePath);
  } catch (error) {
    return `unreadable:${error.code || error.message}`;
  }
}

function scanWorkspaceFiles(dir = ROOT, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanWorkspaceFiles(absolutePath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const relativePath = toPosix(path.relative(ROOT, absolutePath));
    const stat = fs.statSync(absolutePath);
    files.push({
      path: relativePath,
      size: stat.size,
      mtimeMs: Math.round(stat.mtimeMs),
      sha256: hashFile(absolutePath)
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function scanSpreadsheetFiles(dir = SPREADSHEET_SCAN_DIR, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSpreadsheetFiles(absolutePath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!SPREADSHEET_EXTENSIONS.has(extension)) continue;
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) continue;
    files.push({
      path: toPosix(path.relative(SPREADSHEET_SCAN_DIR, absolutePath)),
      sourceDir: SPREADSHEET_SCAN_DIR,
      size: stat.size,
      mtimeMs: Math.round(stat.mtimeMs),
      sha256: safeHashFile(absolutePath)
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function loadSnapshot() {
  if (!fs.existsSync(path.join(ROOT, SNAPSHOT_FILE))) return null;
  return JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT_FILE), 'utf8'));
}

function loadSpreadsheetSnapshot() {
  if (!fs.existsSync(path.join(ROOT, SPREADSHEET_SNAPSHOT_FILE))) return null;
  return JSON.parse(fs.readFileSync(path.join(ROOT, SPREADSHEET_SNAPSHOT_FILE), 'utf8'));
}

function loadSheetsRegistry() {
  const registryPath = path.join(ROOT, SHEETS_REGISTRY_FILE);
  if (!fs.existsSync(registryPath)) {
    return { readPolicy: [], sheets: [] };
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function compareSnapshots(previous, current) {
  const previousMap = new Map((previous?.files || []).map((file) => [file.path, file]));
  const currentMap = new Map(current.files.map((file) => [file.path, file]));
  const addedFiles = current.files.filter((file) => !previousMap.has(file.path)).map((file) => file.path);
  const removedFiles = [...previousMap.keys()].filter((filePath) => !currentMap.has(filePath));
  const changedFiles = current.files
    .filter((file) => previousMap.has(file.path) && previousMap.get(file.path).sha256 !== file.sha256)
    .map((file) => file.path);
  return { addedFiles, removedFiles, changedFiles };
}

function recommendations(diff) {
  const items = [];
  if (diff.changedFiles.some((file) => file.startsWith('apps-script/'))) {
    items.push('Apps Script 有更新：部署前請跑 npm run readiness，並確認 Google Apps Script 只貼 dist/apps-script 封包。');
  }
  if (diff.changedFiles.some((file) => file.startsWith('web/') || file.startsWith('src/core/'))) {
    items.push('PWA 或核心邏輯有更新：請跑 npm run readiness，並部署 dist/static-site。');
  }
  if (diff.changedFiles.some((file) => file.startsWith('docs/'))) {
    items.push('文件有更新：請確認 README 與部署文件說法一致。');
  }
  if (items.length === 0) {
    items.push('未偵測到高風險更新；先從目前目標與部署驗證清單繼續。');
  }
  return items;
}

function renderSheetsRegistry(registry) {
  if (!registry.sheets?.length) return ['- 尚未建立試算表登錄表'];
  return registry.sheets.flatMap((sheet) => [
    `- ${sheet.title} (${sheet.role})`,
    `  - ID：${sheet.id}`,
    `  - 重點分頁：${sheet.criticalTabs.join('、')}`,
    `  - 風險：${sheet.risk}`
  ]);
}

function renderReport(current, diff, spreadsheetSnapshot, spreadsheetDiff, sheetsRegistry, advice) {
  return [
    '# 開工檢查',
    '',
    `時間：${current.generatedAt}`,
    `掃描檔案數：${current.files.length}`,
    '',
    '## 檔案更新',
    `- 新增：${diff.addedFiles.length}`,
    `- 修改：${diff.changedFiles.length}`,
    `- 刪除：${diff.removedFiles.length}`,
    '',
    '## 試算表檔案更新',
    `- 掃描資料夾：${spreadsheetSnapshot.sourceDir}`,
    `- 試算表檔案數：${spreadsheetSnapshot.files.length}`,
    `- 新增：${spreadsheetDiff.addedFiles.length}`,
    `- 修改：${spreadsheetDiff.changedFiles.length}`,
    `- 刪除：${spreadsheetDiff.removedFiles.length}`,
    '',
    '## 需確認的試算表',
    ...(spreadsheetDiff.changedFiles.length || spreadsheetDiff.addedFiles.length
      ? [...spreadsheetDiff.addedFiles, ...spreadsheetDiff.changedFiles].map((file) => `- ${file}`)
      : ['- 無']),
    '',
    '## 線上試算表登錄表',
    `- 登錄檔：${SHEETS_REGISTRY_FILE}`,
    `- 讀取策略：${sheetsRegistry.readPolicy.join('、') || '未設定'}`,
    ...renderSheetsRegistry(sheetsRegistry),
    '',
    '## 修改檔案',
    ...(diff.changedFiles.length ? diff.changedFiles.map((file) => `- ${file}`) : ['- 無']),
    '',
    '## 建議事項',
    ...advice.map((item) => `- ${item}`),
    '',
    '## 手工流程',
    '- 先看這份開工檢查。',
    '- 再看 docs/implementation-checklist.md。',
    '- 若今天要部署，先跑 npm run readiness。',
    '- 若已拿到 Apps Script Web App URL，依序跑 npm run verify:deployment:url、npm run verify:deployment:setup、npm run verify:deployment。',
    `- 若試算表有更新，先依 ${SHEETS_REGISTRY_FILE} 讀 metadata 與重點分頁，不要直接全表讀取。`,
    '- 若試算表有更新，先確認公式、內容資料庫、個案欄位或出圖規則是否影響目前流程。',
    '- 每日用量要保留到凌晨 12:00 的 npm run work:shutdown。'
  ].join('\n');
}

fs.mkdirSync(path.join(ROOT, WORKFLOW_DIR), { recursive: true });

if (fs.existsSync(path.join(ROOT, ACTIVE_SESSION_FILE))) {
  console.error('# 上次開工尚未收工');
  console.error('- 偵測到 .workflow/active-session.json。');
  console.error('- 請先執行 npm run work:shutdown，再重新執行 npm run work:start。');
  process.exit(1);
}

const previous = loadSnapshot();
const previousSpreadsheetSnapshot = loadSpreadsheetSnapshot();
const current = {
  generatedAt: new Date().toISOString(),
  files: scanWorkspaceFiles()
};
const sheetsRegistry = loadSheetsRegistry();
const spreadsheetSnapshot = {
  generatedAt: current.generatedAt,
  sourceDir: SPREADSHEET_SCAN_DIR,
  files: scanSpreadsheetFiles()
};
const diff = compareSnapshots(previous, current);
const spreadsheetDiff = compareSnapshots(previousSpreadsheetSnapshot, spreadsheetSnapshot);
const advice = recommendations(diff);
if (spreadsheetDiff.addedFiles.length || spreadsheetDiff.changedFiles.length || spreadsheetDiff.removedFiles.length) {
  advice.unshift('試算表檔案有更新：開工前要先確認是否影響公式、內容資料庫、個案資料表或出圖規則。');
}
const report = renderReport(current, diff, spreadsheetSnapshot, spreadsheetDiff, sheetsRegistry, advice);

fs.writeFileSync(path.join(ROOT, SNAPSHOT_FILE), `${JSON.stringify(current, null, 2)}\n`);
fs.writeFileSync(path.join(ROOT, SPREADSHEET_SNAPSHOT_FILE), `${JSON.stringify(spreadsheetSnapshot, null, 2)}\n`);
fs.writeFileSync(path.join(ROOT, START_REPORT_FILE), `${report}\n`);
fs.writeFileSync(path.join(ROOT, ACTIVE_SESSION_FILE), `${JSON.stringify({
  startedAt: current.generatedAt,
  scannedFiles: current.files.length,
  scannedSpreadsheets: spreadsheetSnapshot.files.length,
  sheetsRegistry: SHEETS_REGISTRY_FILE,
  startReport: START_REPORT_FILE,
  shutdownCommand: 'npm run work:shutdown',
  scheduledShutdown: '凌晨 12:00'
}, null, 2)}\n`);

console.log(report);
