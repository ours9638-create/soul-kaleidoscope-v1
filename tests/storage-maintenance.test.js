import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  classifyCloudCandidate,
  classifyLocalCandidate
} from '../scripts/storage-maintenance-core.js';
import { runCloudStorageMaintenance, runLocalStorageMaintenance, runStorageMaintenance } from '../scripts/storage-maintenance.js';

const NOW = new Date('2026-06-20T12:00:00.000Z');

const localPolicy = {
  tempRetentionDays: 7,
  recentProtectionHours: 24,
  protectedPathFragments: ['odis_download_dest'],
  managedDownloadRetentionHours: 24
};

test('local classifier only auto-cleans old allowlisted temporary content', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Temp\\old-cache',
    modifiedAt: '2026-06-01T00:00:00.000Z',
    inAutoCleanRoot: true
  }, localPolicy, NOW);

  assert.equal(result.action, 'auto-clean');
});

test('local classifier protects installer caches before age checks', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Temp\\odis_download_dest',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    inAutoCleanRoot: true,
    rootType: 'temp'
  }, localPolicy, NOW);

  assert.equal(result.action, 'protected-path');
});

test('local classifier auto-cleans old managed download batches', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Temp\\odis_download_dest\\old-batch',
    modifiedAt: '2026-06-18T00:00:00.000Z',
    inAutoCleanRoot: true,
    rootType: 'managed-download-temp'
  }, localPolicy, NOW);

  assert.equal(result.action, 'auto-clean');
  assert.equal(result.reason, '受控下載暫存已超過保存期限');
});

test('local classifier protects recent managed download batches', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Temp\\odis_download_dest\\active-batch',
    modifiedAt: '2026-06-20T06:00:00.000Z',
    inAutoCleanRoot: true,
    rootType: 'managed-download-temp'
  }, localPolicy, NOW);

  assert.equal(result.action, 'protected-recent');
});

test('local classifier protects recently modified items', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Temp\\active-cache',
    modifiedAt: '2026-06-20T06:00:00.000Z',
    inAutoCleanRoot: true
  }, localPolicy, NOW);

  assert.equal(result.action, 'protected-recent');
});

test('local classifier never auto-cleans outside allowlisted roots', () => {
  const result = classifyLocalCandidate({
    path: 'C:\\Users\\person\\Documents\\old.pdf',
    modifiedAt: '2020-01-01T00:00:00.000Z',
    inAutoCleanRoot: false
  }, localPolicy, NOW);

  assert.equal(result.action, 'report-only');
});

const cloudPolicy = {
  generatedRetentionDays: 30,
  autoTrashPathPrefixes: ['dist/', 'tmp/'],
  protectedMimeTypes: [
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet'
  ]
};

test('cloud classifier auto-trashes only expired generated files', () => {
  const result = classifyCloudCandidate({
    path: 'tmp/previews/old.png',
    updatedAt: '2026-05-01T00:00:00.000Z',
    mimeType: 'image/png'
  }, cloudPolicy, NOW);

  assert.equal(result.action, 'auto-trash');
});

test('cloud classifier protects formal documents even under generated paths', () => {
  const result = classifyCloudCandidate({
    path: 'tmp/course.pdf',
    updatedAt: '2020-01-01T00:00:00.000Z',
    mimeType: 'application/pdf'
  }, cloudPolicy, NOW);

  assert.equal(result.action, 'report-only');
});

test('cloud classifier reports but does not trash files outside generated paths', () => {
  const result = classifyCloudCandidate({
    path: '個案報告/old.txt',
    updatedAt: '2020-01-01T00:00:00.000Z',
    mimeType: 'text/plain'
  }, cloudPolicy, NOW);

  assert.equal(result.action, 'report-only');
});

