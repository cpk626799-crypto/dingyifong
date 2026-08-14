# v2.9 會員登入穩定修正版

- 受保護頁不再載入 Supabase JS SDK。
- 登入改用 Supabase Auth REST API，登入成功後直接保存本系統自己的 session 與已驗證 profile 快取。
- 登入後首頁可由剛驗證成功的 profile 快取立即解除遮罩，再於背景重新向 profiles 驗證。
- 會員狀態、方案與期限仍由 Supabase profiles + RLS 為準。
- 一般會員：僅四大吉時，當月＋次月。
- 正式會員：查詢皆可，三個指定說明頁除外。
- 永久會員/管理員：全部。
