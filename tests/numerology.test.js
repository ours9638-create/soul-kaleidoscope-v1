import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCase } from '../src/core/numerology.js';

test('calculates the 1989 example with chains and final numbers', () => {
  const result = calculateCase({
    displayName: '小狐狸',
    solarDate: '1989-05-28',
    lunarDate: '1989-04-24',
    birthTime: '15:17',
    queryDate: '2026-06-10'
  });

  assert.equal(result.solar.mainDestiny.chain, '42/6');
  assert.equal(result.solar.mainDestiny.final, 6);
  assert.equal(result.lunar.mainDestiny.chain, '37/10/1');
  assert.equal(result.lunar.mainDestiny.final, 1);
  assert.equal(result.solar.sunMoonBloom.chain, '33/6');
  assert.equal(result.lunar.sunMoonBloom.chain, '28/10/1');
  assert.deepEqual(result.seatNumbers, {
    solar: { day: 1, daySeat: { chain: '28/10/1', mainNumber: 1 }, sunMoon: 6 },
    lunar: { day: 6, daySeat: { chain: '24/6', mainNumber: 6 }, sunMoon: 1 }
  });
  assert.deepEqual(result.horseNumbers.map((item) => item.value), [4, 8, 4, 4]);
  assert.deepEqual(result.supportNumbers, { solar: 7, lunar: 7 });
  assert.deepEqual(result.nobleSupportNumbers, {
    solar: { chain: '7', mainNumber: 7 },
    lunar: { chain: '7', mainNumber: 7 }
  });
  assert.equal(result.annual.afterBirthday.yearFlow.chain, '25/7');
  assert.equal(result.annual.afterBirthday.position, 2);
});

test('auto converts Gregorian date to lunar date when lunarDate is omitted', () => {
  const result = calculateCase({
    displayName: '小狐狸',
    solarDate: '1989-05-28',
    birthTime: '15:17',
    queryDate: '2026-06-10'
  });

  assert.equal(result.input.lunarDate.raw, '1989-04-24');
  assert.equal(result.input.lunarDate.source, 'lunar-calendar-1940-2035');
  assert.equal(result.input.lunarDate.lunarOriginalMonth, 4);
  assert.equal(result.input.lunarDate.lunarFormulaMonth, 4);
  assert.equal(result.lunar.mainDestiny.chain, '37/10/1');
  assert.equal(result.lunar.sunMoonBloom.chain, '28/10/1');
});

test('auto conversion preserves leap lunar month flag', () => {
  const result = calculateCase({
    displayName: '閏月案例',
    solarDate: '1960-07-24',
    birthTime: '00:00',
    queryDate: '2026-06-10'
  });

  assert.equal(result.input.lunarDate.raw, '1960-06-01');
  assert.equal(result.input.lunarDate.isLeapMonth, true);
  assert.equal(result.input.lunarDate.lunarOriginalMonth, 6);
  assert.equal(result.input.lunarDate.lunarFormulaMonth, 7);
  assert.equal(result.input.lunarDate.source, 'lunar-calendar-1940-2035');
  assert.equal(result.lunar.sunMoonBloom.chain, '8');
});

test('calculates the 1991 example and keeps birthday version state', () => {
  const result = calculateCase({
    displayName: '嘟嘟',
    solarDate: '1991-09-23',
    lunarDate: '1991-08-16',
    birthTime: '11:17',
    queryDate: '2026-06-10'
  });

  assert.equal(result.versionMode, 'before_and_after_birthday');
  assert.equal(result.solar.mainDestiny.chain, '34/7');
  assert.equal(result.lunar.mainDestiny.chain, '35/8');
  assert.equal(result.solar.sunMoonBloom.chain, '32/5');
  assert.equal(result.lunar.sunMoonBloom.chain, '24/6');
  assert.deepEqual(result.seatNumbers, {
    solar: { day: 5, daySeat: { chain: '23/5', mainNumber: 5 }, sunMoon: 5 },
    lunar: { day: 7, daySeat: { chain: '16/7', mainNumber: 7 }, sunMoon: 6 }
  });
  assert.deepEqual(result.horseNumbers.map((item) => item.value), [4, 3, 1, 7]);
  assert.deepEqual(result.supportNumbers, { solar: 3, lunar: 6 });
  assert.deepEqual(result.nobleSupportNumbers, {
    solar: { chain: '12/3', mainNumber: 3 },
    lunar: { chain: '15/6', mainNumber: 6 }
  });
  assert.equal(result.activeAnnualKey, 'beforeBirthday');
  assert.equal(result.activeAnnual.yearFlow.chain, '23/5');
  assert.equal(result.activeAnnual.position, 8);
});
