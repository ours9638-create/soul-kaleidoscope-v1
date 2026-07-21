import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function compareCodePoint(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function gitOutput(args, cwd = process.cwd()) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

export function getSourceDateEpoch({ cwd = process.cwd(), env = process.env } = {}) {
  const value = env.SOURCE_DATE_EPOCH || gitOutput(['log', '-1', '--format=%ct', 'HEAD'], cwd);
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`Invalid SOURCE_DATE_EPOCH: ${value}`);
  }
  return Number(value);
}

export function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

export function listFilesSorted(directory) {
  function visit(current, prefix = '') {
    return fs.readdirSync(current, { withFileTypes: true })
      .map((entry) => ({ entry, relativePath: path.posix.join(prefix, entry.name) }))
      .sort((left, right) => compareCodePoint(left.relativePath, right.relativePath))
      .flatMap(({ entry, relativePath }) => {
        const absolutePath = path.join(current, entry.name);
        return entry.isDirectory()
          ? visit(absolutePath, relativePath)
          : [{ absolutePath, relativePath }];
      });
  }
  return visit(directory);
}

export function directoryDigest(directory) {
  const files = listFilesSorted(directory);
  const manifest = files
    .map((file) => `${sha256File(file.absolutePath)}  ${file.relativePath}\n`)
    .join('');
  return {
    fileCount: files.length,
    manifest,
    sha256: sha256Buffer(Buffer.from(manifest, 'utf8'))
  };
}

export function artifactDigest(root, relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const absolutePath = path.join(root, normalizedPath);
  if (normalizedPath.endsWith('/')) return directoryDigest(absolutePath).sha256;
  return sha256File(absolutePath);
}

export function buildSha256Sums(root, artifactNames) {
  return [...artifactNames]
    .sort(compareCodePoint)
    .map((artifactName) => `${artifactDigest(root, artifactName)}  ${artifactName}\n`)
    .join('');
}

export function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function writeUtf8Lf(filePath, content) {
  const normalized = content.replace(/\r\n?/g, '\n');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, normalized, { encoding: 'utf8' });
}

export function npmVersion(env = process.env) {
  const match = env.npm_config_user_agent?.match(/(?:^|\s)npm\/([^\s]+)/);
  if (match) return match[1];
  if (process.platform === 'win32') {
    return execFileSync(process.env.ComSpec, ['/d', '/s', '/c', 'npm --version'], { encoding: 'utf8' }).trim();
  }
  return execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
}
