import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const adminHtml = fs.readFileSync(new URL('../apps-script/Admin.html', import.meta.url), 'utf8');
const schemaDoc = fs.readFileSync(new URL('../docs/sheets-schema.md', import.meta.url), 'utf8');

test('Apps Script case sheet records service and oil module fields', () => {
  assert.match(code, /serviceId/);
  assert.match(code, /usageScenario/);
  assert.match(code, /productType/);
  assert.match(code, /selectedOils/);
  assert.match(code, /function buildServiceCase_/);
});

test('Apps Script allows oil-only service without birthday calculation', () => {
  assert.match(code, /essential-oil-product/);
  assert.match(code, /function serviceNeedsNumber_/);
  assert.match(code, /serviceNeedsNumber_\(serviceId\) \? calculateCase_\(payload\) : null/);
});

test('Apps Script report generation branches by selected service', () => {
  assert.match(code, /function buildServiceReport_/);
  assert.match(code, /精油產品建議/);
  assert.match(code, /精油只作為支持層，不反推數字公式/);
});

test('Apps Script can save a case and generate delivery files in one request', () => {
  assert.match(code, /save-and-generate-report/);
  assert.match(code, /function saveAndGenerateReport_/);
  assert.match(code, /const serviceCase = buildServiceCase_\(payload \|\| {}\)/);
});

test('Apps Script records delivery status for output rows', () => {
  assert.match(code, /deliveryStatus/);
  assert.match(code, /deliveryStatus: 'draft'/);
  assert.match(code, /'reportType', 'status', 'deliveryStatus'/);
});

test('Apps Script normalizes Sheet date and time values when reading a case', () => {
  assert.match(code, /function normalizeSheetDate_/);
  assert.match(code, /function normalizeSheetTime_/);
  assert.match(code, /solarDate: normalizeSheetDate_\(record\.solarDate\)/);
  assert.match(code, /lunarDate: normalizeSheetDate_\(record\.lunarDate\)/);
  assert.match(code, /birthTime: normalizeSheetTime_\(record\.birthTime, record\.caseId\)/);
  assert.match(code, /queryDate: normalizeSheetDate_\(record\.queryDate\)/);
  assert.match(code, /String\(caseId \|\| ''\)\.match\(\/-\(\\d\{2\}\)-\(\\d\{2\}\)\$\/\)/);
  assert.match(code, /Utilities\.formatDate\(value, 'Asia\/Taipei', 'yyyy-MM-dd'\)/);
  assert.match(code, /Utilities\.formatDate\(value, 'Asia\/Taipei', 'HH:mm'\)/);
});

test('Apps Script skips duplicate case rows but still allows report versions', () => {
  assert.match(code, /function saveCaseRowIfNeeded_/);
  assert.match(code, /function findExistingCaseRows_/);
  assert.match(code, /findExistingCaseRows_\(sheet, serviceCase\.id, serviceCase\.serviceId\)/);
  assert.match(code, /duplicateCaseWarning/);
  assert.match(code, /message: 'duplicate case row skipped'/);
  assert.match(code, /serviceMatches = serviceIdIndex === -1 \|\| row\[serviceIdIndex\] === serviceId/);
  assert.match(code, /const delivery = createDeliveryFiles_\(serviceCase\)/);
});

test('Apps Script body parser supports text/plain JSON and form parameters', () => {
  assert.match(code, /function parseBody_/);
  assert.match(code, /e\.parameter && Object\.keys\(e\.parameter\)\.length/);
  assert.match(code, /JSON\.parse\(e\.postData\.contents\)/);
});

test('Apps Script exposes setup and health checks for first deployment', () => {
  assert.match(code, /action === 'health'/);
  assert.match(code, /action === 'setup'/);
  assert.match(code, /setup-workbook/);
  assert.match(code, /function setupWorkbook\(\)/);
  assert.match(code, /function setupWorkbook_/);
  assert.match(code, /function healthCheck_/);
  assert.match(code, /APP_VERSION/);
  assert.match(code, /appVersion/);
  assert.match(code, /missingHeaders/);
  assert.match(code, /reportFolderUrl/);
});

test('Apps Script admin page exposes service and oil inputs', () => {
  assert.match(adminHtml, /name="serviceId"/);
  assert.match(adminHtml, /value="soul-number-reading" selected/);
  assert.match(adminHtml, /id="oilFields"/);
  assert.match(adminHtml, /name="usageScenario"/);
  assert.match(adminHtml, /name="productType"/);
  assert.match(adminHtml, /name="selectedOils"/);
  assert.match(adminHtml, /初始化\/檢查資料表/);
  assert.match(adminHtml, /setupWorkbook/);
});

test('Sheets schema documents service module columns', () => {
  assert.match(schemaDoc, /serviceId/);
  assert.match(schemaDoc, /usageScenario/);
  assert.match(schemaDoc, /productType/);
  assert.match(schemaDoc, /selectedOils/);
  assert.match(schemaDoc, /serviceOutputStatus/);
});
