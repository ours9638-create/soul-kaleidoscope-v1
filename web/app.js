import { calculateCase } from '../src/core/numerology.js';
import { getSupportedSolarDateRange, solarToLunarDate } from '../src/core/lunar-calendar.js';
import { buildImageChecklist } from '../src/core/templates.js';
import { renderChecklistSvg } from '../src/core/svg.js';
import { buildServiceReport, validateReportSafety } from '../src/core/report.js';
import { detectCrisisReferral } from '../src/core/crisis-referral.js';
import { INTERPRETATION_BLOCKS } from '../src/core/interpretation-data.js';
import {
  buildCanvaPackage,
  buildClientReportDraft,
  buildPractitionerCard,
  createInterpretationLibrary,
  renderPractitionerCardHtml
} from '../src/core/interpretation.js';
import { getRecommendedStack, getStepByStepMilestones, getUsageSavingRules } from '../src/core/resource-plan.js';
import { isOilService } from '../src/core/service-catalog.js';
import { DEPLOYMENT_CONFIG } from './deployment-config.js';

const state = {
  result: null,
  checklist: null,
  svg: '',
  report: '',
  practitionerCardHtml: '',
  canvaPackage: null,
  installPrompt: null
};

const INTERPRETATION_LIBRARY = createInterpretationLibrary(INTERPRETATION_BLOCKS);
const FORMULA_VERSION = 'formula-2026-06-20-draft';
const CONTENT_VERSION = 'content-snapshot-2026-06-16';

const API_URL_STORAGE_KEY = 'soulKaleidoscope.appsScriptApiUrl';

const form = document.querySelector('#caseForm');
const status = document.querySelector('#status');
const summary = document.querySelector('#summary');
const svgPreview = document.querySelector('#svgPreview');
const reportPreview = document.querySelector('#reportPreview');
const sendButton = document.querySelector('#sendButton');
const saveApiUrlButton = document.querySelector('#saveApiUrlButton');
const checkBackendButton = document.querySelector('#checkBackendButton');
const installButton = document.querySelector('#installButton');
const resourcePlan = document.querySelector('#resourcePlan');
const numberFields = document.querySelector('#numberFields');
const oilFields = document.querySelector('#oilFields');
const apiUrlInput = form.apiUrl;

document.querySelector('[name="queryDate"]').value = new Date().toISOString().slice(0, 10);
restoreApiUrl();

form.serviceId.addEventListener('change', () => {
  updateServiceFields();
  calculateLocal();
});

form.solarDate.addEventListener('change', () => {
  form.lunarDate.value = '';
  calculateLocal();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculateLocal();
});

sendButton.addEventListener('click', async () => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    setStatus('尚未填 Apps Script API URL');
    return;
  }
  saveApiUrl(apiUrl);
  const payload = getCasePayload();
  setStatus('送出中');
  try {
    const data = await postToAppsScript(apiUrl, { action: 'save-and-generate-report', payload });
    if (data.ok === false) {
      setStatus(data.error);
      return;
    }
    const links = [
      data.reportUrl ? `報告：${data.reportUrl}` : '',
      data.practitionerCardUrl ? `A5 手卡：${data.practitionerCardUrl}` : '',
      data.canvaPackageUrl ? `Canva 套版包：${data.canvaPackageUrl}` : '',
      data.svgUrl ? `SVG：${data.svgUrl}` : ''
    ].filter(Boolean).join('｜');
    const reviewNotice = Array.isArray(data.reviewIssues) && data.reviewIssues.length
      ? `｜仍保持 draft：${data.reviewIssues.join('；')}`
      : '';
    setStatus(links ? `已產生交付連結｜${links}${reviewNotice}` : '已送到後台');
  } catch (error) {
    setStatus(`送出失敗：${error.message}`);
  }
});

saveApiUrlButton.addEventListener('click', () => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    setStatus('尚未填 Apps Script API URL');
    return;
  }
  saveApiUrl(apiUrl);
  setStatus('已儲存 Apps Script API URL');
});

