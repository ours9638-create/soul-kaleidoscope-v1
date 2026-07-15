import fs from 'node:fs';
import path from 'node:path';
import { compareCodePoint, getSourceDateEpoch } from './reproducible-build-utils.js';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'dist/static-site');
const ZIP_PATH = path.join(ROOT, 'dist/static-site.zip');

if (!fs.existsSync(SOURCE_DIR)) {
  console.error('# static zip failed');
  console.error('- 缺少 dist/static-site，請先執行 npm run package:static');
  process.exit(1);
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[i] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(sourceDateEpoch) {
  const date = new Date(sourceDateEpoch * 1000);
  const year = Math.max(date.getUTCFullYear(), 1980);
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return { dosDate, dosTime };
}

function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => compareCodePoint(a.name, b.name))
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry.name);
      const relativePath = path.posix.join(prefix, entry.name);
      return entry.isDirectory()
        ? listFiles(absolutePath, relativePath)
        : [{ absolutePath, relativePath }];
    });
}

function localHeader(entry) {
  const buffer = Buffer.alloc(30);
  buffer.writeUInt32LE(0x04034b50, 0);
  buffer.writeUInt16LE(20, 4);
  buffer.writeUInt16LE(0x0800, 6);
  buffer.writeUInt16LE(0, 8);
  buffer.writeUInt16LE(entry.dosTime, 10);
  buffer.writeUInt16LE(entry.dosDate, 12);
  buffer.writeUInt32LE(entry.crc, 14);
  buffer.writeUInt32LE(entry.size, 18);
  buffer.writeUInt32LE(entry.size, 22);
  buffer.writeUInt16LE(entry.name.length, 26);
  buffer.writeUInt16LE(0, 28);
  return buffer;
}

function centralHeader(entry) {
  const buffer = Buffer.alloc(46);
  buffer.writeUInt32LE(0x02014b50, 0);
  buffer.writeUInt16LE(20, 4);
  buffer.writeUInt16LE(20, 6);
  buffer.writeUInt16LE(0x0800, 8);
  buffer.writeUInt16LE(0, 10);
  buffer.writeUInt16LE(entry.dosTime, 12);
  buffer.writeUInt16LE(entry.dosDate, 14);
  buffer.writeUInt32LE(entry.crc, 16);
  buffer.writeUInt32LE(entry.size, 20);
  buffer.writeUInt32LE(entry.size, 24);
  buffer.writeUInt16LE(entry.name.length, 28);
  buffer.writeUInt16LE(0, 30);
  buffer.writeUInt16LE(0, 32);
  buffer.writeUInt16LE(0, 34);
  buffer.writeUInt16LE(0, 36);
  buffer.writeUInt32LE(0, 38);
  buffer.writeUInt32LE(entry.offset, 42);
  return buffer;
}

function endOfCentralDirectory(fileCount, centralSize, centralOffset) {
  const buffer = Buffer.alloc(22);
  buffer.writeUInt32LE(0x06054b50, 0);
  buffer.writeUInt16LE(0, 4);
  buffer.writeUInt16LE(0, 6);
  buffer.writeUInt16LE(fileCount, 8);
  buffer.writeUInt16LE(fileCount, 10);
  buffer.writeUInt32LE(centralSize, 12);
  buffer.writeUInt32LE(centralOffset, 16);
  buffer.writeUInt16LE(0, 20);
  return buffer;
}

const localParts = [];
const centralParts = [];
const files = listFiles(SOURCE_DIR);
const sourceDateEpoch = getSourceDateEpoch({ cwd: ROOT });
const deterministicTimestamp = dosDateTime(sourceDateEpoch);
let offset = 0;

for (const file of files) {
  const content = fs.readFileSync(file.absolutePath);
  const name = Buffer.from(file.relativePath, 'utf8');
  const entry = {
    name,
    size: content.length,
    crc: crc32(content),
    offset,
    ...deterministicTimestamp
  };
  const header = localHeader(entry);
  localParts.push(header, name, content);
  offset += header.length + name.length + content.length;
  centralParts.push(centralHeader(entry), name);
}

const centralOffset = offset;
const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
const output = Buffer.concat([
  ...localParts,
  ...centralParts,
  endOfCentralDirectory(files.length, centralSize, centralOffset)
]);

fs.writeFileSync(ZIP_PATH, output);

console.log('# static zip ok');
console.log(`- 輸出檔案：${path.relative(ROOT, ZIP_PATH)}`);
console.log(`- 檔案數：${files.length}`);
console.log(`- 大小 bytes：${output.length}`);
console.log(`- SOURCE_DATE_EPOCH：${sourceDateEpoch}`);
