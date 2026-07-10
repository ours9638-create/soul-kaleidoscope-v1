import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registryPath = new URL('../config/google-sheets-registry.json', import.meta.url);
const registry = fs.existsSync(registryPath)
  ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  : null;
const workflowDoc = fs.readFileSync(new URL('../docs/workflow.md', import.meta.url), 'utf8');
const liveCheckDoc = fs.readFileSync(new URL('../docs/google-sheets-live-check.md', import.meta.url), 'utf8');
const startScript = fs.readFileSync(new URL('../scripts/work-start.js', import.meta.url), 'utf8');

test('Google Sheets registry defines formula and content source sheets', () => {
  assert.ok(registry);
  const ids = registry.sheets.map((sheet) => sheet.id);
  assert.ok(ids.includes('12Ddaw4FoMJ4eOFcQ8N-xi2LSiOC0mi4ab877E6sknKQ'));
  assert.ok(ids.includes('1nsUEuPIfeIClQe4RBcWGkRjh9ExT7pT0CMkX6Hp7cEg'));
});

test('Google Sheets registry marks critical tabs and low-usage read policy', () => {
  assert.ok(registry.readPolicy.includes('metadata-first'));
  assert.ok(registry.readPolicy.includes('targeted-ranges-only'));
  const content = registry.sheets.find((sheet) => sheet.role === 'content-database');
  const formula = registry.sheets.find((sheet) => sheet.role === 'formula-source');
  assert.ok(formula.criticalTabs.includes('測試案例'));
  assert.ok(content.criticalTabs.includes('02_公式定稿'));
  assert.ok(content.criticalTabs.includes('09_欄位字典'));
  assert.ok(content.criticalTabs.includes('87_靈魂萬花圖欄位映射'));
  assert.ok(content.criticalTabs.includes('貴人數1-9'));
  assert.ok(content.criticalTabs.includes('流年數1-9'));
  assert.ok(content.criticalTabs.includes('位格1-9'));
});

test('workflow references registry when spreadsheets change', () => {
  assert.match(workflowDoc, /config\/google-sheets-registry\.json/);
  assert.match(liveCheckDoc, /config\/google-sheets-registry\.json/);
  assert.match(startScript, /google-sheets-registry\.json/);
});
