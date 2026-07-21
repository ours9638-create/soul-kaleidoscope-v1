import fs from 'node:fs';
import path from 'node:path';
import {
  artifactDigest,
  buildSha256Sums,
  compareCodePoint,
  getSourceDateEpoch,
  gitOutput,
  npmVersion,
  serializeJson,
  sha256File,
  writeUtf8Lf
} from './reproducible-build-utils.js';

const ROOT = process.cwd();
const BUILD_INFO_PATH = path.join(ROOT, 'dist/BUILD_INFO.json');
const SHA256SUMS_PATH = path.join(ROOT, 'dist/SHA256SUMS.txt');
const BASE_BRANCH = 'release/app-base-2.7.0';
const BASE_COMMIT = '94e6374ab62a4ba9c0928ab78a4718b1fd4621ee';
const ARTIFACT_NAMES = [
  'calculator-deploy/public/',
  'dist/apps-script/',
  'dist/static-site.zip'
].sort(compareCodePoint);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

const rootPackage = readJson('package.json');
const calculatorPackage = readJson('calculator-deploy/package.json');
const calculatorLock = readJson('calculator-deploy/package-lock.json');
const lockedWranglerVersion = calculatorLock.packages['node_modules/wrangler'].version;
const actualNpmVersion = npmVersion();
const expectedNpmVersion = rootPackage.packageManager.split('@').at(-1);

if (process.versions.node !== rootPackage.engines.node) {
  throw new Error(`Node version mismatch: expected ${rootPackage.engines.node}, got ${process.versions.node}`);
}
if (actualNpmVersion !== expectedNpmVersion) {
  throw new Error(`npm version mismatch: expected ${expectedNpmVersion}, got ${actualNpmVersion}`);
}
if (lockedWranglerVersion !== calculatorPackage.devDependencies.wrangler) {
  throw new Error(`Wrangler lock mismatch: expected ${calculatorPackage.devDependencies.wrangler}, got ${lockedWranglerVersion}`);
}

const artifactHashes = Object.fromEntries(
  ARTIFACT_NAMES.map((artifactName) => [artifactName, artifactDigest(ROOT, artifactName)])
);
const buildBranch = process.env.BUILD_BRANCH || gitOutput(['branch', '--show-current'], ROOT) || 'detached';
const buildInfo = {
  repository: gitOutput(['config', '--get', 'remote.origin.url'], ROOT),
  baseBranch: BASE_BRANCH,
  baseCommit: BASE_COMMIT,
  buildBranch,
  buildCommit: gitOutput(['rev-parse', 'HEAD'], ROOT),
  appVersion: calculatorPackage.version,
  engineVersion: calculatorPackage.engineVersion,
  nodeVersion: process.versions.node,
  npmVersion: actualNpmVersion,
  wranglerVersion: lockedWranglerVersion,
  packageManager: rootPackage.packageManager,
  packageLockSha256: sha256File(path.join(ROOT, 'package-lock.json')),
  calculatorPackageLockSha256: sha256File(path.join(ROOT, 'calculator-deploy/package-lock.json')),
  buildProfile: 'release-reproducible',
  sourceDateEpoch: getSourceDateEpoch({ cwd: ROOT }),
  artifactNames: ARTIFACT_NAMES,
  artifactHashes,
  schemaVersion: '1.0.0'
};

writeUtf8Lf(BUILD_INFO_PATH, serializeJson(buildInfo));
writeUtf8Lf(SHA256SUMS_PATH, buildSha256Sums(ROOT, ARTIFACT_NAMES));

console.log('# reproducible build metadata ok');
console.log(`- BUILD_INFO：${path.relative(ROOT, BUILD_INFO_PATH)}`);
console.log(`- SHA256SUMS：${path.relative(ROOT, SHA256SUMS_PATH)}`);
console.log(`- artifacts：${ARTIFACT_NAMES.length}`);
