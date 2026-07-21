# 靈魂萬花筒｜App 2.8.0 實機驗收紀錄

## 1. 文件目的

本文件是 App／PWA `2.8.0` 的 G1 實機驗收操作表與發布證據。它只記錄實際在
手機、安裝後 PWA、PDF 與離線環境觀察到的結果，不以桌機響應式模擬、自動測試、
Build 成功或口頭確認取代實機證據。

所有未執行項目固定標示 `PENDING`。只有填入日期、裝置、結果與可追溯證據後，
才可改成 `PASS` 或 `FAIL`。

## 2. 候選版身分

| 欄位 | 值 |
| --- | --- |
| App／PWA | `2.8.0` |
| Engine | `2.2.1` |
| Release branch | `feature/release-2.8.0-readiness` |
| Promotion PR | `#11`，Open／Draft |
| Promotion base | `calculator-deploy-setup` |
| 最新功能候選 Commit | `30f2d230440f51de7c934e7f7bbfcc4b787ef495` |
| 最新自動 CI | Calculator CI `29691785605`，PASS |
| Production deployment | 未執行 |
| Runtime／Dataset publication | 未執行 |

本文件若以 evidence-only Commit 更新，不得把文件 Commit 誤寫成已驗收的功能
候選 Commit。實機驗收前須重新核對 PR #11 最新 Head 與 CI。

## 3. 驗收 Target Gate

PWA 安裝、Service Worker、快取升級與離線驗收必須使用可由實機開啟的 HTTPS
候選版 Target。區域網路 HTTP 或桌機本機 Preview 只能用來檢查一般畫面，不能
完成下列 PWA Gate。

| 欄位 | 紀錄 |
| --- | --- |
| Target 類型 | `PENDING`：Cloudflare Preview／其他已核准 HTTPS Preview |
| Target URL | `PENDING` |
| Target 對應 Commit | `PENDING` |
| Target 顯示 App 版本 | `PENDING` |
| Target 建立核准紀錄 | `PENDING` |
| 是否確認不是 Production | `PENDING` |

如果目前沒有候選版 HTTPS Target，應停在此 Gate，另行取得 Preview 建立授權；
不得直接部署 production 來補做發版前驗收。

## 4. 中性固定案例

實機驗收不得使用真實個案。統一使用：

| 欄位 | 固定值 |
| --- | --- |
| 姓名 | `個案 A` |
| 國曆生日 | `1991/09/23` |
| 出生時間 | `11:17` |
| 自動換算農曆 | `1991/08/16` |
| 查詢日期 | `2026/07/16` |

關鍵預期值：

- 國曆主命數 `34/7`；農曆主命數 `35/8`。
- 國曆日月綻放 `32/5`；陰曆日月綻放 `24/6`。
- 國曆流年 `23/5`；農曆流年 `24/6`。
- 國曆與農曆今年位格均為 `8`。
- 萬花圖核對固定 11 個位置，左陰右陽、四個木馬位置不得互換。

## 5. 裝置資料

每一種裝置分開填寫；不可把 iPhone 結果複製為 Android 結果。

| Device ID | 裝置型號 | OS／版本 | Browser／版本 | 安裝型態 | 驗收日期 | 執行人 |
| --- | --- | --- | --- | --- | --- | --- |
| IOS-01 | `PENDING` | `PENDING` | Safari `PENDING` | Safari／主畫面 PWA | `PENDING` | `PENDING` |
| AND-01 | `PENDING` | `PENDING` | Chrome `PENDING` | Browser／安裝後 PWA | `PENDING` | `PENDING` |

## 6. 證據規則

- 建議證據目錄：`calculator-deploy/docs/qa/release-2.8.0-device/`。
- 檔名格式：`<Test-ID>_<Device-ID>_<YYYYMMDD>.<ext>`。
- 截圖不得包含真實姓名、生日、通知內容、帳號或其他個資。
- PDF 證據應使用中性固定案例；不得提交真實個案 PDF。
- 每個 `PASS` 至少要有一項可追溯證據或清楚的操作紀錄。
- 發現問題時填 `FAIL`，記錄重現步驟；不得用重新整理後偶爾成功取代失敗紀錄。

結果欄只允許：`PENDING`、`PASS`、`FAIL`、`BLOCKED`、`N/A`。`N/A` 必須寫明
核准理由。

## 7. IOS-01｜iPhone Safari 基本流程

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| IOS-WEB-01 | 以 Safari 開啟 HTTPS Target，頁首顯示 `v2.8.0` | PENDING | |
| IOS-WEB-02 | 首屏、四個入口、兩個 CTA 與底部導覽正常，沒有整頁水平捲動 | PENDING | |
| IOS-WEB-03 | 技術資訊預設收合；必要資料正常時不搶占首屏 | PENDING | |
| IOS-WEB-04 | 輸入固定案例並自動帶入農曆 `1991/08/16` | PENDING | |
| IOS-WEB-05 | 計算完成，主命數、日月綻放、流年與今年位格符合固定值 | PENDING | |
| IOS-WEB-06 | 總覽、國曆、農曆、年度能量、萬花圖核對五頁籤均可切換 | PENDING | |
| IOS-WEB-07 | 萬花圖核對顯示固定 11 個位置，今年位格只顯示最後主數 | PENDING | |
| IOS-WEB-08 | 所有主要按鈕可觸控，底部導覽不遮住內容 | PENDING | |

## 8. IOS-01｜安裝、版本與快取

