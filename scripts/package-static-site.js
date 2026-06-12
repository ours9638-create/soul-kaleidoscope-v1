import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = 'dist/static-site';

function resolvePath(relativePath) {
  return path.join(ROOT, relativePath);
}

function copyFile(source, target = source) {
  const targetPath = resolvePath(path.join(OUT_DIR, target));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(resolvePath(source), targetPath);
}

function copyDir(source, target = source) {
  const targetPath = resolvePath(path.join(OUT_DIR, target));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(resolvePath(source), targetPath, { recursive: true });
}

fs.rmSync(resolvePath(OUT_DIR), { recursive: true, force: true });

copyFile('index.html');
copyDir('web');
copyDir('src/core');

console.log('# static package ok');
console.log(`- 輸出目錄：${OUT_DIR}`);
console.log('- 已包含根入口 index.html');
console.log('- 已包含 web/');
console.log('- 已包含 src/core/');
