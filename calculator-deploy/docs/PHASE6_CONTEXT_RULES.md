# Phase 6｜複合數、位置與週期規則執行規格

> 狀態：候選審核中  
> 候選版本：0.1.0  
> 日期：2026-07-13  
> 分支：`phase6-context-rules-20260713`  
> Draft PR：`#9`  
> CI：Calculator CI run 92 passed  
> 正式資料效力：無；合併前仍需人工審核

## 1. 本階段目的

Phase 6 不重新解釋 0～9，而是定義「同一個數字出現在不同位置、日期系統、週期與權重時，資料應如何保存、引用與組裝」。

本階段採保守策略：

1. 只建立結構、角色與引用邊界。
2. 只引用 Phase 4 已核准公式與 Phase 5 已核准基本數字。
3. 不把 Google Drive 候選主題庫直接升級為 App 正式資料。
4. 不自動生成 81 組流年 × 位格解讀。
5. 不補寫缺數、數字 0／4 次數、4 次以上或條件型組合。

## 2. 與 Phase 13 的關係

Phase 13 是跨階段的資料平台基礎設施，不是內容階段的替代品。

- Phase 6～10：決定「什麼內容可以成為正式資料」。
- Phase 13：決定「正式資料如何從 Drive 經審核進入 GitHub、CI 與 App」。

因此本次 Phase 6 只建立 Candidate，不直接寫入 runtime published JSON。

## 3. 本批產出

| 產出 | 路徑 | 用途 |
|---|---|---|
| Context Rule Schema | `schemas/context-rule.schema.json` | 驗證 Phase 6 規則格式 |
| Phase 6 Candidate | `data/knowledge/candidates/context-rules.phase6.v0.1.json` | 保存 14 條保守候選規則 |
| Context Rule Tests | `tests/run-context-rule-tests.js` | 阻止未核准內容自動發布 |
| Review Template | `data/knowledge/reviews/context-rules.phase6.review-template.json` | 保存逐條人工決策 |
| Knowledge Manifest 更新 | `data/knowledge/manifest.v1.json` | 登錄 Phase 6 Candidate |
| Source Gap Register | `docs/PHASE6_SOURCE_GAP_REGISTER.md` | 管理 Phase 6B 補洞工作 |
| Review Checklist | `docs/PHASE6_REVIEW_CHECKLIST.md` | 管理人工審核與核准門檻 |
| Master Execution Plan | `docs/MASTER_EXECUTION_PLAN_2026-07-13.md` | 統一 Phase 6～10 與平台化工作 |

## 4. 候選規則清單

| ID | 類型 | 主題 |
|---|---|---|
| CTX-001 | number-chain | 完整鏈式與最後主數雙層保存 |
| CTX-002 | number-chain | 複合數與基本數字分層引用 |
| CTX-003 | calendar-role | 國曆與農曆結果分開保存 |
| CTX-004 | position-role | 日月綻放是位置角色 |
| CTX-005 | position-role | 四組木馬依期間分工 |
| CTX-006 | position-role | 國曆與農曆貴人分開保存 |
| CTX-007 | annual-cycle | 流年描述年度行動主題 |
| CTX-008 | annual-cycle | 今年位格描述運作位置 |
| CTX-009 | birthday-switch | 生日切換由查詢日期決定 |
| CTX-010 | annual-cycle | 流年與位格 81 組只建立結構鍵 |
| CTX-011 | weighting | 重複數字只增加權重 |
| CTX-012 | innate-frequency | 先天數可用與封鎖範圍 |
| CTX-013 | conditional-combination | 條件型組合維持待審 |
| CTX-014 | soul-level-link | 靈魂等級採單向引用 |

## 5. 81 組流年 × 位格處理

本階段只定義：

```text
match_key = annual:<1-9>|position:<1-9>
```

驗證條件：

- annual 維度：1～9。
- position 維度：1～9。
- 總數：81。
- `interpretations = null`。
- `autoGenerateInterpretations = false`。

任何正式組合解讀都必須另有來源、逐組審核與版本紀錄。

## 6. 明確封鎖範圍

1. 缺數正式解讀。
2. 數字 0、4 的先天數次數解讀。
3. 4 次、5 次以上與過度集中解讀。
4. `123 皆具`、`有 4＋不同數量的 1` 等條件型組合。
5. 81 組流年 × 位格正式文案。
6. 彩油、精油、視覺幾何與儀式應用。

封鎖範圍只能經新的來源核對與人工核准解除。

## 7. 驗收門檻

Phase 6A 完成條件：

- [x] 14 條候選規則有唯一 ID。
- [x] 每條規則至少有一個來源與依賴。
- [x] 沒有複製 0～9 正文到位置規則。
- [x] 81 組只建立 match key 結構。
- [x] Candidate 維持 `autoPublish: false`。
- [x] CI 加入 context rule test。
- [x] Review Template 已建立。
- [x] Source Gap Register 已建立。
- [x] Draft PR #9 已建立。
- [x] Calculator CI run 92 全部通過。
- [ ] 使用者核准規則內容。
- [ ] 核准後建立 Canonical v1.0.0。
- [ ] 核准後才評估是否讓 App 讀取。

## 8. 後續子階段

### Phase 6B｜來源補洞

優先核對：

1. 生命階段完整年齡區間。
2. 缺數正式內容。
3. 數字 0、4 的先天數次數。
4. 4 次、5 次以上與過度集中。
5. 條件型組合與優先序。
6. 81 組是否已有既存來源。

### Phase 6C｜人工審核

每條候選只能做以下決定之一：

- Adopt
- AdoptWithChanges
- KeepCandidate
- Conflict
- Rejected

### Phase 6D｜正式發布

核准後：

1. 建立 approval record。
2. 候選版本由 `0.1.0` 升為 `1.0.0`。
3. 狀態改為 `Canonical`。
4. 新增 published target。
5. 擴充 CI 確認只有 Canonical 可進 runtime。
6. 更新 changelog 與 rollback 記錄。
