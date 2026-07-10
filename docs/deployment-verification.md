# 部署驗證流程

這份文件只做一件事：確認免費版 v1 真的能交付，不只是本機能算。

## 必測 -1：離線部署包先驗證

在呼叫線上 Apps Script 前，先跑離線部署包檢查：

```powershell
npm run package:apps-script
npm run verify:apps-script
npm run package:static
npm run package:static:zip
npm run verify:static
```

這幾個指令不會呼叫 Apps Script，也不會寫入 Google Sheets 或 Drive。

如果卡在 `verify:apps-script`，代表 `dist/apps-script` 還不能拿去貼到 Apps Script，常見原因是部署包和來源檔不一致、`APP_VERSION` 不一致、`CONTENT_SPREADSHEET_ID` 空掉，或 `appsscript.json` Web App 權限不符合測試流程。

`appsscript.json` 必須包含 Apps Script 實際會用到的 OAuth scopes：Docs、Drive、Sheets 與 Script Properties。少了 Docs scope 時，`setup-workbook` 可能通過，但 `save-and-generate-report` 會在產生 Google Docs 報告時失敗。

如果卡在 `verify:static`，代表 `dist/static-site.zip` 還不能上傳，常見原因是 ZIP 缺檔、PWA 的 `manifest` / service worker / module import 路徑斷掉，或打包後的 `web/deployment-config.js` 沒有有效 Apps Script Web App URL。

你有沒有想過：如果只確認 ZIP 裡「看起來有檔案」，沒有檢查瀏覽器實際會走的 import 路徑，上線後才會變成白畫面或 service worker 安裝失敗。離線先擋掉這些錯，比到 Cloudflare 或 GitHub Pages 才查省時間。

## 驗證前先確認

1. Apps Script 已部署成 Web App。
2. `CONFIG.CONTENT_SPREADSHEET_ID` 指向你要用的 Google Sheets。
3. Web App 權限先用：
   - Execute as：你自己。
   - Who has access：測試期可用 Anyone with link。
4. PWA 的 `Apps Script API URL` 已貼上 Web App URL，或已由 `web/deployment-config.js` 預設帶入；若手動更換網址，記得按「儲存 URL」。

這樣做的風險是 Anyone with link 測試期比較寬。建議只在測試期使用，正式交付前再收緊權限或改成只在後台操作。

## 必測 0：初始化資料表與 Drive 權限

打開 Apps Script Web App 後台，先按「初始化/檢查資料表」。

確認回傳：

- `ok` 是 `true`。
- `個案資料表` 已建立，且 `missingHeaders` 是空陣列。
- `輸出紀錄` 已建立，且 `missingHeaders` 是空陣列。
- `reportFolderUrl` 有回傳 Google Drive 資料夾連結。
- `appVersion` 有回傳，PWA 顯示後台版本。

部署前的 `npm run predeploy` 會檢查 `package.json` 版本與 Apps Script `CONFIG.APP_VERSION` 是否一致。如果版本不一致，先不要部署。

如果這一步失敗，先不要測個案。這通常代表：

- `CONFIG.CONTENT_SPREADSHEET_ID` 填錯。
- Apps Script 還沒授權 Sheets 或 Drive。
- 目前帳號沒有該試算表的編輯權限。
- 線上 Web App 還不是剛剛貼上的 `dist/apps-script` 版本。

接著回到 PWA，按「檢查後台」。

確認：

- 狀態顯示「後台正常」。
- 沒有出現 `missingHeaders` 欄位缺漏。
- 有顯示後台版本，例如 `v0.1.0`。
- 如果出現 HTTP 錯誤，先檢查 Web App URL 是否是最新部署版本。

也可以用命令列一次驗證：

先只檢查初始化，不寫測試個案：

```powershell
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:deployment:setup
```

`APPS_SCRIPT_URL` 必須貼 Web App 部署網址，通常長得像 `https://script.google.com/macros/s/.../exec`。不要貼 Apps Script 編輯頁、部署管理頁、Google Drive 檔案頁，否則驗證腳本會直接停止。

如果你只想先確認 URL 格式，不想呼叫 Apps Script：

```powershell
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:deployment:url
```

這個指令只檢查網址格式，不會呼叫 Apps Script，也不會寫入 Google Sheets 或 Drive。

## 必測 0-1：精油待確認交付防呆

每次更新 Apps Script 後，不能只按儲存。必須到「部署」->「管理部署作業」-> 編輯目前 Web App 部署，版本選「新增版本」，再按部署。Apps Script 的編輯器儲存只更新專案檔，不會自動更新 Web App 對外版本。

部署後先跑：

```powershell
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:delivery-guard
```

這個指令會建立一筆 `DEPLOY-VERIFY` 測試個案，故意不填建議精油，再嘗試把 `deliveryStatus` 改成 `reviewed`。

通過時應看到：

```text
# delivery guard verification ok
```

如果失敗訊息是：

```text
delivery guard did not block reviewed status for pending oil recommendation
```

代表線上 Web App 還在跑舊版本。這時不要改公式，也不要改 Google Sheets；先回 Apps Script 確認是否真的建立並套用了新的部署版本。

如果失敗訊息包含：

```text
DocumentApp.create
https://www.googleapis.com/auth/documents
```

代表線上 Apps Script 還沒有 Docs 授權，或線上專案尚未套用含 `oauthScopes` 的新版 `appsscript.json`。這時先不要跑完整三服務驗證；請更新 Apps Script manifest、部署新版本，並用部署者帳號打開後台完成授權，再重跑 `npm run verify:delivery-guard`。

確認 setup-only 通過後，再做完整驗證：

