import test from 'node:test';
import assert from 'node:assert/strict';

import { buildImageChecklist, getImageTemplate } from '../src/core/templates.js';
import { calculateCase } from '../src/core/numerology.js';

test('soul kaleidoscope template locks required positions', () => {
  const result = calculateCase({
    displayName: '小狐狸',
    solarDate: '1989-05-28',
    lunarDate: '1989-04-24',
    birthTime: '15:17',
    queryDate: '2026-06-10'
  });
  const checklist = buildImageChecklist('soul-kaleidoscope', result);

  assert.equal(checklist.templateId, 'soul-kaleidoscope');
  assert.equal(checklist.positions.centerLeft.value, 1);
  assert.equal(checklist.positions.centerRight.value, 6);
  assert.equal(checklist.positions.horseOne.slot, '左上');
  assert.equal(checklist.positions.horseTwo.slot, '右上');
  assert.equal(checklist.positions.horseThree.slot, '左下');
  assert.equal(checklist.positions.horseFour.slot, '右下');
  assert.equal(checklist.positions.lunarSupport.slot, '左側');
  assert.equal(checklist.positions.solarSupport.slot, '右側');
  assert.equal(checklist.positions.yearFlow.slot, '下方');
  assert.equal(checklist.positions.annualPosition.slot, '最外圈');
});

test('image template registry can add other future combinations', () => {
  const template = getImageTemplate('minimal-number-card');

  assert.equal(template.id, 'minimal-number-card');
  assert.equal(template.outputKind, 'card');
  assert.ok(template.requiredFields.includes('solar.mainDestiny'));
});
