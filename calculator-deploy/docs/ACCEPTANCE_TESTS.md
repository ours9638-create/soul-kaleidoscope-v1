# 靈魂萬花筒｜正式驗收清單

## A. 版本基準

- App／PWA：`2.6.0`
- 計算引擎：`2.2.0`
- Soul Profile Schema：`1.0.0`
- SNGL Report Engine：`1.1.0`
- SNGL Number Data：`1.0.0`
- SNGL Position Data：`1.0.0`
- Report View Model：`1.1.0`
- Case Store Module：`1.0.1`
- Case Store Schema：`1`

App、公式引擎、資料模型、內容資料、個案資料與報告頁分開管理。App 2.6.0 不得改變計算引擎 2.2.0 的既有公式結果。

---

## B. 自動建置順序

正式分支每次提交必須依序完成：

```text
npm run test:core
→ npm run test:cases
→ npm run test:report
→ 產生 lunar-data.js
→ 產生 sngl-data.js（Number Data＋Position Data）
→ 靜態來源與版本檢查
→ 27 項核心自檢
→ npx wrangler deploy
```

任何一步失敗都不得發布正式 Worker。

組建紀錄應包含：

```text
Regression suite passed .../...
Core self-tests passed 27/27.
Case store tests passed 24/24.
Report model tests passed .../...
Generated public/sngl-data.js with number data 1.0.0 and position data 1.0.0.
Static source validation passed .../....
Formula regression passed 27/27.
Prepared Soul Kaleidoscope app v2.6.0 (engine 2.2.0).
```

---

## C. 正式名稱

主頁、報告、純文字、PDF 與文件必須使用：

- 靈魂數字。
- 國曆日月綻放。
- 陰曆日月綻放。
- 流年位格解讀。

不得出現：

- 生命數字。
- 內頻。

日期與曆法名稱仍可使用「國曆／農曆」；「陰曆日月綻放」為已確認的正式欄位名稱。

---

## D. 核心固定案例

### 案例一｜1989/05/28

輸入：

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
- 國曆：流年 `23/5`、位格 8、流月 `32/5`、流日 `31/4`
- 農曆：流年 `24/6`、位格 8、流月 `32/5`、流日 `37/10/1`
- 國曆五階段：`20/2、29/11/2、34/7、36/9、44/8`
- 農曆五階段：`20/2、28/10/1、35/8、37/10/1、45/9`
- 國曆貴人 3、第一木馬 4
- 農曆貴人 6、第一木馬 1

### 正式閏月案例

P0 關閉前必須補上：

- 國曆生日、農曆閏月日期與查詢日期。
- 原始閏月與計算月。
- 國／農曆五階段、流年、位格、流月、流日、貴人與木馬完整預期。
- fixture、`RULES_LOCK.md` 與整合試算表一致。

---

## E. Soul Profile

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
- 國／農曆 `soulStages` 各有五階段。
- `primaryNumber` 與日階段鏈條最後主數一致。
- 主頁、報告頁與複製結果讀取同一份 Soul Profile。
- 報告頁不得重新呼叫核心公式。
- 清除重算後移除 `window.__SOUL_PROFILE__`。
- 真實個案資料不得寫入 console、網址、GitHub 或 Cloudflare 日誌。

---

## F. SNGL Number Data 與 Position Data

### Number Data

- `data/sngl/numbers.v1.json` 完整包含 0～9。
- 每個數字包含 title、core、mature、imbalance、action、geometry、colors。

### Position Data

- `data/sngl/positions.v1.json` 完整包含 1～9。
- 每個位格包含 title、phase、observation、mature、imbalance、action。

位格對應：

| 位格 | 名稱 |
|---:|---|
| 1 | 啟動與定位 |
| 2 | 協調與連結 |
| 3 | 表達與擴散 |
| 4 | 建構與落地 |
| 5 | 轉換與試驗 |
| 6 | 整合與承接 |
| 7 | 沉澱與校準 |
| 8 | 顯化與整合資源 |
| 9 | 完成與釋放 |

### 報告引擎

必須產生：

