import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const script = fs.existsSync(new URL('../scripts/package-static-site.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/package-static-site.js', import.meta.url), 'utf8')
  : '';
const staticZipScript = fs.existsSync(new URL('../scripts/package-static-zip.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/package-static-zip.js', import.meta.url), 'utf8')
  : '';
const verifyStaticScript = fs.existsSync(new URL('../scripts/verify-static-package.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/verify-static-package.js', import.meta.url), 'utf8')
  : '';
const appsScriptPackage = fs.existsSync(new URL('../scripts/package-apps-script.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/package-apps-script.js', import.meta.url), 'utf8')
  : '';
const verifyAppsScriptPackage = fs.existsSync(new URL('../scripts/verify-apps-script-package.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/verify-apps-script-package.js', import.meta.url), 'utf8')
  : '';
const staticPreview = fs.existsSync(new URL('../scripts/preview-static-site.js', import.meta.url))
  ? fs.readFileSync(new URL('../scripts/preview-static-site.js', import.meta.url), 'utf8')
  : '';
const deployDoc = fs.readFileSync(new URL('../docs/deploy-free-stack.md', import.meta.url), 'utf8');
const runbook = fs.readFileSync(new URL('../docs/operator-runbook.md', import.meta.url), 'utf8');
const staticHostingDoc = fs.readFileSync(new URL('../docs/static-hosting.md', import.meta.url), 'utf8');
const pagesWorkflow = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const predeploy = fs.readFileSync(new URL('../scripts/predeploy-check.js', import.meta.url), 'utf8');

test('package exposes a static-site packaging command', () => {
  assert.equal(packageJson.scripts['package:static'], 'node scripts/package-static-site.js');
  assert.equal(packageJson.scripts['package:static:zip'], 'node scripts/package-static-zip.js');
  assert.equal(packageJson.scripts['verify:static'], 'node scripts/verify-static-package.js');
});

