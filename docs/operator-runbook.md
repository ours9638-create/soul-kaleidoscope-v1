# 操作手冊

這份文件是每天實際操作用的 SOP。原則是：先確認資料來源，再改系統；先用免費工具跑通，再升級。

## 1. 每次開工

先進到 `soul-kaleidoscope-v1`，執行：

```bash
npm run work:start
```

如果它提示「上次開工尚未收工」，先執行：

```bash
npm run work:closeout
```

再重新執行 `npm run work:start`。

這樣做的風險是多一個步驟。建議保留，因為你會持續更新 Google Drive 裡的試算表；不先讀更新狀態，後面很容易拿舊公式或舊欄位做判斷。

## 2. 試算表更新判斷

開工後先讀：

- `.workflow/start-report.md`
- `config/google-sheets-registry.json`
- `docs/google-sheets-live-check.md`

如果 `.workflow/start-report.md` 顯示試算表沒有更新：

- 不主動讀整份線上表格。
- 直接依目前任務繼續。

如果顯示試算表有更新：

- 先依 `config/google-sheets-registry.json` 讀 metadata。
- 只讀跟當前任務有關的重點分頁。
- 先判斷更新屬於公式、內容、精油、圖像、報告文案或個案欄位。

你有沒有想過：如果內容資料庫只是新增精油文案，卻直接改核心公式，會讓已驗證的數字盤結果跟著變動。這是目前最大風險，所以更新要先分類。

## 3. 衝突判斷

遇到更新時，照這個順序判斷：

1. 公式更新：檢查 `src/core/numerology.js` 和公式測試。
2. 欄位更新：檢查 `apps-script/Code.gs`、`docs/sheets-schema.md` 和 PWA 送出欄位。
3. 圖像規則更新：檢查 `src/core/templates.js`、`src/core/svg.js` 和 SVG 測試。
4. 精油內容更新：檢查報告文字與安全邊界，不反推數字公式。
5. 只是文案更新：優先改報告模板或文件，不動核心計算。

## 4. 每次改完先跑

```bash
npm run readiness
```

`npm run readiness` 會依序執行：

- `npm test`
- `npm run check`
- `npm run predeploy`
- `npm run package:apps-script`
- `npm run package:static`

這樣做的風險是一次跑完會比單跑某個指令久。建議部署前用這個總門檻；只改文件或只查資料時，可以單跑對應檢查，避免浪費用量。

## 5. 免費部署順序

1. 先跑 `npm run package:apps-script`。
2. 用 `dist/apps-script` 內的檔案部署 Apps Script。
3. 再部署 `dist/static-site` 到 GitHub Pages，或把 `dist/static-site.zip` 上傳到 Cloudflare Pages，細節照 `docs/static-hosting.md`。
4. 若手動上傳 Cloudflare Pages，先跑 `npm run verify:static` 確認 ZIP 內有 PWA、核心模組與後台 URL。
5. 在 PWA 確認 Apps Script Web App URL 已由 `web/deployment-config.js` 帶入；若要改用新部署網址，再手動貼上並按「儲存 URL」。
6. 先按「檢查後台」，確認資料表與 Drive 權限正常。
7. 照 `docs/deployment-verification.md` 測三種服務：
   - 靈魂萬花筒數字盤
   - 精油產品/配方
   - 數字盤 + 精油搭配
7. 若已拿到 Web App URL，先設定 `APPS_SCRIPT_URL` 跑 `npm run verify:deployment:url`，只檢查 URL 格式、不呼叫 Apps Script。接著跑 `npm run verify:deployment:setup`，只驗證 setup，不寫測試個案。通過後再跑 `npm run verify:deployment` 做完整三種服務驗證。完整驗證資料會帶 `DEPLOY-VERIFY-...` 前綴，驗證後要和正式個案分開看；第一次成功驗證建議保留最後一組成功批次當證據，不要自動刪。

