import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const OUT_DIR = 'dist/apps-script';
const FILES = [
  'apps-script/Code.gs',
  'apps-script/Admin.html',
  'apps-script/appsscript.json'
];
const OUTPUT_FILES = [...FILES.map((source) => path.basename(source)), 'README.md'];

function resolvePath(relativePath) {
  return path.join(ROOT, relativePath);
}

const packageJson = JSON.parse(fs.readFileSync(resolvePath('package.json'), 'utf8'));

function copyFile(source) {
  const target = path.join(OUT_DIR, path.basename(source));
  const targetPath = resolvePath(target);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(resolvePath(source), targetPath);
}

function clearKnownOutputs() {
  fs.mkdirSync(resolvePath(OUT_DIR), { recursive: true });
  OUTPUT_FILES.forEach((fileName) => {
    fs.rmSync(resolvePath(path.join(OUT_DIR, fileName)), { force: true });
  });
}

function fileInfo(source) {
  const targetPath = resolvePath(path.join(OUT_DIR, path.basename(source)));
  const content = fs.readFileSync(targetPath);
  return {
    file: path.basename(source),
    size: content.length,
    sha256: crypto.createHash('sha256').update(content).digest('hex')
  };
}

clearKnownOutputs();
FILES.forEach(copyFile);
const manifest = FILES.map(fileInfo);

const checklist = [
  '# Apps Script 部署封包',
  '',
  `版本：${packageJson.version}`,
  `產生時間：${new Date().toISOString()}`,
  '',
  '只使用這個 `dist/apps-script` 資料夾內的檔案部署。不要直接貼 `apps-script/` 原始資料夾，避免貼到未封裝或未核對的版本。',
  '',
  '把這個資料夾內的檔案貼到 Google Apps Script：',
  '',
  '- `Code.gs` -> Apps Script 的 `Code.gs`',
  '- `Admin.html` -> 新增 HTML 檔，名稱必須是 `Admin`',
  '- `appsscript.json` -> 專案設定的 manifest',
  '',
  '## 檔案核對',
  '',
  '| 檔案 | 大小 bytes | SHA-256 |',
  '| --- | ---: | --- |',
  ...manifest.map((item) => `| ${item.file} | ${item.size} | ${item.sha256} |`),
  '',
  '貼上 Apps Script 前，先確認三個檔案都在這份清單內，並確認版本號符合 `package.json`。',
  '',
  '貼上後先部署 Web App，再打開後台按「初始化/檢查資料表」。PWA 按「檢查後台」時，應顯示同一個後台版本。'
].join('\n');

fs.writeFileSync(resolvePath(path.join(OUT_DIR, 'README.md')), `${checklist}\n`);

console.log('# Apps Script package ok');
console.log(`- 輸出目錄：${OUT_DIR}`);
console.log('- 已包含 Code.gs');
console.log('- 已包含 Admin.html');
console.log('- 已包含 appsscript.json');
console.log('- 已包含 README.md');