checkBackendButton.addEventListener('click', async () => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    setStatus('尚未填 Apps Script API URL');
    return;
  }
  saveApiUrl(apiUrl);
  setStatus('檢查後台中');
  try {
    const data = await postToAppsScript(apiUrl, { action: 'setup-workbook' });
    if (data.ok === false) {
      setStatus(data.error);
      return;
    }
    const missing = (data.sheets || [])
      .flatMap((sheet) => sheet.missingHeaders || [])
      .filter(Boolean);
    const version = data.appVersion ? `v${data.appVersion}` : '版本未回傳';
    setStatus(missing.length ? `後台欄位缺漏：${missing.join('、')}` : `後台正常｜${version}｜${data.reportFolderUrl || 'Drive 資料夾已建立'}`);
  } catch (error) {
    setStatus(`後台檢查失敗：${error.message}`);
  }
});

document.querySelector('#downloadSvgButton').addEventListener('click', () => {
  downloadText('靈魂萬花圖_校對版.svg', state.svg, 'image/svg+xml');
});

document.querySelector('#downloadReportButton').addEventListener('click', () => {
  downloadText('靈魂萬花筒_報告草稿.md', state.report, 'text/markdown;charset=utf-8');
});

document.querySelector('#downloadPractitionerCardButton').addEventListener('click', () => {
  downloadText('靈魂萬花筒_A5快速閱讀手卡.html', state.practitionerCardHtml, 'text/html;charset=utf-8');
});