執行此區前，Target Gate 必須完成。

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| IOS-PWA-01 | 由 Safari 加入主畫面，首次開啟正常並顯示 `v2.8.0` | PENDING | |
| IOS-PWA-02 | 關閉 PWA 後重新開啟，仍可進入主頁與輸入流程 | PENDING | |
| IOS-PWA-03 | 若裝置原有 2.7.0，升級後舊 cache 被清除並顯示 2.8.0 | PENDING | |
| IOS-PWA-04 | Manifest 名稱、圖示、啟動畫面與顯示模式正常 | PENDING | |
| IOS-PWA-05 | Service Worker 使用 `soul-kaleidoscope-v2.8.0`，沒有持續舊版內容 | PENDING | |

若沒有保留 2.7.0 的裝置或可重現環境，`IOS-PWA-03` 應標示 `BLOCKED`，不得直接
填寫 `PASS`。

## 9. IOS-01｜個案保存與備份閉環

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| IOS-CASE-01 | 將固定案例儲存為本機個案 | PENDING | |
| IOS-CASE-02 | 關閉 Safari／PWA 後重開，個案仍存在 | PENDING | |
| IOS-CASE-03 | 載入個案後以目前 Engine 重算，結果一致 | PENDING | |
| IOS-CASE-04 | 匯出全部備份，iPhone「檔案」App 可找到 JSON | PENDING | |
| IOS-CASE-05 | 刪除個案後，匯入備份並合併 | PENDING | |
| IOS-CASE-06 | 匯入後個案與重算結果完整還原 | PENDING | |
| IOS-CASE-07 | 錯誤備份檔不破壞既有個案 | PENDING | |

## 10. IOS-01｜報告、草稿與 PDF

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| IOS-REP-01 | 快速版、完整版、老師版均可開啟 | PENDING | |
| IOS-REP-02 | 重新整理後草稿仍存在 | PENDING | |
| IOS-REP-03 | 同時建立兩份報告，草稿互不覆蓋 | PENDING | |
| IOS-REP-04 | 段落開關同步影響畫面、複製文字與列印內容 | PENDING | |
| IOS-REP-05 | 五階段國曆在上、農曆在下，完整四欄可讀 | PENDING | |
| IOS-REP-06 | 靈魂數字結構國曆在上、農曆在下，手機維持兩欄數值 | PENDING | |
| IOS-REP-07 | Safari 可執行列印／儲存 PDF | PENDING | |
| IOS-REP-08 | PDF 不顯示操作列／編輯器，不截字、不漏頁、不水平溢出 | PENDING | |
| IOS-REP-09 | 隱藏段落不留下多餘空白頁 | PENDING | |

## 11. IOS-01｜離線報告

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| IOS-OFF-01 | 在線狀態先建立一份固定案例報告 | PENDING | |
| IOS-OFF-02 | 切換飛航模式／離線後，已快取 App 可重新開啟 | PENDING | |
| IOS-OFF-03 | 離線狀態可重新開啟既有報告資產 | PENDING | |
| IOS-OFF-04 | 回到連線狀態後功能恢復，沒有資料損壞 | PENDING | |

## 12. AND-01｜Android Chrome 煙霧測試

| Test ID | 操作與預期 | 結果 | 證據／備註 |
| --- | --- | --- | --- |
| AND-WEB-01 | Chrome 開啟 HTTPS Target，顯示 `v2.8.0` | PENDING | |
| AND-WEB-02 | 固定案例可輸入、換算、計算與清除 | PENDING | |
| AND-WEB-03 | 五頁籤、年度能量與萬花圖核對可操作 | PENDING | |
| AND-PWA-01 | 安裝後 PWA 可開啟、關閉並重新開啟 | PENDING | |
| AND-REP-01 | 完整版報告可開啟，最新上下排列正常 | PENDING | |
| AND-OFF-01 | 已快取 App 的基本離線開啟正常 | PENDING | |

## 13. 問題紀錄

| Issue ID | Test ID | 嚴重度 | 重現步驟 | 預期 | 實際 | 處理狀態 |
| --- | --- | --- | --- | --- | --- | --- |
| `PENDING` | | | | | | |

嚴重度：

- P0：資料損壞、公式錯誤、個資外洩或無法回復的發布事故。
- P1：主要計算、PWA 啟動、個案還原或三種報告無法使用。
- P2：重要流程可繞行但明顯不符合驗收要求。
- P3：不阻擋發布的視覺或文字細節。

P0／P1 未關閉時不得將 PR #11 標記 Ready。P2 必須有修正或明確的人工核准；
P3 可列入後續 Backlog。

## 14. Gate Summary

| Gate | 狀態 | 說明 |
| --- | --- | --- |
| Candidate identity | PASS | Branch、PR、Base 與功能候選 Commit 已記錄 |
| Candidate HTTPS Target | PENDING | 尚未填入 |
| iPhone Safari | PENDING | 尚未執行 |
| Installed iPhone PWA | PENDING | 尚未執行 |
| Case Store persistence／backup | PENDING | 尚未執行 |
| Report／draft／PDF | PENDING | 尚未執行 |
| Offline report | PENDING | 尚未執行 |
| Android smoke | PENDING | 尚未執行 |
| Open P0／P1 | PENDING | 驗收後填寫 |
| Final G1 device acceptance | PENDING | 所有必要 Gate 完成後才能改為 PASS |

## 15. 後續核准點

實機驗收完成後依序執行：

1. 固定 PR #11 最新 Head SHA 並確認同一 SHA 的 CI PASS。
2. 回填本文件、`RELEASE_2.8.0_READINESS.md` 與 PR #11 說明。
3. 取得將 PR #11 標記 Ready for Review 的獨立核准。
4. 完成 promotion review 並關閉必要問題。
5. 取得 PR #11 merge 的獨立核准。
6. Merge 後另行取得 Cloudflare production deployment 核准。

本文件不授權 Preview deployment、promotion merge、Cloudflare production
deployment、Runtime publication 或 Dataset publication。
