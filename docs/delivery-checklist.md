# 正式個案交付核對表

這份表只做一件事：避免還沒校對的 SVG、報告或精油內容直接交給客人。

這樣做的風險是流程會多 5-10 分鐘。建議接受這個成本，因為 v1 目前仍是後台半自動工作台，正式交付前的人工核對比事後修錯便宜。

## 1. 交付前資料核對

- 確認服務類型正確：數字盤、精油單項、或數字盤 + 精油搭配。
- 確認姓名/代稱沒有打錯。
- 確認 `clientDisplayName` 是客戶可見稱呼，不是內部代稱、暱稱備註或檔案管理用名稱。
- 數字盤服務必須確認國曆生日、農曆生日、出生時間、查詢日期。
- 精油單項不需要生日資料；不要為了湊欄位硬填生日。
- 組合服務必須先有數字盤結果，再接精油支持建議。

你有沒有想過：如果客人的生日或服務類型一開始就錯，後面 SVG、報告、精油建議全部都會跟著錯。這是交付前最大風險。

## 2. 數字盤核對

數字盤服務與組合服務都要檢查：

- 陰曆主命數鏈條與最後主數。
- 陽曆主命數鏈條與最後主數。
- 日月綻放：國曆日月數。
- 內頻：農曆日月數。
- 木馬一、木馬二、木馬三、木馬四。
- 陰曆貴人、陽曆貴人。
- 流年。
- 今年位格。

核對原則：

- 不能只看最後主數，要保留鏈條。
- 若公式還沒定稿，報告不能寫成定稿語氣。
- 若 Google Sheets 內容更新過，先回 `docs/operator-runbook.md` 判斷是否影響公式。

## 3. SVG 校對版核對

數字盤服務與組合服務都要檢查：

- 主風格使用 `Style A｜霧白金線版`。
- 背景乾淨、留白充足，使用細金線與簡約幾何線條。
- 花草裝飾降到最低，不干擾數字與位置校對。
- 中心左是陰曆主命數。
- 中心右是陽曆主命數。
- 上方是日月綻放，也就是國曆日月數。
- 上方副標是內頻，也就是農曆日月數。
- 木馬一在左上。
- 木馬二在右上。
- 木馬三在左下。
- 木馬四在右下。
- 陰曆貴人在左側。
- 陽曆貴人在右側。
- 流年在下方。
- 今年位格在最外圈。

出圖原則：

- SVG 校對版是公式依據。
- AI 美術版只能作為第二步，不能取代 SVG 校對版。
- 圖像只使用數字色，不使用彩油瓶色作為公式位置依據。

## 4. 報告文字核對

所有服務都要檢查：

- 報告名稱與個案名稱一致。
- 報告內容符合所選服務，不多出不相關段落。
- 沒有出現治療、治癒、療效、保證改善、診斷等醫療宣稱。
- 語氣使用支持、提醒、象徵、練習，不寫保證結果。
- 報告有保留輸出紀錄或可追溯 token。

數字盤報告要檢查：

- reportUrl 指向可編輯的原生 Google Docs。
- practitionerCardUrl 指向 A5 內部快速閱讀手卡，且手卡不在客戶報告內。
- canvaPackageUrl 指向 A4 套版包，且不含原始諮詢筆記。
- Canva 最終版放在「靈魂萬花筒」Canva 資料夾：`https://www.canva.com/folder/FAHNdHzaB5o`。
- Canva 檔名包含個案稱呼、caseId、formulaVersion、contentVersion，避免不知道哪一版已交付。
- Canva 若有改文字，必須回寫 Google Docs 或重新產出 CanvaPackage；不能只改 Canva。
- 客戶文件內沒有「待核對」「請補寫」或內部核對文字。
- 客戶報告與 Canva 只允許出現 `approvedClientSummary`；`mainIssue`、`recentTransition`、`repeatingPattern`、`growthFocus`、`excludedTopics`、`monthlyContext` 只能留在個案資料表與 A5 內部手卡。
- `clientDisplayName` 與 `approvedClientSummary` 不得含「不要放」「不能寫」「內部」「原始筆記」等內部語；若出現在 `reviewIssues`，先改稱呼或摘要並重產，不要硬升級 `deliveryStatus`。
- 有核心數字。
- 出圖核對只留在 SVG 與 A5 內部手卡，不塞進客戶報告。
- 解讀同時包含成熟表現與失衡／陰影，不可只寫正向形容。
- 月提醒包含觸發情境、可觀察訊號與可執行行動，且不得在流月未核對時臆測。
- 沒有強迫輸出精油段落。

精油單項報告要檢查：

- 有使用情境、產品型態、建議精油、安全提醒。
- 不需要生日排盤。
- 不出現主命數、木馬、流年等數字盤段落。

組合報告要檢查：

- 先顯示數字盤，再顯示精油支持建議。
- 必須保留「精油只作為支持層，不反推數字公式」的邏輯。
- 精油段落不能改動數字盤公式或圖像位置。

## 5. Drive 與 Sheets 核對

交付前確認：

- `輸出紀錄` 有 token。
- `輸出紀錄` 有 reportUrl。
- 若服務包含數字盤，`輸出紀錄` 有 practitionerCardUrl 與 canvaPackageUrl。
- 若服務包含數字盤，`輸出紀錄` 有 svgUrl。
- 若服務包含數字盤，`輸出紀錄` 有 formulaVersion、contentVersion、reportVersion 與 sourceContentIds。
- `formulaStatus=verified` 且 `contentCoverageStatus=complete`；否則依 `reviewIssues` 補核對，不得交付。
- `輸出紀錄.deliveryStatus` 先保持 `draft`，核對完成後才改成 `reviewed` 或 `delivered`。
- 狀態更新使用 Apps Script 後台的「交付狀態」表單，以 token 更新，不直接開放客人端修改。
- `reportUrl` 開啟的是可編輯 Google Docs 報告。
- `svgUrl` 預覽是 `_checklist.svg` 校對圖。
- `canvaPackageUrl` 內的 `targetCanvaFolder.url` 指向 `https://www.canva.com/folder/FAHNdHzaB5o`。
- Canva 最終版 PDF 的內容版本與 `輸出紀錄.contentVersion` 一致。
- `個案資料表` 沒有安靜新增同一個 `caseId + serviceId` 重複列。
- 若有 `duplicateCaseWarning`，先確認是重新產出報告，還是誤按送出。

## 6. 交付判斷

可以交付：

- 數字、位置、報告文字、Drive 連結都已核對。
- 精油內容沒有醫療宣稱。
- 組合服務沒有讓精油反推公式。
- `deliveryStatus` 已從 `draft` 改成 `reviewed` 或 `delivered`。

先不要交付：

- SVG 位置有任何一項不確定。
- 生日、出生時間、農曆日期或查詢日期不確定。
- 報告出現醫療宣稱。
- reportUrl 或 svgUrl 指向錯誤檔案。
- 同一個案有多筆輸出，但不知道要交哪一版。

## 7. 交付後紀錄

- 在 `輸出紀錄` 保留實際交付 token。
- 若重產報告，記下交付的是哪一版。
- 若客人要求修改，先判斷是資料錯誤、報告文案調整，還是圖像美術版調整。
- 不要直接改核心公式來解決單一客訴。
