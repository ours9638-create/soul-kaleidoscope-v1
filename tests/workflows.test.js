import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const startScript = fs.existsSync(new URL('../scripts/work-start.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/work-start.js', import.meta.url), 'utf8')
  : '';
const shutdownScript = fs.existsSync(new URL('../scripts/work-shutdown.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/work-shutdown.js', import.meta.url), 'utf8')
  : '';
const workflowDoc = fs.existsSync(new URL('../docs/workflow.md', import.meta.url))
  ? fs.readFileSync(new URL('../docs/workflow.md', import.meta.url), 'utf8')
  : '';
const lazyPack = fs.existsSync(new URL('../docs/lazy-pack.md', import.meta.url))
  ? fs.readFileSync(new URL('../docs/lazy-pack.md', import.meta.url), 'utf8')
  : '';
const cloudDriveConfig = fs.existsSync(new URL('../config/google-drive-cloud-sync.json', import.meta.url))
  ? fs.readFileSync(new URL('../config/google-drive-cloud-sync.json', import.meta.url), 'utf8')
  : '';

test('package exposes start and shutdown workflow commands', () => {
  assert.equal(packageJson.scripts['work:start'], 'node scripts/work-start.js');
  assert.equal(packageJson.scripts['work:shutdown'], 'node scripts/work-shutdown.js');
  assert.equal(packageJson.scripts['work:closeout'], 'node scripts/work-shutdown.js --no-storage-clean');
  assert.equal(packageJson.scripts['storage:check'], 'node scripts/storage-maintenance.js --dry-run');
  assert.equal(packageJson.scripts['storage:clean'], 'node scripts/storage-maintenance.js --apply');
});

test('start workflow scans project files and compares a saved snapshot', () => {
  assert.match(startScript, /scanWorkspaceFiles/);
  assert.match(startScript, /scanSpreadsheetFiles/);
  assert.match(startScript, /safeHashFile/);
  assert.match(startScript, /\.workflow\/file-snapshot\.json/);
  assert.match(startScript, /\.workflow\/spreadsheet-snapshot\.json/);
  assert.match(startScript, /\.workflow\/cloud-drive-snapshot\.json/);
  assert.match(startScript, /\.workflow\/cloud-drive-read-report\.json/);
  assert.match(startScript, /\.workflow\/active-session\.json/);
  assert.match(startScript, /config\/google-drive-cloud-sync\.json/);
  assert.match(startScript, /startup-cloud-scan/);
  assert.match(startScript, /STARTUP_SYNC_TOKEN/);
  assert.match(startScript, /folderId/);
  assert.match(startScript, /readAllCloudFilesIfNeeded/);
  assert.match(startScript, /fileIds/);
  assert.match(startScript, /\(dist\|tmp\|outputs\)/);
  assert.match(startScript, /method = 'POST'/);
  assert.match(startScript, /buildCloudPayload/);
  assert.match(startScript, /AbortSignal\.timeout/);
  assert.match(startScript, /cloud \$\{mode\} scan timed out/);
  assert.match(startScript, /sha256/);
  assert.match(startScript, /changedFiles/);
  assert.match(startScript, /recommendations/);
  assert.match(startScript, /npm run readiness/);
  assert.match(startScript, /dist\/apps-script/);
  assert.match(startScript, /dist\/static-site/);
  assert.match(startScript, /verify:deployment:url/);
  assert.match(startScript, /verify:deployment:setup/);
  assert.match(startScript, /verify:deployment/);
  assert.doesNotMatch(startScript, /若今天要部署，先跑 npm test、npm run check、npm run predeploy/);
});

test('cloud Drive config defines guarded network-first startup scan', () => {
  assert.match(cloudDriveConfig, /靈魂萬花筒/);
  assert.match(cloudDriveConfig, /1IfXfpsxP2IKzJbvC3VZrwyRznog-3uQf/);
  assert.match(cloudDriveConfig, /cloud-metadata-first/);
  assert.match(cloudDriveConfig, /read-all-cloud-files-when-any-cloud-file-changes/);
  assert.match(cloudDriveConfig, /web\/deployment-config\.js/);
  assert.match(cloudDriveConfig, /maxBlobBytesPerFile/);
});

