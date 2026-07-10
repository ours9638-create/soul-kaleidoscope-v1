const publicTargets = [
  {
    label: 'GitHub Pages',
    pageUrl: 'https://ours9638-create.github.io/soul-kaleidoscope-v1/web/',
    configUrl: 'https://ours9638-create.github.io/soul-kaleidoscope-v1/web/deployment-config.js'
  },
  {
    label: 'Cloudflare Pages',
    pageUrl: 'https://soul-kaleidoscope-v1.ours9638.workers.dev/web/',
    configUrl: 'https://soul-kaleidoscope-v1.ours9638.workers.dev/web/deployment-config.js'
  },
  {
    label: 'Cloudflare root',
    pageUrl: 'https://soul-kaleidoscope-v1.ours9638.workers.dev/',
    configUrl: 'https://soul-kaleidoscope-v1.ours9638.workers.dev/web/deployment-config.js'
  }
];

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

function validateAppsScriptUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:'
    && parsed.hostname === 'script.google.com'
    && /^\/macros\/s\/[^/]+\/exec$/.test(parsed.pathname);
}

async function readText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();
  assertOk(response.ok, `${url} HTTP ${response.status}`);
  return { response, text };
}

function extractApiUrl(configText) {
  return configText.match(/appsScriptApiUrl:\s*'([^']+)'/)?.[1] || '';
}

async function postSetup(apiUrl) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'setup-workbook' })
  });
  const text = await response.text();
  assertOk(response.ok, `setup-workbook HTTP ${response.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`setup-workbook did not return JSON: ${text.slice(0, 200)}`);
  }
}

async function main() {
  const failures = [];
  const apiUrls = new Set();

  console.log('# public PWA verification');
  for (const target of publicTargets) {
    try {
      const page = await readText(target.pageUrl);
      assertOk(page.text.includes('靈魂萬花筒'), `${target.label} page missing app title`);
      assertOk(page.text.includes('./app.js') || page.text.includes('./web/'), `${target.label} page missing app entry`);

      const config = await readText(target.configUrl);
      const apiUrl = extractApiUrl(config.text);
      assertOk(validateAppsScriptUrl(apiUrl), `${target.label} config missing valid Apps Script URL`);
      apiUrls.add(apiUrl);
      console.log(`- ${target.label}: page HTTP ${page.response.status}, config HTTP ${config.response.status}`);
    } catch (error) {
      failures.push(`${target.label}: ${error.message}`);
    }
  }

  if (apiUrls.size !== 1) {
    failures.push(`公開 PWA 的 Apps Script URL 不一致：${[...apiUrls].join(', ') || 'none'}`);
  }

  if (failures.length === 0) {
    const [apiUrl] = apiUrls;
    try {
      const setup = await postSetup(apiUrl);
      assertOk(setup.ok === true, setup.error || 'setup-workbook did not return ok');
      assertOk(Boolean(setup.appVersion), 'setup-workbook missing appVersion');
      assertOk(Boolean(setup.reportFolderUrl), 'setup-workbook missing reportFolderUrl');
      console.log(`- Apps Script setup: ok, version ${setup.appVersion}`);
    } catch (error) {
      failures.push(`Apps Script setup: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error('# public PWA verification failed');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('# public PWA verification ok');
  console.log('- GitHub Pages / Cloudflare Pages 入口可載入');
  console.log('- 公開 deployment-config.js 指向同一個 Apps Script Web App');
  console.log('- Apps Script setup-workbook 可回應');
}

main().catch((error) => {
  console.error('# public PWA verification failed');
  console.error(`- ${error.message}`);
  process.exit(1);
});
