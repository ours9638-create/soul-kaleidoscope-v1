# 目前部署狀態

更新日期：2026-06-14

## Apps Script Web App

- 狀態：已部署並完成完整驗證
- Web App URL：`https://script.google.com/macros/s/AKfycbyBWz4po4qAiJtTannRhFFYc0ShBLWaO_FART2ndulub0fLlN0eaFBwot-wlMHgXgxd/exec`
- 版本：`v0.1.0`
- Apps Script 部署版本：`6 版 (2026年6月14日晚上8:41)`
- 權限：
  - Execute as：部署者本人
  - Who has access：所有人

## 已完成驗證

- `npm run verify:deployment:url`
- `npm run verify:deployment:setup`
- `npm run verify:deployment`
- PWA 本機預覽按「檢查後台」成功

完整驗證批次：

- `DEPLOY-VERIFY-2026-06-11T13-46-44-349Z`

驗證結果：

- 數字盤單項可產生 `reportUrl` 與 `svgUrl`
- 精油單項可產生 `reportUrl`，不產生 `svgUrl`
- 數字盤 + 精油搭配可產生 `reportUrl` 與 `svgUrl`
- 2026-06-14 追加驗證：`GET action=case` 可讀回真實測試個案，出生時間正確保留為 `15:17`
- 2026-06-14 追加驗證：`GET action=report` 可讀到測試姓名、報告文字檔連結與 SVG 校對圖連結
- 2026-06-14 追加驗證：Drive 預覽確認 `reportUrl` 是 `_report.md`，`svgUrl` 是 `_checklist.svg`
- 2026-06-14 追加驗證：Google Sheets `個案資料表` 與 `輸出紀錄` 都有 Cloudflare 真實測試個案紀錄
- 2026-06-14 追加驗證：重送同一 `caseId + serviceId` 會回傳 `duplicateCaseWarning`，不再安靜新增重複個案列
- 2026-06-14 追加驗證：`輸出紀錄` 已新增 `deliveryStatus` 欄位，表頭順序為 `status` 後接 `deliveryStatus`

## PWA 串接

- `web/deployment-config.js` 已內建 Web App URL
- PWA 第一次開啟會自動帶入 URL
- 若重新部署 Apps Script，要同步更新 `web/deployment-config.js`

## GitHub Pages

- 狀態：已部署並驗證公開頁可用
- GitHub repo：`https://github.com/ours9638-create/soul-kaleidoscope-v1`
- 公開 PWA：`https://ours9638-create.github.io/soul-kaleidoscope-v1/web/`
- 驗證結果：
  - 公開頁 HTTP 200
  - PWA 可本機計算
  - `Apps Script API URL` 自動帶入
  - 按「檢查後台」成功回傳 `後台正常｜v0.1.0`

## Cloudflare Pages

- 狀態：已上傳並驗證公開頁可用
- 公開 PWA：`https://soul-kaleidoscope-v1.ours9638.workers.dev/`
- 可上傳檔案：`dist/static-site.zip`
- 上傳前檢查：`npm run verify:static`
- 驗證結果：
  - PWA 可本機計算
  - `Apps Script API URL` 自動帶入
  - 按「檢查後台」成功回傳 `後台正常｜v0.1.0`

## 真實測試個案

- 狀態：已送出數字盤測試個案
- 測試名稱：`Cloudflare真實測試-2026-06-14`
- caseId：`[REDACTED_TEST_CASE_ID]`
- reportUrl：`[REDACTED_DRIVE_URL]`
- svgUrl：`[REDACTED_DRIVE_URL]`
- 備註：瀏覽器分頁連線逾時，改用 Cloudflare PWA 相同的 Apps Script `save-and-generate-report` 請求格式送出。
- 讀回驗證：`GET action=case` 已確認 `birthTime = 15:17`，避免 Google Sheets 時間欄位轉成 `07:17`。
- Drive 檔案驗證：`reportUrl` 預覽為 Markdown 報告，`svgUrl` 預覽為 SVG 校對圖。
- Sheets 驗證：`個案資料表` 有一列測試個案，`輸出紀錄` 有對應 token、reportUrl、svgUrl。

## 已知資料問題

- `個案資料表` 內 `[REDACTED_CASE_ID]` 曾出現重複組合服務紀錄。
- 風險：同一個案重複送出會產生多份報告與多筆輸出紀錄，後續人工查找容易混淆。
- 已處理：Apps Script 第 4 版已新增重複個案列提醒；同一 `caseId + serviceId` 已存在時，會略過 `個案資料表` 寫入並回傳 `duplicateCaseWarning`。
- 尚未處理：重新產出報告仍會新增 `輸出紀錄`，之後若需要版本管理，再新增「重新產出版本」欄位。

## 交付狀態

- `輸出紀錄.deliveryStatus` 預設為 `draft`。
- 人工核對通過後，才可改成 `reviewed` 或 `delivered`。
- 這個欄位目前是人工流程欄位，不會自動判定報告是否可交付。

## 下一步

1. 下一份正式個案先用 `docs/delivery-checklist.md` 跑完整人工核對。
2. 核對通過後，把 `deliveryStatus` 從 `draft` 改成 `reviewed` 或 `delivered`。
3. 若要自動化狀態更新，再新增 Apps Script 後台按鈕，不要直接讓客人端修改。
