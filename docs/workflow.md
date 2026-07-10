# 開工與收工流程

## 開工流程

每次你說「開工」後，先執行：

```bash
npm run work:start
```

這個指令會：

- 先透過 Apps Script 從雲端 Drive 讀取 `靈魂萬花筒` 資料夾的檔案更新日期。
- 產生 `.workflow/cloud-drive-snapshot.json`。
- 若雲端 Drive 有新增、修改或刪除，會再透過網路讀取雲端資料夾內可讀檔案的內容摘要。
- 產生 `.workflow/cloud-drive-read-report.json`，避免只相信本機 Google Drive 是否已同步。
- 重新掃描專案資料夾內的檔案。
- 重新掃描上一層資料夾裡的試算表檔案，例如 `.gsheet`、`.xlsx`、`.csv`。
- 產生 `.workflow/file-snapshot.json`。
- 產生 `.workflow/spreadsheet-snapshot.json`。
- 產生 `.workflow/active-session.json`，標記今天有開工。
- 與上次開工快照比較新增、修改、刪除。
- 產生 `.workflow/start-report.md`。
- 根據更新檔案給出修改或建議。
- 讀取 `config/google-sheets-registry.json`，列出需要用 Google Drive / Google Sheets 追蹤的線上試算表與重點分頁。

這樣做的風險是：如果任一檔案更新就重讀整個雲端資料夾，Apps Script 會逾時，Google Drive 免費額度也會被快速消耗。正式策略採 metadata-first：每次線上掃描全部檔案修改時間；只有新增與修改的檔案才讀內容摘要，並排除 `dist`、`tmp` 等可重新產生的檔案。

雲端請求設有逾時保護：metadata 預設 120 秒、完整讀取預設 120 秒。metadata 第一次失敗會依 `metadataRetryAttempts` 重試；若重試後仍失敗，且本機已有上次成功的 `.workflow/cloud-drive-snapshot.json`，開工流程會標成 `stale` 並沿用上次成功快照，避免把所有雲端檔案誤判成刪除。metadata 模式只取差異比對必要欄位，不逐檔取 URL；只有 `readAll` 讀內容摘要時才回傳可點連結，減少 Apps Script metadata 掃描時間。目前雲端資料夾檔案量已超過 300 個，實測全量 metadata 掃描可能接近或超過 60 秒；因此雲端掃描會排除 `dist`、`tmp`、`outputs` 這類本機可重建或可由本機掃描的產物，並保留 120 秒緩衝避免每日開工因網路波動直接降級成 `stale`。若新增或修改檔案很多，`readAll` 會用 POST body 傳遞 `fileIds`，避免大量 ID 塞在 URL query 裡造成 Apps Script 回 HTTP 400。

這樣做的風險是：`stale` 只代表「本次雲端讀不到，但有舊快照可降級」，不代表雲端沒有更新。建議看到 `狀態：stale` 時，先完成本機開工，再用 Google Drive / Google Sheets 連線工具人工補讀本日雲端變更；不要把上次快照當成最新狀態，也不要回寫成新的成功快照。

雲端讀取需要一組本機 token：

- Apps Script 專案屬性要設定 `STARTUP_SYNC_TOKEN`。
- 本機可用環境變數 `STARTUP_SYNC_TOKEN`，或建立不提交 Git 的 `.workflow/startup-sync-token.txt`。
- 如果沒有 token，開工流程會繼續跑本機掃描，但會在報告中標記「雲端 Drive 掃描未完成」。

這個限制是必要的。因為目前 Web App 是公開 URL，如果不加 token，等於把「讀取整個 Drive 資料夾」功能公開出去，這個方向有問題。

試算表要特別注意：本機 `.gsheet` 通常只是 Google Drive 捷徑，能偵測檔案是否更新，但不等於已讀取完整表格內容。若 `.workflow/start-report.md` 顯示試算表有更新，開工後要依 `config/google-sheets-registry.json` 用 Google Drive / Google Sheets 連線讀取重點表格，再判斷公式、內容資料庫、個案欄位或出圖規則是否需要修正。

## 手工開工流程

1. 如果 `.workflow/active-session.json` 還存在，先跑 `npm run work:closeout`，不要直接開新工。
2. 跑 `npm run work:start`。
3. 讀 `.workflow/start-report.md`。
4. 若「雲端 Drive 檔案檢查」有更新，先讀 `.workflow/cloud-drive-read-report.json`。
5. 若「雲端 Drive 檔案檢查」顯示 `stale`，代表 Apps Script metadata 掃描重試後仍失敗；先用報告中的本機與試算表更新繼續，但雲端 Drive 變更要人工補讀。
6. 若試算表有更新，照 `config/google-sheets-registry.json` 與 `docs/google-sheets-live-check.md` 用 Google Drive / Google Sheets 讀取重點表格內容。
7. 若有程式更新或今天要部署，跑 `npm run readiness`。
8. 若已拿到 Apps Script Web App URL，依序跑 `npm run verify:deployment:url`、`npm run verify:deployment:setup`、`npm run verify:deployment`。
9. 部署時只使用 `dist/apps-script` 與 `dist/static-site`，不要直接貼原始資料夾。
10. 再開始修改或給建議，不要直接沿用昨天的判斷。


