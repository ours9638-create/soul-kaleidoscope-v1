const REQUIRED_BLOCK_FIELDS = [
  'contentId', 'domain', 'matchKey', 'polarity', 'context', 'clientText',
  'sourceType', 'sourceRef', 'reviewStatus', 'contentVersion'
];

const CANVA_DELIVERY_FOLDER = Object.freeze({
  name: '靈魂萬花筒',
  url: 'https://www.canva.com/folder/FAHNdHzaB5o',
  sourceLink: 'https://canva.link/iouf1tdi625nunr',
  syncMode: 'manual-layout',
  role: 'client-final-visual-output'
});

const CANVA_A4_PAGE_MAP = Object.freeze([
  {
    pageType: 'cover',
    canvaPageName: '封面',
    layoutSlot: 'P01',
    purpose: '個案名稱、報告名稱、版本識別',
    pasteGuidance: '只放個案稱呼與報告標題，不放內部計算表。'
  },
  {
    pageType: 'opening',
    canvaPageName: '這次閱讀的焦點',
    layoutSlot: 'P02',
    purpose: '放已核准摘要，建立這份報告與個案當下議題的連結',
    pasteGuidance: '使用 approvedClientSummary；不要貼原始諮詢筆記。'
  },
  {
    pageType: 'core-facts',
    canvaPageName: '核心數字',
    layoutSlot: 'P03',
    purpose: '列出國曆／農曆主命數、日月綻放（國曆日月數）、內頻（農曆日月數）、流年與位格',
    pasteGuidance: '保留鏈條與最後主數；避免塞入完整內部手卡。'
  },
  {
    pageType: 'mature-expression',
    canvaPageName: '成熟運作方式',
    layoutSlot: 'P04',
    purpose: '呈現個案可穩定運用的力量',
    pasteGuidance: '挑 2–4 句重點，避免整段塞滿版面。'
  },
  {
    pageType: 'pressure-patterns',
    canvaPageName: '失衡與壓力模式',
    layoutSlot: 'P05',
    purpose: '呈現陰影、過度或壓抑表現',
    pasteGuidance: '好的與不好的都要說，避免只寫正向形容。'
  },
  {
    pageType: 'observable-signals',
    canvaPageName: '觸發與可觀察訊號',
    layoutSlot: 'P06',
    purpose: '讓個案知道什麼狀態代表模式正在發生',
    pasteGuidance: '用條列，讓個案能自我辨識。'
  },
  {
    pageType: 'relationship-expression',
    canvaPageName: '關係中的表現',
    layoutSlot: 'P07',
    purpose: '整理關係、人際互動、界線與情緒表現',
    pasteGuidance: '若該案沒有關係內容，這頁可省略或併入成熟／陰影頁。'
  },
  {
    pageType: 'work-expression',
    canvaPageName: '工作與行動表現',
    layoutSlot: 'P08',
    purpose: '整理工作、決策、行動與資源承接方式',
    pasteGuidance: '若該案工作議題不強，可改為生活實踐頁。'
  },
  {
    pageType: 'monthly-reminder',
    canvaPageName: '月份提醒',
    layoutSlot: 'P09',
    purpose: '只放已核對的流月或月份提醒',
    pasteGuidance: '未核對時整頁省略，不顯示待核對或猜測內容。'
  },
  {
    pageType: 'actions',
    canvaPageName: '接下來可以做的事',
    layoutSlot: 'P10',
    purpose: '放 1–3 個可執行行動',
    pasteGuidance: '每個行動要具體，可在一週內開始。'
  },
  {
    pageType: 'closing',
    canvaPageName: '閱讀提醒與結語',
    layoutSlot: 'P11',
    purpose: '收束報告，保留非標籤化與非醫療宣稱邊界',
    pasteGuidance: '保留支持語氣，不寫保證結果。'
  }
]);

export function createInterpretationLibrary(blocks = []) {
  const normalized = blocks.map(validateBlock);
  return {
    blocks: normalized,
    findVerified(domain, matchKey) {
      return normalized.filter((block) => block.reviewStatus === 'verified'
        && block.domain === domain
        && block.matchKey === String(matchKey));
    }
  };
}