```powershell
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:deployment
```

這個指令會執行 `setup-workbook`，再送出數字盤單項、精油單項、數字盤 + 精油搭配三筆測試資料。數字盤單項會刻意不送 `lunarDate`，用來確認直呼 Apps Script API 時仍會套用國曆轉農曆規則。它會真的寫入 Google Sheets 與 Drive，所以只在測試部署時使用，不要拿正式個案資料測。

若要確認公開 PWA 入口也對到同一個後台，可跑：

```powershell
npm run verify:pwa
```

這個指令會檢查 GitHub Pages、Cloudflare Pages、公開 `deployment-config.js` 與 Apps Script `setup-workbook`。它不會送出三服務測試資料，但 `setup-workbook` 仍可能補齊缺漏表頭或資料夾，所以只在部署驗證時使用。

測試資料的 `displayName` 會自動加上 `DEPLOY-VERIFY-...` 批次標記。驗證完成後，你可以在 `個案資料表`、`輸出紀錄` 與 Drive 輸出資料夾用這個前綴找到測試資料。

如果你想固定批次名稱：

```powershell
$env:DEPLOY_VERIFY_RUN_ID="DEPLOY-VERIFY-手動批次名稱"
$env:APPS_SCRIPT_URL="你的 Web App URL"
npm run verify:deployment
```

## 驗證後測試資料處理

不要讓系統自動刪測試資料。這樣做的風險是：一旦條件寫錯，可能刪到正式個案或交付檔。v1 採人工清理。

建議流程：

1. 第一次成功部署後，保留一組 `DEPLOY-VERIFY` 測試資料，作為上線證據。
2. 若同一天重跑多次，只保留最後一次成功的批次。
3. 清理時只處理 `displayName` 或檔名以 `DEPLOY-VERIFY` 開頭的資料。
4. `個案資料表`、`輸出紀錄`、Drive 輸出資料夾要一起檢查，不要只刪其中一邊。
5. 不確定是不是測試資料時，不刪，先改狀態或備註。

你有沒有想過：如果部署測試資料完全不留，之後出問題時會少一份「當時真的通過」的證據；如果全部都留，Sheets 和 Drive 很快變亂。保留最後一次成功批次，是比較省力也比較可追蹤的做法。

## 必測 1：數字盤單項

PWA 選：

- 服務類型：靈魂萬花筒數字盤
- 姓名/代稱：數字盤測試
- 國曆生日：1989-05-28
- 農曆生日：1989-04-24
- 出生時間：15:17

按「計算」後確認：

- 有陰曆主命數。
- 有陽曆主命數。
- 有木馬、貴人、流年、今年位格。
- 有 SVG 校對圖。
- 報告沒有精油產品建議段落。

按「送到後台」後確認：

- `個案資料表.serviceId` 是 `soul-number-reading`。
- `輸出紀錄.reportUrl` 有連結。
- `輸出紀錄.svgUrl` 有連結。

## 必測 2：精油單項

PWA 選：

- 服務類型：精油產品/配方
- 姓名/代稱：精油測試
- 使用情境：睡前放鬆
- 產品型態：滾珠
- 建議精油：乳香、岩蘭草、甜橙

按「計算」後確認：

- 不需要填生日。
- 沒有 SVG 校對圖。
- 報告有精油產品建議。
- 報告沒有主命數、木馬、流年段落。
- 報告沒有治療、治癒、保證改善等醫療宣稱。

按「送到後台」後確認：

- `個案資料表.serviceId` 是 `essential-oil-product`。
- `usageScenario`、`productType`、`selectedOils` 有寫入。
- `輸出紀錄.reportUrl` 有連結。
- `輸出紀錄.svgUrl` 可空白。

## 必測 3：數字盤 + 精油搭配

PWA 選：

- 服務類型：數字盤 + 精油搭配
- 姓名/代稱：組合測試
- 國曆生日：1991-09-23
- 農曆生日：1991-08-16
- 出生時間：11:17
- 使用情境：年度支持
- 產品型態：擴香
- 建議精油：乳香、真正薰衣草、檜木

按「計算」後確認：

- 先有數字盤結果。
- 再有精油產品建議。
- 報告必須出現「精油只作為支持層，不反推數字公式」。
- SVG 只反映數字盤，不使用精油資料反推位置。

按「送到後台」後確認：

- `個案資料表.serviceId` 是 `soul-number-with-oil`。
- `輸出紀錄.reportUrl` 有連結。
- `輸出紀錄.svgUrl` 有連結。

## 失敗時先查這 5 件事

1. Web App URL 是否貼錯。
2. Apps Script 是否部署的是最新版本。
3. `CONTENT_SPREADSHEET_ID` 是否是正確試算表。
4. 第一次執行是否已授權 Drive、Sheets 權限。
5. Google Sheets 是否出現新欄位：`serviceId`、`usageScenario`、`productType`、`selectedOils`、`serviceOutputStatus`。

## PWA 送出注意

PWA 送 Apps Script 時使用 `text/plain;charset=utf-8` 傳 JSON 字串，不使用 `application/json`。

原因：`application/json` 可能讓瀏覽器先送 CORS preflight，Apps Script Web App 不適合作為正式 CORS API 伺服器。v1 先用 simple request，減少免費部署階段的跨網域問題。

這樣做的風險是它不像正式 API 那麼標準。建議 v1 接受這個折衷；等真的需要公開客人端自助操作，再改成 Firebase/Supabase 或正式後端。

你有沒有想過：如果一開始就做客人自助登入，這些錯誤會變成客人在前台遇到。現在先用後台驗證，是比較省用量也比較省維護成本的做法。
