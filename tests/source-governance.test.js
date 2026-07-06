import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const governance = JSON.parse(fs.readFileSync(new URL('../config/source-governance.json', import.meta.url), 'utf8'));
const conformance = JSON.parse(fs.readFileSync(new URL('../config/formula-conformance.json', import.meta.url), 'utf8'));

test('source governance locks formula, interpretation and OCR precedence', () => {
  assert.deepEqual(governance.precedence.map((item) => item.role), [
    'user-confirmed-rule',
    'formula-source',
    'interpretation-source',
    'pdf-evidence',
    'archive-only'
  ]);
  assert.equal(governance.sources.find((item) => item.role === 'formula-source').title, '靈魂數字_可驗算公式表');
  assert.equal(governance.sources.find((item) => item.role === 'interpretation-source').title, '靈魂數字整合系統_分類資料庫_光頻幾何圖輸出更新');
  assert.equal(governance.sources.find((item) => item.role === 'pdf-evidence').promotionRequiresHumanReview, true);
});

test('formula conformance tracks every core formula with implementation and tests', () => {
  const required = ['soul-level', 'annual-position', 'horses', 'sun-moon-bloom', 'inner-frequency', 'day-seat', 'support-number', 'year-flow'];
  assert.deepEqual(conformance.items.map((item) => item.key), required);
  assert.equal(conformance.manualSpreadsheetCheckpoint.sheetName, '測試案例');
  assert.ok(conformance.manualSpreadsheetCheckpoint.requiredRanges.includes('測試案例!S34:S63'));
  assert.match(conformance.manualSpreadsheetCheckpoint.passCondition, /全部為 OK/);
  for (const item of conformance.items) {
    assert.ok(item.sourceRef);
    assert.ok(item.implementation);
    assert.ok(item.testFile);
    assert.ok(['verified', 'needs-live-recheck', 'pending'].includes(item.status));
  }
});
