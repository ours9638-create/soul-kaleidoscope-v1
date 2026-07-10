# 免費部署步驟

## 0. 部署前本機檢查

先在 `soul-kaleidoscope-v1` 執行：

```bash
npm run work:start
npm run readiness
```

`npm run readiness` 會跑測試、語法檢查、部署前檢查，並產生與驗證 `dist/apps-script`、`dist/static-site`、`dist/static-site.zip`。這樣做的風險是一次跑完比較久。建議部署前用它，因為它能在你打開 Apps Script 之前先抓到缺檔、API 沒接好、服務 ID 漏掉、部署包和來源檔不同步這類低級錯誤，省掉 Google 配額與手動排查時間。

若 `npm run work:start` 顯示試算表有更新，先照 `docs/operator-runbook.md` 判斷更新類型，再部署。不要在公式或欄位不確定時上線。

## 1. Apps Script

1. 到 Google Drive 建立 Apps Script 專案。
2. 執行 `npm run package:apps-script`，產生 `dist/apps-script`。
3. 執行 `npm run verify:apps-script`，確認部署包和來源檔一致，版本、Web App manifest 與 SHA-256 清單都可用。
4. 打開 `dist/apps-script/README.md`，確認版本、五個檔案、大小與 SHA-256 核對表都有產生。
5. 把 `dist/apps-script/Code.gs` 貼到 Apps Script 的 `Code.gs`。
6. 新增指令碼檔 `InterpretationData`，貼上 `dist/apps-script/InterpretationData.gs`；缺少此檔會讓解讀查詢失敗。
7. 新增指令碼檔 `LunarCalendarData`，貼上 `dist/apps-script/LunarCalendarData.gs`；缺少此檔會讓後台直呼 API 時無法自動換算農曆。
8. 新增 HTML 檔 `Admin`，貼上 `dist/apps-script/Admin.html`。
9. 專案設定中貼上 `dist/apps-script/appsscript.json` 的設定。
10. 確認 `CONFIG.CONTENT_SPREADSHEET_ID` 是你要寫入個案資料與輸出紀錄的表。
11. 部署成 Web App。
12. 權限建議：
   - Execute as：你自己。
   - Who has access：先用 Anyone with link 測試，正式前再收緊。
13. 打開 Web App 後台，先按「初始化/檢查資料表」。
14. 確認 `個案資料表`、`輸出紀錄`、Drive 輸出資料夾都建立成功。
15. 回到 PWA 按「檢查後台」，確認顯示的後台版本和 `dist/apps-script/README.md` 一致。

如果後續 `save-and-generate-report` 回報缺少 `DocumentApp.create` 權限，代表 Apps Script manifest 沒有套用新版 OAuth scopes，或部署者還沒重新授權。先補 `dist/apps-script/appsscript.json`，部署新版本，再打開 Web App 後台觸發授權。

## 2. PWA 靜態網站

免費選項：

- GitHub Pages：適合長期放公開前台。
- Cloudflare Pages：部署快，也有免費網域。

詳細操作與取捨看 `docs/static-hosting.md`。

先產生靜態部署包：

```bash
npm run package:static
npm run package:static:zip
npm run verify:static
```

部署時請上傳或指定這個資料夾：

- `dist/static-site`
- 或直接上傳 `dist/static-site.zip`

原因：`web/app.js` 會直接 import `src/core` 裡的共享公式邏輯，只部署 `web/` 會讓正式網站讀不到核心模組。

## 3. 使用方式

1. 開啟 PWA。
2. 輸入個案。
3. 先按「計算」確認本機結果。
4. Apps Script 部署後，把 Web App URL 填入 API URL，按「儲存 URL」。
5. 先按「檢查後台」，確認資料表欄位與 Drive 資料夾正常。
6. 按「送到後台」一次完成：
   - 寫入 `個案資料表`。
   - 產生報告文字檔。
   - 若服務包含數字盤，產生 SVG 校對圖。
   - 寫入 `輸出紀錄`。
   - 回傳報告與圖像連結。

## 4. 上線前檢查

- 用 `1989-05-28 / 1989-04-24 / 15:17` 驗算。
- 用 `1991-09-23 / 1991-08-16 / 11:17` 驗算。
- 用精油單項服務確認不用填生日也能產出報告。
- SVG 中心左陰、中心右陽不可顛倒。
- 木馬一二三四位置不可顛倒。
- 報告不得有醫療宣稱。
- 完整部署驗證請照 `docs/deployment-verification.md` 做三種服務測試。

拿到 Apps Script Web App URL 後，可用命令列做一次完整部署驗證：

```powershell
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:deployment:url
npm run verify:deployment:setup
npm run verify:deployment
```

`APPS_SCRIPT_URL` 要貼 Web App 的 `/exec` 網址，不要貼 Apps Script 編輯頁或 Google Drive 檔案頁。
