// 離線預覽專用：不連線 Supabase，不驗證會員身分。
(() => {
  const ready = () => {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  };
  ready();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  }
})();
