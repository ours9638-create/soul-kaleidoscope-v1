import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STATIC_DIR = 'dist/static-site';
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

function resolveStaticPath(relativePath) {
  return path.join(ROOT, STATIC_DIR, relativePath);
}

function readStaticText(relativePath) {
  return fs.readFileSync(resolveStaticPath(relativePath), 'utf8');
}

function validateAppsScriptUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:'
    && parsed.hostname === 'script.google.com'
    && /^\/macros\/s\/[^/]+\/(exec|dev)$/.test(parsed.pathname);
}

function extractImports(content) {
  return [
    ...content.matchAll(/(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)
  ].map((match) => match[1]);
}

function assertResolvable(reference, fromFile, failures) {
  if (!reference.startsWith('.')) return;
  const normalized = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), reference));
  if (!fs.existsSync(resolveStaticPath(normalized))) {
    failures.push(`${fromFile} 參照的檔案不存在：${reference} -> ${normalized}`);
  }
}

function validateModuleGraph(entryFile, failures, visited = new Set()) {
  if (visited.has(entryFile)) return;
  visited.add(entryFile);
  const filePath = resolveStaticPath(entryFile);
  if (!fs.existsSync(filePath)) {
    failures.push(`模組不存在：${entryFile}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const reference of extractImports(content)) {
    if (!reference.startsWith('.')) continue;
    const normalized = path.posix.normalize(path.posix.join(path.posix.dirname(entryFile), reference));
    assertResolvable(reference, entryFile, failures);
    validateModuleGraph(normalized, failures, visited);
  }
}

if (!fs.existsSync(ZIP_PATH)) {
  console.error('# static package verification failed');
  console.error('- 缺少 dist/static-site.zip，請先執行 npm run package:static:zip');
  process.exit(1);
}

const buffer = fs.readFileSync(ZIP_PATH);
const entries = readZipEntries(buffer);
const missing = requiredEntries.filter((entry) => !entries.includes(entry));
const failures = [];

if (missing.length > 0) {
  missing.forEach((entry) => failures.push(`ZIP 缺少：${entry}`));
}

for (const entry of requiredEntries) {
  if (!fs.existsSync(resolveStaticPath(entry))) {
    failures.push(`${STATIC_DIR} 缺少：${entry}`);
  }
}

if (fs.existsSync(resolveStaticPath('index.html'))) {
  const rootIndex = readStaticText('index.html');
  if (!rootIndex.includes('url=./web/') || !rootIndex.includes('href="./web/"')) {
    failures.push('dist/static-site/index.html 未指向 ./web/');
  }
}

if (fs.existsSync(resolveStaticPath('web/index.html'))) {
  const webIndex = readStaticText('web/index.html');
  [
    './manifest.webmanifest',
    './styles.css',
    './app.js'
  ].forEach((reference) => assertResolvable(reference, 'web/index.html', failures));
  if (!webIndex.includes('type="module"')) failures.push('web/index.html 未以 module 載入 app.js');
}

if (fs.existsSync(resolveStaticPath('web/manifest.webmanifest'))) {
  const manifest = JSON.parse(readStaticText('web/manifest.webmanifest'));
  if (manifest.start_url !== './index.html') failures.push('web/manifest.webmanifest start_url 不是 ./index.html');
  for (const icon of manifest.icons || []) {
    assertResolvable(icon.src, 'web/manifest.webmanifest', failures);
  }
}

if (fs.existsSync(resolveStaticPath('web/sw.js'))) {
  const sw = readStaticText('web/sw.js');
  const assetMatches = [...sw.matchAll(/'(\.\/[^']+|\.\.\/[^']+)'/g)].map((match) => match[1]);
  assetMatches.forEach((reference) => {
    if (reference === './') return;
    assertResolvable(reference, 'web/sw.js', failures);
  });
}

validateModuleGraph('web/app.js', failures);

const deploymentConfig = fs.existsSync(resolveStaticPath('web/deployment-config.js'))
  ? readStaticText('web/deployment-config.js')
  : '';
const apiUrlMatch = deploymentConfig.match(/appsScriptApiUrl:\s*'([^']+)'/);
if (!apiUrlMatch || !validateAppsScriptUrl(apiUrlMatch[1])) {
  failures.push('dist/static-site/web/deployment-config.js 沒有有效 Apps Script Web App URL');
}

if (failures.length > 0) {
  console.error('# static package verification failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('# static package verification ok');
console.log(`- ZIP：${path.relative(ROOT, ZIP_PATH)}`);
console.log(`- 檔案數：${entries.length}`);
console.log('- 必要 PWA、manifest、service worker 與核心模組路徑都可解析');
console.log('- 打包後 deployment-config.js 已包含有效 Apps Script Web App URL');
