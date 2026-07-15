import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildSha256Sums,
  directoryDigest,
  getSourceDateEpoch,
  serializeJson
} from '../../scripts/reproducible-build-utils.js';

const ROOT = process.cwd();

test('Node, npm and Wrangler are pinned exactly', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const calculatorPackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'calculator-deploy/package.json'), 'utf8'));
  assert.equal(rootPackage.packageManager, 'npm@11.13.0');
  assert.deepEqual(rootPackage.engines, { node: '24.16.0', npm: '11.13.0' });
  assert.equal(calculatorPackage.packageManager, rootPackage.packageManager);
  assert.deepEqual(calculatorPackage.engines, rootPackage.engines);
  assert.match(calculatorPackage.devDependencies.wrangler, /^\d+\.\d+\.\d+$/);
});

test('SOURCE_DATE_EPOCH accepts only a positive integer', () => {
  assert.equal(getSourceDateEpoch({ env: { SOURCE_DATE_EPOCH: '1783921728' } }), 1783921728);
  assert.throws(() => getSourceDateEpoch({ env: { SOURCE_DATE_EPOCH: 'today' } }), /Invalid SOURCE_DATE_EPOCH/);
});

test('directory aggregate is sorted and ignores filesystem mtimes', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'r1-digest-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  fs.writeFileSync(path.join(temp, 'z.txt'), 'z\n');
  fs.mkdirSync(path.join(temp, 'a'));
  fs.writeFileSync(path.join(temp, 'a', 'b.txt'), 'b\n');
  const first = directoryDigest(temp);
  fs.utimesSync(path.join(temp, 'z.txt'), new Date(0), new Date());
  const second = directoryDigest(temp);
  assert.equal(first.sha256, second.sha256);
  assert.match(first.manifest, /^[a-f0-9]{64}  a\/b\.txt\n[a-f0-9]{64}  z\.txt\n$/);
});

test('SHA256SUMS uses sorted relative POSIX paths and two spaces', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'r1-sums-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  fs.mkdirSync(path.join(temp, 'dir'));
  fs.writeFileSync(path.join(temp, 'z.txt'), 'z');
  fs.writeFileSync(path.join(temp, 'dir', 'a.txt'), 'a');
  const sums = buildSha256Sums(temp, ['z.txt', 'dir/']);
  assert.match(sums, /^[a-f0-9]{64}  dir\/\n[a-f0-9]{64}  z\.txt\n$/);
});

test('JSON serialization is stable UTF-8 text with one final LF', () => {
  const text = serializeJson({ alpha: 1, beta: ['x'] });
  assert.equal(text, '{\n  "alpha": 1,\n  "beta": [\n    "x"\n  ]\n}\n');
  assert.equal(text.includes('\r'), false);
});