## 收工流程

整理流程完成前，每次收工時執行安全收工：

```bash
npm run work:closeout
```

這個指令會：

- 讀取開工快照狀態。
- 追加 `.workflow/work-log.md`。
- 完成後移除 `.workflow/active-session.json`，避免重複收工。
- 記錄今日狀態、收工檢查與明日建議。
- 跳過 storage maintenance，不清理本機檔案，也不移動雲端檔案到垃圾桶。
- 檢查 GitHub 同步狀態，列出目前是否在 Git repo、是否有 GitHub remote、是否還有未提交或未追蹤變更。
- 若今天有踩坑，將可重複使用的結論補到 `docs/lazy-pack.md`，不要只留在聊天紀錄。
- 收工只採人工手動執行；不再保留凌晨自動收工規則。

完整收工加清理仍保留為人工核准後才可使用：

```bash
npm run work:shutdown
```

這個指令會套用白名單清理與 storage maintenance。整理流程完成前不要使用它作為一般收工指令。

## GitHub / 第二大腦同步規則

收工流程必須檢查 GitHub 同步狀態，但不得無條件自動 push。

原因：

- 根目錄 `靈魂萬花筒` 目前不是 Git repo。
- GitHub repo 是 `soul-kaleidoscope-v1`，remote 為 GitHub。
- 根目錄的治理文件若沒有鏡像到 `soul-kaleidoscope-v1`，就不會進 GitHub 第二大腦。
- 專案資料夾內含個案、PDF、Google Docs / Sheets 捷徑、可能含隱私與授權資料，不能整包推上 GitHub。

同步邊界：

| 分層 | 內容 | 規則 |
| --- | --- | --- |
| 可同步 | 程式碼、測試、正式文件、流程規則、可公開設定樣板 | 可列入 commit 候選，但仍需確認是本次任務相關檔案 |
| 需人工確認 | 治理文件、候選清單、輸出規格、Google Sheet registry | 先確認是否要同步摘要或正式副本，不能整批推送 |
| 禁止同步 | 個案、PDF 證據、密鑰、`.workflow/startup-sync-token.txt`、Google Docs / Sheets 捷徑、未核准 Legacy 資料 | 不得推上 GitHub，不得用 `git add .` 整包提交 |

收工時應確認：

1. 本次修改是否在 `soul-kaleidoscope-v1` repo 內。
2. 若修改在根目錄治理文件，是否需要同步摘要或正式副本到 repo 文件區。
3. `git status --short --branch` 是否仍有未提交變更。
4. commit 前是否排除個案、密鑰、`.workflow/startup-sync-token.txt`、Google 文件捷徑與不應公開資料。
5. 只有人工確認可同步檔案後，才可 commit / push 到 GitHub。

若需要同步到 GitHub：

1. 先提出本次可同步檔案清單。
2. 同時提出 commit message。
3. 人工確認清單後，才可逐檔 stage / commit / push。
4. 根目錄治理文件若要進第二大腦，只能同步摘要或正式副本到 `soul-kaleidoscope-v1/docs/`，不能整個 Google Drive 原始資料夾推上 GitHub。

這樣做的風險是多一道人工確認。建議保留，因為第二大腦要同步的是「可追蹤且可公開或可備份的工作紀錄」，不是整個 Google Drive 原始資料夾。

只檢查、不刪除：

```bash
npm run storage:check
```

依白名單套用清理：

```bash
npm run storage:clean
```

強制執行本週雲端掃描可加上 `-- --force-storage-scan`。課程 PDF、內容資料庫、Google Sheets、Google Docs 報告、Downloads、Desktop 與 Documents 永遠不會自動刪除。雲端只移到垃圾桶，不做永久刪除。

## 自動收工狀態

凌晨自動收工已取消。
後續收工只接受人工明確指令，例如「收工」或手動執行：

```bash
npm run work:closeout
```

這樣做的風險是：如果忘記手動收工，`.workflow/active-session.json` 會保留到下次開工。建議下次開工若看到「上次開工尚未收工」，先手動收工，再重新開工。

## 我每次開工時要做的事

1. 重新讀取目前資料夾檔案狀態。
2. 重新讀取雲端 Drive 更新日期；若有更新，讀 `.workflow/cloud-drive-read-report.json`。
3. 檢查 `.workflow/start-report.md`。
4. 說明有哪些檔案更新、可能影響什麼。
5. 如果發現風險，直接指出並給修改建議。
6. 不確定就問，不要用昨天的狀態腦補。
