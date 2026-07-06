import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyCloudCandidate, classifyLocalCandidate } from './storage-maintenance-core.js';

export const DEFAULT_LOCAL_POLICY = {
  minimumFreeBytes: 30 * 1024 ** 3,
  tempRetentionDays: 7,
  recentProtectionHours: 24,
  protectedPathFragments: ['odis_download_dest'],
  managedDownloadRetentionHours: 24
};

function getPathBytes(targetPath) {
  let stat;
  try {
    stat = fs.lstatSync(targetPath);
  } catch {
    return 0;
  }
  if (!stat.isDirectory()) return stat.size;
  let total = 0;
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    total += getPathBytes(path.join(targetPath, entry.name));
  }
  return total;
}

function getFreeBytes(diskRoot) {
  try {
    const stats = fs.statfsSync(diskRoot);
    return Number(stats.bavail) * Number(stats.bsize);
  } catch {
    return null;
  }
}

function listCandidates(roots) {
  const candidates = [];
  for (const root of roots) {
    if (!root.path || !fs.existsSync(root.path)) continue;
    for (const entry of fs.readdirSync(root.path, { withFileTypes: true })) {
      const targetPath = path.join(root.path, entry.name);
      try {
        const stat = fs.lstatSync(targetPath);
        candidates.push({
          path: targetPath,
          modifiedAt: stat.mtime.toISOString(),
          inAutoCleanRoot: true,
          bytes: getPathBytes(targetPath),
          rootType: root.type
        });
      } catch {
        candidates.push({ path: targetPath, scanFailed: true, bytes: 0, rootType: root.type });
      }
    }
  }
  return candidates;
}

export async function runLocalStorageMaintenance({
  roots,
  policy = DEFAULT_LOCAL_POLICY,
  apply = false,
  now = new Date(),
  diskRoot = process.env.SystemDrive ? `${process.env.SystemDrive}\\` : process.cwd()
}) {
  const beforeFreeBytes = getFreeBytes(diskRoot);
  const report = {
    status: 'ok',
    mode: apply ? 'apply' : 'dry-run',
    generatedAt: now.toISOString(),
    beforeFreeBytes,
    afterFreeBytes: beforeFreeBytes,
    freedBytes: 0,
    eligible: [],
    deleted: [],
    protected: [],
    skipped: [],
    failed: []
  };

  for (const candidate of listCandidates(roots)) {
    if (candidate.scanFailed) {
      report.failed.push({ path: candidate.path, reason: '無法讀取檔案狀態' });
      continue;
    }
    const decision = classifyLocalCandidate(candidate, policy, now);
    const item = { path: candidate.path, bytes: candidate.bytes, reason: decision.reason };
    if (decision.action === 'auto-clean') {
      if (candidate.rootType === 'temp'
        && Number.isFinite(policy.minimumFreeBytes)
        && Number.isFinite(beforeFreeBytes)
        && beforeFreeBytes >= policy.minimumFreeBytes) {
        report.skipped.push({ ...item, reason: '可用空間高於門檻，保留一般暫存' });
        continue;
      }
      report.eligible.push(item);
      if (!apply) continue;
      try {
        fs.rmSync(candidate.path, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
        report.deleted.push(item);
        report.freedBytes += candidate.bytes;
      } catch (error) {
        report.failed.push({ ...item, reason: error.message });
      }
    } else if (decision.action.startsWith('protected')) {
      report.protected.push(item);
    } else {
      report.skipped.push(item);
    }
  }

  report.afterFreeBytes = getFreeBytes(diskRoot);
  if (report.failed.length) report.status = 'partial';
  report.protectedCount = report.protected.length;
  report.skippedCount = report.skipped.length;
  report.protected = report.protected.slice(0, 200);
  report.skipped = report.skipped.slice(0, 200);
  return report;
}

async function readJsonResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`雲端端點回傳非 JSON：HTTP ${response.status}`);
  }
  if (!response.ok || data.ok === false) throw new Error(data.error || `雲端端點失敗：HTTP ${response.status}`);
  return data;
}