- 國曆主命數。
- 農曆主命數。
- 國曆流年。
- 農曆流年。
- 國曆今年位格。
- 農曆今年位格。
- 國曆流年 × 位格整合。
- 農曆流年 × 位格整合。
- 雙曆年度能量總結。

缺少可靠農曆流年時：

- 不得把空值解讀為 0。
- 不產生農曆流年段落。
- 不產生農曆流年 × 位格整合。
- 保留人工核對提示。

---

## G. Case Store

### 自動測試

```bash
npm run test:cases
```

至少涵蓋：

- 初始化、新增、同名、覆寫與刪除。
- 搜尋與排序。
- 匯出／匯入一致。
- 無效 JSON、不支援 Schema、缺少 records。
- 無效日曆日期與查詢日早於生日。
- 匯入失敗不改變原資料。
- App 版本自動升級。
- 100 筆資料保存與搜尋。
- 舊 Schema 與舊欄位遷移。

### 人工流程

1. 計算後儲存為新個案。
2. 點選列表後帶入表單並以目前引擎重算。
3. 覆寫保留 ID 與建立時間。
4. 另存建立新 ID；同名可並存。
5. 清除重算後取消目前個案選取。
6. 刪除前顯示姓名與生日確認。
7. 匯入前顯示新增、更新、略過與衝突預覽。
8. 匯出、刪除、匯入後可完整還原。

---

## H. 報告工作區

### 報告模式

- 快速版。
- 完整版。
- 老師版。

### 段落開關

- 基本資料。
- 靈魂數字摘要。
- 靈魂數字解讀。
- 流年位格解讀。
- 五階段靈魂數字。
- 靈魂數字結構。
- 個案補充。

### 草稿

- 整體觀察。
- 當期重點。
- 補充建議。
- 700ms 自動儲存。
- 手動儲存。
- 重設報告設定。

### 純文字

- 內容與目前模式、段落開關及草稿一致。
- 包含正式名稱。
- 頁尾包含 Number Data、Position Data、SNGL Report 與 Report View 版本。

### 新分頁與資料隔離

1. 計算個案 A，開啟報告 A。
2. 回主頁計算個案 B，開啟報告 B。
3. 報告 A 不得被 B 覆寫。
4. 兩個報告均可重新整理。
5. Token 不得包含個資。
6. Token 不存在、資料錯誤或過期時顯示明確提示。

### 列印／PDF

- 操作列與編輯器不列印。
- 隱藏段落不產生空白頁。
- A4 無截字、漏頁或水平溢出。
- 手機與桌面內容一致。
- PDF 頁尾保留版本資訊。

---

## I. 紫金宇宙品牌介面

### 首頁

- 深色宇宙背景。
- 紫金與香檳金色系。
- 頁首顯示 `v2.6.0`。
- 顯示「靈魂數字」「流年與位格」「靈魂萬花圖」「個案報告」入口。
- 文字與星光背景保持足夠對比。

### 手機

- 不產生整頁水平捲動。
- 按鈕觸控高度至少 44px。
- 表格只在容器內橫向滑動。
- 底部導覽不遮住主要按鈕與內容。

---

## J. PWA 與快取

- Manifest 名稱：`靈魂萬花筒｜Soul Kaleidoscope`。
- Service Worker cache：`soul-kaleidoscope-v2.6.0`。
- 快取品牌樣式、核心、Profile、SNGL、Case Store、Report Model 與報告頁。
- 不快取第三方來源請求。
- 新版部署後舊快取被清除。
- Safari 與主畫面 PWA 均顯示 `v2.6.0`。

---

## K. 正式發版規則

每次正式修改至少完成：

1. 修改正式來源檔。
2. 新增或更新測試。
3. 公式異動同步更新引擎版本、fixture 與 `RULES_LOCK.md`。
4. App 功能異動更新 App 版本。
5. 資料模型異動更新 Schema 與 migration。
6. SNGL 內容異動更新對應 Data Version。
7. 執行核心、Case Store 與 Report Model 測試。
8. GitHub Actions 與 Cloudflare Build 成功。
9. 使用固定案例與手機流程人工驗收。
10. 更新路線圖、驗收文件與 GitHub Issue。