export function buildClientReportDraft({
  caseResult,
  library,
  observations = {},
  formulaVersion,
  contentVersion,
  annualPositionResolver
}) {
  if (!caseResult) throw new Error('caseResult is required');
  if (!library?.findVerified) throw new Error('interpretation library is required');
  const displayName = observations.clientDisplayName || caseResult.displayName;
  const selected = selectBlocks(caseResult, library);
  const annualPosition = annualPositionResolver?.(caseResult);
  const sections = [
    {
      id: 'opening',
      title: '這次閱讀的焦點',
      paragraphs: observations.approvedClientSummary
        ? [observations.approvedClientSummary]
        : ['這份報告整理你目前可運用的力量、壓力下容易出現的模式，以及可以落地的下一步。']
    },
    {
      id: 'core-facts',
      title: '核心數字',
      paragraphs: [
        `陽曆主命數 ${caseResult.solar.mainDestiny.chain}，農曆主命數 ${caseResult.lunar.mainDestiny.chain}。`,
        `日月綻放（國曆日月數）${caseResult.solar.sunMoonBloom.chain}，內頻（農曆日月數）${caseResult.lunar.sunMoonBloom.chain}。`,
        `${caseResult.activeAnnual.analysisYear} 年流年 ${caseResult.activeAnnual.yearFlow.chain}，位格 ${caseResult.activeAnnual.position}。`
      ]
    },
    {
      id: 'mature-expression',
      title: '你可以穩定運用的力量',
      paragraphs: selected
        .filter((block) => !['relationship', 'work'].includes(block.context))
        .map((block) => block.clientText).filter(Boolean)
    },
    {
      id: 'relationship-expression',
      title: '關係中的表現',
      paragraphs: selected.filter((block) => block.context === 'relationship')
        .map((block) => block.clientText).filter(Boolean)
    },
    {
      id: 'work-expression',
      title: '工作中的表現',
      paragraphs: selected.filter((block) => block.context === 'work')
        .map((block) => block.clientText).filter(Boolean)
    },
    {
      id: 'pressure-patterns',
      title: '壓力下需要留意的模式',
      paragraphs: selected.map((block) => block.trigger
        ? `${block.trigger}，可以留意：${block.observableSignal || block.clientText}`
        : block.observableSignal).filter(Boolean)
    },
    {
      id: 'observable-signals',
      title: '你可以辨認的訊號',
      paragraphs: unique(selected.map((block) => block.observableSignal).filter(Boolean))
    },
    {
      id: 'actions',
      title: '接下來可以做的事',
      paragraphs: unique(selected.map((block) => block.actionSuggestion).filter(Boolean)).slice(0, 3)
    },
    {
      id: 'closing',
      title: '閱讀提醒',
      paragraphs: ['這份報告提供的是觀察與練習方向，不把任何數字視為對你的固定標籤。']
    }
  ].filter((section) => section.paragraphs.length > 0);

  if (annualPosition?.status === 'approved' && annualPosition.paragraph) {
    sections.splice(2, 0, {
      id: 'annual-position',
      title: annualPosition.sectionTitle || '年度流年 × 位格',
      paragraphs: [annualPosition.paragraph]
    });
  }

  if (observations.monthlyVerified === true) {
    const monthly = library.findVerified('monthFlow', observations.monthFlow);
    if (monthly.length) {
      sections.splice(-1, 0, {
        id: 'monthly-reminder',
        title: '本月提醒',
        paragraphs: monthly.flatMap((block) => [block.clientText, block.actionSuggestion]).filter(Boolean)
      });
      selected.push(...monthly);
    }
  }

  const sourceContentIds = unique([
    ...selected.map((block) => block.contentId),
    annualPosition?.status === 'approved' ? annualPosition.sourceContentId : ''
  ].filter(Boolean));
  return {
    kind: 'ClientReportDraft',
    status: 'draft',
    displayName,
    caseId: caseResult.id,
    formulaVersion,
    contentVersion,
    generatedAt: new Date().toISOString(),
    sourceContentIds,
    sections,
    reviewIssues: sourceContentIds.length ? [] : ['缺少已核對的解讀內容']
  };
}

export function buildPractitionerCard({ caseResult, observations = {}, formulaVersion }) {
  if (!caseResult) throw new Error('caseResult is required');
  return {
    kind: 'PractitionerCard',
    pageSize: 'A5',
    caseId: caseResult.id,
    displayName: observations.clientDisplayName || caseResult.displayName,
    formulaVersion,
    birthdayVersion: caseResult.versionMode,
    solar: calendarForCard(caseResult.solar),
    lunar: calendarForCard(caseResult.lunar),
    seats: cloneSeats(caseResult.seatNumbers),
    horses: caseResult.horseNumbers,
    supportNumbers: caseResult.supportNumbers,
    annual: caseResult.activeAnnual,
    privateObservations: {
      mainIssue: observations.mainIssue || '',
      recentTransition: observations.recentTransition || '',
      repeatingPattern: observations.repeatingPattern || '',
      growthFocus: observations.growthFocus || '',
      excludedTopics: observations.excludedTopics || '',
      monthlyContext: observations.monthlyContext || '',
      approvedClientSummary: observations.approvedClientSummary || ''
    }
  };
}

