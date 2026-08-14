# v3.2 根因與修正

## 已確認的根因
1. v3.1 的 login 初始化先 `await supabase.auth.getSession()`，之後才綁定登入表單 submit 事件。只要 Session 初始化卡住，登入按鈕就完全沒有反應。
2. 舊架構依賴 `supabase-client.js` 再從 jsDelivr 載入 `@supabase/supabase-js`。任何 CDN/module 載入失敗，同樣會讓登入表單完全沒有事件處理器。
3. v3.0–v3.1 同時殘留多套 auth/member/admin JS（原版、v30、v31），部分上傳或快取混用時容易形成不一致部署。
4. 一般會員額外方案導向曾與會員守門並存，造成頁面反覆驗證與跳轉。

## v3.2 修正
- 移除 supabase-js 與 jsDelivr 依賴。
- 直接使用 Supabase Auth REST API 與 Data REST API。
- 登入表單 submit 事件在任何 API 呼叫前立即綁定。
- 只有一套會員守門與一套方案路由。
- 新增獨立 v3.2 Session key：`tianshu_auth_v32`。
- 關鍵 auth JS 全部放網站根目錄，避免 assets 子資料夾漏傳。