這樣做的風險是測試期 `Anyone with link` 權限較寬。建議只在後台操作與測試期使用；正式公開前，再決定是否收緊權限或搬到 Firebase/Supabase。

## 6. 每次交付前

- 先打開 `docs/delivery-checklist.md`，照正式個案交付核對表逐項確認。
- SVG 校對版的位置必須正確。
- 報告不得出現醫療宣稱。
- 精油段落只能作為支持建議，不能反推數字公式。
- `輸出紀錄` 必須有報告連結。
- 有數字盤服務時，`輸出紀錄` 才需要 SVG 連結。
- `輸出紀錄.deliveryStatus` 預設是 `draft`；核對完成後才改成 `reviewed` 或 `delivered`。
- 狀態更新從 Apps Script 後台操作，只用 token 更新，不開放客人端修改。
- 若回傳 `duplicateCaseWarning`，先判斷是重產報告還是誤送，不要直接交付。

## 7. 每次收工

收工前執行：

```bash
npm run work:closeout
```

凌晨自動收工已取消。收工只採人工手動執行；若下次開工提示「上次開工尚未收工」，先手動執行 `npm run work:closeout`，再重新開工。

整理流程完成前，一般收工不執行儲存維護。清理需獨立人工核准：

- `npm run storage:check` 只掃描，不刪除。
- `npm run storage:clean` 套用白名單清理。
- C 槽低於 30 GB 才擴大清理超過 7 天的 `%TEMP%`；24 小時內更新內容與 Autodesk `odis_download_dest` 受保護。
- 雲端每 7 天完整掃描一次，只把根目錄或 `soul-kaleidoscope-v1` 專案內 `dist/`、`tmp/` 中超過 30 天的可重建檔案移到垃圾桶。
- 詳細紀錄在 `.workflow/storage-maintenance-report.json`；正式報告、課程 PDF、資料庫與 Google 文件只列人工判斷，不自動刪除。
- Apps Script 更新 `Code.gs` 後必須重新部署新版本，雲端掃描與移到垃圾桶端點才會生效。

完整收工加清理指令保留為：

```bash
npm run work:shutdown
```

整理流程完成前不要使用它作為一般收工。

GitHub / 第二大腦同步規則：

- 收工必須檢查 GitHub 同步狀態。
- 若 `git status --short --branch` 顯示未提交或未追蹤檔案，代表本機尚未同步到 GitHub。
- 不得自動 commit / push 全部變更；需先人工確認哪些檔案可同步。
- 根目錄治理文件不在 `soul-kaleidoscope-v1` repo 內，若要進第二大腦，需同步摘要或正式副本到 repo 文件區。
- 個案資料、密鑰、Google Docs / Sheets 捷徑、PDF 證據與不應公開資料不得直接推上 GitHub。

同步邊界：

- 可同步：程式碼、測試、正式文件、流程規則、可公開設定樣板。
- 需人工確認：治理文件、候選清單、輸出規格、Google Sheet registry。
- 禁止同步：個案、PDF 證據、密鑰、`.workflow/startup-sync-token.txt`、Google Docs / Sheets 捷徑、未核准 Legacy 資料。

若要 commit / push：

1. 先提出本次可同步檔案清單。
2. 同時提出 commit message。
3. 人工確認後才可逐檔 stage / commit / push。
4. 不使用 `git add .`。

收工規則：

- 收工前先確認是否需要 `npm run readiness`。
- 收工只在人工明確指定時執行。
- 不再保留凌晨自動收工排程。

## 8. 何時不要升級

下面任一情況成立時，先不要升級成付費資料庫或原生 App：

- 還沒有連續 30 天真實使用。
- 還沒有交付 10 份以上個案。
- Google Sheets 還沒有真的成為瓶頸。
- 客人自助登入還不是必要功能。

這個方向有問題的地方是：如果太早做完整 SaaS，會把時間花在登入、付款、權限、上架，而不是把數字盤、精油模組、圖像與報告交付跑穩。
