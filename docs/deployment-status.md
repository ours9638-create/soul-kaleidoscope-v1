# 目前部署狀態

更新日期：2026-06-11

## Apps Script Web App

- 狀態：已部署並完成完整驗證
- Web App URL：`https://script.google.com/macros/s/AKfycbyBWz4po4qAiJtTannRhFFYc0ShBLWaO_FART2ndulub0fLlN0eaFBwot-wlMHgXgxd/exec`
- 版本：`v0.1.0`
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
- caseId：`Cloudflare真實測試-2026-06-14-1989-05-28-1989-04-24-15-17`
- reportUrl：`https://drive.google.com/file/d/1T6zxknoEhuVR2vqjMy51gH3fYAwXPEbX/view?usp=drivesdk`
- svgUrl：`https://drive.google.com/file/d/1E4NL1FQKe_RKDJ-Xn4ePmqUxOFhBonjn/view?usp=drivesdk`
- 備註：瀏覽器分頁連線逾時，改用 Cloudflare PWA 相同的 Apps Script `save-and-generate-report` 請求格式送出。

## 下一步

1. 人工打開 `reportUrl` 與 `svgUrl`，確認內容可讀、圖像位置正確。
2. 檢查 Google Sheets 的 `個案資料表` 與 `輸出紀錄` 是否符合實際工作習慣。
3. 若要做正式交付，先人工校對 SVG 與報告，不要直接交給客人。
