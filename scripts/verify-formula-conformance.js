import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateCase, chainFromSum } from '../src/core/numerology.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BASELINE = path.join(ROOT, 'data', 'formula-conformance-baseline.json');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'outputs', 'formula-conformance');
const STATUS_PASS = '一致';
const STATUS_FAIL = '不一致';

const SOUL_PHASES = ['year', 'month', 'day', 'hour', 'minute'];

export function runFormulaConformance(options = {}) {
  const {
    baselinePath = DEFAULT_BASELINE,
    generatedAt = new Date().toISOString(),
    outputDir = DEFAULT_OUTPUT_DIR,
    writeFiles = false
  } = options;
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const rows = baseline.cases.flatMap((item) => compareCase(item));
  const summary = buildSummary(rows, baseline.cases.length);
  const report = {
    generatedAt,
    baselineVersion: baseline.baselineVersion,
    source: baseline.source,
    summary,
    rows
  };

  if (writeFiles) writeReportFiles(report, outputDir);
  return report;
}

export function compareCase(baselineCase) {
  const result = calculateCase({
    displayName: baselineCase.displayName,
    ...baselineCase.input
  });
  const expected = baselineCase.expected;
  const rows = [];
  const add = (group, formulaKey, label, expectedValue, actualValue, sourceRef = baselineCase.sourceRef) => {
    rows.push(buildRow({
      caseId: baselineCase.caseId,
      displayName: baselineCase.displayName,
      group,
      formulaKey,
      label,
      expectedValue,
      actualValue,
      sourceRef
    }));
  };

  add('birthday', 'solar-date', '國曆生日', expected.birthday.solarDate, result.input.solarDate.raw);
  add('birthday', 'lunar-date', '農曆生日', expected.birthday.lunarDate, result.input.lunarDate.raw);
  add('birthday', 'birth-time', '出生時間', expected.birthday.birthTime, result.input.birthTime.raw);
  add('birthday', 'query-date', '查詢日期', expected.birthday.queryDate, result.input.queryDate.raw);
  add('birthday', 'birthday-state', '是否已過生日', expected.birthday.hasBirthdayPassed, result.activeAnnualKey === 'afterBirthday');
  add('birthday', 'active-annual-key', '採用流年版本', expected.birthday.activeAnnualKey, result.activeAnnualKey);

  add('solar', 'main-destiny-chain', '國曆主命數鏈條', expected.solar.mainDestinyChain, result.solar.mainDestiny.chain);
  add('solar', 'main-destiny-final', '國曆主命數', expected.solar.mainDestinyFinal, result.solar.mainDestiny.final);
  add('solar', 'sun-moon-bloom-chain', '國曆日月綻放鏈條', expected.solar.sunMoonBloomChain, result.solar.sunMoonBloom.chain);
  add('solar', 'sun-moon-bloom-final', '國曆日月綻放數', expected.solar.sunMoonBloomFinal, result.solar.sunMoonBloom.final);
  add('solar', 'day-seat', '國曆日座數', expected.solar.daySeat, result.seatNumbers.solar.day);
  add('solar', 'sun-moon-seat', '國曆日月數', expected.solar.sunMoonSeat, result.seatNumbers.solar.sunMoon);

  add('lunar', 'main-destiny-chain', '農曆主命數鏈條', expected.lunar.mainDestinyChain, result.lunar.mainDestiny.chain);
  add('lunar', 'main-destiny-final', '農曆主命數', expected.lunar.mainDestinyFinal, result.lunar.mainDestiny.final);
  add('lunar', 'sun-moon-bloom-chain', '農曆內頻鏈條', expected.lunar.sunMoonBloomChain, result.lunar.sunMoonBloom.chain);
  add('lunar', 'sun-moon-bloom-final', '農曆內頻數', expected.lunar.sunMoonBloomFinal, result.lunar.sunMoonBloom.final);
  add('lunar', 'day-seat', '農曆日座數', expected.lunar.daySeat, result.seatNumbers.lunar.day);
  add('lunar', 'sun-moon-seat', '農曆日月數', expected.lunar.sunMoonSeat, result.seatNumbers.lunar.sunMoon);

  add('support', 'solar-support', '陽貴人數', expected.support.solar, result.supportNumbers.solar);
  add('support', 'lunar-support', '陰貴人數', expected.support.lunar, result.supportNumbers.lunar);
  add('horse', 'horse-numbers', '木馬數', expected.horseNumbers, result.horseNumbers.map((item) => item.value));

  add('annual', 'analysis-year', '流年採用年', expected.annual.analysisYear, result.activeAnnual.analysisYear);
  add('annual', 'year-flow-chain', '流年鏈條', expected.annual.yearFlowChain, result.activeAnnual.yearFlow.chain);
  add('annual', 'year-flow-final', '流年數', expected.annual.yearFlowFinal, result.activeAnnual.yearFlow.final);

  const actualAgeCount = result.activeAnnual.analysisYear - Number(result.input.solarDate.year) + 1;
  add('position', 'age-count', '歲次', expected.position.ageCount, actualAgeCount);
  add('position', 'position-chain', '位格完整', expected.position.chain, chainFromSum(actualAgeCount).chain);
  add('position', 'position-final', '位格主數', expected.position.final, result.activeAnnual.position);

  for (const kind of ['solar', 'lunar']) {
    for (const phase of SOUL_PHASES) {
      add(
        'soul-level',
        `${kind}-${phase}`,
        `${kind === 'solar' ? '國曆' : '農曆'}${phaseLabel(phase)}靈魂等級`,
        expected.soulLevels[kind][phase],
        result[kind].stage.find((item) => item.phase === phase)?.soulLevel
      );
    }
  }

  return rows;
}

