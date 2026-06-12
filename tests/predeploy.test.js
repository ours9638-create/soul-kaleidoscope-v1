import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const script = fs.existsSync(new URL('../scripts/predeploy-check.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/predeploy-check.js', import.meta.url), 'utf8')
  : '';
const verifyDeployment = fs.existsSync(new URL('../scripts/verify-deployment.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/verify-deployment.js', import.meta.url), 'utf8')
  : '';
const readiness = fs.existsSync(new URL('../scripts/local-readiness.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/local-readiness.js', import.meta.url), 'utf8')
  : '';
const deployDoc = fs.readFileSync(new URL('../docs/deploy-free-stack.md', import.meta.url), 'utf8');
const verificationDoc = fs.readFileSync(new URL('../docs/deployment-verification.md', import.meta.url), 'utf8');
const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const runbook = fs.readFileSync(new URL('../docs/operator-runbook.md', import.meta.url), 'utf8');
const checklist = fs.readFileSync(new URL('../docs/implementation-checklist.md', import.meta.url), 'utf8');

test('package exposes a predeploy readiness check', () => {
  assert.equal(packageJson.scripts.predeploy, 'node scripts/predeploy-check.js');
  assert.equal(packageJson.scripts['verify:deployment'], 'node scripts/verify-deployment.js');
  assert.equal(packageJson.scripts['verify:deployment:setup'], 'node scripts/verify-deployment.js --setup-only');
  assert.equal(packageJson.scripts['verify:deployment:url'], 'node scripts/verify-deployment.js --validate-url-only');
  assert.equal(packageJson.scripts.readiness, 'node scripts/local-readiness.js');
  assert.match(packageJson.scripts.check, /scripts\/local-readiness\.js/);
});

test('predeploy check covers free-stack deployment artifacts', () => {
  assert.match(script, /apps-script\/Code\.gs/);
  assert.match(script, /apps-script\/Admin\.html/);
  assert.match(script, /web\/index\.html/);
  assert.match(script, /web\/app\.js/);
  assert.match(script, /src\/core\/service-catalog\.js/);
  assert.match(script, /scripts\/local-readiness\.js/);
  assert.match(script, /scripts\/verify-deployment\.js/);
  assert.match(script, /docs\/deployment-verification\.md/);
  assert.match(script, /docs\/operator-runbook\.md/);
});

test('predeploy check validates service delivery API and required docs', () => {
  assert.match(script, /save-and-generate-report/);
  assert.match(script, /packageJson\.version/);
  assert.match(script, /APP_VERSION/);
  assert.match(script, /不一致/);
  assert.match(script, /setupWorkbook/);
  assert.match(script, /setup-workbook/);
  assert.match(script, /soul-number-reading/);
  assert.match(script, /essential-oil-product/);
  assert.match(script, /soul-number-with-oil/);
  assert.match(script, /deployment-verification/);
  assert.match(script, /APPS_SCRIPT_URL/);
  assert.match(script, /Local readiness gate runs all offline deployment checks/);
  assert.match(script, /package:apps-script/);
  assert.match(script, /package:static/);
  assert.match(script, /package:static:zip/);
  assert.match(script, /verify:static/);
});

