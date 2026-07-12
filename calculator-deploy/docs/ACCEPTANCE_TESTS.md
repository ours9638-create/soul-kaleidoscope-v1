# 靈魂萬花筒計算器｜驗收清單

## A. Cloudflare 自動建置順序

正式分支每次提交必須依序完成：

```text
npm test
→ 產生 lunar-data.js
→ 產生 sngl-data.js
→ 靜態來源與版本檢查
→ 27 項核心自檢
→ npx wrangler deploy
```

任何一步失敗都不得發布正式 Worker。

## B. 正式 Regression Suite

執行方式：

```bash
npm test
```

必須驗證：

- `tests/fixtures/regression-cases.json` 可解析。
- 所有 fixture 均使用相同核心引擎計算。
- 原有 27 項核心自檢全部通過。
- Soul Profile JSON 建立與驗證通過。
- SNGL 0～9 資料完整。
- SNGL 報告引擎可產生非空代碼與客戶文字。
- 測試失敗時程序以非 0 狀態結束。

### 固定案例一

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

### 固定案例二

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

### 固定案例三｜Ruru

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

## C. 正式閏月案例

目前尚待選定一組正式生日與查詢日期。

必須驗收：

- 國曆生日自動換算為正確閏月。
- 輸入區保留原始閏月標記。
- 計算月使用原月份加 1。
- 加 1 後超過 12 時顯示需人工確認，不自行推算。
- 國曆與農曆年度定位分開計算。
- fixture、`RULES_LOCK.md` 與整合試算表結果一致。

P0 關閉前必須補上完整預期結果。

## D. Soul Profile JSON 驗收

模型版本：`1.0.0`

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
- 國／農曆 soulStages 各有 5 階段。
- `primaryNumber` 與日階段完整鏈條最後主數一致。
- 網站畫面與複製結果讀取 Soul Profile，不直接拼接另一套計算資料。
- 清除重算後移除 `window.__SOUL_PROFILE__`。
- 個案真實資料不得寫入 console、網址、GitHub 或 Cloudflare 日誌。

## E. SNGL 與報告引擎驗收

版本：

- SNGL Report Engine：`1.0.0`
- SNGL Number Data：`1.0.0`

必須驗證：

- `data/sngl/numbers.v1.json` 完整包含 0～9。
- build 產生 `public/sngl-data.js`。
- 國曆主命數、農曆主命數、國曆流年與農曆流年可產生段落。
- 缺少可驗算的農曆流年時，不得把空值解讀為 0。
- 每個段落包含 code、number、chain、theme、observation、mature、imbalance、action、geometry、colors、clientText。
- 客戶文字避免斷言、標籤與醫療化措辭。
- `profile.outputs.report` 保存 report engine 與 data version。

## F. 靜態來源與版本驗證

介面修訂：`v2.2.0-r4`

Cloudflare build 必須檢查：

- `package.json` 與核心引擎同為 `2.2.0`。
- 頁面與 Service Worker 使用 `2.2.0-r4`。
- `profile-model.js`、`sngl-data.js`、`sngl-report.js` 已載入。
- Service Worker 快取上述三項資產。
- 快速閱覽中不存在：
  - 國曆／農曆生日狀態
  - 本年國曆生日
  - 本年農曆生日
- `script.js` 不再引用上述舊 DOM ID 或複製文字。
- 所有 JavaScript 可解析。
- schema、fixture 與 SNGL JSON 可解析。
- 建置只生成 `lunar-data.js` 與 `sngl-data.js`，不改寫正式 HTML、JS、CSS 或 Service Worker。

## G. iPhone Safari 驗收

- 首頁、輸入卡片與所有結果卡片左右對齊。
- 日期與時間欄位可正常使用 iOS 選擇器。
- 國曆生日變更後自動帶出農曆。
- 計算後快速結果與詳細表格更新。
- 快速閱覽只顯示姓名、查詢日期、當日農曆、個案農曆調整與時間計算。
- 下方國／農曆生日、流年、位格、流月與流日表格正常。
- 寬表格只在表格容器內左右滑動，整頁不漂移。
- 清除重算後輸入與結果回到空白。
- 複製快速結果與完整結果可貼入備忘錄。
- 完整結果包含模型、引擎與 SNGL 版本。
- 頁首顯示核心自檢與模型／SNGL 載入狀態。
- 任一底層資產載入失敗時顯示明確錯誤。

## H. PWA 驗收

- Safari 重新整理可取得 `v2.2.0-r4`。
- 加入主畫面後可正常開啟與計算。
- Service Worker cache name 為 `soul-kaleidoscope-v2.2.0-r4`。
- 新版部署後不持續顯示 r3。
- 離線時能載入最近一次完整快取的核心、模型與 SNGL 資產。
- 不快取第三方來源請求。

## I. Cloudflare 驗收

- 生產分支：`calculator-deploy-setup`
- 根目錄：`calculator-deploy`
- 組建命令：`npm run build`
- 部署命令：`npx wrangler deploy`
- 正式 Worker：`soul-kaleidoscope-v1`
- 正式網址維持不變。

組建紀錄至少應出現：

```text
Regression suite passed .../...
Core self-tests passed 27/27.
Generated public/sngl-data.js version 1.0.0.
Static source validation passed 21/21.
Formula regression passed 27/27.
Prepared Soul Kaleidoscope calculator v2.2.0-r4.
```

## J. 發版規則

每次正式修改至少完成：

1. 修改正式來源檔。
2. 新增或更新 fixture／測試。
3. 公式異動同步更新 `RULES_LOCK.md` 與核心版本。
4. 資料模型異動同步更新 schemaVersion 與 migration。
5. SNGL 內容異動同步更新 dataVersion。
6. 介面或快取異動同步更新 `-rN`。
7. 執行 `npm test` 與 `npm run build`。
8. Cloudflare 組建成功。
9. 使用固定案例做手機人工驗收。
10. 更新路線圖、技術稽核或 GitHub Issue。