function buildRow({ caseId, displayName, group, formulaKey, label, expectedValue, actualValue, sourceRef }) {
  return {
    caseId,
    displayName,
    group,
    formulaKey,
    label,
    expected: formatValue(expectedValue),
    actual: formatValue(actualValue),
    status: valuesEqual(expectedValue, actualValue) ? STATUS_PASS : STATUS_FAIL,
    sourceRef
  };
}

function buildSummary(rows, totalCases) {
  const inconsistentRows = rows.filter((item) => item.status === STATUS_FAIL);
  return {
    totalCases,
    totalChecks: rows.length,
    consistent: rows.length - inconsistentRows.length,
    inconsistent: inconsistentRows.length,
    byGroup: summarizeByGroup(rows),
    firstMismatch: inconsistentRows[0] ? {
      caseId: inconsistentRows[0].caseId,
      group: inconsistentRows[0].group,
      formulaKey: inconsistentRows[0].formulaKey,
      label: inconsistentRows[0].label,
      expected: inconsistentRows[0].expected,
      actual: inconsistentRows[0].actual
    } : null
  };
}

function summarizeByGroup(rows) {
  const groups = new Map();
  for (const row of rows) {
    const current = groups.get(row.group) ?? { total: 0, consistent: 0, inconsistent: 0 };
    current.total += 1;
    if (row.status === STATUS_PASS) current.consistent += 1;
    else current.inconsistent += 1;
    groups.set(row.group, current);
  }
  return Object.fromEntries(groups);
}

function writeReportFiles(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const mismatches = report.rows.filter((row) => row.status === STATUS_FAIL);
  fs.writeFileSync(
    path.join(outputDir, 'formula-conformance-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(outputDir, 'formula-conformance-report.csv'),
    toCsv([
      ['個案ID', '姓名', '群組', '公式鍵', '項目', '基準值', '程式輸出', '狀態', '來源'],
      ...report.rows.map((row) => [
        row.caseId,
        row.displayName,
        row.group,
        row.formulaKey,
        row.label,
        row.expected,
        row.actual,
        row.status,
        row.sourceRef
      ])
    ]),
    'utf8'
  );
  fs.writeFileSync(
    path.join(outputDir, 'formula-conformance-mismatches.json'),
    `${JSON.stringify({
      generatedAt: report.generatedAt,
      baselineVersion: report.baselineVersion,
      summary: report.summary,
      rows: mismatches
    }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(outputDir, 'formula-conformance-mismatches.csv'),
    toCsv([
      ['個案ID', '姓名', '群組', '公式鍵', '項目', '基準值', '程式輸出', '狀態', '來源'],
      ...mismatches.map((row) => [
        row.caseId,
        row.displayName,
        row.group,
        row.formulaKey,
        row.label,
        row.expected,
        row.actual,
        row.status,
        row.sourceRef
      ])
    ]),
    'utf8'
  );
  fs.writeFileSync(
    path.join(outputDir, 'formula-conformance-mismatches.md'),
    buildMismatchMarkdown(report, mismatches),
    'utf8'
  );
}

function buildMismatchMarkdown(report, mismatches) {
  const lines = [
    '# 公式一致性差異區塊',
    '',
    `- 基準版本：${report.baselineVersion}`,
    `- 檢查總數：${report.summary.totalChecks}`,
    `- 不一致數：${report.summary.inconsistent}`,
    `- 第一個出入：${report.summary.firstMismatch
      ? `${report.summary.firstMismatch.group} / ${report.summary.firstMismatch.formulaKey}，${report.summary.firstMismatch.label}，基準 ${report.summary.firstMismatch.expected}，程式 ${report.summary.firstMismatch.actual}`
      : '無'}`,
    ''
  ];

  if (mismatches.length === 0) {
    lines.push('目前沒有公式出入。', '');
    return lines.join('\n');
  }

  lines.push('| 群組 | 公式鍵 | 項目 | 基準值 | 程式輸出 |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const row of mismatches) {
    lines.push(`| ${row.group} | ${row.formulaKey} | ${row.label} | ${row.expected} | ${row.actual} |`);
  }
  lines.push('');
  lines.push('## 根因判斷');
  lines.push('');
  lines.push('- `solar-month`：程式把 `28/10/1` 拆成 `28`、`10`、`1` 三段一起判斷；公式表只用 `28` 的十位 `2`、個位 `8`，再加最終主數 `1` 判斷。所以公式表是「最終主數及格、前兩位全部不及格」= 4 級，程式因為多算 `10` 變成 6 級。');
  lines.push('- `solar-minute` 與 `lunar-minute`：程式目前只用生日日期當先天數；公式表在時主數、分主數會把出生時間也納入先天數。這會讓分主數 `50/5` 的 `5` 在公式表裡及格，但在程式裡不及格。');
  lines.push('- 公式表本身還有一個疑點：國曆分主數與農曆分主數都屬於「最終主數及格、前兩位全部及格、過度集中」，但國曆分主數是 6 級，農曆分主數是 7 級。修程式前應先確認這是刻意例外，還是公式表該修正。');
  lines.push('');
  return lines.join('\n');
}

function valuesEqual(expectedValue, actualValue) {
  return JSON.stringify(expectedValue) === JSON.stringify(actualValue);
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join('/');
  if (value == null) return '';
  return String(value);
}

function phaseLabel(phase) {
  return {
    year: '年主數',
    month: '月主數',
    day: '日主數',
    hour: '時主數',
    minute: '分主數'
  }[phase];
}

function toCsv(table) {
  return `${table.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runFormulaConformance({ writeFiles: true });
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.inconsistent > 0 && !process.argv.includes('--no-fail')) {
    process.exitCode = 1;
  }
}
