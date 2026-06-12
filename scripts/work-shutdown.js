import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKFLOW_DIR = '.workflow';
const SNAPSHOT_FILE = '.workflow/file-snapshot.json';
const START_REPORT_FILE = '.workflow/start-report.md';
const WORK_LOG_FILE = '.workflow/work-log.md';
const ACTIVE_SESSION_FILE = '.workflow/active-session.json';

function readIfExists(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function loadSnapshot() {
  const content = readIfExists(SNAPSHOT_FILE);
  return content ? JSON.parse(content) : null;
}

function loadActiveSession() {
  const content = readIfExists(ACTIVE_SESSION_FILE);
  return content ? JSON.parse(content) : null;
}

function appendWorkLog(entry) {
  fs.mkdirSync(path.join(ROOT, WORKFLOW_DIR), { recursive: true });
  fs.appendFileSync(path.join(ROOT, WORK_LOG_FILE), `${entry}\n`);
}

const snapshot = loadSnapshot();
const activeSession = loadActiveSession();
const startReport = readIfExists(START_REPORT_FILE);
const timestamp = new Date().toISOString();
const scannedFiles = snapshot?.files?.length || 0;

if (!activeSession) {
  console.log([
    `# 收工流程｜${timestamp}`,
    '',
    '## 無開工狀態',
    '- 沒有偵測到 .workflow/active-session.json。',
    '- 這次不追加正式收工紀錄，避免每日凌晨 12:00 空轉產生雜訊。',
    '- 若今天真的有工作，請先跑 npm run work:start，再跑 npm run work:shutdown。',
    '- 每日用量：仍要保留足夠額度給凌晨 12:00 的 npm run work:shutdown。'
  ].join('\n'));
  process.exit(0);
}

const entry = [
  `# 收工流程｜${timestamp}`,
  '',
  '## 今日狀態',
  `- 開工時間：${activeSession.startedAt}`,
  `- 開工掃描檔案數：${scannedFiles}`,
  `- 開工報告：${startReport ? START_REPORT_FILE : '尚未產生，明天先跑 npm run work:start'}`,
  '- 每日用量：要保留足夠額度給凌晨 12:00 的 npm run work:shutdown，不要在睡前把額度用到見底。',
  '',
  '## 收工檢查',
  '- 若有改程式或部署前準備：確認已跑 npm run readiness。',
  '- 若有 Apps Script Web App URL：確認已跑 npm run verify:deployment:url。',
  '- 若已部署 Apps Script：確認已跑 npm run verify:deployment:setup。',
  '- 若尚未部署 Google Apps Script：明天第一步仍是照 docs/deployment-verification.md 做實測。',
  '',
  '## 明日建議',
  '- 先跑 npm run work:start 重新讀取資料夾檔案更新。',
  '- 若要部署，先跑 npm run readiness，再只使用 dist/apps-script 與 dist/static-site。',
  '- 不要新增功能到失焦；先完成 Apps Script 真實部署驗證與 npm run verify:deployment。',
  '- 若用量不足，優先保留收工流程與部署驗證，不做低優先級美化。'
].join('\n');

appendWorkLog(entry);
fs.rmSync(path.join(ROOT, ACTIVE_SESSION_FILE), { force: true });

console.log(entry);
