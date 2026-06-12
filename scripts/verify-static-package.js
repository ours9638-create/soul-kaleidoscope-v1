import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ZIP_PATH = path.join(ROOT, 'dist/static-site.zip');
const requiredEntries = [
  'index.html',
  'web/index.html',
  'web/app.js',
  'web/deployment-config.js',
  'web/manifest.webmanifest',
  'web/sw.js',
  'src/core/numerology.js',
  'src/core/service-catalog.js'
];

function readZipEntries(buffer) {
  const entries = [];
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = buffer.subarray(fileNameStart, fileNameEnd).toString('utf8');
    entries.push(fileName);
    offset = fileNameEnd + extraLength + compressedSize;
  }
  return entries;
}

if (!fs.existsSync(ZIP_PATH)) {
  console.error('# static package verification failed');
  console.error('- 缺少 dist/static-site.zip，請先執行 npm run package:static:zip');
  process.exit(1);
}

const buffer = fs.readFileSync(ZIP_PATH);
const entries = readZipEntries(buffer);
const missing = requiredEntries.filter((entry) => !entries.includes(entry));

if (missing.length > 0) {
  console.error('# static package verification failed');
  missing.forEach((entry) => console.error(`- ZIP 缺少：${entry}`));
  process.exit(1);
}

const deploymentConfig = fs.readFileSync(path.join(ROOT, 'web/deployment-config.js'), 'utf8');
if (!deploymentConfig.includes('https://script.google.com/macros/s/') || !deploymentConfig.includes('/exec')) {
  console.error('# static package verification failed');
  console.error('- web/deployment-config.js 沒有有效 Apps Script Web App URL');
  process.exit(1);
}

console.log('# static package verification ok');
console.log(`- ZIP：${path.relative(ROOT, ZIP_PATH)}`);
console.log(`- 檔案數：${entries.length}`);
console.log('- 必要 PWA 與核心模組都已包含');
