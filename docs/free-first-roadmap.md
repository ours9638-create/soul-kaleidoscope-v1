# 免費優先路線圖

## 先講結論

該怎麼做：先用 `Google Sheets + Apps Script + Drive + PWA` 完成後台操作版，不要一開始做原生 App、會員系統、付款系統或複雜資料庫。

原因：你的內容還在持續更新，最貴的不是主機費，而是把還沒定稿的公式與出圖規則寫進難改的系統。v1 要先讓你穩定交付個案，再談自助化。

## 目前最大 3 個風險

1. 同時做品牌、後台、App、會員、付款。
   - 這樣做的風險是：還沒驗證交付流程，就先背上維護成本。
   - 建議改成：先交付 5-10 份真實個案，再決定要開哪些客人端功能。

2. 把 AI 生圖當成系統核心。
   - 這樣做的風險是：AI 會改位置、改數字、改陰陽方向，最後漂亮但不準。
   - 建議改成：SVG 校對版是主控，美術版只做第二層。

3. 太早換資料庫。
   - 這樣做的風險是：內容還在改，搬到資料庫後每次調欄位都更麻煩。
   - 建議改成：Sheets 先當內容後台，等連續使用量穩定再搬。

## 免費工具分工

| 層級 | v1 工具 | 用途 | 為什麼 |
|---|---|---|---|
| 內容後台 | Google Sheets | 公式、文案、個案紀錄 | 你可以直接編輯，最適合持續更新 |
| 後端/API | Apps Script | 寫入 Sheets、產生報告、存 Drive | 免費且原生接 Google 服務 |
| 檔案儲存 | Google Drive | 報告、SVG、PDF | 交付檔案不用另外架儲存服務 |
| 前台/PWA | GitHub Pages 或 Cloudflare Pages | 品牌頁與手機工作台 | 靜態檔最省錢也最穩 |
| App | PWA | 手機可安裝 | 避免原生 App 上架與維護 |

## 用量節省規則

1. 前端先本機計算，只有要保存個案時才呼叫 Apps Script。
2. 同一個個案批次寫入，不要每個欄位寫一次 Sheets。
3. SVG 校對版先產生，確認後才做 AI 美術版。
4. 報告先用模板，只有客製精修才使用 AI。
5. Drive 只存正式交付與必要版本，不存每次測試圖。
6. 前台不公開可寫入的 API 金鑰、不暴露可編輯 Sheet。
7. 先手動部署，等更新頻率固定再自動化。

## 一步步完成

### 第 1 週：跑通內部交付

1. 部署 Apps Script。
2. PWA 填入 Apps Script URL。
3. 用兩組測試生日跑完計算。
4. 確認 `個案資料表` 與 `輸出紀錄` 有寫入。
5. 下載 SVG 與報告草稿。

### 第 2 週：交付真實個案

1. 用真實個案跑一次完整流程。
2. 先看 SVG 校對版，不急著美術化。
3. 把卡住的公式、文案、欄位記回 Sheets。
4. 修正後再交付第二份。

### 第 3-4 週：穩定內容資料庫

1. 統一報告語氣。
2. 把常用出圖組合整理成模板。
3. 建立 5 份以上輸出紀錄。
4. 才開始整理品牌官網公開文案。

### 第 2 階段：客人只讀端

1. 報告只讀連結穩定後，再做客人端頁面。
2. 客人只能看自己的報告。
3. 不開放客人自助改生日資料。

### 第 3 階段：再決定是否升級

只有出現以下情況才考慮 Firebase/Supabase 或正式 App：

1. 連續 30 天都有真實使用。
2. Sheets 開始難維護或接近配額。
3. 客人自助登入變成必要。
4. 付款、會員、歷史報告查詢成為主要需求。

## 官方限制來源

- Apps Script 配額會依服務和帳號類型變動，超過配額會讓腳本停止或拋錯：https://developers.google.com/apps-script/guides/services/quotas
- Sheets API 有每分鐘讀寫限制，超過會出現 429：https://developers.google.com/workspace/sheets/api/limits
- GitHub Pages 有站台大小、頻寬與建置限制：https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Cloudflare Pages 有專案與部署限制，免費方案適合靜態前台：https://developers.cloudflare.com/pages/platform/limits/
- Firebase Spark 是免費方案，但不是現在的第一選擇；需要客人登入/資料庫後再評估：https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## 不建議現在做

- 原生 iOS/Android App。
- 完整會員系統。
- 付款系統。
- 客人自助排盤。
- 付費資料庫。
- 大量 AI 自動生圖。

這些不是永遠不做，而是現在做會讓系統太早變重。
