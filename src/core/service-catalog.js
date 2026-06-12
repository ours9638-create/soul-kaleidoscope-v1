const SERVICES = [
  {
    id: 'soul-number-reading',
    name: '靈魂萬花筒數字盤',
    category: 'primary',
    isPrimary: true,
    canStandalone: true,
    canCombineWith: ['essential-oil-product'],
    requiresSoulNumberResult: false,
    requiredInputs: ['displayName', 'solarDate', 'lunarDate', 'birthTime', 'queryDate'],
    outputs: ['數字盤計算結果', '出圖核對表', '靈魂萬花圖 SVG 校對版', '報告草稿'],
    deliveryFormats: ['Markdown report', 'SVG checklist', 'Google Drive file'],
    riskNotes: [
      '圖像是象徵性視覺化，不反推公式。',
      'AI 美術版不能取代 SVG 校對版。'
    ]
  },
  {
    id: 'essential-oil-product',
    name: '精油產品/配方',
    category: 'module',
    isPrimary: false,
    canStandalone: true,
    canCombineWith: ['soul-number-reading'],
    requiresSoulNumberResult: false,
    requiredInputs: ['displayName', 'usageScenario', 'productType', 'selectedOils'],
    outputs: ['精油產品建議', '使用情境', '安全提醒', '產品/配方草稿'],
    deliveryFormats: ['Markdown report', 'Product label draft'],
    riskNotes: [
      '不寫治療、治癒、保證改善。',
      '需保留孕期、嬰幼兒、慢性病、用藥、寵物等禁忌提醒。',
      '精油是支持與產品層，不作為數字公式來源。'
    ]
  },
  {
    id: 'soul-number-with-oil',
    name: '靈魂萬花筒數字盤 + 精油搭配',
    category: 'bundle',
    isPrimary: false,
    canStandalone: false,
    canCombineWith: [],
    requiresSoulNumberResult: true,
    requiredInputs: ['displayName', 'solarDate', 'lunarDate', 'birthTime', 'queryDate', 'usageScenario', 'productType'],
    outputs: ['數字盤計算結果', '出圖核對表', '精油支持建議', '組合報告草稿'],
    deliveryFormats: ['Markdown report', 'SVG checklist', 'Google Drive file'],
    riskNotes: [
      '先完成數字盤，再接精油支持建議。',
      '精油不得反推數字公式。',
      '不得出現醫療或保證效果宣稱。'
    ]
  }
];

const WORKFLOWS = {
  'soul-number-reading': {
    serviceId: 'soul-number-reading',
    steps: [
      { id: 'calculate-soul-number', label: '計算數字盤' },
      { id: 'build-image-checklist', label: '建立出圖核對表' },
      { id: 'build-number-report', label: '產出數字盤報告' }
    ],
    guardrails: ['數字盤是主系統；圖像不得反推公式。']
  },
  'essential-oil-product': {
    serviceId: 'essential-oil-product',
    steps: [
      { id: 'build-oil-suggestion', label: '建立精油產品建議' },
      { id: 'build-oil-report', label: '產出精油報告' }
    ],
    guardrails: ['精油可獨立交付；不需要生日排盤。', '不得使用醫療宣稱。']
  },
  'soul-number-with-oil': {
    serviceId: 'soul-number-with-oil',
    steps: [
      { id: 'calculate-soul-number', label: '計算數字盤' },
      { id: 'build-image-checklist', label: '建立出圖核對表' },
      { id: 'build-oil-suggestion', label: '建立精油支持建議' },
      { id: 'build-combined-report', label: '產出組合報告' }
    ],
    guardrails: ['精油不得反推數字公式。', '精油只作為支持層，不污染公式層。']
  }
};

export function listServices() {
  return SERVICES.map((service) => structuredClone(service));
}

export function getServiceDefinition(serviceId) {
  const service = SERVICES.find((item) => item.id === serviceId);
  if (!service) throw new Error(`unknown service: ${serviceId}`);
  return structuredClone(service);
}

export function buildServiceWorkflow(serviceId) {
  const workflow = WORKFLOWS[serviceId];
  if (!workflow) throw new Error(`unknown service workflow: ${serviceId}`);
  return structuredClone(workflow);
}

export function isOilService(serviceId) {
  return serviceId === 'essential-oil-product' || serviceId === 'soul-number-with-oil';
}
