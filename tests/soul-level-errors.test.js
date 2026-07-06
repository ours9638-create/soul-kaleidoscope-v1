import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSoulLevel, resolveSoulLevel } from '../src/core/soul-level.js';

test('rejects malformed marker patterns', () => {
  for (const pattern of ['', '●/●', '●●●/●', '●●/●●', '11/11/1', '●●-●']) {
    assert.throws(
      () => resolveSoulLevel('month', pattern),
      /靈魂等級標記格式錯誤/,
      pattern
    );
  }
});

test('rejects unsupported calculation phases', () => {
  assert.throws(
    () => resolveSoulLevel('week', '●●/●'),
    /不支援的靈魂等級階段：week/
  );
});

test('resolves soul levels from first segment and final number only', () => {
  assert.equal(resolveSoulLevel('month', '○○/●'), 4);
  assert.equal(resolveSoulLevel('minute', '○●/○'), 2);
  assert.equal(resolveSoulLevel('day', '●●/○'), 3);
  assert.equal(resolveSoulLevel('minute', '●●/●'), 7);
  assert.equal(resolveSoulLevel('minute', '●●/●', { overConcentrated: true }), 6);
});

test('rejects malformed birth dates and number chains', () => {
  for (const birthDate of ['19910923', '1991/09/23', '1991-9-23', '']) {
    assert.throws(
      () => buildSoulLevel({ birthDate, chain: '20/2', phase: 'year' }),
      /生日必須使用 YYYY-MM-DD/,
      birthDate
    );
  }
  for (const chain of ['', '2', '2/0/2/1', 'AA/2', '200/2', '20/22']) {
    assert.throws(
      () => buildSoulLevel({ birthDate: '1991-09-23', chain, phase: 'year' }),
      /主數鏈格式錯誤/,
      chain
    );
  }
});

test('does not consume duplicate birth digits when checking repeated course digits', () => {
  const result = buildSoulLevel({
    birthDate: '1982-09-23',
    chain: '29/11/2',
    phase: 'month'
  });
  assert.equal(result.pattern, '●●/●');
  assert.equal(result.level, 7);
});

test('ignores middle reduction groups when judging soul level', () => {
  const result = buildSoulLevel({
    birthDate: '1996-03-06',
    chain: '28/10/1',
    phase: 'month'
  });

  assert.equal(result.pattern, '○○/●');
  assert.equal(result.level, 4);
});

test('keeps zero as a date digit and does not add birth time to soul level digits', () => {
  const result = buildSoulLevel({
    birthDate: '1996-03-06',
    chain: '50/5',
    phase: 'minute'
  });

  assert.equal(result.pattern, '○●/○');
  assert.equal(result.level, 2);
});
