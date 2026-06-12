# 開工與收工流程

## 開工流程

每次你說「開工」後，先執行：

```bash
npm run work:start
```

這個指令會：

- 重新掃描專案資料夾內的檔案。
- 重新掃描上一層資料夾裡的試算表檔案，例如 `.gsheet`、`.xlsx`、`.csv`。
- 產生 `.workflow/file-snapshot.json`。
- 產生 `.workflow/spreadsheet-snapshot.json`。
- 產生 `.workflow/active-session.json`，標記今天有開工。
- 與上次開工快照比較新增、修改、刪除。
- 產生 `.workflow/start-report.md`。
- 根據更新檔案給出修改或建議。
- 讀取 `config/google-sheets-registry.json`，列出需要用 Google Drive / Google Sheets 追蹤的線上試算表與重點分頁。

這樣做的風險是：如果專案變很大，掃描全部檔案會多花一點時間。建議 v1 先接受，因為現在最大的風險是漏看 Google Drive 同步後的檔案更新。

試算表要特別注意：本機 `.gsheet` 通常只是 Google Drive 捷徑，能偵測檔案是否更新，但不等於已讀取完整表格內容。若 `.workflow/start-report.md` 顯示試算表有更新，開工後要依 `config/google-sheets-registry.json` 用 Google Drive / Google Sheets 連線讀取重點表格，再判斷公式、內容資料庫、個案欄位或出圖規則是否需要修正。

## 手工開工流程

1. 如果 `.workflow/active-session.json` 還存在，先跑 `npm run work:shutdown`，不要直接開新工。
2. 跑 `npm run work:start`。
3. 讀 `.workflow/start-report.md`。
4. 若試算表有更新，照 `config/google-sheets-registry.json` 與 `docs/google-sheets-live-check.md` 用 Google Drive / Google Sheets 讀取重點表格內容。
5. 若有程式更新或今天要部署，跑 `npm run readiness`。
6. 若已拿到 Apps Script Web App URL，依序跑 `npm run verify:deployment:url`、`npm run verify:deployment:setup`、`npm run verify:deployment`。
7. 部署時只使用 `dist/apps-script` 與 `dist/static-site`，不要直接貼原始資料夾。
8. 再開始修改或給建議，不要直接沿用昨天的判斷。

## 收工流程

每次收工時執行：

```bash
npm run work:shutdown
```

這個指令會：

- 讀取開工快照狀態。
- 追加 `.workflow/work-log.md`。
- 完成後移除 `.workflow/active-session.json`，避免重複收工。
- 記錄今日狀態、收工檢查與明日建議。
- 提醒每日用量要保留給凌晨 12:00 的自動收工。

## 凌晨 12:00 自動收工

在每次有「開工」指令後，凌晨 12:00 需要執行一次收工流程：

```bash
npm run work:shutdown
```

目前已建立 Codex 自動化：

- 名稱：靈魂萬花筒凌晨收工流程
- ID：`automation-2`
- 時間：每日凌晨 12:00
- 執行內容：`npm run work:shutdown`

這樣做的風險是：它是每日凌晨 12:00 固定執行，不是精準偵測每次「開工」後才建立一次性排程。建議先接受這個折衷，因為固定收工比靠記憶穩；目前腳本已用 `.workflow/active-session.json` 控制，沒有開工狀態時只提示「無開工狀態」，不追加正式收工紀錄。

每日用量規則：

- 晚上不要把用量用到見底。
- 至少保留足夠一次收工流程的額度。
- 如果用量不足，優先做收工紀錄，不做低優先級美化。
- 收工流程比新增功能重要，因為它保留隔天接續工作的上下文。

## 我每次開工時要做的事

1. 重新讀取目前資料夾檔案狀態。
2. 檢查 `.workflow/start-report.md`。
3. 說明有哪些檔案更新、可能影響什麼。
4. 如果發現風險，直接指出並給修改建議。
5. 不確定就問，不要用昨天的狀態腦補。