test('local runner dry-run preserves files and apply removes only eligible files', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-'));
  const tempRoot = path.join(root, 'Temp');
  const oldPath = path.join(tempRoot, 'old-cache');
  const recentPath = path.join(tempRoot, 'recent-cache');
  const protectedPath = path.join(tempRoot, 'odis_download_dest');
  fs.mkdirSync(oldPath, { recursive: true });
  fs.mkdirSync(recentPath, { recursive: true });
  fs.mkdirSync(protectedPath, { recursive: true });
  fs.writeFileSync(path.join(oldPath, 'old.bin'), '12345');
  fs.writeFileSync(path.join(recentPath, 'recent.bin'), '123');
  fs.writeFileSync(path.join(protectedPath, 'installer.bin'), '1234567');
  const oldTime = new Date('2026-05-01T00:00:00.000Z');
  fs.utimesSync(oldPath, oldTime, oldTime);
  fs.utimesSync(protectedPath, oldTime, oldTime);

  try {
    const dryRun = await runLocalStorageMaintenance({
      roots: [{ path: tempRoot, type: 'temp' }],
      policy: localPolicy,
      apply: false,
      now: NOW,
      diskRoot: root
    });
    assert.equal(dryRun.eligible.length, 1);
    assert.equal(fs.existsSync(oldPath), true);

    const applied = await runLocalStorageMaintenance({
      roots: [{ path: tempRoot, type: 'temp' }],
      policy: localPolicy,
      apply: true,
      now: NOW,
      diskRoot: root
    });
    assert.equal(applied.deleted.length, 1);
    assert.equal(applied.deleted[0].bytes, 5);
    assert.equal(fs.existsSync(oldPath), false);
    assert.equal(fs.existsSync(recentPath), true);
    assert.equal(fs.existsSync(protectedPath), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('local runner keeps general temp content while free space is above threshold', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-threshold-'));
  const tempRoot = path.join(root, 'Temp');
  const oldPath = path.join(tempRoot, 'old-cache');
  fs.mkdirSync(oldPath, { recursive: true });
  fs.writeFileSync(path.join(oldPath, 'old.bin'), '12345');
  const oldTime = new Date('2026-05-01T00:00:00.000Z');
  fs.utimesSync(oldPath, oldTime, oldTime);
  try {
    const report = await runLocalStorageMaintenance({
      roots: [{ path: tempRoot, type: 'temp' }],
      policy: { ...localPolicy, minimumFreeBytes: 1 },
      apply: true,
      now: NOW,
      diskRoot: root
    });
    assert.equal(report.deleted.length, 0);
    assert.equal(report.skipped[0].reason, '可用空間高於門檻，保留一般暫存');
    assert.equal(fs.existsSync(oldPath), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('local runner cleans old managed download temp even while free space is above threshold', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-managed-download-'));
  const tempRoot = path.join(root, 'Temp');
  const downloadRoot = path.join(tempRoot, 'odis_download_dest');
  const oldBatch = path.join(downloadRoot, 'old-batch');
  const recentBatch = path.join(downloadRoot, 'recent-batch');
  fs.mkdirSync(oldBatch, { recursive: true });
  fs.mkdirSync(recentBatch, { recursive: true });
  fs.writeFileSync(path.join(oldBatch, 'installer.tar'), '12345');
  fs.writeFileSync(path.join(recentBatch, 'active.tar'), '123');
  const oldTime = new Date('2026-06-18T00:00:00.000Z');
  fs.utimesSync(oldBatch, oldTime, oldTime);
  try {
    const report = await runLocalStorageMaintenance({
      roots: [
        { path: tempRoot, type: 'temp' },
        { path: downloadRoot, type: 'managed-download-temp' }
      ],
      policy: { ...localPolicy, minimumFreeBytes: 1 },
      apply: true,
      now: NOW,
      diskRoot: root
    });
    assert.equal(report.deleted.length, 1);
    assert.match(report.deleted[0].path, /old-batch/);
    assert.equal(fs.existsSync(downloadRoot), true);
    assert.equal(fs.existsSync(oldBatch), false);
    assert.equal(fs.existsSync(recentBatch), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('local runner caps non-actionable detail while preserving counts', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-cap-'));
  const tempRoot = path.join(root, 'Temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  for (let index = 0; index < 205; index += 1) {
    fs.writeFileSync(path.join(tempRoot, `recent-${index}.tmp`), 'x');
  }
  try {
    const report = await runLocalStorageMaintenance({
      roots: [{ path: tempRoot, type: 'temp' }],
      policy: localPolicy,
      apply: false,
      now: new Date(),
      diskRoot: root
    });
    assert.equal(report.protectedCount, 205);
    assert.equal(report.protected.length, 200);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cloud runner dry-run scans candidates without sending trash request', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({
      ok: true,
      files: [{ id: 'old-generated', path: 'tmp/old.png', updatedAt: '2026-05-01T00:00:00.000Z', mimeType: 'image/png' }]
    }), { status: 200 });
  };

  const report = await runCloudStorageMaintenance({
    apiUrl: 'https://example.test/exec',
    token: 'secret',
    folderId: 'folder-id',
    policy: cloudPolicy,
    apply: false,
    force: true,
    now: NOW,
    fetchImpl
  });

  assert.equal(report.autoTrashCandidates.length, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /storage-cloud-scan/);
  assert.equal(calls[0].options.method, undefined);
});

test('cloud runner apply posts only auto-trash candidate ids', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (options.method === 'POST') {
      return new Response(JSON.stringify({ ok: true, trashed: [{ id: 'old-generated', path: 'tmp/old.png' }], rejected: [], failed: [] }), { status: 200 });
    }
    return new Response(JSON.stringify({
      ok: true,
      files: [
        { id: 'old-generated', path: 'tmp/old.png', updatedAt: '2026-05-01T00:00:00.000Z', mimeType: 'image/png' },
        { id: 'recent-generated', path: 'tmp/new.png', updatedAt: '2026-06-19T00:00:00.000Z', mimeType: 'image/png' }
      ]
    }), { status: 200 });
  };

  const report = await runCloudStorageMaintenance({
    apiUrl: 'https://example.test/exec',
    token: 'secret',
    folderId: 'folder-id',
    policy: cloudPolicy,
    apply: true,
    force: true,
    now: NOW,
    fetchImpl
  });

  assert.equal(report.trashed.length, 1);
  assert.equal(calls.length, 2);
  const body = JSON.parse(calls[1].options.body);
  assert.deepEqual(body.payload.fileIds, ['old-generated']);
  assert.doesNotMatch(calls[1].options.body, /recent-generated/);
});

test('combined runner writes an auditable report without requiring cloud credentials', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-report-'));
  const tempRoot = path.join(root, 'Temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  try {
    const report = await runStorageMaintenance({
      root,
      apply: false,
      now: NOW,
      localRoots: [{ path: tempRoot, type: 'temp' }],
      diskRoot: root
    });
    const reportPath = path.join(root, '.workflow', 'storage-maintenance-report.json');
    assert.equal(fs.existsSync(reportPath), true);
    assert.equal(report.local.mode, 'dry-run');
    assert.equal(report.cloud.status, 'skipped');
    assert.doesNotMatch(fs.readFileSync(reportPath, 'utf8'), /secret/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('combined runner can skip cloud scan for local-only cleanup', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-storage-local-only-'));
  const tempRoot = path.join(root, 'Temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const calls = [];
  try {
    const report = await runStorageMaintenance({
      root,
      apply: true,
      localOnly: true,
      now: NOW,
      localRoots: [{ path: tempRoot, type: 'temp' }],
      diskRoot: root,
      fetchImpl: async (...args) => {
        calls.push(args);
        return new Response(JSON.stringify({ ok: true, files: [] }), { status: 200 });
      }
    });
    assert.equal(report.local.mode, 'apply');
    assert.equal(report.cloud.status, 'skipped');
    assert.equal(report.cloud.failed[0].reason, '本機清理模式，略過雲端掃描');
    assert.equal(calls.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
