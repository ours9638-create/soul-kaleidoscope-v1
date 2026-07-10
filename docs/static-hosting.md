# PWA 免費靜態網站部署

目前 PWA 已可用 `dist/static-site` 部署。Apps Script 後台 URL 已寫在 `web/deployment-config.js`，所以靜態網站上線後會自動連到目前驗證過的後台。

## 選項比較

| 選項 | 優點 | 代價 | 建議 |
| --- | --- | --- | --- |
| Cloudflare Pages 手動上傳 | 不需要先整理 Git repo，最快能公開測試 | 每次更新要重新上傳 `dist/static-site` | 適合第一週試用 |
| GitHub Pages | 之後每次 push 自動部署，可追蹤版本 | 需要先建立 GitHub repo 與 Pages 設定 | 適合長期維護 |

這樣做的風險是：如果先用手動上傳，之後容易忘記哪一版在線上。建議第一週用 Cloudflare 快速試跑；一旦開始正式交付，就改 GitHub Pages。

## Cloudflare Pages 手動上傳

1. 先跑：

```bash
npm run readiness
```

2. 這會同時產生：

```text
dist/static-site
dist/static-site.zip
```

3. 若要單獨檢查 ZIP，可跑：

```bash
npm run verify:static
```

這個檢查不是只看 ZIP 有沒有檔案，還會確認打包後的 `web/index.html`、`manifest`、service worker 與 `web/app.js` 的 module import 路徑能解析，並確認打包後的 `web/deployment-config.js` 是有效 Apps Script Web App URL。

4. 到 Cloudflare Pages 建立專案，選擇直接上傳。
5. 上傳 `dist/static-site.zip`；如果介面要求資料夾，就改選 `dist/static-site`。
6. 上線後打開網站，確認：

- `Apps Script API URL` 已自動帶入。
- 按「檢查後台」顯示 `後台正常｜v0.1.0`。
- 按「計算」能看到數字盤、SVG 與報告草稿。

## GitHub Pages 自動部署

本專案已準備 `.github/workflows/pages.yml`。等你建立 GitHub repo 後：

1. 把專案推到 GitHub。
2. 到 repo 的 Settings -> Pages。
3. Source 選 GitHub Actions。
4. 推到 `main` 後，workflow 會執行：

```bash
npm run readiness
```

5. 通過後部署 `dist/static-site`。

## 重新部署 Apps Script 時

若 Apps Script 產生新的 Web App URL：

1. 更新 `web/deployment-config.js`。
2. 跑：

```bash
npm run readiness
```

3. 重新部署 PWA 靜態網站。

不要只改線上前端，不改本機檔案。這樣做的風險是下次封包會把舊 URL 蓋回去。
