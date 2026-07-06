const STOP_RULES = [
  {
    category: 'selfHarmOrSuicide',
    severity: 'P0',
    signals: ['自殺', '想死', '不想活', '活不下去', '結束生命', '傷害自己', '自殘', '了結']
  },
  {
    category: 'immediateDanger',
    severity: 'P0',
    signals: ['現在有危險', '被威脅', '暴力', '我要傷害', '有人要傷害我']
  },
  {
    category: 'realityDisorientation',
    severity: 'P1',
    signals: ['分不清現實', '聽到聲音', '被控制', '失去現實感']
  },
  {
    category: 'clinicalOrLegalDecision',
    severity: 'P1',
    signals: ['要不要停藥', '診斷', '法律怎麼辦', '投資建議', '重大財務決定']
  }
];

const REFERRAL_LINES = [
  '我先不做數字解讀，因為你現在提到的內容可能牽涉安全或專業協助。',
  '如果你或身邊的人有立即危險，請先打 110 或 119。',
  '如果你有想傷害自己、想死、或覺得撐不下去，請立刻聯絡 1925 安心專線、1995 生命線或 1980 張老師。',
  '現在最重要的不是分析數字，而是先讓你有人可以陪、也讓安全被接住。'
];

const OBSERVATION_FIELDS = [
  'mainIssue',
  'recentTransition',
  'repeatingPattern',
  'growthFocus',
  'excludedTopics',
  'monthlyContext',
  'approvedClientSummary'
];

export function detectCrisisReferral(input = {}) {
  const text = collectRiskText(input);
  const hits = [];
  for (const rule of STOP_RULES) {
    for (const signal of rule.signals) {
      if (text.includes(signal)) {
        hits.push({
          category: rule.category,
          severity: rule.severity,
          signal
        });
      }
    }
  }
  return {
    triggered: hits.length > 0,
    hits,
    mode: hits.length > 0 ? 'crisis-referral' : 'normal',
    message: hits.length > 0 ? REFERRAL_LINES.join('\n\n') : ''
  };
}

export function buildCrisisReferralReport(displayName = '個案', detection = {}) {
  const hitSummary = (detection.hits || [])
    .map((hit) => `${hit.severity}:${hit.category}`)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join('、');
  return [
    `# ${displayName}｜安全支持提醒`,
    '',
    '## 先暫停數字解讀',
    '',
    detection.message || REFERRAL_LINES.join('\n\n'),
    '',
    '## 系統處理狀態',
    '',
    '- 已停止數字解讀。',
    '- 不產生命盤詮釋、月提醒或命定語句。',
    `- 觸發類型：${hitSummary || '安全／專業範圍風險'}`
  ].join('\n');
}

function collectRiskText(input) {
  const values = [];
  const observations = input.observations || {};
  for (const field of OBSERVATION_FIELDS) {
    values.push(input[field], observations[field]);
  }
  values.push(input.displayName, observations.clientDisplayName);
  return values
    .filter((value) => value != null)
    .map((value) => String(value))
    .join('\n');
}
