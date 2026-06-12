import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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

test('package exposes start and shutdown workflow commands', () => {
  assert.equal(packageJson.scripts['work:start'], 'node scripts/work-start.js');
  assert.equal(packageJson.scripts['work:shutdown'], 'node scripts/work-shutdown.js');
});

test('start workflow scans project files and compares a saved snapshot', () => {
  assert.match(startScript, /scanWorkspaceFiles/);
  assert.match(startScript, /scanSpreadsheetFiles/);
  assert.match(startScript, /safeHashFile/);
  assert.match(startScript, /\.workflow\/file-snapshot\.json/);
  assert.match(startScript, /\.workflow\/spreadsheet-snapshot\.json/);
  assert.match(startScript, /\.workflow\/active-session\.json/);
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

test('start workflow blocks when previous work session was not shut down', () => {
  assert.match(startScript, /上次開工尚未收工/);
  assert.match(startScript, /process\.exit\(1\)/);
});

test('shutdown workflow records daily status and reserves midnight shutdown usage', () => {
  assert.match(shutdownScript, /\.workflow\/work-log\.md/);
  assert.match(shutdownScript, /\.workflow\/active-session\.json/);
  assert.match(shutdownScript, /凌晨 12:00/);
  assert.doesNotMatch(shutdownScript, /凌晨 1:00/);
  assert.match(shutdownScript, /npm run work:shutdown/);
  assert.match(shutdownScript, /npm run readiness/);
  assert.match(shutdownScript, /verify:deployment:url/);
  assert.match(shutdownScript, /verify:deployment:setup/);
  assert.match(shutdownScript, /verify:deployment/);
  assert.match(shutdownScript, /dist\/apps-script/);
  assert.match(shutdownScript, /dist\/static-site/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm test/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm run check、npm run predeploy/);
  assert.doesNotMatch(shutdownScript, /確認已跑 npm run package:static/);
  assert.match(shutdownScript, /每日用量/);
  assert.match(shutdownScript, /無開工狀態/);
  assert.match(shutdownScript, /fs\.rmSync\(path\.join\(ROOT, ACTIVE_SESSION_FILE\)/);
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
  assert.match(workflowDoc, /凌晨 12:00/);
  assert.match(workflowDoc, /試算表/);
  assert.match(workflowDoc, /Google Drive/);
});
