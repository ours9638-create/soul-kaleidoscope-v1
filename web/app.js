import { calculateCase } from '../src/core/numerology.js';
import { buildImageChecklist } from '../src/core/templates.js';
import { renderChecklistSvg } from '../src/core/svg.js';
import { buildServiceReport, validateReportSafety } from '../src/core/report.js';
import { getRecommendedStack, getStepByStepMilestones, getUsageSavingRules } from '../src/core/resource-plan.js';
import { isOilService } from '../src/core/service-catalog.js';
import { DEPLOYMENT_CONFIG } from './deployment-config.js';

const state = {
  result: null,
  checklist: null,
  svg: '',
  report: '',
  installPrompt: null
};

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
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.apiUrl;
  setStatus('送出中');
  try {
    const data = await postToAppsScript(apiUrl, { action: 'save-and-generate-report', payload });
    if (data.ok === false) {
      setStatus(data.error);
      return;
    }
    const links = [
      data.reportUrl ? `報告：${data.reportUrl}` : '',
      data.svgUrl ? `SVG：${data.svgUrl}` : ''
    ].filter(Boolean).join('｜');
    setStatus(links ? `已產生交付連結｜${links}` : '已送到後台');
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
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.apiUrl;
  const serviceId = payload.serviceId || 'soul-number-reading';
  const oilProfile = buildOilProfile(payload);
  const needsNumber = serviceId !== 'essential-oil-product';
  state.result = needsNumber ? calculateCase(payload) : null;
  state.checklist = needsNumber ? buildImageChecklist('soul-kaleidoscope', state.result) : null;
  state.svg = state.checklist ? renderChecklistSvg(state.checklist) : '';
  state.report = buildServiceReport(serviceId, {
    caseResult: state.result,
    checklist: state.checklist,
    oilProfile
  });
  const safety = validateReportSafety(state.report);

  renderSummary(serviceId, state.result, oilProfile);
  svgPreview.innerHTML = state.svg || '<p class="empty-state">精油單項服務不需要數字盤 SVG。</p>';
  reportPreview.textContent = state.report;
  setStatus(safety.ok ? '已完成本機計算' : `報告語氣需檢查：${safety.hits.join(', ')}`);
}

function renderSummary(serviceId, result, oilProfile) {
  const items = [];
  if (result) {
    const annual = result.annual.afterBirthday;
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
    input.required = numberSelected;
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
