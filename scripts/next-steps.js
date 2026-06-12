import {
  getRecommendedStack,
  getStepByStepMilestones,
  getUsageSavingRules,
  getUpgradeTriggers
} from '../src/core/resource-plan.js';
import { listServices } from '../src/core/service-catalog.js';

const stack = getRecommendedStack();

console.log('# 靈魂萬花筒 v1 下一步');
console.log('\n## 免費架構');
console.log(`- 後端/API：${stack.backend.primary}`);
console.log(`- 資料庫：${stack.database.primary}`);
console.log(`- 檔案儲存：${stack.storage.primary}`);
console.log(`- 前台/PWA：${stack.frontend.primary}`);
console.log(`- 手機：${stack.mobile.primary}`);

console.log('\n## 服務模型');
listServices().forEach((service) => {
  console.log(`- ${service.name}：${service.canStandalone ? '可單獨使用' : '組合服務'}${service.isPrimary ? '，主服務' : ''}`);
});

console.log('\n## 省用量規則');
getUsageSavingRules().forEach((rule, index) => console.log(`${index + 1}. ${rule}`));

console.log('\n## 一步步完成');
getStepByStepMilestones().forEach((step, index) => console.log(`${index + 1}. ${step}`));
console.log('7. 每次開工先照 docs/operator-runbook.md 跑 npm run work:start 並確認試算表更新狀態。');
console.log('8. 照 docs/deployment-verification.md 驗證數字盤、精油單項、組合服務。');
console.log('9. 確認 PWA 按一次「送到後台」會回傳 reportUrl，含數字盤時也回傳 svgUrl。');
console.log('10. 每次收工跑 npm run work:shutdown，並保留凌晨 12:00 自動收工用量。');

console.log('\n## 何時才升級');
getUpgradeTriggers().forEach((trigger, index) => console.log(`${index + 1}. ${trigger}`));
