const apiUrl = process.env.APPS_SCRIPT_URL;
const args = process.argv.slice(2);
const setupOnly = process.env.DEPLOY_VERIFY_SETUP_ONLY === '1' || args.includes('--setup-only');
const validateUrlOnly = args.includes('--validate-url-only');
const deliveryGuardOnly = args.includes('--delivery-guard-only');
const runId = process.env.DEPLOY_VERIFY_RUN_ID || `DEPLOY-VERIFY-${new Date().toISOString().replace(/[:.]/g, '-')}`;

const serviceCases = [
  {
    label: '數字盤單項',
    payload: {
      serviceId: 'soul-number-reading',
      displayName: '數字盤部署測試',
      solarDate: '1989-05-28',
      // Intentionally omit lunarDate so direct Apps Script API calls must use F-007 lookup.
      birthTime: '15:17',
      queryDate: '2026-06-11'
    },
    expectSvg: true
  },
  {
    label: '精油單項',
    payload: {
      serviceId: 'essential-oil-product',
      displayName: '精油部署測試',
      usageScenario: '睡前放鬆',
      productType: '滾珠',
      selectedOils: '乳香、岩蘭草、甜橙'
    },
    expectSvg: false
  },
  {
    label: '數字盤 + 精油搭配',
    payload: {
      serviceId: 'soul-number-with-oil',
      displayName: '組合部署測試',
      solarDate: '1991-09-23',
      lunarDate: '1991-08-16',
      birthTime: '11:17',
      queryDate: '2026-06-11',
      usageScenario: '年度支持',
      productType: '擴香',
      selectedOils: '乳香、真正薰衣草、檜木'
    },
    expectSvg: true
  }
];

if (!apiUrl) {
  console.error('# verify deployment failed');
  console.error('- 缺少 APPS_SCRIPT_URL。');
  console.error('- 用法：$env:APPS_SCRIPT_URL="你的 Web App URL"; npm run verify:deployment');
  process.exit(1);
}

function validateApiUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('APPS_SCRIPT_URL 不是有效網址');
  }

  const isAppsScriptHost = parsed.hostname === 'script.google.com';
  const isWebAppPath = /^\/macros\/s\/[^/]+\/(exec|dev)$/.test(parsed.pathname);

  if (parsed.protocol !== 'https:' || !isAppsScriptHost || !isWebAppPath) {
    throw new Error('APPS_SCRIPT_URL 必須是 Apps Script Web App URL，格式通常是 https://script.google.com/macros/s/.../exec');
  }
}

function modeLabel() {
  if (validateUrlOnly) return 'validate-url-only';
  if (deliveryGuardOnly) return 'delivery-guard-only';
  if (setupOnly) return 'setup-only';
  return 'full';
}