export async function runCloudStorageMaintenance({
  apiUrl,
  token,
  folderId,
  policy,
  apply = false,
  force = false,
  previousScanAt = '',
  now = new Date(),
  fetchImpl = fetch,
  timeoutMs = 15000
}) {
  const report = {
    status: 'ok',
    mode: apply ? 'apply' : 'dry-run',
    scannedAt: null,
    nextCloudScanAt: null,
    autoTrashCandidates: [],
    manualReview: [],
    kept: [],
    trashed: [],
    rejected: [],
    failed: []
  };
  if (!apiUrl || !token || !folderId) {
    report.status = 'skipped';
    report.failed.push({ reason: '缺少 Apps Script URL、同步權杖或 folderId' });
    return report;
  }
  const intervalMs = Number(policy.scanIntervalDays || 7) * 24 * 60 * 60 * 1000;
  const previousMs = Date.parse(previousScanAt);
  if (!force && Number.isFinite(previousMs) && now.getTime() - previousMs < intervalMs) {
    report.status = 'throttled';
    report.nextCloudScanAt = new Date(previousMs + intervalMs).toISOString();
    return report;
  }

  const scanUrl = new URL(apiUrl);
  scanUrl.searchParams.set('action', 'storage-cloud-scan');
  scanUrl.searchParams.set('token', token);
  scanUrl.searchParams.set('folderId', folderId);
  const scanResponse = await fetchImpl(scanUrl, { signal: AbortSignal.timeout(timeoutMs) });
  const scan = await readJsonResponse(scanResponse);
  report.scannedAt = now.toISOString();
  report.nextCloudScanAt = new Date(now.getTime() + intervalMs).toISOString();

  for (const candidate of scan.files || []) {
    const decision = classifyCloudCandidate(candidate, policy, now);
    const item = { ...candidate, reason: decision.reason };
    if (decision.action === 'auto-trash') report.autoTrashCandidates.push(item);
    else if (decision.action === 'report-only') report.manualReview.push(item);
    else report.kept.push(item);
  }

  if (!apply || !report.autoTrashCandidates.length) return report;
  const trashResponse = await fetchImpl(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      action: 'storage-cloud-trash',
      payload: {
        token,
        folderId,
        fileIds: report.autoTrashCandidates.map((item) => item.id),
        generatedRetentionDays: policy.generatedRetentionDays
      }
    })
  });
  const trashResult = await readJsonResponse(trashResponse);
  report.trashed = trashResult.trashed || [];
  report.rejected = trashResult.rejected || [];
  report.failed = trashResult.failed || [];
  if (report.failed.length) report.status = 'partial';
  return report;
}

function defaultRoots() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const tempRoot = process.env.TEMP || os.tmpdir();
  return [
    { path: tempRoot, type: 'temp' },
    { path: path.join(tempRoot, 'odis_download_dest'), type: 'managed-download-temp' },
    { path: path.join(localAppData, 'CrashDumps'), type: 'crash-dumps' },
    { path: path.join(localAppData, 'D3DSCache'), type: 'd3d-cache' }
  ];
}

function readJsonIfExists(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function resolveAppsScriptUrl(root, config) {
  if (process.env.APPS_SCRIPT_URL) return process.env.APPS_SCRIPT_URL.trim();
  const sourcePath = path.join(root, config.appsScriptUrlSource || 'web/deployment-config.js');
  try {
    const content = fs.readFileSync(sourcePath, 'utf8');
    return content.match(/appsScriptApiUrl:\s*'([^']+)'/)?.[1] || '';
  } catch {
    return '';
  }
}

function loadStartupSyncToken(root) {
  if (process.env.STARTUP_SYNC_TOKEN) return process.env.STARTUP_SYNC_TOKEN.trim();
  try {
    return fs.readFileSync(path.join(root, '.workflow', 'startup-sync-token.txt'), 'utf8').trim();
  } catch {
    return '';
  }
}

function writeReport(root, report) {
  const workflowDir = path.join(root, '.workflow');
  const reportPath = path.join(workflowDir, 'storage-maintenance-report.json');
  const temporaryPath = `${reportPath}.tmp`;
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.renameSync(temporaryPath, reportPath);
  return reportPath;
}

export async function runStorageMaintenance({
  root = process.cwd(),
  apply = false,
  force = false,
  localOnly = false,
  now = new Date(),
  localRoots = defaultRoots(),
  diskRoot = process.env.SystemDrive ? `${process.env.SystemDrive}\\` : root,
  fetchImpl = fetch
} = {}) {
  const configPath = path.join(root, 'config', 'google-drive-cloud-sync.json');
  const config = readJsonIfExists(configPath, {});
  const previous = readJsonIfExists(path.join(root, '.workflow', 'storage-maintenance-report.json'), {});
  const local = await runLocalStorageMaintenance({
    roots: localRoots,
    policy: DEFAULT_LOCAL_POLICY,
    apply,
    now,
    diskRoot
  });
  let cloud;
  if (localOnly) {
    cloud = {
      status: 'skipped',
      scannedAt: null,
      autoTrashCandidates: [],
      manualReview: [],
      trashed: [],
      failed: [{ reason: '本機清理模式，略過雲端掃描' }]
    };
  } else try {
    cloud = await runCloudStorageMaintenance({
      apiUrl: resolveAppsScriptUrl(root, config),
      token: loadStartupSyncToken(root),
      folderId: config.folderId || '',
      policy: config.maintenancePolicy || {
        scanIntervalDays: 7,
        generatedRetentionDays: 30,
        autoTrashPathPrefixes: [
          'dist/',
          'tmp/',
          'soul-kaleidoscope-v1/dist/',
          'soul-kaleidoscope-v1/tmp/'
        ],
        protectedMimeTypes: []
      },
      apply,
      force,
      previousScanAt: previous.cloud?.scannedAt || '',
      now,
      fetchImpl,
      timeoutMs: Number(config.metadataTimeoutMs || 15000)
    });
  } catch (error) {
    cloud = {
      status: 'partial',
      scannedAt: null,
      autoTrashCandidates: [],
      manualReview: [],
      trashed: [],
      failed: [{ reason: error.message }]
    };
  }
  const report = {
    generatedAt: now.toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    status: local.status === 'partial' || cloud.status === 'partial' ? 'partial' : 'ok',
    local,
    cloud
  };
  report.reportPath = writeReport(root, report);
  return report;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force-storage-scan');
  const localOnly = process.argv.includes('--local-only');
  const report = await runStorageMaintenance({ apply, force, localOnly });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
