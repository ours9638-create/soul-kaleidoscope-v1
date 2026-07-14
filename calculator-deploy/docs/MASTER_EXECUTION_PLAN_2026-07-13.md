# 靈魂萬花筒｜後續完整執行總計畫

> 版本：1.0.0  
> 日期：2026-07-13  
> 適用範圍：Phase 6～10 與 Knowledge Platform  
> 執行原則：一次完成一個內容 Gate；平台工程可平行，但不得繞過內容核准

## 1. 現況判定

已完成：

- Phase 0：治理規範。
- Phase 1：來源盤點。
- Phase 2：分類與欄位架構。
- Phase 3：候選抽取與衝突整理。
- Phase 4：核心計算規則保守定版。
- Phase 5：0～9 基本數字與 24 筆先天數 1～3 次解讀。
- Calculator App：計算、個案儲存、報告預覽與靈魂萬花圖資料模型。
- Knowledge Platform 基礎：Drive Candidate、GitHub Schema、CI Gate。

目前主線應回到 Phase 6。Knowledge Platform 視為基礎設施軌，不取代 Phase 6～10。

## 2. 建議執行順序

| 順序 | 階段 | 核心成果 | 發布門檻 |
|---:|---|---|---|
| 1 | Phase 6 | 複合數、位置、週期、權重與封鎖規則 | Context Rules Canonical |
| 2 | Phase 7 | 語句庫、組裝規則與報告內容層 | 可追溯、不重複、不斷言 |
| 3 | Phase 8A | 彩油應用 | 每個數字位置一瓶、來源與顏色核對 |
| 4 | Phase 8B | 精油應用 | 安全、濃度、滴數與數字引用分離 |
| 5 | Phase 8C | 靈魂萬花圖與 SNGL | 固定位置、陰陽方向、年度外圈 |
| 6 | Phase 8D | 儀式與魔法應用 | 僅作應用，不回寫核心 |
| 7 | Phase 9 | 全系統回歸 | 計算、內容、報告、應用一致 |
| 8 | Phase 10 | 正式自動化與發布 | 只讀 Canonical，可回滾 |
| 平行軌 | Platform | Drive → Candidate → Review → JSON → CI → App | 任何非 Canonical 不得上線 |

## 3. Phase 6｜位置與週期規則

### 6A 結構候選

本批已執行：

- 建立 14 條 Context Rule Candidate。
- 建立 Schema。
- 建立 CI Test。
- 建立 81 組 match key 結構。
- 明確封鎖未知內容。

### 6B 來源補洞

待核對：

- 生命階段完整區間。
- 缺數。
- 0／4 次數解讀。
- 4 次與 5 次以上。
- 過度集中。
- 條件型組合。
- 81 組既有資料來源。

### 6C 人工核准

採用保守模式：無來源即不發布。

## 4. Phase 7｜報告語句與組裝

### 資料模組

1. 核心摘要。
2. 成熟展現。
3. 失衡提醒。
4. 行動建議。
5. 關係情境。
6. 工作與資源情境。
7. 年度情境。
8. 生日前／生日後過渡語句。
9. 國曆／農曆並列與整合語句。
10. 重複數字去重與權重語句。

### 組裝規則

- 先位置，再數字。
- 先固定主頻率，再年度變化。
- 國曆與農曆並列，最後才做整合摘要。
- 相同核心句不得重複出現。
- 沒有正式資料時顯示中性缺口，不生成補洞文字。
- 不使用人格診斷、宿命斷言或高低等級標籤。

### 產出

- `sentence-library`
- `report-assembly-rules`
- `deduplication-rules`
- `report-section-contract`
- 報告回歸案例

## 5. Phase 8｜應用層

### 8A 彩油

需建立：

- Bottle master。
- 瓶號、上下層顏色、正式名稱、版本與來源。
- 一個數字位置對應一瓶。
- 重複數字仍重複呈現。
- `00、0` 等重複位置不能合併成一瓶。
- 彩油只作應用解讀，不作靈魂萬花圖配色。

### 8B 精油

需建立：

- Essential oil master。
- 成本、容量、濃度、滴數與安全欄位。
- 數字推薦與配方計算分離。
- 使用者既有公式：基底油 ml × 濃度% × 20 滴。
- 產品、孕期、兒童、光敏與禁忌欄位。
- 配方預設不超過 4 種精油。

### 8C 靈魂萬花圖

需固定：

- 中心主命數。
- 上方日月綻放。
- 左上木馬二、右上木馬一。
- 左下木馬三、右下木馬四。
- 左側陰曆貴人、右側陽曆貴人。
- 下方流年、最外圈今年位格。
- 左陰右陽、左旋陰曆、右旋陽曆。
- 中心固定，年度只改外圈。
- 圖面少字，報告承接標籤與解讀。
- 配色只依數字色，不依彩油瓶色。

### 8D 儀式

- 魔法教科書只作儀式與象徵應用。
- 儀式內容不得成為公式來源。
- 所有儀式語句標示應用性與非保證性。

## 6. Phase 9｜驗證

建立五層測試：

1. Formula tests。
2. Knowledge schema tests。
3. Context rule tests。
4. Report snapshot tests。
5. Application isolation tests。

必要案例：

- 國曆與農曆生日不同步。
- 閏月與需人工確認。
- 生日前／生日後。
- 0、00、10／1、11／2、22／4、33／6。
- 木馬含 0。
- 重複數字 1～3 次。
- 被封鎖的缺數與 4 次以上。
- 81 組 match key 完整性。
- `37/10/1 = 5級` 回歸。
- 個案資料不得進通用資料庫。

## 7. Phase 10｜發布

正式發布流程：

```text
Drive 正式內容
→ Snapshot
→ Candidate
→ Diff
→ 人工核准
→ Canonical JSON
→ Schema/Test
→ PR
→ CI
→ Merge
→ Cloudflare
→ 線上驗收
→ Release Record
```

必要控制：

- Candidate 不得被 App 直接讀取。
- 每個資料集有版本與 rollback。
- App、Engine、Content、Schema 各自版本化。
- 敏感個案只保存在本機或受控後端。
- 部署失敗不修改來源資料。
- 線上驗收包含桌機、iPhone Safari、PWA cache。

## 8. 近期三個里程碑

### M1｜Phase 6A Candidate

- Schema、14 條規則、CI Gate、Draft PR。
- 狀態：本批執行。

### M2｜Phase 6 審核包

- 來源差異。
- 缺口清單。
- 採用／延後決策。
- Canonical 版本草案。

### M3｜Phase 7 MVP

- 以一個完整個案產生不重複、可追溯的核心報告。
- 不含彩油、精油與儀式。
- 通過 snapshot 與語句去重測試。

## 9. 治理結論

後續不再同時開啟多個內容 Phase。每批必須依序完成：

```text
來源 → Candidate → 差異 → 人工核准 → Canonical → 測試 → 發布
```

平台工程可以先準備 Schema、CI 與資料管線，但不得把尚未核准的內容送進 App。
