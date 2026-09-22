import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../web/semantic-review.js', import.meta.url), 'utf8');

test('semantic review supports annual and mainDestiny without sharing a storage key', () => {
  assert.match(source, /\['annual','mainDestiny'\]/);
  assert.match(source, /soulKaleidoscope\.semanticReview\.\$\{module\}/);
});

test('annual review keeps pair whitelist and mainDestiny validates number/context', () => {
  assert.match(source, /\^\[1-9\]x\[1-9\]\$/);
  assert.match(source, /core-mature/);
  assert.match(source, /core-shadow/);
});

test('review export never auto-promotes canonical or runtime', () => {
  assert.match(source, /copy\.canonicalAdopted = false/);
  assert.match(source, /copy\.runtimeEligible = false/);
});

test('revise requires explicit replacement text', () => {
  assert.match(source, /decision === 'revise' && !revision/);
});
