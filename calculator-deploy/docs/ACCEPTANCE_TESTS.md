# 靈魂萬花筒計算器｜驗收清單

## A. 版本基準

- App／PWA：`2.4.0`
- 計算引擎：`2.2.0`
- Soul Profile Schema：`1.0.0`
- SNGL Report Engine：`1.0.0`
- SNGL Number Data：`1.0.0`
- Case Store Module：`1.0.1`
- Case Store Schema：`1`
- Report Preview Spec：`1.0`

App、公式引擎、資料模型、內容資料與報告頁分開管理。新增報告頁不得改變既有公式結果。

---

## B. 自動建置順序

正式分支每次提交必須依序完成：

```text
npm run test:core
→ npm run test:cases
→ 產生 lunar-data.js
→ 產生 sngl-data.js
→ 46 項靜態來源與版本檢查
→ 27 項核心自檢
→ npx wrangler deploy
```

任何一步失敗都不得發布正式 Worker。

組建紀錄應包含：

```text
Regression suite passed .../...
Core self-tests passed 27/27.
Case store tests passed 24/24.
Generated public/sngl-data.js version 1.0.0.
Static source validation passed 46/46.
Formula regression passed 27/27.
Prepared Soul Kaleidoscope app v2.4.0 (engine 2.2.0).
```

---

## C. 核心固定案例

### 案例一｜1989/05/28

- 國曆生日：`1989/05/28`
- 出生時間：`15:17`
- 農曆生日：`1989/04/24`
- 查詢日期：`2026/07/05`

預期：

- 查詢農曆：`2026/05/21`
- 國曆：流年 `25/7`、位格 2、流月 `44/8`、流日 `37/10/1`
- 農曆：流年 `20/2`、位格 2、流月 `38/11/2`、流日 `34/7`
- 國曆五階段：`27/9、32/5、42/6、48/12/3、56/11/2`
- 農曆五階段：`27/9、31/4、37/10/1、43/7、51/6`
- 農曆主命數靈魂等級：`5級`
- 國曆貴人 7、第一木馬 4
- 農曆貴人 7、第一木馬 2

### 案例二｜1989/12/28

- 國曆生日：`1989/12/28`
- 出生時間：`00:00`
- 農曆生日：`1989/12/01`
- 查詢日期：`2026/07/06`

預期：

- 查詢農曆：`2026/05/22`
- 計算時數：24
- 農曆 `2026/12/01` 對應國曆 `2027/01/08`
- 國曆尚未過生日；流年 `22/4`、位格 1
- 農曆尚未過生日；流年 `13/4`、位格 1

### 案例三｜1991/09/23

- 國曆生日：`1991/09/23`
- 出生時間：`11:17`
- 農曆生日：`1991/08/16`
- 查詢日期：`2026/07/11`

預期：

- 查詢農曆：`2026/05/27`
- 本農曆年生日對應國曆：`2026/09/26`
- 國曆：流年 `23/5`、位格 8、流月 `32/5`、流日 `31/4`
- 農曆：流年 `24/6`、位格 8、流月 `32/5`、流日 `37/10/1`
- 國曆五階段：`20/2、29/11/2、34/7、36/9、44/8`
- 農曆五階段：`20/2、28/10/1、35/8、37/10/1、45/9`
- 國曆貴人 3、第一木馬 4
- 農曆貴人 6、第一木馬 1

### 正式閏月案例

P0 關閉前必須補上：

- 實際國曆生日與農曆閏月日期。
- 查詢日期。
- 原始閏月與計算月。
- 國／農曆五階段、流年、位格、流月、流日、貴人與木馬完整預期。
- fixture、`RULES_LOCK.md` 與整合試算表一致。

---

## D. Soul Profile JSON

每次成功計算必須建立：

- `meta.schemaVersion`
- `meta.engineVersion`
- `meta.generatedAt`
- `subject.name`
- `source.solarBirthDate`
- `source.birthTime`
- `source.queryDate`
- `source.lunarBirth`
- `calendar.queryLunar`
- `numerology.solar`
- `numerology.lunar`
- `outputs.report`
- `outputs.soulKaleidoscope`

驗收：

- `Profile.validate(profile).ok === true`
- 國／農曆 `soulStages` 各有 5 階段。
- `primaryNumber` 與日階段鏈條最後主數一致。
- 主頁、報告頁與複製結果讀取同一份 Soul Profile。
- 報告頁不得重新呼叫核心公式。
- 清除重算後移除 `window.__SOUL_PROFILE__`。
- 真實個案資料不得寫入 console、網址、GitHub 或 Cloudflare 日誌。

---

## E. SNGL 與報告引擎

- `data/sngl/numbers.v1.json` 完整包含 0～9。
- Build 產生 `public/sngl-data.js`。
- 國曆主命數、農曆主命數、國曆流年與農曆流年可產生段落。
- 缺少可靠農曆流年時，不把空值解讀為 0。
- 每個段落包含 code、number、chain、theme、observation、mature、imbalance、action、geometry、colors、clientText。
- 客戶文字避免斷言、標籤與醫療化措辭。
- `profile.outputs.report` 保存 Report Engine 與 Data Version。

---

## F. Case Store 自動與人工驗收

### 自動測試

```bash
npm run test:cases
```

