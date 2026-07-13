# Phase 13｜Google Drive × GitHub Knowledge Platform

版本：`1.0`  
狀態：第一批 0～9 候選資料橋接已建立

## 1. 目的

讓 Google Drive Knowledge Base 與 GitHub App 資料共同使用，但維持單一治理流程：

```text
Google Drive Knowledge Base
→ 欄位映射
→ Candidate 快照
→ 差異報告
→ 人工審核
→ Canonical
→ GitHub 發布 JSON
→ CI
→ Cloudflare／PWA／報告／萬花圖
```

Google Drive 是人工作業與來源治理層；GitHub JSON 是程式發布層。PWA 不在執行時直接讀取 Google Drive。

## 2. 既有正式來源

### Google Drive

- Knowledge Base folder：`18pitXmSuxH2HjYRK-o-8mId5oORQcFID`
- Schema：`02_資料庫Schema_V1`
- Number Topic Sheet：`03_數字主題庫_0到9_V1`
- Records：`靈魂萬花筒/Records`
- 正式治理文件：`SOURCE_PRIORITY.md`、`DATABASE_STRUCTURE.md`

### GitHub

- App 發布資料：`data/sngl/numbers.v1.json`
- 位格發布資料：`data/sngl/positions.v1.json`
- Knowledge manifest：`data/knowledge/manifest.v1.json`
- Drive 欄位映射：`data/knowledge/mappings/number-topic.drive.v1.json`
- Candidate 快照：`data/knowledge/candidates/number-topics.drive.v1.json`
- 差異報告：`data/knowledge/reports/number-topic-diff.generated.json`

## 3. 資料角色

| 層級 | 角色 | 可否直接給 App 使用 |
|---|---|---|
| Drive source | 原始來源、人工編輯、閱讀版、課程頁碼 | 否 |
| Candidate | 已結構化但尚未正式核准 | 否 |
| Reviewed | 已完成內容審查但尚未發布 | 否 |
| Conflict | 存在來源或欄位衝突 | 否 |
| Canonical | 已有人工作業核准及版本紀錄 | 是 |
| Published JSON | CI 驗證通過的正式快照 | 是 |
| Records | 修改、決策、比較、遷移紀錄 | 否 |

只有 `reviewStatus = Canonical` 的資料可以進入發布層。

## 4. Knowledge Record

共同資料封套至少包含：

```text
id
domain
matchKey
reviewStatus
version
lastReviewedAt
sourceRefs
content
applications
governance
```

正式 Schema：`schemas/knowledge-record.schema.json`

### content

正式解讀核心：

- title
- theme
- observation
- mature
- imbalance
- action
- keywords

### applications

應用層：

- geometry
- colors
- relationship
- money
- spiritual
- affirmation
- energyCorrespondence
- bodyNotes

應用層不得反推公式。

### governance

- sourceStatus
- notes
- conflicts
- approvedBy
- approvalRecord

候選資料的舊狀態文字不可直接轉成 `Canonical`。

## 5. 第一批 0～9

Drive Sheet 共 10 筆：`NUM-000` 至 `NUM-009`。

本階段已完成：

- 22 欄欄位映射。
- 0～9 Candidate JSON 快照。
- Drive row、來源 ID、頁碼與修改時間追蹤。
- Candidate 與 `numbers.v1.json` 差異產生器。
- 發布門檻：Candidate 不得自動發布。
- Knowledge Data CI 測試。

### 已知需要人工決策

- Drive 顏色與 App 目前配色存在多處差異。
- Drive 的「核心原型」欄位內容不一致，不能自動映射成幾何原型。
- 部分來源文字仍含標籤、健康暗示或過度斷言，需要正式語氣審核。
- Drive 的「已校稿／正式版本」文字不等於治理狀態 `Canonical`。
- Drive 閱讀版內容較完整；App `numbers.v1.json` 是精簡報告語句，兩者不應直接覆蓋。

## 6. 差異檢查

執行：

```bash
npm run knowledge:diff
```

輸出：

```text
data/knowledge/reports/number-topic-diff.generated.json
```

比較欄位：

- title
- observation／core
- mature
- imbalance
- action
- colors

`geometry` 一律列為人工核對，直到 Drive 建立穩定幾何欄位。

差異存在不代表 Build 失敗；未核准資料進入發布層才必須失敗。

## 7. CI 發布門檻

執行：

```bash
npm run test:knowledge
```

必須驗證：

- manifest、mapping、candidate、published JSON 可解析。
- Candidate 固定包含 0～9、ID 不重複、matchKey 不重複。
- 所有候選資料均有來源追蹤。
- 所有 Candidate 都不能自動發布。
- Runtime 不直接讀取 Drive。
- 差異報告可以產生且不缺 Published record。
- 只有 Canonical 可以進入發布層。

## 8. 人工審核流程

每次只處理一個明確資料集或小批次：

1. 確認 Drive 來源位置與修改時間。
2. 建立 Candidate 快照。
3. 產生差異報告。
4. 逐欄決定採用 Published、Candidate 或重新改寫。
5. 建立 Records 決策紀錄。
6. 指定 approvedBy、approvalRecord、lastReviewedAt。
7. reviewStatus 改為 Canonical。
8. 產生新的 Published JSON 版本。
9. CI 通過後部署。

不得以 Candidate 自動覆蓋正式 App。

## 9. 後續批次

依序進行：

1. Number Topic 0～9 人工審核與 `numbers.v2.json`。
2. Position 1～9 對應 Drive 正式來源。
3. DayMoon 日月綻放資料。
4. Horse 木馬數資料。
5. Helper 貴人數資料。
6. Soul Level 1～7。
7. Annual、流月與流日。
8. Relationship、Career、Money、Growth。
9. Geometry、Prompt、Oil 等應用層。

每一批都使用相同 Candidate → Review → Canonical → Publish 流程。

## 10. 不在本階段執行

- 不修改既有 Drive Sheet 欄位。
- 不讓 App 即時讀取 Drive。
- 不把 Candidate 內容顯示給正式客戶。
- 不建立新的資料庫取代 Drive Knowledge Base。
- 不把個案報告或輸出反推為通用知識。
- 不開始 CMS、帳號或雲端同步。
