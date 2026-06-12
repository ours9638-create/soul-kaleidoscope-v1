import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCase } from '../src/core/numerology.js';
import { buildImageChecklist } from '../src/core/templates.js';
import {
  buildServiceReport,
  validateReportSafety
} from '../src/core/report.js';

const caseResult = calculateCase({
  displayName: '小狐狸',
  solarDate: '1989-05-28',
  lunarDate: '1989-04-24',
  birthTime: '15:17',
  queryDate: '2026-06-10'
});
const checklist = buildImageChecklist('soul-kaleidoscope', caseResult);

test('number-only report does not force an oil section', () => {
  const report = buildServiceReport('soul-number-reading', {
    caseResult,
    checklist
  });

  assert.match(report, /靈魂萬花筒 v1 報告草稿/);
  assert.doesNotMatch(report, /精油產品建議/);
});

test('oil-only report does not require birthday calculation', () => {
  const report = buildServiceReport('essential-oil-product', {
    oilProfile: {
      displayName: '安定支持滾珠',
      usageScenario: '睡前放鬆',
      productType: '滾珠',
      selectedOils: ['真正薰衣草', '乳香', '檜木']
    }
  });

  assert.match(report, /精油產品建議/);
  assert.match(report, /睡前放鬆/);
  assert.doesNotMatch(report, /主命數/);
  assert.equal(validateReportSafety(report).ok, true);
});

test('combined report keeps oil as support layer and not formula source', () => {
  const report = buildServiceReport('soul-number-with-oil', {
    caseResult,
    checklist,
    oilProfile: {
      displayName: '年度支持配方',
      usageScenario: '年度支持',
      productType: '擴香',
      selectedOils: ['乳香', '岩蘭草', '甜橙']
    }
  });

  assert.match(report, /靈魂萬花筒 v1 報告草稿/);
  assert.match(report, /精油產品建議/);
  assert.match(report, /精油只作為支持層，不反推數字公式/);
  assert.equal(validateReportSafety(report).ok, true);
});
