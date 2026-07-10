# 目前部署狀態

更新日期：2026-07-01

## 2026-07-01 部署驗證續查

- 本機 Apps Script 部署包：已重新產生並通過 `npm run verify:apps-script`。
- 本機 static-site 部署包：已重新產生並通過 `npm run verify:static`。
- Apps Script URL 格式：`npm run verify:deployment:url` 通過。
- Apps Script setup：`npm run verify:deployment:setup` 通過。
- 曾卡住的位置：`npm run verify:delivery-guard` 在 `save-and-generate-report` 階段失敗，線上 Apps Script 回 HTML 錯誤頁，不是 JSON。
- 直接診斷結果：線上 Web App 缺少 `DocumentApp.create` 權限，必要 scope 是 `https://www.googleapis.com/auth/documents`。
- 已補本機修正：`apps-script/appsscript.json` 已加入 Docs、Drive、Sheets、Script Properties OAuth scopes；`dist/apps-script/appsscript.json` 已重新產生。
- 重新部署並授權後，`npm run verify:delivery-guard` 已通過。
- delivery guard 使用一次性測試 token；token 不納入版本控制。
- 完整三服務驗證已通過，測試批次：`DEPLOY-VERIFY-2026-07-01T09-49-15-904Z`。
- 驗證結果：數字盤單項與組合服務皆產生 `reportUrl`、`svgUrl`；精油單項產生 `reportUrl` 且不產生 `svgUrl`。
- 公開 PWA 檢查：`npm run verify:pwa` 已通過。GitHub Pages、Cloudflare Pages `/web/`、Cloudflare root 皆 HTTP 200；公開 `deployment-config.js` 指向同一個 Apps Script URL；Apps Script `setup-workbook` 回 `ok=true`、版本 `0.1.0`。

## Apps Script Web App

- 狀態：已部署並完成完整驗證
- Web App URL：`https://script.google.com/macros/s/AKfycbyBWz4po4qAiJtTannRhFFYc0ShBLWaO_FART2ndulub0fLlN0eaFBwot-wlMHgXgxd/exec`
- 版本：`v0.1.0`
- Apps Script 部署版本：`14 版 (2026年6月18日晚上8:34)`
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
- 2026-06-15 追加驗證：Apps Script 後台/API 可用 token 更新 `deliveryStatus`，測試 token 已更新為 `reviewed`
- 2026-06-15 人工核對：Apps Script 後台已顯示「交付狀態」表單，使用者確認畫面 OK
- 2026-06-15 追加驗證：Apps Script 第 8 版已部署，保留原 Web App URL，`verify:deployment:url` 與 `verify:deployment:setup` 通過
- 2026-06-15 追加驗證：第 8 版修正 Apps Script SVG 固定座標輸出，並在報告補回流年與今年位格
- 2026-06-18 追加部署：第 14 版已部署，保留原 Web App URL；新增 `fileIds` 篩選，只讀取開工掃描中新增與修改的 Drive 檔案
- 2026-06-18 追加驗證：清除 DNS 快取後，health 回傳 HTTP 200；空篩選回傳 `readTargetCount = 0`，單檔篩選回傳 `readTargetCount = 1` 且讀取成功

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

## 測試與個案資料

- 測試與正式個案的名稱、生日、caseId、token、Drive 連結及輸出連結不得寫入版本控制。
- 歷史驗證已確認 `birthTime` 時區讀回、報告與 SVG 輸出，以及重複個案提醒流程。
- 已知限制：重新產出報告仍可能新增輸出紀錄；需要版本治理時另行處理。

## 交付狀態

- `輸出紀錄.deliveryStatus` 預設為 `draft`。
- 人工核對通過後，才可改成 `reviewed` 或 `delivered`。
- 狀態更新由 Apps Script 後台/API 以 token 執行，不開放客人端修改。
- 這個欄位仍是人工流程欄位，不會自動判定報告是否可交付。

## 下一步

1. 下一份正式個案先用 `docs/delivery-checklist.md` 跑完整人工核對。
2. 核對通過後，用後台「交付狀態」表單把 `deliveryStatus` 從 `draft` 改成 `reviewed` 或 `delivered`。
3. 若要進入正式個案交付，需要先確認個案資料，不要沿用測試資料。
