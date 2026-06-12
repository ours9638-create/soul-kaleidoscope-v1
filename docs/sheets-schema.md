# Google Sheets 資料表設計

## 公式主檔

來源：`靈魂數字_可驗算公式表`

用途：

- 放可驗算公式。
- 保留鏈條與最終數。
- 不混入品牌文案與個案交付紀錄。

## 內容資料庫

來源：`靈魂數字整合系統_分類資料庫_光頻幾何圖輸出更新`

用途：

- 數字解讀。
- 流年解讀。
- 精油文案。
- 安全邊界。
- 出圖規格。

## 個案資料表

Apps Script 會自動建立 `個案資料表`，欄位如下：

```text
caseId
createdAt
serviceId
displayName
solarDate
lunarDate
birthTime
queryDate
usageScenario
productType
selectedOils
solarMain
lunarMain
solarBloom
lunarBloom
horses
solarSupport
lunarSupport
yearFlow
annualPosition
versionMode
serviceOutputStatus
status
```

欄位說明：

- `serviceId`：目前可用 `soul-number-reading`、`essential-oil-product`、`soul-number-with-oil`。
- `usageScenario`：精油使用情境；單做數字盤時可空白。
- `productType`：精油產品型態，例如滾珠、擴香、噴霧。
- `selectedOils`：建議精油清單，用 `、` 分隔。
- `serviceOutputStatus`：記錄這筆資料產出的服務類型，避免未來服務變多後無法追蹤。

這樣做的風險是欄位會比純數字盤多。建議接受這個成本，因為精油可以單獨販售，也能跟數字盤搭配，早點拆欄位比日後清資料便宜。

## 輸出紀錄

Apps Script 會自動建立 `輸出紀錄`，欄位如下：

```text
token
createdAt
caseId
serviceId
displayName
reportUrl
svgUrl
reportType
status
```

## 維護規則

- 公式與文案分開。
- 個案紀錄與輸出紀錄分開。
- 暫定公式不可寫成正式報告定稿。
- 報告文字不得出現治療、治癒、保證改善等語句。
