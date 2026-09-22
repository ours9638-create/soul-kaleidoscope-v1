import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../web/semantic-review.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../review-packages/manifest.json', import.meta.url), 'utf8'));

test('semantic review exposes isolated adapters for supported modules', () => {
  for (const module of ['annual','mainDestiny','horse','solarSunMoonBloom','lunarSunMoonBloom']) {
    assert.match(source, new RegExp(module));
  }
  assert.match(source, /soulKaleidoscope\.semanticReview\.\$\{module\}/);
});

test('annual keeps pair whitelist while phrase modules validate their own number/context bounds', () => {
  assert.match(source, /\^\[1-9\]x\[1-9\]\$/);
  assert.match(source, /numberMin: 0/);
  assert.match(source, /numberMax: 8/);
  assert.match(source, /core-mature/);
  assert.match(source, /core-shadow/);
  assert.match(source, /pressure\/support/);
  assert.match(source, /solar-side/);
  assert.match(source, /lunar-side/);
});

test('review export never auto-promotes canonical or runtime', () => {
  assert.match(source, /copy\.canonicalAdopted = false/);
  assert.match(source, /copy\.runtimeEligible = false/);
});

test('revise requires explicit replacement text', () => {
  assert.match(source, /decision === 'revise' && !revision/);
});

test('manifest keeps blocked and archive-only modules out of review-ready queue', () => {
  const neutral = manifest.packages.find(item => item.module === 'mainDestinyNeutralCore');
  const legacy = manifest.packages.find(item => item.module === 'F002LegacyModel');
  assert.equal(neutral.state, 'BLOCKED_BY_BAD_003');
  assert.equal(legacy.state, 'ARCHIVE_REFERENCE_ONLY');
});

test('review-ready package counts are fixed', () => {
  const expected = {mainDestiny:18,horse:9,solarSunMoonBloom:9,lunarSunMoonBloom:9};
  for (const [module,count] of Object.entries(expected)) {
    const item = manifest.packages.find(entry => entry.module === module);
    assert.equal(item.state, 'REVIEW_READY');
    assert.equal(item.count, count);
  }
});
