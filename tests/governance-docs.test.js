import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const systemCharter = fs.readFileSync(new URL('../docs/system-charter.md', import.meta.url), 'utf8');
const contentGovernance = fs.readFileSync(new URL('../docs/content-governance.md', import.meta.url), 'utf8');
const reviewSheetQaFields = fs.readFileSync(new URL('../docs/review-sheet-qa-fields.md', import.meta.url), 'utf8');
const crisisReferralMode = fs.readFileSync(new URL('../docs/crisis-referral-mode.md', import.meta.url), 'utf8');
const qaRubric = JSON.parse(fs.readFileSync(new URL('../config/content-qa-rubric.json', import.meta.url), 'utf8'));
const crisisPolicy = JSON.parse(fs.readFileSync(new URL('../config/crisis-referral-policy.json', import.meta.url), 'utf8'));

test('system charter records scope, response modes, and safety boundaries', () => {
  assert.match(systemCharter, /以數字為鏡的自我理解與節奏整理系統/);
  assert.match(systemCharter, /計算層/);
  assert.match(systemCharter, /詮釋層/);
  assert.match(systemCharter, /情境層/);
  assert.match(systemCharter, /行動層/);
  assert.match(systemCharter, /安全層/);
  assert.match(systemCharter, /映照模式/);
  assert.match(systemCharter, /整理模式/);
  assert.match(systemCharter, /行動模式/);
  assert.match(systemCharter, /轉介模式/);
  assert.match(systemCharter, /crisis-referral-policy\.json/);
  assert.match(systemCharter, /1925/);
  assert.doesNotMatch(systemCharter, /改善焦慮.*可以宣稱/);
});

test('content governance defines QA scoring, vocabulary rules, and implementation gaps', () => {
  assert.match(contentGovernance, /內容評分表/);
  assert.match(contentGovernance, /主體性/);
  assert.match(contentGovernance, /非命定/);
  assert.match(contentGovernance, /今天/);
  assert.match(contentGovernance, /這週/);
  assert.match(contentGovernance, /這個月/);
  assert.match(contentGovernance, /禁用詞庫/);
  assert.match(contentGovernance, /替代詞庫/);
  assert.match(contentGovernance, /情境詞庫/);
  assert.match(contentGovernance, /衝突型/);
  assert.match(contentGovernance, /補強型/);
  assert.match(contentGovernance, /放大型/);
  assert.match(contentGovernance, /延遲型/);
  assert.match(contentGovernance, /危機轉介/);
  assert.match(contentGovernance, /content-qa-rubric\.json/);
  assert.match(contentGovernance, /review-sheet-qa-fields\.md/);
});

test('content QA rubric defines Google Sheet columns and pass threshold', () => {
  assert.equal(qaRubric.minimumPassScore, 7);
  assert.equal(qaRubric.maximumScore, 9);
  assert.equal(qaRubric.dimensions.length, 9);
  assert.deepEqual(
    qaRubric.sheetColumns.map((column) => column.key),
    ['qaScore', 'qaBlockingIssue', 'revisionPriority', 'reviewerDecision']
  );
  assert.match(reviewSheetQaFields, /QA分數/);
  assert.match(reviewSheetQaFields, /QA阻塞原因/);
  assert.match(reviewSheetQaFields, /修改優先級/);
  assert.match(reviewSheetQaFields, /核對決策/);
  assert.match(reviewSheetQaFields, /QA分數 >= 7/);
});

test('crisis referral policy blocks numerology and includes Taiwan resources', () => {
  assert.equal(crisisPolicy.mode, 'referral');
  assert.ok(crisisPolicy.stopInterpretationWhen.some((item) => item.category === 'selfHarmOrSuicide'));
  assert.ok(crisisPolicy.stopInterpretationWhen.some((item) => item.severity === 'P0'));
  assert.ok(crisisPolicy.blockedOutput.includes('numerologyInterpretation'));
  assert.ok(crisisPolicy.blockedOutput.includes('medicalAdvice'));
  assert.ok(crisisPolicy.taiwanResources.some((item) => item.contact === '1925'));
  assert.ok(crisisPolicy.taiwanResources.some((item) => item.contact === '110/119'));
  assert.match(crisisReferralMode, /停止數字解讀/);
  assert.match(crisisReferralMode, /110／119/);
  assert.match(crisisReferralMode, /1925/);
});
