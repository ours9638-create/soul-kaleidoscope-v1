# 靈魂萬花筒計算器｜驗收清單

## A. 版本基準

- App／PWA：`2.3.0`
- 計算引擎：`2.2.0`
- Soul Profile Schema：`1.0.0`
- SNGL Report Engine：`1.0.0`
- SNGL Number Data：`1.0.0`
- Case Store Module：`1.0.0`
- Case Store Schema：`1`

產品版本與計算引擎版本分開管理。P1 功能上線不得改動既有公式結果。

---

## B. Cloudflare 自動建置順序

正式分支每次提交必須依序完成：

```text
npm run test:core
→ npm run test:cases
→ 產生 lunar-data.js
→ 產生 sngl-data.js
→ 29 項靜態來源與版本檢查
→ 27 項核心自檢
→ npx wrangler deploy
```

任何一步失敗都不得發布正式 Worker。

組建紀錄應包含：

```text
Regression suite passed .../...
Core self-tests passed 27/27.
Case store tests passed 20/20.
Generated public/sngl-data.js version 1.0.0.
Static source validation passed 29/29.
Formula regression passed 27/27.
Prepared Soul Kaleidoscope app v2.3.0 (engine 2.2.0).
```

---

## C. 核心固定案例

### 案例一｜1989/05/28

輸入：

- 國曆生日：`1989/05/28`
- 出生時間：`15:17`
- 農曆生日：`1989/04/24`
- 查詢日期：`2026/07/05`

預期：

- 查詢農曆：`2026/05/21`
- 國曆流年 `25/7`、位格 2、流月 `44/8`、流日 `37/10/1`
- 農曆流年 `20/2`、位格 2、流月 `38/11/2`、流日 `34/7`
- 國曆五階段：`27/9、32/5、42/6、48/12/3、56/11/2`
- 農曆五階段：`27/9、31/4、37/10/1、43/7、51/6`
- 農曆主命數靈魂等級：`5級`
- 國曆貴人 7、第一木馬 4
- 農曆貴人 7、第一木馬 2

### 案例二｜1989/12/28

輸入：

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

輸入：

- 國曆生日：`1991/09/23`
- 出生時間：`11:17`
- 農曆生日：`1991/08/16`
- 查詢日期：`2026/07/11`

預期：

- 查詢農曆：`2026/05/27`
- 本農曆年生日對應國曆：`2026/09/26`
- 國曆流年 `23/5`、位格 8、流月 `32/5`、流日 `31/4`
- 農曆流年 `24/6`、位格 8、流月 `32/5`、流日 `37/10/1`
- 國曆五階段：`20/2、29/11/2、34/7、36/9、44/8`
- 農曆五階段：`20/2、28/10/1、35/8、37/10/1、45/9`
- 國曆貴人 3、第一木馬 4
- 農曆貴人 6、第一木馬 1

### 正式閏月案例

P0 關閉前必須補上：

- 實際國曆生日與農曆閏月日期。
- 查詢日期。
- 原始閏月與計算月。
- 國／農曆五階段、流年、位格、流月、流日、貴人與木馬完整預期值。
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
- 網站畫面與複製結果讀取 Soul Profile。
- 清除重算後移除 `window.__SOUL_PROFILE__`。
- 真實個案資料不得寫入 console、網址、GitHub 或 Cloudflare 日誌。

---

## E. SNGL 與報告引擎

必須驗證：

- `data/sngl/numbers.v1.json` 完整包含 0～9。
- Build 產生 `public/sngl-data.js`。
- 國曆主命數、農曆主命數、國曆流年與農曆流年可產生段落。
- 缺少可靠農曆流年時，不把空值解讀為 0。
- 每個段落包含 code、number、chain、theme、observation、mature、imbalance、action、geometry、colors、clientText。
- 客戶文字避免斷言、標籤與醫療化措辭。
- `profile.outputs.report` 保存 report engine 與 data version。

---

## F. Case Store 自動測試

執行：

```bash
npm run test:cases
```

必須通過 20 項檢查：

- 空資料庫初始化與 Schema。
- 新增一筆。
- 同名個案使用不同 ID，不互相覆寫。
- 覆寫保留 `createdAt` 並更新 `modifiedAt`。
- 刪除指定 ID。
- 搜尋姓名與國曆生日。
- 依修改時間由新到舊排序。
- JSON 匯出再匯入資料一致。
- 無效 JSON 被拒絕。
- 不支援 Schema 被拒絕。
- 匯入失敗不改變本機原資料。
- 100 筆資料保存與搜尋正常。
- 舊 Schema `0` 與舊欄位可遷移。

