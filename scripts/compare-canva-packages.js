import fs from 'node:fs';

const [, , leftPath, rightPath, ...flags] = process.argv;
const json = flags.includes('--json');

if (!leftPath || !rightPath) {
  console.error('Usage: node scripts/compare-canva-packages.js <left.json> <right.json> [--json]');
  process.exit(2);
}

const left = readPackage(leftPath);
const right = readPackage(rightPath);
const result = compareCanvaPackages(left, right);

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printTextReport(result);
}

if (result.status === 'fail') process.exit(1);

export function compareCanvaPackages(leftPackage, rightPackage) {
  assertCanvaPackage(leftPackage, 'left');
  assertCanvaPackage(rightPackage, 'right');

  const leftParagraphs = extractParagraphs(leftPackage);
  const rightParagraphs = extractParagraphs(rightPackage);
  const exactSharedParagraphs = intersection(leftParagraphs, rightParagraphs);
  const exactTextOverlap = exactSharedParagraphs.length / Math.max(
    Math.min(leftParagraphs.length, rightParagraphs.length),
    1,
  );

  const leftSources = new Set(leftPackage.sourceContentIds || []);
  const rightSources = new Set(rightPackage.sourceContentIds || []);
  const sharedSources = [...leftSources].filter((id) => rightSources.has(id));
  const sourceOverlap = sharedSources.length / Math.max(Math.min(leftSources.size, rightSources.size), 1);

  const leftPageTypes = (leftPackage.pages || []).map((page) => page.pageType);
  const rightPageTypes = (rightPackage.pages || []).map((page) => page.pageType);
  const samePageOrder = leftPageTypes.join('|') === rightPageTypes.join('|');
  const sameCase = leftPackage.caseId === rightPackage.caseId;
  const sameDisplayName = leftPackage.displayName === rightPackage.displayName;

  const warnings = [];
  if (sameCase) warnings.push('caseId 相同，可能是同一個案或重複輸出。');
  if (sameDisplayName) warnings.push('displayName 相同，需確認是否為同一位客戶。');
  if (samePageOrder) warnings.push('頁面順序完全相同；這可以接受，但要確認每頁重點不是同文複製。');
  if (exactTextOverlap >= 0.55) warnings.push('客戶文字重疊偏高，需人工檢查是否模板感過重。');
  if (sourceOverlap >= 0.55) warnings.push('來源 contentId 重疊偏高，可能代表兩案選到相近解讀內容。');

  const status = sameCase || (exactTextOverlap >= 0.85 && sourceOverlap >= 0.85) ? 'fail'
    : warnings.length ? 'review'
      : 'pass';

  return {
    status,
    comparedAt: new Date().toISOString(),
    left: summarizePackage(leftPackage, leftParagraphs),
    right: summarizePackage(rightPackage, rightParagraphs),
    sameCase,
    sameDisplayName,
    samePageOrder,
    exactTextOverlap: round(exactTextOverlap),
    sourceOverlap: round(sourceOverlap),
    sharedParagraphCount: exactSharedParagraphs.length,
    sharedSourceContentIds: sharedSources,
    warnings,
  };
}

function readPackage(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertCanvaPackage(value, label) {
  if (value?.kind !== 'CanvaPackage') {
    throw new Error(`${label} is not a CanvaPackage`);
  }
  if (!Array.isArray(value.pages)) {
    throw new Error(`${label} CanvaPackage missing pages`);
  }
}

function extractParagraphs(pkg) {
  return (pkg.pages || [])
    .flatMap((page) => page.body || [])
    .map((text) => normalizeText(text))
    .filter((text) => text.length >= 12);
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[，。、「」『』：；！？」]/g, '')
    .trim();
}

function intersection(leftValues, rightValues) {
  const rightSet = new Set(rightValues);
  return [...new Set(leftValues)].filter((value) => rightSet.has(value));
}

function summarizePackage(pkg, paragraphs) {
  return {
    caseId: pkg.caseId,
    displayName: pkg.displayName,
    formulaVersion: pkg.formulaVersion,
    contentVersion: pkg.contentVersion,
    pages: (pkg.pages || []).length,
    paragraphs: paragraphs.length,
    sourceContentIds: (pkg.sourceContentIds || []).length,
  };
}

function printTextReport(result) {
  console.log(`CanvaPackage 差異檢查：${result.status}`);
  console.log(`- 個案：${result.left.displayName} ↔ ${result.right.displayName}`);
  console.log(`- 頁面數：${result.left.pages} ↔ ${result.right.pages}`);
  console.log(`- 文字重疊率：${result.exactTextOverlap}`);
  console.log(`- 來源重疊率：${result.sourceOverlap}`);
  if (result.warnings.length) {
    console.log('- 需要人工檢查：');
    for (const warning of result.warnings) console.log(`  - ${warning}`);
  }
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
