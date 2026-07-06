import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCase } from '../src/core/numerology.js';
import { buildImageChecklist } from '../src/core/templates.js';
import { renderChecklistSvg } from '../src/core/svg.js';
import { buildReportDraft, validateReportSafety } from '../src/core/report.js';

test('renders a deterministic SVG checklist with locked labels and values', () => {
  const result = calculateCase({
    displayName: '小狐狸',
    solarDate: '1989-05-28',
    lunarDate: '1989-04-24',
    birthTime: '15:17',
    queryDate: '2026-06-10'
  });
  const checklist = buildImageChecklist('soul-kaleidoscope', result);
  const svg = renderChecklistSvg(checklist);

  assert.match(svg, /<svg/);
  assert.match(svg, /中心左｜陰曆主命數/);
  assert.match(svg, /中心右｜陽曆主命數/);
  assert.match(svg, /左上｜木馬一/);
  assert.match(svg, /右上｜木馬二/);
  assert.match(svg, /下方｜流年/);
  assert.doesNotMatch(svg, /Aura-Soma/);
});

test('report draft avoids medical claims and records output checks', () => {
  const result = calculateCase({
    displayName: '小狐狸',
    solarDate: '1989-05-28',
    lunarDate: '1989-04-24',
    birthTime: '15:17',
    queryDate: '2026-06-10'
  });
  const report = buildReportDraft(result, buildImageChecklist('soul-kaleidoscope', result));

  assert.equal(validateReportSafety(report).ok, true);
  assert.match(report, /靈魂數字個案報告/);
  assert.match(report, /內容來源 ID/);
  assert.doesNotMatch(report, /Style A｜霧白金線版|出圖核對|快速閱讀/);
  assert.doesNotMatch(report, /治療|治癒|保證改善/);
});

test('report draft uses the active pre-birthday annual version', () => {
  const result = calculateCase({
    displayName: '嘟嘟',
    solarDate: '1991-09-23',
    lunarDate: '1991-08-16',
    birthTime: '11:17',
    queryDate: '2026-06-14'
  });
  const report = buildReportDraft(result, buildImageChecklist('soul-kaleidoscope', result));

  assert.match(report, /2025 年流年 23\/5，位格 8/);
  assert.doesNotMatch(report, /2026 年流年 24\/6/);
});
