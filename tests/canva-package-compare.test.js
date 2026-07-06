import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../scripts/compare-canva-packages.js', import.meta.url));

test('Canva package comparison passes different cases with different text', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canva-compare-'));
  const leftPath = path.join(dir, 'left.json');
  const rightPath = path.join(dir, 'right.json');
  fs.writeFileSync(leftPath, JSON.stringify(packageFixture({
    caseId: 'case-a',
    displayName: 'A',
    sourceContentIds: ['main-1', 'horse-2'],
    body: ['A 的核心是啟動與建立方向。', '下一步是先做一個小行動。']
  })));
  fs.writeFileSync(rightPath, JSON.stringify(packageFixture({
    caseId: 'case-b',
    displayName: 'B',
    sourceContentIds: ['main-7', 'horse-4'],
    body: ['B 的核心是沉澱與整理脈絡。', '下一步是設定思考期限。']
  })));

  const result = runCompare(leftPath, rightPath);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'review');
  assert.equal(parsed.sameCase, false);
  assert.equal(parsed.exactTextOverlap, 0);
});

test('Canva package comparison fails same case id', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canva-compare-'));
  const leftPath = path.join(dir, 'left.json');
  const rightPath = path.join(dir, 'right.json');
  const fixture = packageFixture({
    caseId: 'same-case',
    displayName: 'Same',
    sourceContentIds: ['main-1'],
    body: ['這是一段完全相同的客戶文字。']
  });
  fs.writeFileSync(leftPath, JSON.stringify(fixture));
  fs.writeFileSync(rightPath, JSON.stringify({ ...fixture, displayName: 'Same Copy' }));

  const result = runCompare(leftPath, rightPath);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'fail');
  assert.equal(parsed.sameCase, true);
});

function runCompare(leftPath, rightPath) {
  return spawnSync(process.execPath, [scriptPath, leftPath, rightPath, '--json'], {
    encoding: 'utf8'
  });
}

function packageFixture({ caseId, displayName, sourceContentIds, body }) {
  return {
    kind: 'CanvaPackage',
    format: 'A4-portrait',
    caseId,
    displayName,
    formulaVersion: 'formula-test',
    contentVersion: 'content-test',
    sourceContentIds,
    pages: [
      { pageType: 'cover', title: `${displayName}｜靈魂數字個案報告`, body: [] },
      { pageType: 'opening', title: '這次閱讀的焦點', body },
    ],
  };
}