document.querySelector('#downloadCanvaPackageButton').addEventListener('click', () => {
  const content = state.canvaPackage ? JSON.stringify(state.canvaPackage, null, 2) : '';
  downloadText('靈魂萬花筒_Canva_A4套版包.json', content, 'application/json;charset=utf-8');
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  state.installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!state.installPrompt) return;
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  installButton.hidden = true;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

calculateLocal();
renderResourcePlan();
updateServiceFields();

function calculateLocal() {
  const payload = getCasePayload();
  const serviceId = payload.serviceId || 'soul-number-reading';
  const oilProfile = buildOilProfile(payload);
  const observations = buildObservations(payload);
  const crisis = detectCrisisReferral({ ...payload, observations });
  const needsNumber = serviceId !== 'essential-oil-product';
  state.result = needsNumber && !crisis.triggered ? calculateCase(payload) : null;
  state.checklist = needsNumber && !crisis.triggered ? buildImageChecklist('soul-kaleidoscope', state.result) : null;
  state.svg = state.checklist ? renderChecklistSvg(state.checklist) : '';
  state.report = buildServiceReport(serviceId, {
    caseResult: state.result,
    checklist: state.checklist,
    oilProfile,
    observations,
    formulaVersion: FORMULA_VERSION,
    contentVersion: CONTENT_VERSION
  });
  if (state.result) {
    const clientDraft = buildClientReportDraft({
      caseResult: state.result,
      library: INTERPRETATION_LIBRARY,
      observations,
      formulaVersion: FORMULA_VERSION,
      contentVersion: CONTENT_VERSION
    });
    const card = buildPractitionerCard({
      caseResult: state.result,
      observations,
      formulaVersion: FORMULA_VERSION
    });
    state.practitionerCardHtml = renderPractitionerCardHtml(card);
    state.canvaPackage = buildCanvaPackage(clientDraft);
  } else {
    state.practitionerCardHtml = '';
    state.canvaPackage = null;
  }
  const safety = validateReportSafety(state.report);

  renderSummary(serviceId, state.result, oilProfile);
  svgPreview.innerHTML = state.svg || (
    crisis.triggered
      ? '<p class="empty-state">危機轉介模式已觸發，暫停數字盤 SVG。</p>'
      : '<p class="empty-state">精油單項服務不需要數字盤 SVG。</p>'
  );
  reportPreview.textContent = state.report;
  setStatus(crisis.triggered
    ? '危機轉介模式已觸發：已停止數字解讀'
    : (safety.ok ? '已完成本機計算' : `報告語氣需檢查：${safety.hits.join(', ')}`));
}

function getCasePayload() {
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.apiUrl;
  const lunarDateInput = form.elements.lunarDate;
  if (!payload.lunarDate && payload.solarDate) {
    const converted = solarToLunarDate(payload.solarDate);
    if (converted) {
      payload.lunarDate = converted.raw;
      if (lunarDateInput) lunarDateInput.value = converted.raw;
    } else {
      const range = getSupportedSolarDateRange();
      setStatus(`這個國曆日期不在自動農曆換算範圍：${range.start} 至 ${range.end}，請手動填農曆生日`);
    }
  }
  return payload;
}

function renderSummary(serviceId, result, oilProfile) {
  const items = [];
  if (result) {
    const annual = result.activeAnnual;
    items.push(
      ['陰曆主命數', result.lunar.mainDestiny.chain],
      ['陽曆主命數', result.solar.mainDestiny.chain],
      ['日月綻放', result.solar.sunMoonBloom.chain],
      ['內頻', result.lunar.sunMoonBloom.chain],
      ['木馬', result.horseNumbers.map((item) => item.value).join(' / ')],
      ['貴人', `陰 ${result.supportNumbers.lunar}｜陽 ${result.supportNumbers.solar}`],
      ['流年', annual.yearFlow.chain],
      ['今年位格', annual.position],
      ['版本', result.versionMode === 'after_birthday_only' ? '生日後正式版' : '生日前/生日後雙版本']
    );
  }
  if (isOilService(serviceId)) {
    items.push(
      ['精油情境', oilProfile.usageScenario],
      ['產品型態', oilProfile.productType],
      ['建議精油', oilProfile.selectedOils.join(' / ')]
    );
  }
  summary.innerHTML = items.map(([label, value]) => `
    <div class="summary-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join('');
}

function updateServiceFields() {
  const serviceId = form.serviceId.value;
  const oilSelected = serviceId === 'essential-oil-product' || serviceId === 'soul-number-with-oil';
  const numberSelected = serviceId !== 'essential-oil-product';
  oilFields.hidden = !oilSelected;
  numberFields.hidden = !numberSelected;
  numberFields.querySelectorAll('input').forEach((input) => {
    input.required = numberSelected && input.name !== 'lunarDate';
  });
}

function buildOilProfile(payload) {
  return {
    displayName: payload.displayName || '精油產品',
    usageScenario: payload.usageScenario || '待確認',
    productType: payload.productType || '待確認',
    selectedOils: String(payload.selectedOils || '')
      .split(/[、,，/]/)
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

function buildObservations(payload) {
  return {
    mainIssue: payload.mainIssue || '',
    recentTransition: payload.recentTransition || '',
    repeatingPattern: payload.repeatingPattern || '',
    growthFocus: payload.growthFocus || '',
    excludedTopics: payload.excludedTopics || '',
    monthlyContext: payload.monthlyContext || '',
    clientDisplayName: payload.clientDisplayName || payload.displayName || '',
    approvedClientSummary: payload.approvedClientSummary || ''
  };
}

function setStatus(message) {
  status.textContent = message;
}

function getApiUrl() {
  return apiUrlInput.value.trim();
}

function restoreApiUrl() {
  const savedUrl = window.localStorage.getItem(API_URL_STORAGE_KEY);
  apiUrlInput.value = savedUrl || DEPLOYMENT_CONFIG.appsScriptApiUrl || '';
}

function saveApiUrl(apiUrl) {
  window.localStorage.setItem(API_URL_STORAGE_KEY, apiUrl);
}

async function postToAppsScript(apiUrl, body) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function downloadText(filename, text, type) {
  if (!text) return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderResourcePlan() {
  const stack = getRecommendedStack();
  const rules = getUsageSavingRules();
  const milestones = getStepByStepMilestones();
  resourcePlan.innerHTML = `
    <div class="resource-grid">
      ${[
        ['後端/API', stack.backend.primary],
        ['資料庫', stack.database.primary],
        ['檔案儲存', stack.storage.primary],
        ['前台/PWA', stack.frontend.primary],
        ['手機 App', stack.mobile.primary]
      ].map(([label, value]) => `
        <div class="summary-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join('')}
    </div>
    <h3>省用量規則</h3>
    <ol>${rules.map((rule) => `<li>${rule}</li>`).join('')}</ol>
    <h3>一步步完成</h3>
    <ol>${milestones.map((step) => `<li>${step}</li>`).join('')}</ol>
  `;
}
