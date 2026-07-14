# Phase 6｜人工審核清單

> 候選資料：`data/knowledge/candidates/context-rules.phase6.v0.1.json`  
> 候選版本：0.1.0  
> 審核狀態：Approved  
> 審核日期：2026-07-14  
> 審核人：`ours9638-create`  
> 原則：逐條記錄決策；本次核准授權建立 Canonical 草案，不等同 Runtime 發布。

## 1. 決策定義

| 決策 | 說明 |
|---|---|
| Adopt | 原文可直接採用 |
| AdoptWithChanges | 修正後採用，已記錄修改內容 |
| KeepCandidate | 保留候選，暫不發布 |
| Conflict | 與其他正式規則或來源衝突 |
| Rejected | 不採用 |

## 2. 共通審核原則

- 來源可追溯至正式規則、原始教材或已核准文件。
- 只定義位置、週期與引用邊界，不重寫 0～9 本體。
- 國曆與農曆維持獨立。
- 完整鏈式與最後主數同時保存。
- 不使用保證性、宿命性或人格診斷語句。
- 未知範圍與封鎖條件繼續保留。
- 不影響 Engine 2.2.1 既有公式回歸。
- Candidate、Approval Record 與 Canonical Draft 不得被 Runtime 自動讀取。

## 3. 逐條審核結果

| ID | 主題 | 決策 | 修正內容／備註 |
|---|---|---|---|
| CTX-001 | 完整鏈式與最後主數雙層保存 | Adopt | 完整鏈不可遺失；最後主數只作 0～9 正式本體引用。 |
| CTX-002 | 複合數與基本數字分層引用 | AdoptWithChanges | 未核准的複合數意義維持 Pending；未來正式複合數資料庫須有獨立版本、來源與審核流程。 |
| CTX-003 | 國曆與農曆結果分開保存 | Adopt | 禁止合併相加與互相覆蓋。 |
| CTX-004 | 日月綻放是位置角色 | AdoptWithChanges | 固定輸出 `daySeatFinal`、`dayMoonFullChain`、`dayMoonFinal`、`calendarType`、`sourceMonth`、`sourceDay`、`baseNumberRef`；日座數與日月綻放分離。 |
| CTX-005 | 四組木馬依期間分工 | Adopt | 木馬一 40 前、木馬二 36～40、木馬三終其一生、木馬四 41 後；結果 0 保留。 |
| CTX-006 | 國曆與農曆貴人分開保存 | Adopt | 來源與位置分開，不因數值相同而合併。 |
| CTX-007 | 流年描述年度行動主題 | Adopt | 僅描述年度主題，不作事件預言。 |
| CTX-008 | 今年位格描述運作位置 | Adopt | 位格與流年分離；正式顯示最後主數。 |
| CTX-009 | 生日切換由查詢日期決定 | Adopt | 國曆／農曆各自判斷；閏月、多義或找不到日期時保留 `needsReview`。 |
| CTX-010 | 流年與位格 81 組只建立結構鍵 | Adopt | `interpretations=null`，禁止自動拼接成正式解讀。 |
| CTX-011 | 重複數字只增加權重 | AdoptWithChanges | 優先序：已核准專屬次數語句 > 通用權重語句 > 中性缺口提示；通用權重不得產生新結論。 |
| CTX-012 | 先天數可用與封鎖範圍 | Adopt | 只開放已核准的 24 筆 1～3 次內容；數字 0、4 不套用一般次數模型。 |
| CTX-013 | 條件型組合維持待審 | Adopt | 未定義條件組合與優先序繼續封鎖。 |
| CTX-014 | 靈魂等級採單向引用 | AdoptWithChanges | 固定回歸 `37/10/1 = 5級`；所有後天過程數依 Engine 2.2.1 納入判斷。 |

## 4. 整包核准檢查

- [x] 14 條規則均有決策。
- [x] 四條 `AdoptWithChanges` 已完成修正文案並獲核准。
- [x] `Conflict` 為 0。
- [x] `KeepCandidate` 與 `Rejected` 為 0。
- [x] 81 組矩陣仍未自動生成解讀。
- [x] 六項 blocked scope 未解除。
- [x] Review Template 與實際決策一致。
- [x] 建立 Approval Record。
- [ ] 建立 Canonical v1.0.0 草案，但尚未讓 App 讀取。
- [ ] Canonical 草案通過 Schema、Context Rule 與 Runtime Isolation 測試。
- [ ] 更新 changelog 與 rollback 說明。
- [ ] 另行確認是否合併 PR #9。
- [ ] 另行確認 Runtime 發布。

## 5. 正式核准紀錄

Approval Record：

```text
data/knowledge/approvals/context-rules.phase6.approval.2026-07-14.json
```

決策統計：

```text
Adopt: 10
AdoptWithChanges: 4
KeepCandidate: 0
Conflict: 0
Rejected: 0
```

本次核准不包含：

- Candidate 直接發布。
- 81 組流年 × 位格正式文案。
- 缺數、數字 0／4 一般次數、4 次以上或條件型組合解鎖。
- 彩油、精油、儀式內容回寫核心規則。
- PR 合併或 Cloudflare 部署。
