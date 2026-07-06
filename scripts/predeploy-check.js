import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const requiredFiles = [
  'apps-script/Code.gs',
  'apps-script/InterpretationData.gs',
  'apps-script/LunarCalendarData.gs',
  'apps-script/Admin.html',
  'apps-script/appsscript.json',
  'web/index.html',
  'web/app.js',
  'web/manifest.webmanifest',
  'web/sw.js',
  'scripts/package-static-site.js',
  'scripts/package-static-zip.js',
  'scripts/verify-static-package.js',
  'scripts/package-apps-script.js',
  'scripts/verify-apps-script-package.js',
  'scripts/local-readiness.js',
  'scripts/verify-deployment.js',
  'src/core/numerology.js',
  'src/core/report.js',
  'src/core/service-catalog.js',
  'docs/deployment-verification.md',
  'docs/deploy-free-stack.md',
  'docs/operator-runbook.md',
  'docs/sheets-schema.md'
];

const checks = [
  {
    label: 'Apps Script exposes one-call delivery API',
    file: 'apps-script/Code.gs',
    patterns: ['save-and-generate-report', 'saveAndGenerateReport_', 'setup-workbook', 'setupWorkbook', 'reportUrl', 'svgUrl']
  },
  {
    label: 'Apps Script admin page exposes first deployment setup',
    file: 'apps-script/Admin.html',
    patterns: ['初始化/檢查資料表', 'setupWorkbook']
  },
  {
    label: 'PWA calls one-call delivery API',
    file: 'web/app.js',
    patterns: ['save-and-generate-report', 'setup-workbook', 'data.reportUrl', 'data.svgUrl', 'localStorage']
  },
  {
    label: 'Static site package keeps web and shared core together',
    file: 'scripts/package-static-site.js',
    patterns: ['dist/static-site', "copyFile('index.html'", "copyDir('web'", "copyDir('src/core'"]
  },
  {
    label: 'Static zip package creates upload artifact',
    file: 'scripts/package-static-zip.js',
    patterns: ['dist/static-site.zip', 'dist/static-site', 'crc32']
  },
  {
    label: 'Static package verifier checks upload artifact',
    file: 'scripts/verify-static-package.js',
    patterns: ['dist/static-site.zip', 'web/deployment-config.js', 'requiredEntries']
  },
  {
    label: 'Apps Script package keeps deployment files together',
    file: 'scripts/package-apps-script.js',
    patterns: ['dist/apps-script', 'Code.gs', 'InterpretationData.gs', 'LunarCalendarData.gs', 'Admin.html', 'appsscript.json']
  },
  {
    label: 'Apps Script package verifier checks deployable output',
    file: 'scripts/verify-apps-script-package.js',
    patterns: ['dist/apps-script', 'APP_VERSION', 'SHA-256', 'setup-workbook']
  },
  {
    label: 'Deployment verifier covers setup and three services',
    file: 'scripts/verify-deployment.js',
    patterns: ['APPS_SCRIPT_URL', 'setup-workbook', 'save-and-generate-report', 'soul-number-reading', 'essential-oil-product', 'soul-number-with-oil']
  },
  {
    label: 'Service catalog keeps three v1 services',
    file: 'src/core/service-catalog.js',
    patterns: ['soul-number-reading', 'essential-oil-product', 'soul-number-with-oil']
  },
  {
    label: 'Deployment guide links verification flow',
    file: 'docs/deploy-free-stack.md',
    patterns: ['npm run readiness', 'dist/apps-script', 'dist/static-site', 'deployment-verification']
  },
  {
    label: 'Local readiness gate runs all offline deployment checks',
    file: 'scripts/local-readiness.js',
    patterns: ['npm', 'test', 'check', 'predeploy', 'package:apps-script', 'verify:apps-script', 'package:static', 'package:static:zip', 'verify:static']
  },
  {
    label: 'Operator runbook keeps start, sheet review, and shutdown together',
    file: 'docs/operator-runbook.md',
    patterns: ['npm run work:start', 'config/google-sheets-registry.json', 'npm run work:closeout', '凌晨自動收工已取消']
  },
  {
    label: 'Verification guide covers three service tests',
    file: 'docs/deployment-verification.md',
    patterns: ['必測 0', 'missingHeaders', 'reportFolderUrl', 'soul-number-reading', 'essential-oil-product', 'soul-number-with-oil']
  }
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    failures.push(`缺少必要檔案：${file}`);
  }
}

for (const check of checks) {
  const absolutePath = path.join(ROOT, check.file);
  if (!fs.existsSync(absolutePath)) continue;
  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      failures.push(`${check.label} 未找到 "${pattern}"：${check.file}`);
    }
  }
}

const codePath = path.join(ROOT, 'apps-script/Code.gs');
if (fs.existsSync(codePath)) {
  const code = fs.readFileSync(codePath, 'utf8');
  const versionMatch = code.match(/APP_VERSION:\s*'([^']+)'/);
  if (!versionMatch) {
    failures.push('Apps Script 未設定 CONFIG.APP_VERSION：apps-script/Code.gs');
  } else if (versionMatch[1] !== packageJson.version) {
    failures.push(`Apps Script 版本 ${versionMatch[1]} 與 package.json 版本 ${packageJson.version} 不一致`);
  }
}

if (failures.length > 0) {
  console.error('# predeploy failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('# predeploy ok');
console.log('- Apps Script 檔案齊全');
console.log('- PWA 檔案齊全');
console.log('- 三種服務 ID 已保留');
console.log('- 單次保存並產出報告 API 已連接');
console.log('- 部署驗證文件已存在');
