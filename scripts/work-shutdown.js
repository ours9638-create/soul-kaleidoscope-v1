import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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

function runGit(args) {
  return spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false
  });
}

function githubSyncBoundarySummary() {
  return [
    '## GitHub 同步邊界',
    '- 可同步：程式碼、測試、正式文件、流程規則、可公開設定樣板。',
    '- 需人工確認：治理文件、候選清單、輸出規格、Google Sheet registry。',
    '- 禁止同步：個案、PDF 證據、密鑰、`.workflow/startup-sync-token.txt`、Google Docs / Sheets 捷徑、未核准 Legacy 資料。',
    '- 若要 commit：先提出本次可同步檔案清單與 commit message，人工確認後才可 stage / commit / push。'
  ];
}

function githubSyncSummary() {
  const inside = runGit(['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0) {
    return [
      '## GitHub 同步狀態',
      '- 狀態：目前資料夾不是 Git repo，收工內容不會同步到 GitHub。',
      '- 建議：確認工作是否應在 `soul-kaleidoscope-v1` repo 內，或將需同步的治理文件鏡像到 repo 文件區。',
      '',
      ...githubSyncBoundarySummary()
    ];
  }

  const branch = runGit(['status', '--short', '--branch']);
  const remote = runGit(['remote', '-v']);
  const statusLines = (branch.stdout || '').trim().split(/\r?\n/).filter(Boolean);
  const branchLine = statusLines[0] || '## unknown';
  const changedLines = statusLines.slice(1);
  const hasRemote = (remote.stdout || '').includes('github.com');

  if (changedLines.length === 0) {
    return [
      '## GitHub 同步狀態',
      `- 分支：${branchLine}`,
      `- GitHub remote：${hasRemote ? '已設定' : '未偵測到 GitHub remote'}`,
      '- 狀態：工作樹乾淨；若本機分支已 push，GitHub 已同步。',
      '- 收工規則：本流程只檢查同步狀態，不自動 commit / push。'
    ];
  }

  return [
    '## GitHub 同步狀態',
    `- 分支：${branchLine}`,
    `- GitHub remote：${hasRemote ? '已設定' : '未偵測到 GitHub remote'}`,
    `- 狀態：尚有 ${changedLines.length} 筆已修改或未追蹤檔案，尚未同步到 GitHub。`,
    '- 檢查指令：`git status --short --branch`；不得使用 `git add .` 整包提交。',
    '- 收工規則：不得自動 commit / push；需先人工確認可同步檔案，排除個案、密鑰、Google 文件捷徑與不應公開資料。',
    '',
    ...githubSyncBoundarySummary()
  ];
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
    '- 每日用量：仍要保留足夠額度給凌晨 12:00 的 npm run work:shutdown。',
    '',
    ...githubSyncSummary()
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
  ...githubSyncSummary(),
  '',
  '## 收工檢查',
  '- 若有改程式或部署前準備：確認已跑 npm run readiness。',
  '- 若有 Apps Script Web App URL：確認已跑 npm run verify:deployment:url。',
  '- 若已部署 Apps Script：確認已跑 npm run verify:deployment:setup。',
  '- 若尚未部署 Google Apps Script：明天第一步仍是照 docs/deployment-verification.md 做實測。',
  '- 若今天踩到錯誤流程：把「錯在哪、下次不要做、正確做法」補到 docs/lazy-pack.md。',
  '',
  '## 踩坑紀錄與懶人包',
  '- 懶人包：docs/lazy-pack.md。',
  '- Apps Script 大段貼碼不要再靠瀏覽器自動化；先跑 npm run copy:apps-script，再手動貼到程式碼.gs。',
  '- 若精油報告仍是「建議精油：待確認」，deliveryStatus 只能保持 draft。',
  '- 部署後若要驗證精油待確認防呆，跑 npm run verify:delivery-guard。',
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
