# 靈魂萬花筒｜核心平台完整執行計畫

## 目標

將目前的計算器整理成可長期維護的共同核心，使網站、PWA、PDF、AI 解讀、個案管理與靈魂萬花圖都只讀取同一份資料，不各自重算。

## 一、共同資料流

```text
使用者輸入
  ↓
核心計算引擎
  ↓
Soul Profile JSON 1.0.0
  ├─ 網站快速結果
  ├─ 個案本機儲存
  ├─ SNGL 報告引擎
  ├─ PDF 報告
  ├─ AI 解讀輸入
  └─ 靈魂萬花圖核對表與提示詞
```

## 二、目前已執行

### A. 正式回歸測試

新增：

- `tests/fixtures/regression-cases.json`
- `tests/run-regression-tests.js`
- `npm test`
- Cloudflare 執行 `npm test` 後才進入正式 build

涵蓋：

- 原有 27 項核心自檢
- 兩組固定個案案例
- 國曆與農曆流年、位格、流月、流日
- 五階段主數與靈魂等級
- 貴人與木馬
- 凌晨 00:00 使用 24
- 農曆跨國曆年生日
- 統一資料模型驗證
- SNGL 報告生成驗證

### B. 統一 JSON 資料模型

新增：

- `schemas/soul-profile.schema.json`
- `public/profile-model.js`

模型版本：`1.0.0`

主要區塊：

- `meta`：模型、引擎、時間與個案識別版本
- `subject`：個案基本識別
- `source`：原始輸入資料
- `calendar`：國／農曆生日狀態與年度定位
- `numerology`：國／農曆五階段、流年、流月、流日、貴人與木馬
- `outputs.report`：SNGL 與報告輸出
- `outputs.soulKaleidoscope`：靈魂萬花圖資料

原則：

1. 所有輸出只讀取 Soul Profile。
2. 不在多個畫面重複計算公式。
3. 個案儲存以原始輸入與版本為主，載入後由目前引擎重算。
4. 每份報告保留模型、引擎、SNGL 與內容資料版本。

### C. SNGL 與報告引擎

新增：

- `data/sngl/numbers.v1.json`
- `public/sngl-report.js`
- build 時產生 `public/sngl-data.js`

目前第一版生成四個段落：

1. 國曆主命數
2. 農曆主命數
3. 國曆流年
4. 農曆流年

每個段落包含：

- SNGL 代碼
- 數字與完整鏈條
- 核心主題
- 頻率觀察
- 成熟展現
- 失衡提醒
- 行動建議
- 幾何原型
- 數字配色
- 客戶報告文字

語氣原則：不斷言、不貼標籤、不醫療化，以頻率觀察與可執行建議為主。

## 三、版本治理

| 類型 | 當前版本 | 變更條件 |
|---|---:|---|
| 計算引擎 | 2.2.0 | 公式或計算結果改變 |
| 介面修訂 | 2.2.0-r3 | 只改畫面、不改公式 |
| Soul Profile Schema | 1.0.0 | JSON 欄位或語意改變 |
| SNGL Report Engine | 1.0.0 | 組裝規則改變 |
| SNGL Number Data | 1.0.0 | 解讀內容改變 |
| Regression Fixtures | 1.0.0 | 新增或修正固定案例 |

任何公式修改必須同時更新：

1. `RULES_LOCK.md`
2. 核心程式
3. regression fixture
4. 自動測試
5. 引擎版本
6. 變更紀錄

## 四、下一階段執行順序

### P1｜個案本機資料庫

使用 Soul Profile Schema 儲存：

- 儲存新個案
- 覆寫、另存、刪除
- 姓名與生日搜尋
- 最近修改排序
- JSON 匯出與匯入
- 格式版本遷移

完成門檻：100 筆個案、匯出後清空再匯入可完整還原。

### P3-A｜SNGL 資料治理

先於 PDF 完成：

- 0～9 基礎數字審核
- 中間數 10、11、12 等
- 靈魂等級 1～7
- 位格、流月、流日
- 特殊組合數
- 每條資料來源、版本、適用欄位與核准狀態

### P2｜報告產生器

報告只讀取 `profile.outputs.report`：

- 快速版
- 完整版
- 老師版
- 可編輯草稿
- HTML 預覽
- PDF 輸出
- 頁尾版本追溯

### P4｜靈魂萬花圖

只讀取 Soul Profile：

- 自動核對表
- 生日前／生日後版判斷
- 固定位置資料
- 數字幾何原型
- 少字精準版提示詞
- SVG／PNG 輸出規格

### P5｜雲端同步

P1、P2 穩定後才開始：

- 帳號
- 加密
- 權限
- 備份與刪除
- 操作紀錄
- 隱私政策

## 五、禁止事項

- 不在網站、PDF、AI 與萬花圖中各寫一套公式。
- 不把姓名、生日與出生時間放進網址參數。
- 不將真實個案資料提交到公開 GitHub。
- 不以舊試算表直接覆寫已鎖定規則。
- 不在未通過回歸測試時部署正式版本。
- 不直接讓未核准的解讀內容進入客戶報告。

## 六、完成定義

這三項基礎工作的第一版完成條件：

- `npm test` 全部通過。
- Cloudflare build 先跑 regression suite。
- 每次計算會建立可驗證的 Soul Profile JSON。
- Soul Profile 包含 SNGL report output。
- 網站複製功能讀取 Soul Profile，而非直接拼接原始計算物件。
- Service Worker 快取統一模型與 SNGL 資產。
- 後續 P1、P2、P4 均以此模型為唯一輸入。
