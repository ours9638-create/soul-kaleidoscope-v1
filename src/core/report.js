const BANNED_CLAIMS = ['治療', '治癒', '保證改善', '保證有效', '醫療效果'];

export function buildServiceReport(serviceId, context = {}) {
  if (serviceId === 'soul-number-reading') {
    requireContext(context, ['caseResult', 'checklist'], serviceId);
    return buildReportDraft(context.caseResult, context.checklist);
  }

  if (serviceId === 'essential-oil-product') {
    requireContext(context, ['oilProfile'], serviceId);
    return buildOilReport(context.oilProfile);
  }

  if (serviceId === 'soul-number-with-oil') {
    requireContext(context, ['caseResult', 'checklist', 'oilProfile'], serviceId);
    return [
      buildReportDraft(context.caseResult, context.checklist),
      '',
      buildOilReport(context.oilProfile, { combined: true })
    ].join('\n');
  }

  throw new Error(`unknown service report: ${serviceId}`);
}

export function buildReportDraft(caseResult, checklist) {
  const annual = caseResult.annual.afterBirthday;
  const lines = [
    `# ${caseResult.displayName}｜靈魂萬花筒 v1 報告草稿`,
    '',
    '## 核心數字',
    `- 陰曆主命數：${caseResult.lunar.mainDestiny.chain}`,
    `- 陽曆主命數：${caseResult.solar.mainDestiny.chain}`,
    `- 日月綻放：${caseResult.solar.sunMoonBloom.chain}`,
    `- 內頻：${caseResult.lunar.sunMoonBloom.chain}`,
    `- 木馬：${caseResult.horseNumbers.map((item) => item.value).join(' / ')}`,
    `- 陰曆貴人：${caseResult.supportNumbers.lunar}`,
    `- 陽曆貴人：${caseResult.supportNumbers.solar}`,
    `- ${annual.analysisYear} 流年：${annual.yearFlow.chain}`,
    `- 今年位格：${annual.position}`,
    '',
    '## 出圖核對',
    ...Object.values(checklist.positions).map((item) => `- ${item.label}：${item.chain ?? item.value}（${item.slot}）`),
    '',
    '## 報告語氣邊界',
    '- 本報告使用支持、提醒、象徵與練習語氣。',
    '- 靈魂萬花圖是象徵性視覺化，不代表公式本身，也不可由圖像反推公式。',
    '- 精油與色彩內容只作為日常支持建議，不作為醫療用途。',
    '',
    '## 下一步',
    '- 先確認核對表位置與數字。',
    '- 再產出美術版提示詞或交付版 PDF。'
  ];
  return lines.join('\n');
}

export function validateReportSafety(reportText) {
  const hits = BANNED_CLAIMS.filter((word) => reportText.includes(word));
  return {
    ok: hits.length === 0,
    hits
  };
}

export function validateDeliveryReadiness(serviceId, context = {}) {
  const issues = [];
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
