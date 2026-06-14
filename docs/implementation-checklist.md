# 執行檢查清單

## A. 本機確認

- [ ] 若 `.workflow/active-session.json` 存在，先執行 `npm run work:shutdown`
- [ ] 開工後先執行 `npm run work:start`
- [ ] 讀 `.workflow/start-report.md`
- [ ] 若 `.workflow/start-report.md` 顯示試算表更新，用 Google Drive / Google Sheets 讀取重點表格內容
- [ ] 照 `docs/operator-runbook.md` 判斷更新屬於公式、欄位、圖像、精油或文案
- [ ] 在 `soul-kaleidoscope-v1` 執行 `npm run readiness`
- [ ] 用 `python -m http.server 8080` 開啟本機伺服器
- [ ] 打開 `http://localhost:8080/web/`
- [ ] 確認畫面有計算結果、SVG、報告草稿、免費資源架構

## B. Apps Script 部署

- [x] 建立 Apps Script 專案
- [x] 確認已執行 `npm run readiness`
- [x] 打開 `dist/apps-script/README.md`，確認版本與 SHA-256 核對表
- [x] 貼上 `dist/apps-script/Code.gs`
- [x] 新增 `Admin.html`
- [x] 貼上 `dist/apps-script/Admin.html`
- [x] 專案設定貼上 `dist/apps-script/appsscript.json`
- [x] 確認 `CONFIG.CONTENT_SPREADSHEET_ID`
- [x] 部署成 Web App
- [x] 複製 Web App URL
- [x] 執行 `npm run verify:deployment:url`
- [x] 執行 `npm run verify:deployment:setup`
- [x] 打開 Web App 後台，按「初始化/檢查資料表」
- [x] 確認 `個案資料表`、`輸出紀錄`、Drive 輸出資料夾都建立成功
- [x] PWA 按「檢查後台」，確認後台版本與 `dist/apps-script/README.md` 一致

## C. 串接 PWA

- [x] 在 PWA 貼上 Apps Script API URL，或由 `web/deployment-config.js` 自動帶入
- [x] 按「計算」
- [x] GitHub Pages 公開 PWA 可載入
- [x] GitHub Pages 公開 PWA 按「檢查後台」成功
- [x] Cloudflare Pages 公開 PWA 可載入
- [x] Cloudflare Pages 公開 PWA 按「檢查後台」成功
- [x] 按「送到後台」送出真實測試個案
- [x] 重新部署 Apps Script 第 3 版，修正 Sheets 讀回日期/時間格式
- [x] 用 `GET action=case` 讀回真實測試個案，確認 `birthTime = 15:17`
- [x] 用 `GET action=report` 確認只讀報告頁可讀到報告與 SVG 連結
- [x] 回 Google Sheets 檢查 `個案資料表`
- [x] 檢查 `輸出紀錄`
- [x] 重新部署 Apps Script 第 4 版，新增重複 `caseId + serviceId` 提醒
- [x] 重送同一個案時確認回傳 `duplicateCaseWarning`
- [x] 確認回傳 `reportUrl`
- [x] 若服務包含數字盤，確認回傳 `svgUrl`

## C2. 三種服務部署驗證

- [x] 執行 `npm run verify:deployment`
- [x] 數字盤單項：`serviceId = soul-number-reading`
- [x] 精油單項：`serviceId = essential-oil-product`，不需要生日
- [x] 組合服務：`serviceId = soul-number-with-oil`
- [x] 精油報告不得出現醫療宣稱
- [x] 組合報告不得讓精油反推數字公式
- [x] 詳細步驟照 `docs/deployment-verification.md`

## D. 第一份個案交付

- [ ] 輸入個案資料
- [ ] 產出 reportUrl 與必要的 svgUrl
- [ ] 打開 `docs/delivery-checklist.md`
- [ ] 依交付核對表檢查資料、數字、SVG、報告、Drive 與 Sheets
- [ ] 若有 `duplicateCaseWarning`，確認是重產報告還是誤送
- [ ] 人工校對通過後再交付

## E. 每次新增出圖組合

- [ ] 先寫清楚圖像用途
- [ ] 定義需要哪些欄位
- [ ] 定義每個欄位在圖上的位置
- [ ] 新增模板
- [ ] 新增測試
- [ ] 先產出校對版，不直接做美術版

## F. 升級前檢查

- [ ] 是否連續 30 天都有真實使用？
- [ ] 是否已交付至少 10 份個案？
- [ ] Sheets 是否真的開始難維護？
- [ ] 客人自助登入是否已經必要？
- [ ] 是否有付費需求支撐維護成本？

如果以上多數是否，先不要升級。

## G. 收工流程

- [ ] 收工前執行 `npm run work:shutdown`
- [ ] 確認 `.workflow/work-log.md` 有新增紀錄
- [ ] 若當天有開工，凌晨 12:00 也要執行一次收工流程
- [ ] 每日用量要保留足夠完成凌晨 12:00 的收工程序