test('package exposes a static preview command without external dependencies', () => {
  assert.equal(packageJson.scripts['preview:static'], 'node scripts/preview-static-site.js');
  assert.match(staticPreview, /node:http/);
  assert.match(staticPreview, /dist\/static-site/);
  assert.match(staticPreview, /index\.html/);
  assert.match(staticPreview, /localhost:\$\{PORT\}\/web\//);
});

test('package exposes an Apps Script deployment packaging command', () => {
  assert.equal(packageJson.scripts['package:apps-script'], 'node scripts/package-apps-script.js');
  assert.equal(packageJson.scripts['verify:apps-script'], 'node scripts/verify-apps-script-package.js');
  assert.match(packageJson.scripts.check, /scripts\/verify-apps-script-package\.js/);
});

test('static package includes root entry, web assets, and shared core modules', () => {
  assert.match(script, /dist\/static-site/);
  assert.match(script, /copyFile\('index\.html'/);
  assert.match(script, /copyDir\('web'/);
  assert.match(script, /copyDir\('src\/core'/);
});

test('static zip package creates a Cloudflare upload artifact without dependencies', () => {
  assert.match(staticZipScript, /dist\/static-site\.zip/);
  assert.match(staticZipScript, /dist\/static-site/);
  assert.match(staticZipScript, /crc32/);
  assert.match(staticZipScript, /0x06054b50/);
});

test('static verifier checks the Cloudflare upload artifact before publishing', () => {
  assert.match(verifyStaticScript, /dist\/static-site\.zip/);
  assert.match(verifyStaticScript, /requiredEntries/);
  assert.match(verifyStaticScript, /web\/deployment-config\.js/);
  assert.match(verifyStaticScript, /script\.google\.com\/macros\/s/);
});

test('deployment guide tells user to deploy the packaged static-site folder', () => {
  assert.match(deployDoc, /npm run package:static/);
  assert.match(deployDoc, /dist\/static-site/);
  assert.match(deployDoc, /docs\/static-hosting\.md/);
});

test('static hosting doc covers Cloudflare and GitHub Pages paths', () => {
  assert.match(staticHostingDoc, /Cloudflare Pages/);
  assert.match(staticHostingDoc, /GitHub Pages/);
  assert.match(staticHostingDoc, /dist\/static-site/);
  assert.match(staticHostingDoc, /dist\/static-site\.zip/);
  assert.match(staticHostingDoc, /npm run verify:static/);
  assert.match(staticHostingDoc, /web\/deployment-config\.js/);
  assert.match(staticHostingDoc, /npm run readiness/);
  assert.match(staticHostingDoc, /後台正常｜v0\.1\.0/);
});

test('GitHub Pages workflow builds the static package from source', () => {
  assert.match(pagesWorkflow, /Deploy PWA to GitHub Pages/);
  assert.match(pagesWorkflow, /npm run readiness/);
  assert.match(pagesWorkflow, /actions\/upload-pages-artifact@v3/);
  assert.match(pagesWorkflow, /dist\/static-site/);
  assert.match(pagesWorkflow, /actions\/deploy-pages@v4/);
});

test('Apps Script package includes the files the user must paste', () => {
  assert.match(appsScriptPackage, /dist\/apps-script/);
  assert.match(appsScriptPackage, /packageJson\.version/);
  assert.match(appsScriptPackage, /apps-script\/Code\.gs/);
  assert.match(appsScriptPackage, /apps-script\/InterpretationData\.gs/);
  assert.match(appsScriptPackage, /apps-script\/LunarCalendarData\.gs/);
  assert.match(appsScriptPackage, /apps-script\/Admin\.html/);
  assert.match(appsScriptPackage, /apps-script\/appsscript\.json/);
  assert.match(appsScriptPackage, /crypto/);
  assert.match(appsScriptPackage, /SHA-256/);
  assert.match(appsScriptPackage, /不要直接貼 `apps-script\/` 原始資料夾/);
  assert.match(appsScriptPackage, /PWA 按「檢查後台」/);
  assert.match(appsScriptPackage, /fileInfo/);
  assert.match(appsScriptPackage, /初始化\/檢查資料表/);
});

test('Apps Script package verifier checks packaged output against source', () => {
  assert.match(verifyAppsScriptPackage, /dist\/apps-script/);
  assert.match(verifyAppsScriptPackage, /sourceMap/);
  assert.match(verifyAppsScriptPackage, /APP_VERSION/);
  assert.match(verifyAppsScriptPackage, /LunarCalendarData\.gs/);
  assert.match(verifyAppsScriptPackage, /CONTENT_SPREADSHEET_ID/);
  assert.match(verifyAppsScriptPackage, /appsscript\.json/);
  assert.match(verifyAppsScriptPackage, /USER_DEPLOYING/);
  assert.match(verifyAppsScriptPackage, /auth\/documents/);
  assert.match(verifyAppsScriptPackage, /auth\/drive/);
  assert.match(verifyAppsScriptPackage, /auth\/script\.storage/);
  assert.match(verifyAppsScriptPackage, /auth\/spreadsheets/);
  assert.match(verifyAppsScriptPackage, /SHA-256/);
  assert.match(verifyAppsScriptPackage, /setup-workbook/);
});

test('deployment guide and runbook use the Apps Script package', () => {
  assert.match(deployDoc, /npm run package:apps-script/);
  assert.match(deployDoc, /dist\/apps-script\/Code\.gs/);
  assert.match(deployDoc, /dist\/apps-script\/InterpretationData\.gs/);
  assert.match(deployDoc, /dist\/apps-script\/LunarCalendarData\.gs/);
  assert.match(deployDoc, /SHA-256/);
  assert.match(deployDoc, /dist\/apps-script\/Admin\.html/);
  assert.match(deployDoc, /dist\/apps-script\/appsscript\.json/);
  assert.match(runbook, /npm run package:apps-script/);
  assert.match(runbook, /dist\/apps-script/);
});

test('predeploy check knows about static package script', () => {
  assert.match(predeploy, /scripts\/package-static-site\.js/);
  assert.match(predeploy, /scripts\/package-apps-script\.js/);
});
