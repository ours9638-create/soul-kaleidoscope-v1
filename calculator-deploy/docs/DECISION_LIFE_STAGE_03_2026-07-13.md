# 正式決策紀錄｜第三階段「主軸」

> 決策 ID：DEC-LIFESTAGE-003  
> 決策日期：2026-07-13  
> 決策人：專案擁有者  
> 狀態：Approved  
> 適用範圍：Phase 6B／生命階段來源對齊  
> 來源：專案擁有者於本次審核中明確確認

## 1. 正式決策

第三階段正式定義為：

- 階段名稱：**主軸**
- 正式角色：**終其一生的主軸**
- 對應柱位：**日柱**
- 是否為固定年齡區間：**否**
- 是否終生有效：**是**

第三階段不是只在某一段年齡啟動、之後結束的排他性年齡階段；它是從出生至生命全程持續存在的核心主軸。

## 2. 與其他階段的關係

第三階段可以與第四、第五階段同時存在：

- 第四階段「收成」：41～60 歲，月柱，屬於年齡觸發的生命時期。
- 第五階段「圓滿」：61 歲以後，年柱，屬於年齡觸發的生命時期。
- 第三階段「主軸」：終其一生，日柱，屬於持續性的核心角色。

因此，資料模型不得把第三階段與第四、第五階段處理成彼此互斥的單一時間區間。

## 3. 舊定義處理

舊整理中的「第三階段＝21～40 歲」：

- 不再作為正式規則。
- 狀態標記為 `deprecated-as-official-rule`。
- 僅保留在來源衝突與稽核紀錄中，不得進入 Canonical 文案、App 或報告組裝。
- 21～40 歲目前不另行創建未經來源支持的新階段名稱或解讀。

## 4. 建議資料欄位

```text
stageNumber: 3
stageName: 主軸
pillar: 日柱
roleType: lifelong-axis
ageStart: null
ageEnd: null
appliesThroughoutLife: true
exclusiveAgeBand: false
coexistsWithChronologicalStages: true
```

## 5. 發布邊界

本決策只解決 P6B-01 的第三階段來源衝突，不代表：

- Phase 6 的 14 條 Context Rule 已全部核准。
- CTX-002、CTX-004、CTX-011、CTX-014 的修正文案已核准。
- Candidate 已升級為 Canonical。
- Draft PR #9 可以直接合併。
- App 可以讀取本項資料。

本規則進入正式資料前，仍須建立 Candidate／Canonical 資料結構、Schema 驗證及回歸測試。
