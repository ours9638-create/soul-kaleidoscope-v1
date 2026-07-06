import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { runFormulaConformance } from '../scripts/verify-formula-conformance.js';

const baseline = JSON.parse(fs.readFileSync(new URL('../data/formula-conformance-baseline.json', import.meta.url), 'utf8'));

test('formula conformance baseline keeps source spreadsheet traceability', () => {
  assert.equal(baseline.source.title, '靈魂數字_可驗算公式表');
  assert.equal(baseline.source.spreadsheetId, '12Ddaw4FoMJ4eOFcQ8N-xi2LSiOC0mi4ab877E6sknKQ');
  assert.ok(baseline.source.ranges.includes('靈魂數字!A1:Z140'));
  assert.ok(baseline.cases.length >= 4);
});

test('formula conformance baseline covers soul-level edge cases', () => {
  const coverage = new Set(baseline.cases.flatMap((item) => item.coverageFocus ?? []));
  for (const focus of [
    'zero-preserved',
    'over-concentrated',
    'existence-not-inventory',
    'middle-reduction-10',
    'before-birthday'
  ]) {
    assert.ok(coverage.has(focus), `missing formula baseline focus: ${focus}`);
  }
});

test('formula conformance compares required formula groups with pass/fail statuses', () => {
  const report = runFormulaConformance({ generatedAt: '2026-06-30T00:00:00.000Z' });
  const groups = new Set(report.rows.map((row) => row.group));
  for (const group of ['birthday', 'annual', 'position', 'soul-level']) {
    assert.ok(groups.has(group), `missing group: ${group}`);
  }
  assert.equal(report.summary.totalCases, baseline.cases.length);
  assert.equal(report.summary.totalChecks, report.rows.length);
  assert.equal(report.summary.consistent + report.summary.inconsistent, report.rows.length);
  assert.ok(report.rows.every((row) => ['一致', '不一致'].includes(row.status)));
});

test('formula conformance report identifies the first mismatch when formulas drift', () => {
  const report = runFormulaConformance({ generatedAt: '2026-06-30T00:00:00.000Z' });
  const firstMismatch = report.rows.find((row) => row.status === '不一致') ?? null;
  assert.deepEqual(report.summary.firstMismatch, firstMismatch ? {
    caseId: firstMismatch.caseId,
    group: firstMismatch.group,
    formulaKey: firstMismatch.formulaKey,
    label: firstMismatch.label,
    expected: firstMismatch.expected,
    actual: firstMismatch.actual
  } : null);
});

test('formula conformance package exposes a rerunnable verification command', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.scripts['verify:formulas'], 'node scripts/verify-formula-conformance.js');
});
