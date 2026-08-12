# 天書三式會員制 v2.0｜Supabase + Cloudflare Pages 部署

## Supabase 已完成

- Authentication Email 註冊：開啟
- Confirm email：開啟
- `public.profiles`：已建立
- 新會員 Trigger：預設 `member / pending / free`
- 管理員：`admin / active / permanent`
- RLS：會員看自己；active admin 可看／改全部 profiles

## 網站使用的公開設定

檔案：`assets/supabase-config.js`

- Project URL：`https://qxcyilkzaayqrbcngrel.supabase.co`
- Publishable key：已寫入檔案

注意：絕不可將 `sb_secret_...`、service_role 或 Database Password 放入前端、GitHub 或公開檔案。

## Cloudflare Pages 上線後

取得正式網址，例如：

`https://tianshu-sanshi-v2.pages.dev`

再回 Supabase：Authentication → URL Configuration

- Site URL：`https://tianshu-sanshi-v2.pages.dev`
- Redirect URL 建議加入：`https://tianshu-sanshi-v2.pages.dev/**`

如此 `register.html` 設定的 `emailRedirectTo = verify.html` 才會被 Supabase 允許。

## 首次驗收流程

1. 開啟 `register.html` 建立一個測試會員。
2. 到測試 Email 點驗證連結。
3. 網站應顯示等待管理員審核。
4. 管理員登入後開 `admin.html`。
5. 將測試會員改成 `active`，方案可選 `formal`，並設定到期日。
6. 測試會員重新登入後應可進入 `index.html` 及所有術數頁。
7. 改成 `suspended` 後再次進入術數頁應被導向 `pending.html`。

## 第一階段限制

本版已做會員入口與 RLS 權限，但既有術數演算法仍位於瀏覽器端 JS。下一階段可把核心公式改成 Cloudflare Functions / Workers API，在伺服器端計算後只回傳結果，以降低核心演算法被直接下載的風險。
