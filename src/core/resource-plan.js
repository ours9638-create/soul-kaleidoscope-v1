export const FREE_FIRST_STACK = {
  googleSheets: {
    name: 'Google Sheets',
    role: '內容資料庫、個案資料表、輸出紀錄',
    officialLimitNote: 'Sheets API 有每分鐘讀寫配額；v1 盡量用 Apps Script 批次讀寫。'
  },
  appsScript: {
    name: 'Google Apps Script',
    role: '後台 API、Google Drive 檔案產出、簡單管理頁',
    officialLimitNote: 'Apps Script 配額依帳號與服務變動；避免高頻公開 API。'
  },
  googleDrive: {
    name: 'Google Drive',
    role: '報告、SVG、PDF、個案輸出檔儲存',
    officialLimitNote: 'v1 只存交付檔，不拿 Drive 當高頻資料庫。'
  },
  staticHosting: {
    name: 'GitHub Pages 或 Cloudflare Pages',
    role: '品牌網站與 PWA 靜態頁',
    officialLimitNote: '靜態資源便宜穩定，不要把需要保密的資料放前端。'
  }
};

export function getRecommendedStack({ stage = 'v1', operatorMode = 'owner_only' } = {}) {
  const isOwnerOnlyV1 = stage === 'v1' && operatorMode === 'owner_only';
  return {
    backend: {
      primary: isOwnerOnlyV1 ? FREE_FIRST_STACK.appsScript.name : 'Firebase/Supabase later',
      reason: '目前是你後台操作，Apps Script 直接接 Sheets/Drive，最省建置與維護成本。'
    },
    database: {
      primary: FREE_FIRST_STACK.googleSheets.name,
      reason: '內容仍持續更新，Sheets 最適合你現階段維護公式、文案與個案紀錄。'
    },
    storage: {
      primary: FREE_FIRST_STACK.googleDrive.name,
      reason: '報告與 SVG 是檔案型輸出，Drive 免費流程最順。'
    },
    frontend: {
      primary: FREE_FIRST_STACK.staticHosting.name,
      reason: '前台/PWA 是靜態檔，免費靜態託管比伺服器省。'
    },
    mobile: {
      primary: 'PWA',
      reason: '先讓手機可安裝，不承擔原生 App 上架與維護成本。'
    },
    avoid: [
      'Native iOS/Android app',
      'Paid database before recurring usage is proven',
      'AI image generation as the source of truth',
      'Public self-serve login before privacy rules are ready'
    ]
  };
}

export function getUsageSavingRules() {
  return [
    '前端先本機計算，只有確認要保存個案時才呼叫 Apps Script。',
    '同一個個案的資料批次寫入 Google Sheets，不要每個欄位呼叫一次 API。',
    'SVG 校對版由程式產生，AI 美術版只在確認數字與位置後才做。',
    '報告草稿先用模板產生，只有需要精修時才使用 AI。',
    'Google Drive 只存最終交付檔與必要版本，不保存每次測試圖。',
    '公開網頁只放靜態內容，不從前端暴露 Google Sheet ID 或可寫入 API 金鑰。',
    '先用手動部署，等每週固定更新再考慮自動化部署流程。'
  ];
}

export function getUpgradeTriggers() {
  return [
    '連續 30 天每週都有真實個案使用，且手動後台流程成為瓶頸。',
    'Google Sheets 讀寫開始接近配額，或資料表因列數/權限變得難維護。',
    '客人自助登入、查詢歷史報告、付款或會員功能成為必要功能。',
    '報告輸出需要多人協作、權限分層或大量 PDF 批次產生。',
    '需要正式監控、錯誤追蹤、備份與權限稽核。'
  ];
}

export function getStepByStepMilestones() {
  return [
    '完成 Apps Script 部署，確認能寫入個案資料表。',
    '用兩個已知生日案例跑完公式、SVG、報告草稿。',
    '把第一份真實個案用 v1 流程交付，記錄卡住的位置。',
    '連續交付 5 份個案後，再整理品牌網站公開文案。',
    '連續交付 10 份個案後，再評估客人只讀報告頁與預約表單。',
    '有固定付費需求後，再評估會員、付款、Firebase/Supabase 或原生 App。'
  ];
}