24 項資料層檢查至少涵蓋：

- 初始化、新增、同名、覆寫與刪除。
- 搜尋與排序。
- 匯出／匯入一致。
- 無效 JSON、不支援 Schema、缺少 records。
- 無效日曆日期與查詢日早於生日。
- 匯入失敗不改變原資料。
- App 版本自動升級。
- 100 筆資料保存與搜尋。
- 舊 Schema 與舊欄位遷移。

### 介面流程

1. 計算後儲存為新個案。
2. 列表顯示姓名、生日、修改時間與建立引擎。
3. 點選列表後帶入表單並以目前引擎重算。
4. 覆寫保留 ID 與建立時間。
5. 另存建立新 ID；同名可並存。
6. 清除重算後取消目前個案選取。
7. 刪除前顯示姓名與生日確認。
8. 匯入前顯示新增、更新、略過與衝突預覽。
9. 取消匯入時不得寫入。
10. 匯出、刪除、匯入後可完整還原。

---

## G. P2a 新分頁報告預覽

### 主頁

- 計算結果區包含「在新分頁開啟報告」。
- 未計算時按下，只顯示提示，不建立空報告。
- 完成計算後建立隨機 Token 與報告快照。
- 網址不得包含姓名、生日、出生時間或完整結果。
- 最多保留 10 份有效預覽。
- 預覽 24 小時後失效。

### 報告內容

- 姓名與報告產生時間。
- 國曆生日、農曆生日、出生時間、查詢日期與查詢日農曆。
- 國／農曆主命數、流年、今年位格、流月與流日。
- 國曆主命數、農曆主命數、國曆流年與農曆流年 SNGL 段落。
- 貴人數、日座、日月綻放與四個木馬。
- Soul Profile、Engine、SNGL Report 與 SNGL Data 版本。

### 新分頁與資料隔離

1. 計算個案 A，開啟報告 A。
2. 回主頁計算個案 B，開啟報告 B。
3. 報告 A 不得被 B 覆寫。
4. 兩個報告分頁均可重新整理。
5. 關閉主頁後，未過期報告仍可重新整理。
6. Token 不存在、資料錯誤或過期時顯示明確提示。

### 列印／PDF

- 點「列印／儲存 PDF」可開啟列印介面。
- 列印版隱藏返回、列印與清除按鈕。
- A4 排版無截字、漏頁或整段切斷。
- 手機與桌面報告內容一致。
- PDF 頁尾保留版本資訊。

### 清除與隱私

- 「清除此報告」需要確認。
- 清除後重新整理不可再次顯示。
- 報告頁設定 `noindex,nofollow,noarchive`。
- 預覽只存於同一瀏覽器 LocalStorage。
- 不將報告傳送到 GitHub、Cloudflare 日誌或第三方分析服務。

---

## H. iPhone Safari 與 PWA

### 版面

- 首頁、輸入、個案管理與結果卡片左右對齊。
- 個案管理與報告按鈕不造成水平捲動。
- 寬表格只在容器內左右滑動。
- 報告頁手機版基本資料與數字結構使用單欄顯示。

### 保存與快取

- Safari 關閉再開後本機個案仍存在。
- 主畫面 PWA 關閉再開後本機個案仍存在。
- Service Worker cache name：`soul-kaleidoscope-v2.4.0`
- 快取核心、Profile、SNGL、Case Store 與四個報告資產。
- 已建立的有效報告在資產快取完整時可離線重新開啟。
- 不快取第三方來源請求。

### 新分頁呈現

- 功能使用 `_blank` 開啟；實際顯示為 Safari 分頁、視窗或系統瀏覽器由 iOS 決定。
- 無論呈現方式為何，報告內容與 Token 讀取必須正常。
- 若新分頁被阻擋，主頁顯示明確提示。

---

## I. 靜態來源與版本檢查

Build 必須確認：

- App `2.4.0` 與 Engine `2.2.0` 分開管理。
- 主頁版本、CSS 查詢字串與 Service Worker 快取一致。
- Case Store、Case UI、Report Preview、Report Page 全部存在。
- 主頁包含報告按鈕並載入 `report-preview.js`。
- 報告頁包含列印與清除操作。
- 報告頁只讀取報告快照，不重新計算。
- Service Worker 快取 `report.html`、`report.css`、`report.js`、`report-preview.js`。
- 快速閱覽中不存在生日狀態、本年國曆生日與本年農曆生日摘要卡。
- 所有 JavaScript 可解析。
- Schema、fixture 與 SNGL JSON 可解析。
- Build 只生成 `lunar-data.js` 與 `sngl-data.js`，不改寫正式 HTML、JS、CSS 或 Service Worker。

---

## J. 發版規則

1. 修改正式來源檔。
2. 新增或更新 fixture／測試／驗收文件。
3. 公式異動更新 `RULES_LOCK.md` 與 Engine Version。
4. App 功能異動更新 App Version。
5. 資料模型異動更新 Schema 與 migration。
6. SNGL 內容異動更新 dataVersion。
7. 執行 `npm test` 與 `npm run build`。
8. GitHub Actions 與 Cloudflare Build 成功。
9. 使用固定案例、P1 備份流程與 P2a 報告流程做 iPhone 驗收。
10. 更新路線圖、規格文件與 GitHub Issue。
