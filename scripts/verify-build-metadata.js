import assert from 'node:assert/strict';
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
  sha256File
} from './reproducible-build-utils.js';

const ROOT = process.cwd();
const buildInfoPath = path.join(ROOT, 'dist/BUILD_INFO.json');
const sumsPath = path.join(ROOT, 'dist/SHA256SUMS.txt');
const buildInfoText = fs.readFileSync(buildInfoPath, 'utf8');
const sumsText = fs.readFileSync(sumsPath, 'utf8');
const buildInfo = JSON.parse(buildInfoText);
const rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const calculatorPackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'calculator-deploy/package.json'), 'utf8'));
const calculatorLock = JSON.parse(fs.readFileSync(path.join(ROOT, 'calculator-deploy/package-lock.json'), 'utf8'));
const lockedWranglerVersion = calculatorLock.packages['node_modules/wrangler'].version;

assert.equal(buildInfoText.includes('\r'), false, 'BUILD_INFO must use LF');
assert.equal(sumsText.includes('\r'), false, 'SHA256SUMS must use LF');
assert.equal(buildInfoText.endsWith('\n'), true, 'BUILD_INFO must end with LF');
assert.equal(sumsText.endsWith('\n'), true, 'SHA256SUMS must end with LF');
assert.equal(buildInfoText, serializeJson(buildInfo), 'BUILD_INFO formatting or key order changed');
assert.equal(buildInfo.baseCommit, '94e6374ab62a4ba9c0928ab78a4718b1fd4621ee');
assert.equal(buildInfo.buildCommit, gitOutput(['rev-parse', 'HEAD'], ROOT));
assert.equal(buildInfo.appVersion, calculatorPackage.version);
assert.equal(buildInfo.engineVersion, calculatorPackage.engineVersion);
assert.equal(buildInfo.nodeVersion, process.versions.node);
assert.equal(buildInfo.npmVersion, npmVersion());
assert.equal(buildInfo.wranglerVersion, lockedWranglerVersion);
assert.equal(lockedWranglerVersion, calculatorPackage.devDependencies.wrangler);
assert.equal(buildInfo.packageManager, rootPackage.packageManager);
assert.equal(buildInfo.packageLockSha256, sha256File(path.join(ROOT, 'package-lock.json')));
assert.equal(buildInfo.calculatorPackageLockSha256, sha256File(path.join(ROOT, 'calculator-deploy/package-lock.json')));
assert.equal(buildInfo.sourceDateEpoch, getSourceDateEpoch({ cwd: ROOT }));
assert.equal(buildInfo.schemaVersion, '1.0.0');
assert.deepEqual(buildInfo.artifactNames, [...buildInfo.artifactNames].sort(compareCodePoint));
assert.deepEqual(Object.keys(buildInfo.artifactHashes), buildInfo.artifactNames);

for (const artifactName of buildInfo.artifactNames) {
  assert.equal(artifactName.includes('\\'), false, `Artifact path must be POSIX: ${artifactName}`);
  assert.equal(path.isAbsolute(artifactName), false, `Artifact path must be relative: ${artifactName}`);
  assert.equal(artifactName.includes('node_modules'), false, `node_modules is forbidden: ${artifactName}`);
  assert.equal(artifactName.startsWith('Records/'), false, `Records is forbidden: ${artifactName}`);
  assert.equal(buildInfo.artifactHashes[artifactName], artifactDigest(ROOT, artifactName));
}

assert.equal(sumsText, buildSha256Sums(ROOT, buildInfo.artifactNames));
const sumPaths = sumsText.trimEnd().split('\n').map((line) => line.slice(66));
assert.deepEqual(sumPaths, buildInfo.artifactNames);

console.log('# build metadata verification ok');
console.log(`- artifacts：${buildInfo.artifactNames.length}`);
console.log(`- BUILD_INFO SHA-256：${sha256File(buildInfoPath)}`);
console.log(`- SHA256SUMS SHA-256：${sha256File(sumsPath)}`);
