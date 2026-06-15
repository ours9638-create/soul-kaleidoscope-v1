import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKFLOW_DIR = '.workflow';
const SNAPSHOT_FILE = '.workflow/file-snapshot.json';
const SPREADSHEET_SNAPSHOT_FILE = '.workflow/spreadsheet-snapshot.json';
const CLOUD_DRIVE_SNAPSHOT_FILE = '.workflow/cloud-drive-snapshot.json';
const CLOUD_DRIVE_READ_REPORT_FILE = '.workflow/cloud-drive-read-report.json';
const START_REPORT_FILE = '.workflow/start-report.md';
const ACTIVE_SESSION_FILE = '.workflow/active-session.json';
const SHEETS_REGISTRY_FILE = 'config/google-sheets-registry.json';
const CLOUD_DRIVE_CONFIG_FILE = 'config/google-drive-cloud-sync.json';
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

function loadCloudDriveSnapshot() {
  if (!fs.existsSync(path.join(ROOT, CLOUD_DRIVE_SNAPSHOT_FILE))) return null;
  return JSON.parse(fs.readFileSync(path.join(ROOT, CLOUD_DRIVE_SNAPSHOT_FILE), 'utf8'));
}

function loadSheetsRegistry() {
  const registryPath = path.join(ROOT, SHEETS_REGISTRY_FILE);
  if (!fs.existsSync(registryPath)) {
    return { readPolicy: [], sheets: [] };
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function loadCloudDriveConfig() {
  const configPath = path.join(ROOT, CLOUD_DRIVE_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return { folderName: '靈魂萬花筒', readPolicy: [] };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
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

function compareCloudSnapshots(previous, current) {
  const previousMap = new Map((previous?.files || []).map((file) => [file.id, file]));
  const currentMap = new Map((current?.files || []).map((file) => [file.id, file]));
  const addedFiles = (current?.files || [])
    .filter((file) => !previousMap.has(file.id))
    .map((file) => file.path);
  const removedFiles = [...previousMap.values()]
    .filter((file) => !currentMap.has(file.id))
    .map((file) => file.path);
  const changedFiles = (current?.files || [])
    .filter((file) => {
      const previousFile = previousMap.get(file.id);
      return previousFile && (
        previousFile.updatedAt !== file.updatedAt ||
        previousFile.size !== file.size ||
        previousFile.mimeType !== file.mimeType
      );
    })
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

function resolveAppsScriptUrl(config) {
  if (process.env.APPS_SCRIPT_URL) return process.env.APPS_SCRIPT_URL;
  const source = config.appsScriptUrlSource || 'web/deployment-config.js';
  const sourcePath = path.join(ROOT, source);
  if (!fs.existsSync(sourcePath)) return '';
  const content = fs.readFileSync(sourcePath, 'utf8');
  const match = content.match(/appsScriptApiUrl:\s*'([^']+)'/);
  return match ? match[1] : '';
}

function loadStartupSyncToken() {
  if (process.env.STARTUP_SYNC_TOKEN) return process.env.STARTUP_SYNC_TOKEN.trim();
  const tokenPath = path.join(ROOT, WORKFLOW_DIR, 'startup-sync-token.txt');
  if (!fs.existsSync(tokenPath)) return '';
  return fs.readFileSync(tokenPath, 'utf8').trim();
}

function buildCloudUrl(apiUrl, config, mode, token) {
  const url = new URL(apiUrl);
  url.searchParams.set('action', 'startup-cloud-scan');
  url.searchParams.set('mode', mode);
  url.searchParams.set('token', token);
  url.searchParams.set('folderName', config.folderName || '靈魂萬花筒');
  for (const key of ['maxTextCharsPerFile', 'maxPreviewRowsPerSheet', 'maxPreviewColumnsPerSheet', 'maxBlobBytesPerFile']) {
    if (config[key] != null) url.searchParams.set(key, String(config[key]));
  }
  return url;
}

async function fetchCloudDrive(apiUrl, config, mode, token) {
  const response = await fetch(buildCloudUrl(apiUrl, config, mode, token));
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`cloud scan returned non-JSON response: HTTP ${response.status}`);
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `cloud scan failed: HTTP ${response.status}`);
  }
  return data;
}

async function buildCloudDriveState(generatedAt, config) {
  const apiUrl = resolveAppsScriptUrl(config);
  const token = loadStartupSyncToken();
  if (!apiUrl) {
    return {
      status: 'skipped',
      reason: 'missing Apps Script URL',
      generatedAt,
      folderName: config.folderName || '靈魂萬花筒',
      files: []
    };
  }
  if (!token) {
    return {
      status: 'skipped',
      reason: 'missing STARTUP_SYNC_TOKEN or .workflow/startup-sync-token.txt',
      generatedAt,
      folderName: config.folderName || '靈魂萬花筒',
      files: []
    };
  }
  try {
    const metadata = await fetchCloudDrive(apiUrl, config, 'metadata', token);
    return {
      status: 'ok',
      generatedAt,
      source: 'apps-script',
      appsScriptUrl: apiUrl,
      folderName: metadata.folderName,
      fileCount: metadata.fileCount,
      files: metadata.files
    };
  } catch (error) {
    return {
      status: 'failed',
      reason: error.message,
      generatedAt,
      folderName: config.folderName || '靈魂萬花筒',
      files: []
    };
  }
}

async function readAllCloudFilesIfNeeded(cloudDriveSnapshot, cloudDriveDiff, config) {
  const hasChanges = cloudDriveDiff.addedFiles.length || cloudDriveDiff.changedFiles.length || cloudDriveDiff.removedFiles.length;
  if (!hasChanges || cloudDriveSnapshot.status !== 'ok') return null;
  const apiUrl = resolveAppsScriptUrl(config);
  const token = loadStartupSyncToken();
  let safeReport;
  try {
    const readReport = await fetchCloudDrive(apiUrl, config, 'readAll', token);
    safeReport = {
      status: 'ok',
      generatedAt: readReport.generatedAt,
      folderName: readReport.folderName,
      fileCount: readReport.fileCount,
      readSummary: readReport.readSummary,
      reads: readReport.reads
    };
  } catch (error) {
    safeReport = {
      status: 'failed',
      generatedAt: new Date().toISOString(),
      folderName: config.folderName || '靈魂萬花筒',
      error: error.message,
      readSummary: { read: 0, skipped: 0, failed: 1 },
      reads: []
    };
  }
  fs.writeFileSync(path.join(ROOT, CLOUD_DRIVE_READ_REPORT_FILE), `${JSON.stringify(safeReport, null, 2)}\n`);
  return safeReport;
}

function renderCloudDriveSection(cloudDriveConfig, cloudDriveSnapshot, cloudDriveDiff, cloudReadReport) {
  const lines = [
    '## 雲端 Drive 檔案檢查',
    `- 設定檔：${CLOUD_DRIVE_CONFIG_FILE}`,
    `- 雲端資料夾：${cloudDriveSnapshot.folderName || cloudDriveConfig.folderName || '靈魂萬花筒'}`,
    `- 讀取策略：${(cloudDriveConfig.readPolicy || []).join('、') || '未設定'}`,
    `- 狀態：${cloudDriveSnapshot.status}`
  ];
  if (cloudDriveSnapshot.reason) lines.push(`- 狀態說明：${cloudDriveSnapshot.reason}`);
  lines.push(
    `- 雲端檔案數：${cloudDriveSnapshot.files.length}`,
    `- 新增：${cloudDriveDiff.addedFiles.length}`,
    `- 修改：${cloudDriveDiff.changedFiles.length}`,
    `- 刪除：${cloudDriveDiff.removedFiles.length}`,
    '',
    '## 需確認的雲端檔案',
    ...(cloudDriveDiff.changedFiles.length || cloudDriveDiff.addedFiles.length || cloudDriveDiff.removedFiles.length
      ? [
        ...cloudDriveDiff.addedFiles.map((file) => `- 新增：${file}`),
        ...cloudDriveDiff.changedFiles.map((file) => `- 修改：${file}`),
        ...cloudDriveDiff.removedFiles.map((file) => `- 刪除：${file}`)
      ]
      : ['- 無'])
  );
  lines.push('', '## 雲端更新後網路讀取');
  if (cloudReadReport) {
    lines.push(
      `- 已透過 Apps Script 網路讀取雲端資料夾檔案摘要：${CLOUD_DRIVE_READ_REPORT_FILE}`,
      `- 網路讀取狀態：${cloudReadReport.status}`,
      `- 讀取成功：${cloudReadReport.readSummary?.read ?? 0}`,
      `- 跳過：${cloudReadReport.readSummary?.skipped ?? 0}`,
      `- 失敗：${cloudReadReport.readSummary?.failed ?? 0}`
    );
    if (cloudReadReport.error) lines.push(`- 錯誤：${cloudReadReport.error}`);
  } else if (cloudDriveSnapshot.status === 'ok' && !(cloudDriveDiff.addedFiles.length || cloudDriveDiff.changedFiles.length || cloudDriveDiff.removedFiles.length)) {
    lines.push('- 沒有雲端更新，未觸發完整網路讀取。');
  } else {
    lines.push('- 未執行；請先完成 Apps Script token 設定或排除雲端掃描錯誤。');
  }
  return lines;
}

function renderReport(current, diff, spreadsheetSnapshot, spreadsheetDiff, sheetsRegistry, cloudDriveConfig, cloudDriveSnapshot, cloudDriveDiff, cloudReadReport, advice) {
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
    ...renderCloudDriveSection(cloudDriveConfig, cloudDriveSnapshot, cloudDriveDiff, cloudReadReport),
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
    `- 開工會先讀 ${CLOUD_DRIVE_CONFIG_FILE}，用 Apps Script 從雲端檢查 Drive 更新日期。`,
    `- 若雲端檔案有更新，先看 ${CLOUD_DRIVE_READ_REPORT_FILE}，再判斷是否要修程式或文件。`,
    `- 若試算表有更新，先依 ${SHEETS_REGISTRY_FILE} 與雲端讀取報告判斷重點分頁，不要只相信本機同步狀態。`,
    '- 若試算表有更新，先確認公式、內容資料庫、個案欄位或出圖規則是否影響目前流程。',
    '- 每日用量要保留到凌晨 12:00 的 npm run work:shutdown。'
  ].join('\n');
}