export function buildCanvaPackage(report) {
  if (report?.kind !== 'ClientReportDraft') throw new Error('ClientReportDraft is required');
  const fileNaming = `${report.displayName}_${report.caseId}_${report.formulaVersion}_${report.contentVersion}_CanvaA4`;
  const pages = [
    { pageType: 'cover', title: `${report.displayName}｜靈魂數字個案報告`, body: [] },
    ...report.sections.map((section) => ({
      pageType: section.id,
      title: section.title,
      body: [...section.paragraphs]
    }))
  ].map((page, index) => enrichCanvaPage(page, index + 1));
  return {
    kind: 'CanvaPackage',
    format: 'A4-portrait',
    caseId: report.caseId,
    displayName: report.displayName,
    formulaVersion: report.formulaVersion,
    contentVersion: report.contentVersion,
    targetCanvaFolder: CANVA_DELIVERY_FOLDER,
    fileNaming,
    workflowNotes: [
      'Google Docs 是文字與版本主檔；Canva 只做客戶最終視覺版。',
      'Canva 內若調整文案，需回寫 Google Docs 或重產套版包，避免版本分裂。',
      'A5 內部手卡與內部觀察不可貼入 Canva 客戶報告。'
    ],
    pageMap: CANVA_A4_PAGE_MAP,
    sourceContentIds: [...report.sourceContentIds],
    pages
  };
}

function enrichCanvaPage(page, pageNumber) {
  const mapping = CANVA_A4_PAGE_MAP.find((item) => item.pageType === page.pageType);
  return {
    pageNumber,
    pageType: page.pageType,
    canvaPageName: mapping?.canvaPageName || page.title,
    layoutSlot: mapping?.layoutSlot || `P${String(pageNumber).padStart(2, '0')}`,
    title: page.title,
    purpose: mapping?.purpose || '',
    pasteGuidance: mapping?.pasteGuidance || '',
    body: page.body
  };
}

export function renderClientReportText(report) {
  return [
    `# ${report.displayName}｜靈魂數字個案報告`,
    '',
    ...report.sections.flatMap((section) => [
      `## ${section.title}`,
      '',
      ...section.paragraphs.flatMap((paragraph) => [paragraph, ''])
    ]),
    `內容版本：${report.contentVersion}`,
    `公式版本：${report.formulaVersion}`,
    `內容來源 ID：${report.sourceContentIds.join('、')}`
  ].join('\n').trim();
}

export function renderPractitionerCardHtml(card) {
  const stageRows = (label, calendar) => calendar.stage.map((stage) => `
    <tr><td>${escapeHtml(label)}</td><td>${escapeHtml(stage.phase)}</td><td>${escapeHtml(stage.chain)}</td><td>${escapeHtml(stage.soulLevel == null ? '待人工核對' : `${stage.soulLevel}級`)}</td></tr>`).join('');
  const observations = Object.entries(card.privateObservations)
    .filter(([, value]) => value)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}</strong>：${escapeHtml(value)}</li>`)
    .join('');
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>${escapeHtml(card.displayName)}｜快速閱讀</title>
<style>
@page { size: A5 portrait; margin: 10mm; }
body { font-family: "Noto Sans TC", Arial, sans-serif; color: #263238; margin: 0; }
h1 { font-size: 20px; text-align: center; margin: 0 0 8px; }
.meta { text-align: center; font-size: 11px; color: #607d8b; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 10px; }
th, td { border: 1px solid #b0bec5; padding: 4px; text-align: center; }
th { background: #e8eaf6; }
h2 { font-size: 13px; margin: 9px 0 4px; }
ul { margin: 4px 0; padding-left: 18px; font-size: 10px; }
</style></head><body>
<h1>${escapeHtml(card.displayName)}｜快速閱讀</h1>
<div class="meta">A5 內部解讀手卡｜${escapeHtml(card.formulaVersion)}｜${escapeHtml(card.birthdayVersion)}</div>
<table><thead><tr><th>曆別</th><th>階段</th><th>主數鏈</th><th>靈魂等級</th></tr></thead><tbody>
${stageRows('國曆', card.solar)}${stageRows('農曆', card.lunar)}
</tbody></table>
<h2>座數</h2>
<ul><li>國曆日座數 ${escapeHtml(card.seats?.solar?.day ?? '待核對')}／日月數 ${escapeHtml(card.seats?.solar?.sunMoon ?? '待核對')}</li>
<li>農曆日座數 ${escapeHtml(card.seats?.lunar?.day ?? '待核對')}／日月數 ${escapeHtml(card.seats?.lunar?.sunMoon ?? '待核對')}</li></ul>
<h2>木馬與貴人</h2>
<ul><li>木馬：${card.horses.map((item) => `${escapeHtml(item.label)} ${escapeHtml(item.value)}`).join('／')}</li>
<li>陰曆貴人 ${escapeHtml(card.supportNumbers.lunar)}／陽曆貴人 ${escapeHtml(card.supportNumbers.solar)}</li>
<li>${escapeHtml(card.annual.analysisYear)} 流年 ${escapeHtml(card.annual.yearFlow.chain)}／位格 ${escapeHtml(card.annual.position)}</li></ul>
${observations ? `<h2>內部觀察</h2><ul>${observations}</ul>` : ''}
</body></html>`;
}

