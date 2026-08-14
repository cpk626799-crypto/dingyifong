# v2.7 會員登入停在「正在驗證會員權限」修正

- 保留原 Supabase 登入／註冊流程。
- 受保護頁面不再以 `supabase.auth.getSession()` 作為進站守門；改由本機已登入 session 的 JWT 直接向 Supabase Data API 讀取 `profiles`，避免瀏覽器 Auth Web Lock 卡死造成無限等待。
- JWT 即將到期時，直接以 refresh token 呼叫 Supabase Auth refresh endpoint 更新 session。
- 會員資料仍由 Supabase RLS 驗證，未降低資料庫權限。
- 管理員後台同樣改用已驗證會員 JWT + REST Data API，避免再次觸發 Auth session lock。
- 所有受保護頁面加入 12 秒 fail-closed watchdog；若驗證程式或網路異常，不會永遠停在載入畫面，也不會顯示受保護內容，而是顯示重新整理／重新登入提示。
- 權限維持：一般會員只可四大吉時當月＋次月；正式會員可全部查詢但不可進三個指定法說明；永久會員／管理員全部開放。
