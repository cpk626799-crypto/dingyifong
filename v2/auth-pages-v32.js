(() => {
  'use strict';
  const A = window.TianShuAuth;
  const $ = (s) => document.querySelector(s);
  const FORMAL_LOCKED = new Set(['liunian-rules.html', 'benming-rules.html', 'renming-rules.html']);

  function setMessage(text, type = 'info') {
    const box = $('#authMessage');
    if (!box) return;
    box.textContent = text;
    box.className = `auth-message ${type}`;
    box.hidden = false;
  }

  function redirectTarget(defaultTarget = 'index.html') {
    const value = new URLSearchParams(location.search).get('next');
    if (!value || /^(https?:|\/\/|javascript:)/i.test(value)) return defaultTarget;
    return value;
  }

  function targetFile(target) {
    return String(target || '').split('#')[0].split('?')[0] || 'index.html';
  }

  function routeByProfile(profile, fallback = 'index.html') {
    const now = Date.now();
    const expired = profile.expires_at && new Date(profile.expires_at).getTime() <= now;
    const notStarted = profile.starts_at && new Date(profile.starts_at).getTime() > now;
    if (profile.status !== 'active' || expired || notStarted) {
      let reason = profile.status || 'pending';
      if (expired) reason = 'expired';
      if (notStarted) reason = 'not_started';
      location.replace(`pending.html?reason=${encodeURIComponent(reason)}`);
      return;
    }
    if (profile.role !== 'admin') {
      const plan = profile.plan || 'free';
      if (plan === 'free') { location.replace('jishi.html'); return; }
      if (plan === 'formal' && FORMAL_LOCKED.has(targetFile(fallback))) { location.replace('index.html'); return; }
    }
    location.replace(fallback);
  }

  function friendlyError(error) {
    const m = String(error?.message || error || '未知錯誤');
    if (/invalid login credentials/i.test(m)) return '登入失敗：Email 或密碼不正確。';
    if (/email not confirmed/i.test(m)) return '此 Email 尚未完成驗證，請先點擊驗證信中的連結。';
    if (/failed to fetch|networkerror/i.test(m)) return '無法連線至會員伺服器，請檢查網路後再試。';
    return `登入失敗：${m}`;
  }

  function initLogin() {
    const form = $('#loginForm');
    if (!form) return;

    // 關鍵修正：先綁定 submit，絕不在綁定前 await 任何 Session/API。
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value;
      const btn = $('#loginSubmit');
      btn.disabled = true;
      btn.textContent = '登入中…';
      setMessage('正在連線會員伺服器…');
      try {
        const session = await A.signIn(email, password);
        setMessage('帳密驗證成功，正在讀取會員方案…', 'success');
        const profile = await A.getOwnProfile(session);
        routeByProfile(profile, redirectTarget());
      } catch (error) {
        console.error('[v3.2 login]', error);
        setMessage(friendlyError(error), 'error');
        btn.disabled = false;
        btn.textContent = '會員登入';
      }
    });

    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'profile') setMessage('會員資料讀取失敗，請重新登入。', 'error');

    // 已有 v3.2 Session 時才在背景導向；不阻塞按鈕事件。
    setTimeout(async () => {
      try {
        const session = await A.getSession();
        if (!session?.user) return;
        const profile = await A.getOwnProfile(session);
        routeByProfile(profile, redirectTarget());
      } catch (_) {}
    }, 0);
  }

  function initRegister() {
    const form = $('#registerForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const displayName = $('#registerName').value.trim();
      const email = $('#registerEmail').value.trim();
      const password = $('#registerPassword').value;
      const password2 = $('#registerPassword2').value;
      const btn = $('#registerSubmit');
      if (password.length < 8) return setMessage('密碼請至少設定 8 個字元。', 'error');
      if (password !== password2) return setMessage('兩次輸入的密碼不一致。', 'error');
      btn.disabled = true;
      btn.textContent = '建立帳號中…';
      try {
        const redirectTo = new URL('verify.html', location.href).href;
        const data = await A.signUp({ email, password, displayName, redirectTo });
        if (data?.access_token) location.replace('pending.html?reason=pending');
        else {
          setMessage('註冊資料已送出。請到信箱完成 Email 驗證；驗證後仍需管理員審核。', 'success');
          form.reset();
          btn.textContent = '已送出驗證信';
        }
      } catch (error) {
        console.error('[v3.2 register]', error);
        setMessage(`註冊失敗：${error.message || error}`, 'error');
        btn.disabled = false;
        btn.textContent = '註冊會員';
      }
    });
  }

  async function initVerify() {
    const status = $('#verifyStatus');
    if (!status) return;
    status.textContent = '正在確認驗證結果…';
    try {
      const session = await A.captureSessionFromUrl();
      if (!session?.user) {
        status.textContent = '若你已完成 Email 驗證，請返回登入頁登入。';
        $('#verifyLogin')?.removeAttribute('hidden');
        return;
      }
      const profile = await A.getOwnProfile(session);
      status.textContent = profile.status === 'active' ? 'Email 已驗證，會員權限已啟用。' : 'Email 已驗證成功。目前帳號等待管理員審核。';
      $('#verifyPending')?.removeAttribute('hidden');
    } catch (error) {
      console.error('[v3.2 verify]', error);
      status.textContent = '驗證已返回，但會員資料尚未就緒；請返回登入頁重新登入。';
      $('#verifyLogin')?.removeAttribute('hidden');
    }
  }

  async function initPending() {
    const statusEl = $('#pendingStatus');
    if (!statusEl) return;
    try {
      const session = await A.getSession();
      if (!session?.user) {
        statusEl.textContent = '目前沒有登入中的會員。請先登入。';
        $('#pendingLogin')?.removeAttribute('hidden');
        return;
      }
      const profile = await A.getOwnProfile(session);
      const reason = new URLSearchParams(location.search).get('reason') || profile.status;
      const messages = {
        pending: 'Email 驗證完成後，仍需等待管理員審核啟用。',
        suspended: '此會員帳號目前已停權，請聯絡管理員。',
        expired: '此會員使用期限已到期，請聯絡管理員辦理續期。',
        not_started: '此會員資格尚未到啟用日期。'
      };
      statusEl.textContent = messages[reason] || messages[profile.status] || '帳號目前尚不能進入術數查詢系統。';
      $('#pendingEmail').textContent = profile.email || session.user.email || '—';
      $('#pendingPlan').textContent = ({ free: '一般會員', formal: '正式會員', permanent: '永久會員' })[profile.plan] || profile.plan;
      $('#pendingState').textContent = profile.status;
      const expired = profile.expires_at && new Date(profile.expires_at).getTime() <= Date.now();
      const notStarted = profile.starts_at && new Date(profile.starts_at).getTime() > Date.now();
      if (profile.status === 'active' && !expired && !notStarted) {
        const enter = $('#pendingEnter');
        if (enter) {
          enter.href = profile.role !== 'admin' && (profile.plan || 'free') === 'free' ? 'jishi.html' : 'index.html';
          enter.removeAttribute('hidden');
        }
      }
    } catch (error) {
      console.error('[v3.2 pending]', error);
      statusEl.textContent = '無法取得會員狀態，請重新登入。';
    }
    $('#pendingLogout')?.addEventListener('click', async () => { await A.signOut(); location.replace('login.html'); });
  }

  initLogin();
  initRegister();
  initVerify();
  initPending();
})();