function selectBlocks(caseResult, library) {
  const targets = [
    ['mainDestinyChain', caseResult.solar.mainDestiny.chain],
    ['mainDestinyChain', caseResult.lunar.mainDestiny.chain],
    ['mainDestiny', caseResult.solar.mainDestiny.final],
    ['mainDestiny', caseResult.lunar.mainDestiny.final],
    ...sunMoonBloomComponentDigits(caseResult.solar.sunMoonBloom.chain)
      .map((digit) => ['sunMoonBloomComponent', digit]),
    ['sunMoonBloom', caseResult.solar.sunMoonBloom.final],
    ...sunMoonBloomComponentDigits(caseResult.lunar.sunMoonBloom.chain)
      .map((digit) => ['innerFrequencyComponent', digit]),
    ['innerFrequency', caseResult.lunar.sunMoonBloom.final],
    ['daySeat', caseResult.seatNumbers?.solar?.day],
    ['daySeat', caseResult.seatNumbers?.lunar?.day],
    ...caseResult.horseNumbers.map((horse) => ['horse', horse.value]),
    ['support', caseResult.supportNumbers.solar],
    ['support', caseResult.supportNumbers.lunar],
    ['annual', caseResult.activeAnnual.yearFlow.final],
    ['position', caseResult.activeAnnual.position]
  ];
  const daySoulLevel = caseResult.solar.stage.find((stage) => stage.phase === 'day')?.soulLevel;
  if (daySoulLevel) targets.push(['soulLevel', daySoulLevel]);

  const seen = new Set();
  return targets.flatMap(([domain, matchKey]) => library.findVerified(domain, matchKey))
    .filter((block) => {
      if (seen.has(block.contentId)) return false;
      seen.add(block.contentId);
      return true;
    });
}

function sunMoonBloomComponentDigits(chain) {
  const parts = String(chain ?? '').split('/').filter(Boolean);
  const firstLayer = parts[0] ?? '';
  const firstLayerDigits = firstLayer
    .replace(/\D/g, '')
    .split('')
    .filter(Boolean);
  const middleLayers = parts.slice(1, -1).filter((part) => /^\d+$/.test(part));
  return unique([...firstLayerDigits, ...middleLayers]);
}

function validateBlock(block) {
  if (!block || typeof block !== 'object') throw new Error('interpretation block must be an object');
  const missing = REQUIRED_BLOCK_FIELDS.filter((field) => block[field] === undefined || block[field] === '');
  if (missing.length) throw new Error(`interpretation block missing: ${missing.join(', ')}`);
  if (block.reviewStatus === 'verified' && !block.lastReviewedAt) {
    throw new Error(`verified interpretation block missing lastReviewedAt: ${block.contentId}`);
  }
  return { ...block, matchKey: String(block.matchKey) };
}

function calendarForCard(calendar) {
  return {
    date: calendar.date,
    mainDestiny: calendar.mainDestiny,
    sunMoonBloom: calendar.sunMoonBloom,
    stage: calendar.stage.map((stage) => ({ ...stage }))
  };
}

function cloneSeats(seats) {
  return seats
    ? {
      solar: { ...seats.solar },
      lunar: { ...seats.lunar }
    }
    : {
      solar: { day: '待核對', sunMoon: '待核對' },
      lunar: { day: '待核對', sunMoon: '待核對' }
    };
}

function unique(values) {
  return [...new Set(values)];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
