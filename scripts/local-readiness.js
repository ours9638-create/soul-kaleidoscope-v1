import { spawnSync } from 'node:child_process';

const commands = [
  ['npm test', '測試核心公式、服務、報告、UI 與流程'],
  ['npm run check', '檢查 JavaScript 與 Apps Script 語法'],
  ['npm run predeploy', '檢查免費部署必要檔案與版本一致'],
  ['npm run package:apps-script', '產出 Apps Script 部署包'],
  ['npm run verify:apps-script', '檢查 Apps Script 部署包內容、版本與來源一致'],
  ['npm run package:static', '產出 PWA 靜態網站部署包'],
  ['npm run package:static:zip', '產出 Cloudflare Pages 手動上傳 ZIP'],
  ['npm run verify:static', '檢查 PWA ZIP 是否包含必要檔案與後台 URL']
];

console.log('# 本機交付門檻');

for (const [display, description] of commands) {
  console.log(`\n## ${display}`);
  console.log(`- 用途：${description}`);

  const result = spawnSync(display, {
    shell: true,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error('\n# readiness failed');
    console.error(`- 失敗指令：${display}`);
    process.exit(result.status || 1);
  }
}

console.log('\n# readiness ok');
console.log('- 本機測試、語法檢查、部署前檢查與靜態/Apps Script 部署包都已通過。');
console.log('- 下一步若要驗證線上部署，設定 APPS_SCRIPT_URL 後先跑 npm run verify:deployment:setup。');
