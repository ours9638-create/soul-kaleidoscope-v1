# 靈魂萬花筒｜App 2.7.0 正式部署紀錄

## 一、部署結論

狀態：**GitHub／Cloudflare 正式建置與部署成功**。

- App／PWA：`2.7.0`
- 計算引擎：`2.2.1`
- Soul Profile Schema：`1.0.0`
- SNGL Report Engine：`1.1.0`
- SNGL Number Data：`1.0.0`
- SNGL Position Data：`1.0.0`
- Report View Model：`1.1.1`
- Soul Kaleidoscope Visual Model：`1.0.1`
- Case Store Module：`1.0.1`
- Case Store Schema：`1`

正式網址：

```text
https://soul-kaleidoscope-v1.ours9638.workers.dev
```

Cloudflare Worker Version ID：

```text
ff8aee37-0de7-4320-8cc8-98c36773ca6c
```

部署完成時間：

```text
2026-07-13 02:10 UTC
2026-07-13 10:10 Asia/Taipei
```

## 二、自動測試與建置結果

| 檢查項目 | 結果 |
|---|---:|
| Regression suite | `86/86` |
| Core self-tests | `29/29` |
| Case Store tests | `24/24` |
| Report Model tests | `44/44` |
| Kaleidoscope Model tests | `18/18` |
| Static source validation | `96/96` |
| Formula regression | `29/29` |
| lunar-data.js | `35064` rows |
| Cloudflare deploy | 成功 |

主要建置輸出：

```text
Regression suite passed 86/86.
Core self-tests passed 29/29.
Case store tests passed 24/24.
Report model tests passed 44/44.
Kaleidoscope model tests passed 18/18.
Soul Kaleidoscope visual model 1.0.1; fixed positions 11.
Static source validation passed 96/96.
Formula regression passed 29/29.
Prepared Soul Kaleidoscope app v2.7.0 (engine 2.2.1).
Success: Deploy command completed
Success! Build completed.
```

## 三、目前確認的正式內容

- 首頁採深色宇宙、紫金與香檳金品牌介面。
- 首頁顯示 `v2.7.0` 與核心自檢 `29/29`。
- 功能入口包含靈魂數字、流年與位格、靈魂萬花圖、個案報告。
- 正式名稱採用「靈魂數字」、「國曆日月綻放」、「陰曆日月綻放」、「流年位格解讀」。
- 靈魂萬花圖模型保留固定 11 個位置及日月綻放完整鏈。
- 公開範例不得使用真實個案姓名，搜尋提示採「個案 A」。

## 四、尚未關閉的人工驗收

本次紀錄只證明程式測試、建置與 Cloudflare 部署成功；下列項目仍須實機確認：

1. iPhone Safari 顯示 `v2.7.0`。
2. 加入主畫面後的 PWA 顯示 `v2.7.0`，且舊快取已清除。
3. 五分頁可正常切換，整頁沒有水平溢出。
4. 固定案例 `1991/09/23` 的國曆日月綻放為 `32/5`、陰曆日月綻放為 `24/6`。
5. 萬花圖核對固定 11 個位置正確。
6. 個案「儲存 → 重開 → 匯出 → 刪除 → 匯入 → 重算」閉環成功。
7. 快速版、完整版、老師版報告可開啟、儲存草稿、複製及列印 PDF。
8. PDF 不顯示操作列、不截字、不漏頁、不產生水平溢出。

## 五、正式發版判定

- 自動化建置：**通過**。
- Cloudflare 部署：**通過**。
- iPhone／PWA 實機驗收：**待完成**。
- P0、P1、P2 正式封版：**尚未關閉**。

本紀錄不得放入姓名、生日、出生時間、報告內容或其他真實個案資料。
