const STYLE_PRESETS = {
  'mist-white-gold-line': {
    id: 'mist-white-gold-line',
    label: 'Style A｜霧白金線版',
    usage: 'v1 預設 PDF 與圖卡主風格',
    visualRules: [
      '背景乾淨、留白充足。',
      '使用細金線、簡約線條與幾何結構建立秩序感。',
      '花草裝飾降到最低，不讓背景干擾數字與位置校對。',
      '文字排版保持清楚、溫和、可閱讀。'
    ]
  }
};

const IMAGE_TEMPLATES = {
  'soul-kaleidoscope': {
    id: 'soul-kaleidoscope',
    name: '靈魂萬花圖',
    outputKind: 'mandala-checklist',
    defaultStylePreset: 'mist-white-gold-line',
    requiredFields: [
      'lunar.mainDestiny',
      'solar.mainDestiny',
      'solar.sunMoonBloom',
      'lunar.sunMoonBloom',
      'horseNumbers',
      'supportNumbers',
      'annual'
    ],
    slots: {
      centerLeft: '中心左',
      centerRight: '中心右',
      bloom: '上方主圈',
      innerFrequency: '上方副標',
      horseOne: '左上',
      horseTwo: '右上',
      horseThree: '左下',
      horseFour: '右下',
      lunarSupport: '左側',
      solarSupport: '右側',
      yearFlow: '下方',
      annualPosition: '最外圈'
    }
  },
  'minimal-number-card': {
    id: 'minimal-number-card',
    name: '數字摘要卡',
    outputKind: 'card',
    requiredFields: ['solar.mainDestiny', 'lunar.mainDestiny', 'solar.sunMoonBloom'],
    slots: {
      title: '上方',
      main: '中央',
      support: '下方'
    }
  }
};

export function getImageTemplate(templateId) {
  const template = IMAGE_TEMPLATES[templateId];
  if (!template) throw new Error(`unknown image template: ${templateId}`);
  return structuredClone(template);
}

export function listImageTemplates() {
  return Object.values(IMAGE_TEMPLATES).map((template) => ({
    id: template.id,
    name: template.name,
    outputKind: template.outputKind,
    requiredFields: [...template.requiredFields]
  }));
}

export function getStylePreset(stylePresetId) {
  const preset = STYLE_PRESETS[stylePresetId];
  if (!preset) throw new Error(`unknown style preset: ${stylePresetId}`);
  return structuredClone(preset);
}

export function listStylePresets() {
  return Object.values(STYLE_PRESETS).map((preset) => ({
    id: preset.id,
    label: preset.label,
    usage: preset.usage
  }));
}

export function buildImageChecklist(templateId, caseResult) {
  const template = getImageTemplate(templateId);
  if (templateId === 'soul-kaleidoscope') {
    return buildSoulKaleidoscopeChecklist(template, caseResult);
  }
  return buildMinimalChecklist(template, caseResult);
}

function buildSoulKaleidoscopeChecklist(template, caseResult) {
  const annual = caseResult.activeAnnual;
  const horses = Object.fromEntries(caseResult.horseNumbers.map((item) => [item.key, item]));
  return {
    templateId: template.id,
    templateName: template.name,
    stylePreset: getStylePreset(template.defaultStylePreset),
    caseId: caseResult.id,
    displayName: caseResult.displayName,
    versionMode: caseResult.versionMode,
    sourcePolicy: caseResult.sourcePolicy,
    positions: {
      centerLeft: {
        label: '中心左｜陰曆主命數',
        slot: template.slots.centerLeft,
        value: caseResult.lunar.mainDestiny.final,
        chain: caseResult.lunar.mainDestiny.chain,
        rule: '左陰'
      },
      centerRight: {
        label: '中心右｜陽曆主命數',
        slot: template.slots.centerRight,
        value: caseResult.solar.mainDestiny.final,
        chain: caseResult.solar.mainDestiny.chain,
        rule: '右陽'
      },
      bloom: {
        label: '上方｜日月綻放',
        slot: template.slots.bloom,
        value: caseResult.solar.sunMoonBloom.final,
        chain: caseResult.solar.sunMoonBloom.chain,
        rule: '主顯示國曆月+日'
      },
      innerFrequency: {
        label: '上方副標｜內頻',
        slot: template.slots.innerFrequency,
        value: caseResult.lunar.sunMoonBloom.final,
        chain: caseResult.lunar.sunMoonBloom.chain,
        rule: '副欄補充農曆月+日'
      },
      horseOne: positionHorse('左上｜木馬一', template.slots.horseOne, horses.horseOne),
      horseTwo: positionHorse('右上｜木馬二', template.slots.horseTwo, horses.horseTwo),
      horseThree: positionHorse('左下｜木馬三', template.slots.horseThree, horses.horseThree),
      horseFour: positionHorse('右下｜木馬四', template.slots.horseFour, horses.horseFour),
      lunarSupport: {
        label: '左側｜陰曆貴人',
        slot: template.slots.lunarSupport,
        value: caseResult.supportNumbers.lunar,
        rule: '左陰，不寫成保證遇見特定人物'
      },
      solarSupport: {
        label: '右側｜陽曆貴人',
        slot: template.slots.solarSupport,
        value: caseResult.supportNumbers.solar,
        rule: '右陽，不寫成保證遇見特定人物'
      },
      yearFlow: {
        label: '下方｜流年',
        slot: template.slots.yearFlow,
        value: annual.yearFlow.final,
        chain: annual.yearFlow.chain,
        rule: '年度主題，不放中心'
      },
      annualPosition: {
        label: '最外圈｜今年位格',
        slot: template.slots.annualPosition,
        value: annual.position,
        rule: '年度運作位置'
      }
    },
    checks: [
      '中心同時顯示陰曆與陽曆主命數，左陰右陽不可顛倒。',
      '木馬一左上、木馬二右上、木馬三左下、木馬四右下。',
      '流年在下方，今年位格在最外圈。',
      '顏色只使用數字色，不使用彩油瓶色。',
      '圖像是象徵性視覺化，不可反推公式。'
    ]
  };
}

function buildMinimalChecklist(template, caseResult) {
  return {
    templateId: template.id,
    templateName: template.name,
    caseId: caseResult.id,
    displayName: caseResult.displayName,
    positions: {
      title: { label: '上方｜個案名稱', slot: template.slots.title, value: caseResult.displayName },
      main: { label: '中央｜陽曆主命數', slot: template.slots.main, value: caseResult.solar.mainDestiny.final },
      support: { label: '下方｜日月綻放', slot: template.slots.support, value: caseResult.solar.sunMoonBloom.chain }
    },
    checks: ['此模板為未來其他出圖組合的最小範例。']
  };
}

function positionHorse(label, slot, horse) {
  return {
    label,
    slot,
    value: horse.value,
    period: horse.period,
    rule: '固定位置，不讓 AI 自由重排'
  };
}
