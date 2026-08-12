# 四大吉時月表｜後續資料更新說明

本版已將四大吉時拆成獨立資料模組，避免每次新增月份都修改整個會員網站。

## 目前開放
- 2026 年 8 月
- 2026 年 9 月
- CSV 匯出：關閉
- 列印／另存 PDF：保留

## 主要檔案
- `jishi.html`：四大吉時查詢介面
- `assets/jishi.js`：顯示與查詢程式
- `assets/jishi-data.js`：每日資料與開放年月

## 未來增加月份
將新的每日資料加入 `FOUR_TIME_DATA`，再於 `FOUR_TIME_META.availableMonths` 加入月份即可。會員系統、Supabase 與其他術數頁面不需重做。

## 建議更新流程
1. 先以 Excel／指定通書資料校對每日欄位。
2. 節氣與交節時間以指定官方來源校對，並統一臺灣時間（UTC+8）。
3. 更新 `assets/jishi-data.js`。
4. 本機檢查月份選單、交節備註、今日列、列印版面。
5. 上傳 GitHub `v2` 資料夾後，Cloudflare Pages 自動部署。

© 2026 丁一峰老師 版權所有。
