import { INTERPRETATION_BLOCKS } from './interpretation-data.js';
import {
  buildClientReportDraft,
  createInterpretationLibrary,
  renderClientReportText
} from './interpretation.js';
import {
  buildCrisisReferralReport,
  detectCrisisReferral
} from './crisis-referral.js';
import {
  resolveAnnualPositionReportContentFromCase
} from './annual-position.js';

const BANNED_CLAIMS = ['治療', '治癒', '保證改善', '保證有效', '醫療效果'];
const INTERNAL_CLIENT_VISIBLE_TERMS = [
  '不要放', '不能寫', '不要寫', '勿填', '內部', '原始筆記', '原始諮詢', '不要出現', '不得出現', '僅供內部'
];
const DEFAULT_LIBRARY = createInterpretationLibrary(INTERPRETATION_BLOCKS);
const DEFAULT_FORMULA_VERSION = 'formula-2026-06-20-draft';
const DEFAULT_CONTENT_VERSION = 'content-snapshot-2026-06-16';

export function buildServiceReport(serviceId, context = {}) {
  const crisis = detectCrisisReferral({
    displayName: context.caseResult?.displayName || context.oilProfile?.displayName || context.observations?.clientDisplayName,
    observations: context.observations || {}
  });
  if (crisis.triggered) {
    return buildCrisisReferralReport(
      context.observations?.clientDisplayName || context.caseResult?.displayName || context.oilProfile?.displayName || '個案',
      crisis
    );
  }

  if (serviceId === 'soul-number-reading') {
    requireContext(context, ['caseResult', 'checklist'], serviceId);
    return buildReportDraft(context.caseResult, context.checklist, context);
  }

  if (serviceId === 'essential-oil-product') {
    requireContext(context, ['oilProfile'], serviceId);
    return buildOilReport(context.oilProfile);
  }

  if (serviceId === 'soul-number-with-oil') {
    requireContext(context, ['caseResult', 'checklist', 'oilProfile'], serviceId);
    return [
      buildReportDraft(context.caseResult, context.checklist, context),
      '',
      buildOilReport(context.oilProfile, { combined: true })
    ].join('\n');
  }

  throw new Error(`unknown service report: ${serviceId}`);
}

export function buildReportDraft(caseResult, _checklist, options = {}) {
  const report = buildClientReportDraft({
    caseResult,
    library: options.library || DEFAULT_LIBRARY,
    observations: options.observations || {},
    formulaVersion: options.formulaVersion || DEFAULT_FORMULA_VERSION,
    contentVersion: options.contentVersion || DEFAULT_CONTENT_VERSION,
    annualPositionResolver: options.annualPositionResolver || resolveAnnualPositionReportContentFromCase
  });
  return renderClientReportText(report);
}

export function validateReportSafety(reportText) {
  const hits = BANNED_CLAIMS.filter((word) => reportText.includes(word));
  return {
    ok: hits.length === 0,
    hits
  };
}

export function findInternalClientSummaryTerms(summaryText) {
  const text = String(summaryText || '');
  return INTERNAL_CLIENT_VISIBLE_TERMS.filter((term) => text.includes(term));
}

export function validateDeliveryReadiness(serviceId, context = {}) {
  const issues = [];
  const crisis = detectCrisisReferral({
    displayName: context.caseResult?.displayName || context.oilProfile?.displayName || context.observations?.clientDisplayName,
    observations: context.observations || {}
  });
  if (crisis.triggered) {
    issues.push('危機轉介模式已觸發，不能標記為已核對或已交付。');
  }
  const internalDisplayNameTerms = findInternalClientSummaryTerms(context.observations?.clientDisplayName);
  if (internalDisplayNameTerms.length) {
    issues.push(`客戶可見稱呼疑似含內部語：${internalDisplayNameTerms.join('、')}。請改成客戶可見稱呼後再交付。`);
  }
  const internalSummaryTerms = findInternalClientSummaryTerms(context.observations?.approvedClientSummary);
  if (internalSummaryTerms.length) {
    issues.push(`已核准摘要疑似含內部語：${internalSummaryTerms.join('、')}。請改成客戶可見文字後再交付。`);
  }
  if (serviceId === 'essential-oil-product' || serviceId === 'soul-number-with-oil') {
    const oilProfile = context.oilProfile || {};
    if (!Array.isArray(oilProfile.selectedOils) || oilProfile.selectedOils.length === 0) {
      issues.push('精油服務缺少建議精油，不能標記為已核對或已交付。');
    }
    if (!oilProfile.usageScenario) {
      issues.push('精油服務缺少使用情境。');
    }
    if (!oilProfile.productType) {
      issues.push('精油服務缺少產品型態。');
    }
  }

  if (context.reportText) {
    const safety = validateReportSafety(context.reportText);
    issues.push(...safety.hits.map((hit) => `報告含有禁止宣稱：${hit}`));
    if (/建議精油[：:]\s*(待確認|待選油)/.test(context.reportText)) {
      issues.push('報告精油段落仍是待確認。');
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

function buildOilReport(oilProfile, options = {}) {
  const selectedOils = Array.isArray(oilProfile.selectedOils) && oilProfile.selectedOils.length > 0
    ? oilProfile.selectedOils.join('、')
    : '待選油';
  const lines = [
    `# ${oilProfile.displayName || '精油產品'}｜精油產品建議`,
    '',
    '## 精油產品建議',
    `- 使用情境：${oilProfile.usageScenario || '待確認'}`,
    `- 產品型態：${oilProfile.productType || '待確認'}`,
    `- 建議精油：${selectedOils}`,
    '',
    '## 安全提醒',
    '- 精油內容作為日常支持與產品建議，不作為醫療用途。',
    '- 孕期、嬰幼兒、慢性病、用藥、寵物環境需另外確認禁忌。',
    '- 實際濃度、滴數與使用部位需依族群與情境調整。'
  ];

  if (options.combined) {
    lines.push('', '## 與數字盤的關係', '- 精油只作為支持層，不反推數字公式。');
  }

  return lines.join('\n');
}

function requireContext(context, keys, serviceId) {
  const missing = keys.filter((key) => context[key] == null);
  if (missing.length > 0) {
    throw new Error(`${serviceId} missing context: ${missing.join(', ')}`);
  }
}