test('start workflow blocks when previous work session was not shut down', () => {
  assert.match(startScript, /上次開工尚未收工/);
  assert.match(startScript, /npm run work:closeout/);
  assert.doesNotMatch(startScript, /請先執行 npm run work:shutdown/);
  assert.match(startScript, /process\.exit\(1\)/);
});

test('failed cloud scan does not report every previously known file as removed', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-work-start-'));
  const workflowDir = path.join(tempRoot, '.workflow');
  const configDir = path.join(tempRoot, 'config');
  const webDir = path.join(tempRoot, 'web');
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, 'startup-sync-token.txt'), 'test-token\n');
  fs.writeFileSync(path.join(workflowDir, 'cloud-drive-snapshot.json'), JSON.stringify({
    status: 'ok',
    generatedAt: '2026-06-18T00:00:00.000Z',
    files: [{ id: 'old-file', path: 'important.md', updatedAt: '2026-06-18T00:00:00Z', size: 10, mimeType: 'text/plain' }]
  }));
  fs.writeFileSync(path.join(configDir, 'google-drive-cloud-sync.json'), JSON.stringify({
    folderName: 'test-folder',
    appsScriptUrlSource: 'web/deployment-config.js'
  }));
  fs.writeFileSync(path.join(configDir, 'google-sheets-registry.json'), JSON.stringify({ readPolicy: [], sheets: [] }));
  fs.writeFileSync(path.join(webDir, 'deployment-config.js'), "export const deploymentConfig = { appsScriptApiUrl: 'https://example.test/exec' };\n");
  const preloadPath = path.join(tempRoot, 'reject-fetch.mjs');
  fs.writeFileSync(preloadPath, "globalThis.fetch = async () => { throw new Error('fetch failed'); };\n");

  try {
    const result = spawnSync(process.execPath, [
      '--import',
      pathToFileURL(preloadPath).href,
      fileURLToPath(new URL('../scripts/work-start.js', import.meta.url))
    ], {
      cwd: tempRoot,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /狀態：stale/);
    assert.match(result.stdout, /使用上次成功雲端快照/);
    assert.match(result.stdout, /刪除：0/);
    assert.doesNotMatch(result.stdout, /刪除：important\.md/);
    const savedCloudSnapshot = JSON.parse(fs.readFileSync(path.join(workflowDir, 'cloud-drive-snapshot.json'), 'utf8'));
    assert.equal(savedCloudSnapshot.generatedAt, '2026-06-18T00:00:00.000Z');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('metadata cloud scan retries once before falling back', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-work-retry-'));
  const workflowDir = path.join(tempRoot, '.workflow');
  const configDir = path.join(tempRoot, 'config');
  const webDir = path.join(tempRoot, 'web');
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, 'startup-sync-token.txt'), 'test-token\n');
  fs.writeFileSync(path.join(configDir, 'google-drive-cloud-sync.json'), JSON.stringify({
    folderName: 'test-folder',
    appsScriptUrlSource: 'web/deployment-config.js',
    metadataRetryAttempts: 1,
    metadataRetryDelayMs: 1
  }));
  fs.writeFileSync(path.join(configDir, 'google-sheets-registry.json'), JSON.stringify({ readPolicy: [], sheets: [] }));
  fs.writeFileSync(path.join(webDir, 'deployment-config.js'), "export const deploymentConfig = { appsScriptApiUrl: 'https://example.test/exec' };\n");
  const preloadPath = path.join(tempRoot, 'retry-fetch.mjs');
  fs.writeFileSync(preloadPath, `let calls = 0;
globalThis.fetch = async () => {
  calls += 1;
  if (calls === 1) throw new Error('temporary cloud failure');
  return new Response(JSON.stringify({
    ok: true,
    folderName: 'test-folder',
    folderId: 'folder-id',
    folderUrl: 'https://example.test/folder',
    folderCandidateCount: 1,
    fileCount: 1,
    files: [{ id: 'new-file', path: 'important.md', updatedAt: '2026-06-18T00:00:00Z', size: 10, mimeType: 'text/plain' }]
  }), { status: 200 });
};
`);

  try {
    const result = spawnSync(process.execPath, [
      '--import',
      pathToFileURL(preloadPath).href,
      fileURLToPath(new URL('../scripts/work-start.js', import.meta.url))
    ], {
      cwd: tempRoot,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /狀態：ok/);
    assert.match(result.stdout, /雲端檔案數：1/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('failed cloud content read keeps the intended target count', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-work-read-'));
  const workflowDir = path.join(tempRoot, '.workflow');
  const configDir = path.join(tempRoot, 'config');
  const webDir = path.join(tempRoot, 'web');
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, 'startup-sync-token.txt'), 'test-token\n');
  fs.writeFileSync(path.join(workflowDir, 'cloud-drive-snapshot.json'), JSON.stringify({
    status: 'ok',
    files: [{ id: 'changed-file', path: 'important.md', updatedAt: '2026-06-17T00:00:00Z', size: 10, mimeType: 'text/plain' }]
  }));
  fs.writeFileSync(path.join(configDir, 'google-drive-cloud-sync.json'), JSON.stringify({
    folderName: 'test-folder',
    appsScriptUrlSource: 'web/deployment-config.js'
  }));
  fs.writeFileSync(path.join(configDir, 'google-sheets-registry.json'), JSON.stringify({ readPolicy: [], sheets: [] }));
  fs.writeFileSync(path.join(webDir, 'deployment-config.js'), "export const deploymentConfig = { appsScriptApiUrl: 'https://example.test/exec' };\n");
  const preloadPath = path.join(tempRoot, 'content-read-fails.mjs');
  fs.writeFileSync(preloadPath, `globalThis.fetch = async (url, options = {}) => {
    const mode = new URL(url).searchParams.get('mode');
    if (mode === 'readAll') {
      if (options.method !== 'POST') throw new Error('readAll did not use POST');
      const body = JSON.parse(options.body || '{}');
      if (!Array.isArray(body.fileIds) || body.fileIds[0] !== 'changed-file') throw new Error('readAll did not send fileIds in body');
      throw new Error('content read failed');
    }
    return new Response(JSON.stringify({
      ok: true,
      folderName: 'test-folder',
      folderId: 'folder-id',
      folderUrl: 'https://example.test/folder',
      folderCandidateCount: 1,
      fileCount: 1,
      files: [{ id: 'changed-file', path: 'important.md', updatedAt: '2026-06-18T00:00:00Z', size: 10, mimeType: 'text/plain' }]
    }), { status: 200 });
  };\n`);

  try {
    const result = spawnSync(process.execPath, [
      '--import',
      pathToFileURL(preloadPath).href,
      fileURLToPath(new URL('../scripts/work-start.js', import.meta.url))
    ], {
      cwd: tempRoot,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /網路讀取狀態：failed/);
    assert.match(result.stdout, /目標檔案：1/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('shutdown workflow records daily status and keeps shutdown manual', () => {
  assert.match(shutdownScript, /\.workflow\/work-log\.md/);
  assert.match(shutdownScript, /\.workflow\/active-session\.json/);
  assert.match(shutdownScript, /--no-storage-clean/);
  assert.match(shutdownScript, /安全收工，不清理/);
  assert.match(shutdownScript, /未執行 storage maintenance/);
  assert.match(shutdownScript, /自動收工：已取消/);
  assert.doesNotMatch(shutdownScript, /凌晨 1:00/);
  assert.doesNotMatch(shutdownScript, /凌晨 12:00/);
  assert.match(shutdownScript, /npm run work:closeout/);
  assert.match(shutdownScript, /npm run readiness/);
  assert.match(shutdownScript, /verify:deployment:url/);
  assert.match(shutdownScript, /verify:deployment:setup/);
  assert.match(shutdownScript, /verify:deployment/);
  assert.match(shutdownScript, /dist\/apps-script/);
  assert.match(shutdownScript, /dist\/static-site/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm test/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm run check、npm run predeploy/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm run package:static/);
  assert.match(shutdownScript, /無開工狀態/);
  assert.match(shutdownScript, /docs\/lazy-pack\.md/);
  assert.match(shutdownScript, /npm run copy:apps-script/);
  assert.match(shutdownScript, /verify:delivery-guard/);
  assert.match(shutdownScript, /fs\.rmSync\(path\.join\(ROOT, ACTIVE_SESSION_FILE\)/);
  assert.match(shutdownScript, /runStorageMaintenance/);
  assert.match(shutdownScript, /storage-maintenance-report\.json/);
  assert.match(shutdownScript, /GitHub 同步邊界/);
  assert.match(shutdownScript, /可同步：程式碼、測試、正式文件、流程規則、可公開設定樣板/);
  assert.match(shutdownScript, /需人工確認：治理文件、候選清單、輸出規格、Google Sheet registry/);
  assert.match(shutdownScript, /禁止同步：個案、PDF 證據、密鑰/);
  assert.match(shutdownScript, /本次可同步檔案清單/);
  assert.match(shutdownScript, /commit message/);
  assert.match(shutdownScript, /git add \./);
  assert.match(shutdownScript, /finally/);
});

test('workflow documentation explains manual start and shutdown process', () => {
  assert.match(workflowDoc, /開工流程/);
  assert.match(workflowDoc, /npm run work:start/);
  assert.match(workflowDoc, /npm run readiness/);
  assert.match(workflowDoc, /verify:deployment:url/);
  assert.match(workflowDoc, /verify:deployment:setup/);
  assert.match(workflowDoc, /dist\/apps-script/);
  assert.match(workflowDoc, /dist\/static-site/);
  assert.doesNotMatch(workflowDoc, /npm test` 與 `npm run check/);
  assert.doesNotMatch(workflowDoc, /npm run predeploy` 與 `npm run package:static/);
  assert.match(workflowDoc, /收工流程/);
  assert.match(workflowDoc, /npm run work:shutdown/);
  assert.match(workflowDoc, /npm run work:closeout/);
  assert.match(workflowDoc, /整理流程完成前/);
  assert.match(workflowDoc, /跳過 storage maintenance/);
  assert.match(workflowDoc, /完整收工加清理/);
  assert.match(workflowDoc, /凌晨自動收工已取消/);
  assert.doesNotMatch(workflowDoc, /automation-2/);
  assert.match(workflowDoc, /試算表/);
  assert.match(workflowDoc, /Google Drive/);
  assert.match(workflowDoc, /雲端 Drive/);
  assert.match(workflowDoc, /STARTUP_SYNC_TOKEN/);
  assert.match(workflowDoc, /metadataRetryAttempts/);
  assert.match(workflowDoc, /metadata 預設 120 秒/);
  assert.match(workflowDoc, /metadata 模式只取差異比對必要欄位/);
  assert.match(workflowDoc, /stale/);
  assert.match(workflowDoc, /cloud-drive-read-report/);
  assert.match(workflowDoc, /docs\/lazy-pack\.md/);
  assert.match(workflowDoc, /GitHub \/ 第二大腦同步規則/);
  assert.match(workflowDoc, /同步邊界/);
  assert.match(workflowDoc, /可同步.*程式碼.*測試.*正式文件/);
  assert.match(workflowDoc, /需人工確認.*治理文件.*候選清單.*輸出規格/);
  assert.match(workflowDoc, /禁止同步.*個案.*PDF 證據.*密鑰/);
  assert.match(workflowDoc, /本次可同步檔案清單/);
  assert.match(workflowDoc, /commit message/);
  assert.match(workflowDoc, /git add \./);
  assert.match(workflowDoc, /不能整個 Google Drive 原始資料夾推上 GitHub/);
  assert.match(lazyPack, /Apps Script 更新 Code\.gs/);
  assert.match(lazyPack, /npm run copy:apps-script/);
  assert.match(lazyPack, /validateDeliveryStatusTransition_/);
  assert.match(lazyPack, /建議精油：待確認/);
  assert.match(lazyPack, /儲存不等於 Web App 已更新/);
  assert.match(lazyPack, /管理部署作業/);
  assert.match(lazyPack, /新增版本/);
  assert.match(lazyPack, /Google Drive 同步鎖住 dist/);
  assert.match(lazyPack, /EPERM/);
  assert.match(lazyPack, /EINVAL/);
});
