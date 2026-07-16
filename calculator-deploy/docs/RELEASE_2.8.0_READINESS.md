# 靈魂萬花筒｜App 2.8.0 Release Readiness

## 1. 目前狀態

- App／PWA：`2.8.0`
- Engine：`2.2.1`，未變更
- UI-B PR：`#10`，已合併
- Merge commit：`3b56ead1bf594945e88d85a37b7aea51b614feb4`
- 整合分支：`r3-runtime-foundation-closeout`
- Release-readiness 分支：`feature/release-2.8.0-readiness`
- Cloudflare production branch：`calculator-deploy-setup`
- 正式部署：尚未執行

此階段只建立發布證據與完成可離線執行的驗收。Push、promotion PR、
promotion merge、Cloudflare deployment、Runtime publication 與 Dataset
publication 均為獨立核准點。

## 2. 發布內容

- 品牌首屏與兩個導引 CTA。
- 四個核心入口與五個結果頁籤。
- 出生資料用途與本機保存說明。
- 真實 WebP 宇宙／神聖幾何資產。
- Tabler SVG 導覽與箭頭圖示。
- 收合式系統技術資訊，載入失敗時自動展開。
- UI 資產存在性檢查與 Service Worker cache `soul-kaleidoscope-v2.8.0`。

不包含公式、Engine、Soul Profile Schema、Published Dataset、Report Model、
Kaleidoscope Model 或個案儲存語意變更。

## 3. 已完成證據

| Gate | 狀態 | 證據 |
| --- | --- | --- |
| PR CI release toolchain | PASS | Calculator CI `29490592334`; Node.js 24.16.0 / npm 11.13.0 |
| Root suite | PASS | 131/131 |
| Calculator regression | PASS | 86/86 |
| Core self-tests | PASS | 29/29 |
| Case Store | PASS | 24/24 |
| Report Model | PASS | 44/44 |
| Kaleidoscope Model | PASS | 18/18 |
| Knowledge data | PASS | 28/28；Candidate auto-publish 維持阻擋 |
| Runtime Foundation | PASS | 43/43 + 33/33 |
| Static source validation | PASS | 110/110 |
| Desktop／mobile Design QA | PASS | `design-qa.md` 與 `docs/qa/` |
| 系統資訊收合與失敗展開 | PASS | 桌機／手機 QA 截圖與互動檢查 |

## 4. G1 自動與本機檢查

- [x] 從 merge commit 建立乾淨 worktree。
- [x] `npm test` — 131/131。
- [x] `npm --prefix calculator-deploy test` — 86/86、24/24、44/44、18/18、28/28、43/43、33/33。
- [x] `npm --prefix calculator-deploy run build` — static 110/110、formula 29/29。
- [x] 確認 protected R3 Runtime、公式及 Published Dataset 沒有 G1 差異。
- [x] 確認 build 只產生預期的 `lunar-data.js`、`sngl-data.js` 與 knowledge diff report。
- [x] 本機 preview 首頁、manifest、Service Worker、品牌圖片與圖示均回應成功；cache closure 33/33。
- [x] 本機 HTML／JavaScript 可解析，沒有遺漏資產。

本機重跑日期為 2026-07-16，使用 Node.js 24.14.0／npm 11.9.0。宣告的
Node.js 24.16.0／npm 11.13.0 工具鏈已由同一個 PR Head 的 GitHub Actions
Calculator CI `29490592334` 驗證成功。

## 5. 必須由實機完成的檢查

下列項目不能由桌面模擬取代，未完成時不得宣稱 2.8.0 已正式驗收：

- [ ] iPhone Safari 顯示 `v2.8.0`，首屏與輸入流程正常。
- [ ] 加入主畫面後首次開啟正常。
- [ ] 從 2.7.0 升級後舊 cache 被清除，重新開啟仍為 2.8.0。
- [ ] PWA 重開後 LocalStorage 個案仍存在。
- [ ] 完成「匯出 → 刪除 → 匯入 → 重算」閉環。
- [ ] 快速版、完整版、老師版均可開啟。
- [ ] 草稿重新整理後仍存在，兩份報告互不覆蓋。
- [ ] iPhone 可列印／儲存 PDF，表格不超出 A4、隱藏段落不留空白頁。
- [ ] 已建立報告後切換離線，既有報告資產仍可重新開啟。
- [ ] Android Chrome／安裝後 PWA 完成一輪基本煙霧測試。

實機驗收只使用中性 Mock Data，不使用真實個案資料。

## 6. Promotion topology

Cloudflare 目前設定的 production branch 是 `calculator-deploy-setup`。2.8.0 的
promotion 不應直接部署 `r3-runtime-foundation-closeout`，而應：

- Production head：`94e6374ab62a4ba9c0928ab78a4718b1fd4621ee`。
- Read-only merge-base 檢查確認 production head 是目前 release candidate 的祖先，沒有 production-only commit 需要回收。
- Promotion 預期包含 reproducible-build、R3 Runtime Foundation、UI-B 與 G1 發布文件。

1. 產生 `calculator-deploy-setup...release candidate` 完整差異。
2. 確認差異包含 reproducible-build、R3 Runtime Foundation 與 UI-B 的預期提交。
3. 建立獨立 promotion PR。
4. 在宣告的 Node.js 24.16.0／npm 11.13.0 工具鏈重跑 CI。
5. 取得 promotion merge 核准。
6. merge 後另行取得 Cloudflare deployment 核准。

不得以修改 Cloudflare production branch 設定繞過 promotion review。

## 7. Release gate

符合以下全部條件後，才可請求 deployment 核准：

- 所有自動測試與 production build 通過。
- G1 文件與實際版本一致。
- 實機清單完成並留下日期、裝置與結果。
- Promotion PR 沒有未解決 Review Thread。
- Head SHA 固定且 release toolchain CI 成功。
- Rollback 目標仍指向最後已知正常的 2.7.0 Worker version。
- 未發布任何 Runtime 或 Dataset 變更。

## 8. 目前停止點

完成 G1 本機證據後，停在以下核准點：

> 核准推送 `feature/release-2.8.0-readiness` 並建立 promotion Draft PR；不合併、不部署。