function compactSnippet(text) {
  const title = text.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
  const errorMessage = text.match(/class="errorMessage"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const readable = errorMessage
    ? `${title} ${errorMessage}`
    : text;
  return readable
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

async function postToAppsScript(body) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '未回傳';
  const action = body.action || 'unknown-action';
  if (!response.ok) {
    throw new Error(`${action} HTTP ${response.status}，content-type: ${contentType}，response: ${compactSnippet(text)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${action} did not return JSON，content-type: ${contentType}，response: ${compactSnippet(text)}`);
  }
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

function validateSetupResult(result) {
  assertOk(result.ok === true, result.error || 'setup-workbook did not return ok');
  assertOk(Boolean(result.appVersion), 'setup-workbook did not return appVersion');
  assertOk(Array.isArray(result.sheets), 'setup-workbook did not return sheets');
  const missing = result.sheets.flatMap((sheet) => sheet.missingHeaders || []);
  assertOk(missing.length === 0, `missing sheet headers: ${missing.join(', ')}`);
  assertOk(Boolean(result.reportFolderUrl), 'setup-workbook did not return reportFolderUrl');
}

function validateDeliveryResult(result, expected) {
  assertOk(result.ok === true, result.error || `${expected.label} did not return ok`);
  assertOk(result.serviceId === expected.payload.serviceId, `${expected.label} returned wrong serviceId`);
  assertOk(Boolean(result.caseId), `${expected.label} missing caseId`);
  assertOk(Boolean(result.reportUrl), `${expected.label} missing reportUrl`);
  if (expected.expectSvg) {
    assertOk(Boolean(result.svgUrl), `${expected.label} missing svgUrl`);
  } else {
    assertOk(!result.svgUrl, `${expected.label} should not create svgUrl`);
  }
}

function validateDeliveryGuardResult(result) {
  assertOk(result.ok === false, 'delivery guard did not block reviewed status for pending oil recommendation');
  assertOk(result.error === 'delivery is not ready', 'delivery guard returned unexpected error');
  assertOk(Array.isArray(result.issues), 'delivery guard did not return issues');
  assertOk(
    result.issues.some((issue) => issue.includes('精油段落仍是待確認')),
    'delivery guard did not report pending oil recommendation'
  );
}

function buildPayload(payload) {
  return {
    ...payload,
    displayName: `${runId}-${payload.displayName}`
  };
}

async function main() {
  validateApiUrl(apiUrl);
  if (validateUrlOnly) {
    console.log('# deployment url ok');
    console.log('- APPS_SCRIPT_URL 格式符合 Apps Script Web App。');
    console.log('- validate-url-only 模式未呼叫 Apps Script，也未寫入 Google Sheets 或 Drive。');
    return;
  }

  console.log('# deployment verification');
  console.log(`- mode: ${modeLabel()}`);
  console.log(`- runId: ${runId}`);
  console.log('- setup-workbook');
  validateSetupResult(await postToAppsScript({ action: 'setup-workbook' }));
  if (deliveryGuardOnly) {
    console.log('- delivery guard');
    const pendingOilCase = buildPayload({
      serviceId: 'soul-number-with-oil',
      displayName: '精油待確認防呆測試',
      solarDate: '1989-05-28',
      lunarDate: '1989-04-24',
      birthTime: '15:17',
      queryDate: '2026-06-15',
      usageScenario: '身體按摩油',
      productType: '身體按摩油',
      selectedOils: ''
    });
    const delivery = await postToAppsScript({
      action: 'save-and-generate-report',
      payload: pendingOilCase
    });
    validateDeliveryResult(delivery, {
      label: '精油待確認防呆測試',
      payload: pendingOilCase,
      expectSvg: true
    });
    const reviewed = await postToAppsScript({
      action: 'update-delivery-status',
      payload: {
        token: delivery.token,
        deliveryStatus: 'reviewed'
      }
    });
    if (reviewed.ok === true) {
      await postToAppsScript({
        action: 'update-delivery-status',
        payload: {
          token: delivery.token,
          deliveryStatus: 'draft'
        }
      });
    }
    validateDeliveryGuardResult(reviewed);
    console.log('# delivery guard verification ok');
    console.log(`- 測試 token：${delivery.token}`);
    console.log('- 精油建議待確認時，線上後台已拒絕 reviewed 狀態。');
    return;
  }
  if (setupOnly) {
    console.log('# deployment verification ok');
    console.log('- setup-workbook ok');
    console.log('- appVersion ok');
    console.log('- setup-only 模式未寫入測試個案或 Drive 報告檔');
    return;
  }

  const results = [];

  for (const item of serviceCases) {
    console.log(`- ${item.label}`);
    const payload = buildPayload(item.payload);
    const result = await postToAppsScript({
      action: 'save-and-generate-report',
      payload
    });
    validateDeliveryResult(result, { ...item, payload });
    results.push({ label: item.label, caseId: result.caseId, reportUrl: result.reportUrl, svgUrl: result.svgUrl || '' });
  }

  console.log('# deployment verification ok');
  console.log(`- 測試批次：${runId}`);
  console.log('- setup-workbook ok');
  console.log('- appVersion ok');
  console.log('- 三種服務皆已產生 reportUrl');
  console.log('- 數字盤服務皆已產生 svgUrl，精油單項未產生 svgUrl');
  results.forEach((result) => {
    console.log(`- ${result.label}：${result.caseId}`);
  });
}

main().catch((error) => {
  console.error('# deployment verification failed');
  console.error(`- ${error.message}`);
  process.exit(1);
});
