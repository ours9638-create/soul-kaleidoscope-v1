# 靈魂萬花筒懶人包

這份文件只放會反覆用到的操作捷徑與踩坑紀錄，不放每日流水帳。

這樣做的風險是文件會變成雜記。建議每次只記三件事：錯在哪、下次不要怎麼做、正確做法是什麼。

## 1. Apps Script 更新 Code.gs

### 這次踩坑

- Apps Script 編輯器是 Monaco 編輯器，瀏覽器自動化大段貼上容易失敗。
- 失敗時可能只剩 `}` 或少量字元，這時絕對不能按儲存。
- Google Drive 連接器只能更新 Drive 檔案，不能直接替換 Apps Script 專案原始碼。
- Apps Script 按儲存不等於 Web App 已更新；必須到部署管理建立新版本或編輯部署版本。

### 下次不要做

- 不要再用瀏覽器自動化直接貼整份 `Code.gs`。
- 不要在沒有確認函式名稱與檔案長度前儲存。
- 不要把 `apps-script/Code.gs` 原始檔直接當部署檔貼上。
- 不要只按儲存就回來跑線上驗證；Web App 仍可能是舊版本。

### 正確做法

1. 先跑本機門檻：

```bash
npm run readiness
```

2. 把封裝後的部署檔放到剪貼簿：

```bash
npm run copy:apps-script
```

3. 到 Apps Script 編輯器的 `程式碼.gs` 手動貼上。
4. 貼完先搜尋本次新增或修改的關鍵函式，例如：

```text
validateDeliveryStatusTransition_
```

5. 確認不是空檔、不是只剩幾個字元，再儲存。
6. 到「部署」->「管理部署作業」-> 編輯目前 Web App 部署，版本選「新增版本」，再按部署。
7. 不確定是否部署成功時，先跑線上防呆驗證；如果仍允許 `reviewed`，代表 Web App 還是舊版本。
8. 部署後跑線上防呆驗證：

```powershell
$env:APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbyBWz4po4qAiJtTannRhFFYc0ShBLWaO_FART2ndulub0fLlN0eaFBwot-wlMHgXgxd/exec"; npm run verify:delivery-guard
```

## 2. 精油待確認不能交付

### 這次踩坑

- 「數字盤 + 精油」如果 `selectedOils` 空白，報告會產生「建議精油：待確認」。
- 這份報告可以作為草稿，但不能標記為 `reviewed` 或 `delivered`。

### 正確做法

- 精油未定案時保持 `deliveryStatus = draft`。
- 補上建議精油後再重產報告。
- 核對通過後才改成 `reviewed` 或 `delivered`。

## 3. Google Drive 同步鎖住 dist

### 這次踩坑

- 專案放在 Google Drive 裡，`dist/apps-script` 有時會被同步程序鎖住。
- 如果打包腳本先刪整個 `dist/apps-script`，可能出現 `EPERM` 或 `EINVAL`。

### 下次不要做

- 不要把「刪整個 dist 子資料夾」當成必要打包步驟。
- 不要看到一次 `EPERM` 就改核心功能；先判斷是不是雲端同步鎖檔。

### 正確做法

- Apps Script 打包只覆寫已知輸出檔：`Code.gs`、`Admin.html`、`appsscript.json`、`README.md`。
- 如果 Google Drive 還在同步，等幾秒後重跑：

```bash
npm run package:apps-script
```

## 4. 收工時要補的紀錄

每次收工前，如果今天遇到錯誤流程，補到這份文件：

- 錯誤現象：看到了什麼錯誤或壞狀態。
- 錯誤原因：為什麼這樣做會出問題。
- 下次不要做：明確寫禁止重複的動作。
- 正確做法：留下可執行命令或手工步驟。

如果只是單日進度，寫 `.workflow/work-log.md`；如果會影響下次操作，寫這份懶人包。
