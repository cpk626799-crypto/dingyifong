# v3.0 穩定登入基線

本版停止修改 Supabase 登入核心，直接回復至最初已實際驗收成功之會員制 v2.0 驗證流程：

- `auth-pages-v30.js`：內容直接取自 v2.0 `auth-pages.js`
- `member-auth-v30.js`：內容直接取自 v2.0 `member-auth.js`
- `admin-v30.js`：內容直接取自 v2.0 `admin.js`
- `supabase-client.js` / `supabase-config.js`：直接取自 v2.0

三級會員權限獨立在 `plan-permissions-v30.js`，不介入登入、Session、Refresh Token 或 profiles 讀取。

權限：
- 一般會員：僅四大吉時；臺灣時間當月＋下一月
- 正式會員：查詢功能可用；流年法說明／個人流年法說明／人命擇日說明禁止
- 永久會員：全部可用
- 管理員：全部可用＋會員管理