test('local readiness check runs all offline deployment gates', () => {
  assert.match(readiness, /npm/);
  assert.match(readiness, /test/);
  assert.match(readiness, /npm run check/);
  assert.match(readiness, /npm run predeploy/);
  assert.match(readiness, /npm run package:apps-script/);
  assert.match(readiness, /npm run package:static/);
  assert.match(readiness, /npm run package:static:zip/);
  assert.match(readiness, /npm run verify:static/);
  assert.doesNotMatch(readiness, /\['npm run verify:deployment'/);
  assert.match(readme, /npm run readiness/);
  assert.match(runbook, /npm run readiness/);
  assert.match(deployDoc, /npm run readiness/);
});

test('deployment guide tells user to run the offline deployment gate before Apps Script deployment', () => {
  assert.match(deployDoc, /npm run readiness/);
  assert.match(checklist, /npm run readiness/);
  assert.match(readiness, /npm run predeploy/);
  assert.match(deployDoc, /npm run work:start/);
  assert.match(deployDoc, /operator-runbook/);
  assert.match(deployDoc, /初始化\/檢查資料表/);
  assert.match(deployDoc, /儲存 URL/);
  assert.match(deployDoc, /檢查後台/);
  assert.match(deployDoc, /npm run verify:deployment/);
});

test('verification guide starts with workbook setup before service tests', () => {
  assert.match(verificationDoc, /必測 0：初始化資料表與 Drive 權限/);
  assert.match(checklist, /npm run verify:deployment:url/);
  assert.match(checklist, /npm run verify:deployment:setup/);
  assert.match(checklist, /npm run verify:deployment/);
  assert.match(verificationDoc, /missingHeaders/);
  assert.match(verificationDoc, /reportFolderUrl/);
  assert.match(verificationDoc, /appVersion/);
  assert.match(verificationDoc, /後台版本/);
  assert.match(verificationDoc, /儲存 URL/);
  assert.match(verificationDoc, /檢查後台/);
  assert.match(verificationDoc, /npm run verify:deployment/);
  assert.match(verificationDoc, /npm run verify:deployment:setup/);
  assert.match(verificationDoc, /npm run verify:deployment:url/);
  assert.match(verificationDoc, /setup-workbook/);
  assert.match(verificationDoc, /先只檢查初始化，不寫測試個案/);
  assert.match(verificationDoc, /只檢查網址格式，不會呼叫 Apps Script/);
  assert.match(verificationDoc, /DEPLOY-VERIFY/);
  assert.match(verificationDoc, /不要讓系統自動刪測試資料/);
  assert.match(verificationDoc, /保留一組 `DEPLOY-VERIFY` 測試資料/);
  assert.match(verificationDoc, /只處理 `displayName` 或檔名以 `DEPLOY-VERIFY` 開頭/);
});

test('operator runbook ties start, spreadsheet review, deployment, and shutdown together', () => {
  assert.match(readme, /operator-runbook/);
  assert.match(runbook, /npm run work:start/);
  assert.match(runbook, /config\/google-sheets-registry\.json/);
  assert.match(runbook, /npm run predeploy/);
  assert.match(runbook, /npm run package:static/);
  assert.match(runbook, /npm run verify:deployment/);
  assert.match(runbook, /npm run verify:deployment:setup/);
  assert.match(runbook, /npm run verify:deployment:url/);
  assert.match(runbook, /DEPLOY-VERIFY/);
  assert.match(runbook, /不要自動刪/);
  assert.match(runbook, /npm run work:shutdown/);
  assert.match(runbook, /凌晨 12:00/);
  assert.match(runbook, /精油段落只能作為支持建議，不能反推數字公式/);
});

test('implementation checklist uses packaged Apps Script files instead of raw source files', () => {
  assert.match(checklist, /dist\/apps-script\/README\.md/);
  assert.match(checklist, /dist\/apps-script\/Code\.gs/);
  assert.match(checklist, /dist\/apps-script\/Admin\.html/);
  assert.match(checklist, /dist\/apps-script\/appsscript\.json/);
  assert.doesNotMatch(checklist, /貼上 `apps-script\/Code\.gs`/);
  assert.doesNotMatch(checklist, /貼上 `apps-script\/Admin\.html`/);
});

test('deployment verifier requires an explicit Apps Script URL and covers all v1 services', () => {
  assert.match(verifyDeployment, /process\.env\.APPS_SCRIPT_URL/);
  assert.match(verifyDeployment, /validateApiUrl/);
  assert.match(verifyDeployment, /validateUrlOnly/);
  assert.match(verifyDeployment, /--validate-url-only/);
  assert.match(verifyDeployment, /script\.google\.com/);
  assert.match(verifyDeployment, /\/macros\/s\//);
  assert.match(verifyDeployment, /process\.env\.DEPLOY_VERIFY_SETUP_ONLY/);
  assert.match(verifyDeployment, /args\.includes\('--setup-only'\)/);
  assert.match(verifyDeployment, /setup-only/);
  assert.match(verifyDeployment, /process\.env\.DEPLOY_VERIFY_RUN_ID/);
  assert.match(verifyDeployment, /DEPLOY-VERIFY/);
  assert.match(verifyDeployment, /function buildPayload/);
  assert.match(verifyDeployment, /setup-workbook/);
  assert.match(verifyDeployment, /appVersion/);
  assert.match(verifyDeployment, /save-and-generate-report/);
  assert.match(verifyDeployment, /soul-number-reading/);
  assert.match(verifyDeployment, /essential-oil-product/);
  assert.match(verifyDeployment, /soul-number-with-oil/);
  assert.match(verifyDeployment, /Content-Type': 'text\/plain;charset=utf-8/);
  assert.match(verifyDeployment, /process\.exit\(1\)/);
});
