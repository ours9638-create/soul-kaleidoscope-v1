import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const OUT_DIR = 'dist/apps-script';
const files = [
  'Code.gs',
  'InterpretationData.gs',
  'LunarCalendarData.gs',
  'Admin.html',
  'appsscript.json',
  'README.md'
];
const sourceMap = new Map([
  ['Code.gs', 'apps-script/Code.gs'],
  ['InterpretationData.gs', 'apps-script/InterpretationData.gs'],
  ['LunarCalendarData.gs', 'apps-script/LunarCalendarData.gs'],
  ['Admin.html', 'apps-script/Admin.html'],
  ['appsscript.json', 'apps-script/appsscript.json']
]);
const requiredOauthScopes = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/script.storage',
  'https://www.googleapis.com/auth/spreadsheets'
];

function resolvePath(relativePath) {
  return path.join(ROOT, relativePath);
}

function fail(failures) {
  console.error('# Apps Script package verification failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(resolvePath(relativePath), 'utf8');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const failures = [];
const outPath = resolvePath(OUT_DIR);
if (!fs.existsSync(outPath)) {
  fail([`缺少 ${OUT_DIR}，請先執行 npm run package:apps-script`]);
}

for (const file of files) {
  if (!fs.existsSync(resolvePath(path.join(OUT_DIR, file)))) {
    failures.push(`部署包缺少：${OUT_DIR}/${file}`);
  }
}

for (const [packageFile, sourceFile] of sourceMap.entries()) {
  const packagePath = path.join(OUT_DIR, packageFile);
  if (!fs.existsSync(resolvePath(packagePath)) || !fs.existsSync(resolvePath(sourceFile))) continue;
  const packaged = readText(packagePath);
  const source = readText(sourceFile);
  if (packaged !== source) {
    failures.push(`${packagePath} 與 ${sourceFile} 內容不一致，請重新執行 npm run package:apps-script`);
  }
}

if (fs.existsSync(resolvePath('package.json')) && fs.existsSync(resolvePath(path.join(OUT_DIR, 'Code.gs')))) {
  const packageJson = JSON.parse(readText('package.json'));
  const code = readText(path.join(OUT_DIR, 'Code.gs'));
  const versionMatch = code.match(/APP_VERSION:\s*'([^']+)'/);
  if (!versionMatch) {
    failures.push('dist/apps-script/Code.gs 未設定 CONFIG.APP_VERSION');
  } else if (versionMatch[1] !== packageJson.version) {
    failures.push(`Apps Script 版本 ${versionMatch[1]} 與 package.json 版本 ${packageJson.version} 不一致`);
  }
  const spreadsheetMatch = code.match(/CONTENT_SPREADSHEET_ID:\s*'([^']+)'/);
  if (!spreadsheetMatch || spreadsheetMatch[1].trim().length < 20) {
    failures.push('dist/apps-script/Code.gs 未設定有效的 CONFIG.CONTENT_SPREADSHEET_ID');
  }
  ['setup-workbook', 'save-and-generate-report', 'update-delivery-status'].forEach((action) => {
    if (!code.includes(action)) failures.push(`dist/apps-script/Code.gs 缺少 ${action} action`);
  });
}

if (fs.existsSync(resolvePath(path.join(OUT_DIR, 'appsscript.json')))) {
  const manifest = JSON.parse(readText(path.join(OUT_DIR, 'appsscript.json')));
  if (manifest.runtimeVersion !== 'V8') failures.push('appsscript.json runtimeVersion 不是 V8');
  if (manifest.webapp?.executeAs !== 'USER_DEPLOYING') failures.push('appsscript.json webapp.executeAs 不是 USER_DEPLOYING');
  if (!['ANYONE_ANONYMOUS', 'ANYONE'].includes(manifest.webapp?.access)) {
    failures.push('appsscript.json webapp.access 不是可測試 Web App 權限');
  }
  const scopes = new Set(manifest.oauthScopes || []);
  requiredOauthScopes.forEach((scope) => {
    if (!scopes.has(scope)) failures.push(`appsscript.json 缺少 OAuth scope：${scope}`);
  });
}

if (fs.existsSync(resolvePath(path.join(OUT_DIR, 'README.md')))) {
  const readme = readText(path.join(OUT_DIR, 'README.md'));
  const missingReadmeItems = ['Code.gs', 'InterpretationData.gs', 'LunarCalendarData.gs', 'Admin.html', 'appsscript.json', 'SHA-256', '初始化/檢查資料表']
    .filter((item) => !readme.includes(item));
  missingReadmeItems.forEach((item) => failures.push(`dist/apps-script/README.md 缺少部署提示：${item}`));

  for (const [packageFile] of sourceMap.entries()) {
    const packagePath = path.join(OUT_DIR, packageFile);
    if (!fs.existsSync(resolvePath(packagePath))) continue;
    const digest = sha256(fs.readFileSync(resolvePath(packagePath)));
    if (!readme.includes(digest)) {
      failures.push(`dist/apps-script/README.md 未列出 ${packageFile} 的 SHA-256`);
    }
  }
}

if (failures.length > 0) fail(failures);

console.log('# Apps Script package verification ok');
console.log(`- 部署包：${OUT_DIR}`);
console.log('- 來源檔與部署包內容一致');
console.log('- APP_VERSION 與 package.json 一致');
console.log('- Web App manifest、OAuth scopes、README 與 SHA-256 清單已檢查');
