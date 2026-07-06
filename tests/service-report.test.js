import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCase } from '../src/core/numerology.js';
import { buildImageChecklist } from '../src/core/templates.js';
import {
  buildServiceReport,
  validateDeliveryReadiness,
  validateReportSafety
} from '../src/core/report.js';
import { detectCrisisReferral } from '../src/core/crisis-referral.js';

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
    checklist,
    observations: {
      clientDisplayName: '小狐狸',
      approvedClientSummary: '這次閱讀聚焦在工作節奏與界線。'
    }
  });

  assert.match(report, /靈魂數字個案報告/);
  assert.doesNotMatch(report, /精油產品建議/);
  assert.match(report, /穩定運用的力量/);
  assert.match(report, /壓力下需要留意的模式/);
  assert.match(report, /可以辨認的訊號/);
  assert.match(report, /接下來可以做的事/);
  assert.doesNotMatch(report, /請補寫|待核對|快速閱讀|本月提醒/);
  assert.match(report, /年度流年 × 位格/);
  assert.match(report, /annual-position-scoped-7x2/);
});

test('client report only uses approved summary from observation fields', () => {
  const report = buildServiceReport('soul-number-reading', {
    caseResult,
    checklist,
    observations: {
      clientDisplayName: '小狐狸',
      mainIssue: '內部主要議題不得出現在客戶版',
      recentTransition: '內部近期轉折不得出現在客戶版',
      repeatingPattern: '內部重複模式不得出現在客戶版',
      growthFocus: '內部加強方向不得出現在客戶版',
      excludedTopics: '內部排除主題不得出現在客戶版',
      monthlyContext: '內部本月背景不得出現在客戶版',
      approvedClientSummary: '這段是唯一核准進客戶版的摘要。'
    }
  });

  assert.match(report, /這段是唯一核准進客戶版的摘要/);
  assert.doesNotMatch(
    report,
    /內部主要議題|內部近期轉折|內部重複模式|內部加強方向|內部排除主題|內部本月背景/
  );
});

test('number-only report inserts annual position paragraph only for scoped approved matchKey', () => {
  const approvedCase = {
    ...caseResult,
    activeAnnual: {
      ...caseResult.activeAnnual,
      yearFlow: { ...caseResult.activeAnnual.yearFlow, final: 1, chain: '1' },
      position: 9
    }
  };
  const report = buildServiceReport('soul-number-reading', {
    caseResult: approvedCase,
    checklist
  });

  assert.match(report, /年度流年 × 位格/);
  assert.match(report, /新舊循環/);
  assert.match(report, /annual-position-scoped-1x9/);
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

  assert.match(report, /靈魂數字個案報告/);
  assert.match(report, /精油產品建議/);
  assert.match(report, /精油只作為支持層，不反推數字公式/);
  assert.equal(validateReportSafety(report).ok, true);
});

test('oil delivery is not ready when selected oils are missing', () => {
  const report = buildServiceReport('soul-number-with-oil', {
    caseResult,
    checklist,
    oilProfile: {
      displayName: '狐狸',
      usageScenario: '身體按摩油',
      productType: '身體按摩油',
      selectedOils: []
    }
  });

  const readiness = validateDeliveryReadiness('soul-number-with-oil', {
    oilProfile: {
      displayName: '狐狸',
      usageScenario: '身體按摩油',
      productType: '身體按摩油',
      selectedOils: []
    },
    reportText: report
  });

  assert.equal(readiness.ok, false);
  assert.match(readiness.issues.join('\n'), /缺少建議精油|待確認|待選油/);
});

test('delivery readiness blocks approved client summary that still contains internal notes', () => {
  const readiness = validateDeliveryReadiness('soul-number-reading', {
    observations: {
      approvedClientSummary: '內部：這段不要放進客戶版，只是原始筆記。'
    },
    reportText: '客戶報告草稿'
  });

  assert.equal(readiness.ok, false);
  assert.match(readiness.issues.join('\n'), /已核准摘要疑似含內部語/);
  assert.match(readiness.issues.join('\n'), /內部|不要放|原始筆記/);
});

test('delivery readiness blocks client-visible name that still looks internal', () => {
  const readiness = validateDeliveryReadiness('soul-number-reading', {
    observations: {
      clientDisplayName: '內部代稱-A案',
      approvedClientSummary: '這次閱讀聚焦在工作節奏。'
    },
    reportText: '客戶報告草稿'
  });

  assert.equal(readiness.ok, false);
  assert.match(readiness.issues.join('\n'), /客戶可見稱呼疑似含內部語/);
  assert.match(readiness.issues.join('\n'), /內部/);
});

test('crisis referral stops numerology interpretation and switches to safety support', () => {
  const crisis = detectCrisisReferral({
    observations: {
      mainIssue: '我覺得活不下去，也一直想死。'
    }
  });
  assert.equal(crisis.triggered, true);
  assert.equal(crisis.hits[0].severity, 'P0');

  const report = buildServiceReport('soul-number-reading', {
    caseResult,
    checklist,
    observations: {
      clientDisplayName: '小狐狸',
      mainIssue: '我覺得活不下去，也一直想死。'
    }
  });

  assert.match(report, /安全支持提醒/);
  assert.match(report, /我先不做數字解讀/);
  assert.match(report, /110 或 119/);
  assert.match(report, /1925/);
  assert.doesNotMatch(report, /靈魂數字個案報告|核心數字|主命數|日月綻放/);

  const readiness = validateDeliveryReadiness('soul-number-reading', {
    observations: {
      mainIssue: '我覺得活不下去'
    },
    reportText: report
  });
  assert.equal(readiness.ok, false);
  assert.match(readiness.issues.join('\n'), /危機轉介模式已觸發/);
});
