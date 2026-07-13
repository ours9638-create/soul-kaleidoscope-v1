# Phase 6｜人工審核清單

> 候選資料：`data/knowledge/candidates/context-rules.phase6.v0.1.json`  
> 候選版本：0.1.0  
> 審核狀態：Pending  
> 原則：每一條規則必須個別決策，不以整包一次核准取代逐條審核

## 1. 可用決策

| 決策 | 說明 |
|---|---|
| Adopt | 原文可直接採用 |
| AdoptWithChanges | 修正後採用，需記錄修改內容 |
| KeepCandidate | 保留候選，暫不發布 |
| Conflict | 與其他正式規則或來源衝突 |
| Rejected | 不採用 |

## 2. 共通審核問題

每一條規則均需確認：

- 來源是否可追溯到正式規則、原始教材或已核准文件。
- 是否只定義位置、週期與引用邊界，沒有重寫 0～9 本體。
- 是否保留國曆與農曆的獨立性。
- 是否保存完整鏈式與最後主數。
- 是否避免保證性、宿命性或人格診斷語句。
- 是否明確標示未知範圍與封鎖條件。
- 是否需要補充例外、優先序或人工確認條件。
- 是否會影響現有公式回歸測試。
- 是否可在不讀取 Candidate 的情況下安全合併。

## 3. 逐條審核表

| ID | 主題 | 主要審核點 | 決策 | 修正內容／備註 |
|---|---|---|---|---|
| CTX-001 | 完整鏈式與最後主數雙層保存 | 完整鏈是否不可遺失；最後主數是否只作 0～9 引用 |  |  |
| CTX-002 | 複合數與基本數字分層引用 | 是否避免把複合數建立成第二套基本數字 |  |  |
| CTX-003 | 國曆與農曆結果分開保存 | 是否禁止合併相加與互相覆蓋 |  |  |
| CTX-004 | 日月綻放是位置角色 | 是否與主命數、日座數及其他位置清楚分離 |  |  |
| CTX-005 | 四組木馬依期間分工 | 四個期間是否符合正式規則；結果 0 是否保留 |  |  |
| CTX-006 | 國曆與農曆貴人分開保存 | 是否保留兩個來源與兩個位置，不因數值相同而合併 |  |  |
| CTX-007 | 流年描述年度行動主題 | 是否只描述年度主題，不作事件預言 |  |  |
| CTX-008 | 今年位格描述運作位置 | 是否只顯示最後主數；是否與流年分離 |  |  |
| CTX-009 | 生日切換由查詢日期決定 | 國曆／農曆是否各自判斷；閏月與無法唯一換算是否進人工確認 |  |  |
| CTX-010 | 流年與位格 81 組只建立結構鍵 | 是否維持 interpretations=null 且禁止自動拼接 |  |  |
| CTX-011 | 重複數字只增加權重 | 權重是否不改寫基本數字；是否與先天數次數規則分離 |  |  |
| CTX-012 | 先天數可用與封鎖範圍 | 是否只開放已核准的 1～3 次內容 |  |  |
| CTX-013 | 條件型組合維持待審 | 是否完整封鎖未定義的組合與優先序 |  |  |
| CTX-014 | 靈魂等級採單向引用 | 是否只引用計算結果，不反向推導公式或數字本體 |  |  |

## 4. 整包核准前檢查

- [ ] 14 條規則均有決策。
- [ ] 所有 `AdoptWithChanges` 均完成修訂與二次確認。
- [ ] 所有 `Conflict` 均建立衝突紀錄。
- [ ] 所有 `KeepCandidate` 與 `Rejected` 不會進入 published target。
- [ ] 81 組矩陣仍未自動生成解讀。
- [ ] 六項 blocked scope 未被解除。
- [ ] Review Template 與實際決策一致。
- [ ] Candidate 已通過 `npm run test:context`。
- [ ] 完整 `npm test` 與 build 通過。
- [ ] 建立 approval record。
- [ ] 建立 Canonical v1.0.0 草案，但尚未讓 App 讀取。
- [ ] 更新 changelog 與 rollback 說明。

## 5. 正式核准紀錄最低欄位

正式 approval record 至少包含：

- datasetId
- candidateVersion
- canonicalVersion
- reviewer
- reviewedAt
- adoptedRuleIds
- changedRuleIds
- keptCandidateRuleIds
- conflictRuleIds
- rejectedRuleIds
- sourceSnapshot
- testSummary
- approvalStatement

未填妥以上欄位，不得把資料狀態改成 `Canonical`。
