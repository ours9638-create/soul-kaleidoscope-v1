# 靈魂萬花筒 v1

免費優先的第一版後台與 PWA 骨架。目標是先讓你在後台輸入個案資料，產出數字計算、靈魂萬花圖校對 SVG、報告草稿與交付紀錄。

## 目前完成

- 核心公式：主命數、日月綻放/內頻、木馬、貴人、流年、今年位格。
- 服務目錄：數字盤、精油產品/配方、數字盤 + 精油搭配。
- 出圖流程：可註冊多種圖像模板，目前有 `soul-kaleidoscope` 與 `minimal-number-card`。
- 報告安全：避免醫療承諾語句，保留象徵與支持語氣。
- Apps Script：可部署成 Google Web App，讀寫 Google Sheets 與 Google Drive。
- PWA：可本機預覽、手機安裝、下載 SVG 與 Markdown 報告。

## 目錄

- `src/core/`：可測試的核心邏輯。
- `tests/`：Node 內建測試。
- `apps-script/`：Google Apps Script 後台/API。
- `web/`：PWA 靜態網頁。
- `docs/`：流程、資料表、部署說明。

## 先看這八份

1. [免費優先路線圖](docs/free-first-roadmap.md)
2. [執行檢查清單](docs/implementation-checklist.md)
3. [服務模組模型](docs/service-model.md)
4. [免費部署步驟](docs/deploy-free-stack.md)
5. [部署驗證流程](docs/deployment-verification.md)
6. [開工與收工流程](docs/workflow.md)
7. [Google Sheets 開工讀取範圍](docs/google-sheets-live-check.md)
8. [每日操作手冊](docs/operator-runbook.md)
9. [目前部署狀態](docs/deployment-status.md)
10. [PWA 免費靜態網站部署](docs/static-hosting.md)

## 本機檢查

```bash
npm run work:start
npm run readiness
```

`npm run readiness` 會依序跑測試、語法檢查、部署前檢查、Apps Script 封裝與 PWA 靜態封裝。它不會呼叫線上 Apps Script，也不會寫入 Google Sheets 或 Drive。

## 本機預覽 PWA

```bash
npm run package:static
npm run preview:static
```

開啟：

```text
http://localhost:4173/web/
```

## 免費部署建議

1. Google Sheets 繼續當內容與個案資料來源。
2. Google Apps Script 部署成 Web App。
3. 執行 `npm run package:static`，用 GitHub Pages 或 Cloudflare Pages 部署 `dist/static-site`；細節看 `docs/static-hosting.md`。
4. PWA 會自動帶入已驗證的 Apps Script Web App URL；若重新部署，再手動更新 URL。
5. 照 `docs/deployment-verification.md` 測數字盤、精油單項、組合服務。

## 省用量原則

- 前端先本機計算，確認要保存才呼叫 Apps Script。
- 同一個個案批次寫入 Sheets。
- SVG 校對版由程式產生，AI 美術版只做第二步。
- 報告先用模板，只有客製精修才使用 AI。
- Drive 只存正式交付與必要版本。

## 重要限制

- v1 不做客人自助登入。
- v1 不做付款。
- v1 不做原生 App。
- AI 美術版不能取代 SVG 校對版；圖像位置與數字以核對表為準。
- 精油、色彩、療癒內容不得寫成醫療宣稱。