fs.mkdirSync(path.join(ROOT, WORKFLOW_DIR), { recursive: true });

async function main() {
  if (fs.existsSync(path.join(ROOT, ACTIVE_SESSION_FILE))) {
    console.error('# 上次開工尚未收工');
    console.error('- 偵測到 .workflow/active-session.json。');
    console.error('- 請先執行 npm run work:shutdown，再重新執行 npm run work:start。');
    process.exit(1);
  }

  const previous = loadSnapshot();
  const previousSpreadsheetSnapshot = loadSpreadsheetSnapshot();
  const previousCloudDriveSnapshot = loadCloudDriveSnapshot();
  const current = {
    generatedAt: new Date().toISOString(),
    files: scanWorkspaceFiles()
  };
  const sheetsRegistry = loadSheetsRegistry();
  const cloudDriveConfig = loadCloudDriveConfig();
  const spreadsheetSnapshot = {
    generatedAt: current.generatedAt,
    sourceDir: SPREADSHEET_SCAN_DIR,
    files: scanSpreadsheetFiles()
  };
  const cloudDriveSnapshot = await buildCloudDriveState(current.generatedAt, cloudDriveConfig);
  const diff = compareSnapshots(previous, current);
  const spreadsheetDiff = compareSnapshots(previousSpreadsheetSnapshot, spreadsheetSnapshot);
  const cloudDriveDiff = compareCloudSnapshots(previousCloudDriveSnapshot, cloudDriveSnapshot);
  const cloudReadReport = await readAllCloudFilesIfNeeded(cloudDriveSnapshot, cloudDriveDiff, cloudDriveConfig);
  const advice = recommendations(diff);
  if (spreadsheetDiff.addedFiles.length || spreadsheetDiff.changedFiles.length || spreadsheetDiff.removedFiles.length) {
    advice.unshift('試算表檔案有更新：開工前要先確認是否影響公式、內容資料庫、個案資料表或出圖規則。');
  }
  if (cloudDriveDiff.addedFiles.length || cloudDriveDiff.changedFiles.length || cloudDriveDiff.removedFiles.length) {
    advice.unshift('雲端 Drive 檔案有更新：已優先使用網路讀取狀態，請依雲端讀取報告判斷是否要修正流程。');
  }
  if (cloudDriveSnapshot.status !== 'ok') {
    advice.unshift(`雲端 Drive 掃描未完成：${cloudDriveSnapshot.reason}`);
  }
  const report = renderReport(
    current,
    diff,
    spreadsheetSnapshot,
    spreadsheetDiff,
    sheetsRegistry,
    cloudDriveConfig,
    cloudDriveSnapshot,
    cloudDriveDiff,
    cloudReadReport,
    advice
  );

  fs.writeFileSync(path.join(ROOT, SNAPSHOT_FILE), `${JSON.stringify(current, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, SPREADSHEET_SNAPSHOT_FILE), `${JSON.stringify(spreadsheetSnapshot, null, 2)}\n`);
  if (cloudDriveSnapshot.status === 'ok') {
    fs.writeFileSync(path.join(ROOT, CLOUD_DRIVE_SNAPSHOT_FILE), `${JSON.stringify(cloudDriveSnapshot, null, 2)}\n`);
  }
  fs.writeFileSync(path.join(ROOT, START_REPORT_FILE), `${report}\n`);
  fs.writeFileSync(path.join(ROOT, ACTIVE_SESSION_FILE), `${JSON.stringify({
    startedAt: current.generatedAt,
    scannedFiles: current.files.length,
    scannedSpreadsheets: spreadsheetSnapshot.files.length,
    scannedCloudDriveFiles: cloudDriveSnapshot.files.length,
    cloudDriveStatus: cloudDriveSnapshot.status,
    cloudDriveConfig: CLOUD_DRIVE_CONFIG_FILE,
    sheetsRegistry: SHEETS_REGISTRY_FILE,
    startReport: START_REPORT_FILE,
    shutdownCommand: 'npm run work:shutdown',
    scheduledShutdown: '凌晨 12:00'
  }, null, 2)}\n`);

  console.log(report);
}

main().catch((error) => {
  console.error('# 開工流程失敗');
  console.error(`- ${error.message}`);
  process.exit(1);
});