---

## G. P1 個案管理介面

### 基本流程

1. 輸入有效資料並計算。
2. 點「儲存為新個案」。
3. 個案列表新增一筆並顯示姓名、國曆生日、修改時間與建立引擎。
4. 點選列表紀錄，表單自動帶入並以目前引擎重新計算。
5. 修改姓名或查詢日期後點「覆寫目前個案」，ID 與建立時間保持不變。
6. 點「儲存為新個案」，建立另一個新 ID。
7. 同名紀錄可以並存。

### 搜尋與排序

- 搜尋姓名片段可找到個案。
- 搜尋 `YYYY-MM` 或完整國曆生日可找到個案。
- 預設依最後修改時間由新到舊。
- 找不到資料時顯示空狀態，不產生錯誤。

### 刪除

- 未載入個案時「覆寫」與「刪除」按鈕停用。
- 刪除前顯示姓名與生日二次確認。
- 取消確認不刪除。
- 刪除後列表、筆數與目前個案狀態同步更新。

### 匯出

- 無資料時不可匯出空備份。
- 匯出前顯示筆數與明文個資警示。
- 檔名：`soul-kaleidoscope-cases-YYYY-MM-DD.json`
- 匯出後顯示最後備份時間。
- iPhone 可在「檔案」App 找到備份。

### 匯入

- 匯入前先顯示：新增、更新、相同略過、保留本機較新資料的筆數。
- 使用者取消時不寫入。
- 預設只使用「合併」，不清空現有資料。
- 相同 ID 且匯入資料較新時更新。
- 相同 ID 且本機較新時保留本機資料。
- 錯誤 JSON、錯誤日期、重複 ID 或不支援 Schema 均不得寫入。

---

## H. iPhone Safari 與 PWA

### 版面

- 首頁、輸入、個案管理與結果卡片左右對齊。
- 個案管理按鈕在手機不造成水平捲動。
- 個案列表可垂直滑動。
- 寬表格只在表格容器內左右滑動，整頁不漂移。

### 本機保存

- Safari 一般分頁保存後關閉再開，資料仍存在。
- 加入主畫面後保存，關閉 App 再開資料仍存在。
- 清除網站資料後個案會消失，畫面已明確提醒先備份。
- 私密瀏覽模式顯示不保證長期保存的警示。
- LocalStorage 不可用時，計算功能仍可使用；個案管理按鈕停用並顯示錯誤。

### 快取

- 頁首顯示 `v2.3.0`。
- Service Worker cache name：`soul-kaleidoscope-v2.3.0`
- 離線時能載入最近一次完整快取的核心、Profile、SNGL 與 Case Store 資產。
- 不快取第三方來源請求。

---

## I. 靜態來源與版本檢查

Cloudflare Build 必須確認：

- App 版本 `2.3.0` 與引擎版本 `2.2.0` 分開管理。
- `index.html` 包含 app-version metadata 與 `v2.3.0`。
- `case-manager.css`、`case-store.js`、`case-ui.js` 已載入。
- Service Worker 快取上述 P1 資產。
- 快速閱覽中不存在：
  - 國曆／農曆生日狀態。
  - 本年國曆生日。
  - 本年農曆生日。
- P1 介面包含搜尋、列表、新增、覆寫、刪除、匯出與匯入。
- 匯入預設為 merge。
- 所有 JavaScript 可解析。
- Schema、fixture 與 SNGL JSON 可解析。
- Build 只生成 `lunar-data.js` 與 `sngl-data.js`，不臨時改寫正式 HTML、JS、CSS 或 Service Worker。

---

## J. 發版規則

每次正式修改至少完成：

1. 修改正式來源檔。
2. 新增或更新 fixture／測試。
3. 公式異動同步更新 `RULES_LOCK.md` 與計算引擎版本。
4. App 功能異動更新 App 版本，不強制提升引擎版本。
5. 資料模型異動更新 Schema 與 migration。
6. SNGL 內容異動更新 dataVersion。
7. 執行 `npm test` 與 `npm run build`。
8. Cloudflare 組建成功。
9. 使用固定案例與 P1 備份流程做手機人工驗收。
10. 更新路線圖、驗收文件與 GitHub Issue。
