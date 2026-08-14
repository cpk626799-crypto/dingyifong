import { supabase } from './supabase-client.js';

const $ = (s) => document.querySelector(s);

function setMessage(text, type = 'info') {
  const box = $('#authMessage');
  if (!box) return;
  box.textContent = text;
  box.className = `auth-message ${type}`;
  box.hidden = false;
}

function redirectTarget(defaultTarget = 'index.html') {
  const params = new URLSearchParams(location.search);
  const value = params.get('next');
  if (!value) return defaultTarget;
  // 僅允許站內相對頁面，避免開放式重新導向。
  if (/^(https?:|\/\/|javascript:)/i.test(value)) return defaultTarget;
  return value;
}

async function getOwnProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,status,plan,starts_at,expires_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
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
  location.replace(fallback);
}

async function initLogin() {
  const form = $('#loginForm');
  if (!form) return;

  const params = new URLSearchParams(location.search);
  if (params.get('error') === 'profile') setMessage('會員資料讀取失敗，請重新登入；若持續發生請聯絡管理員。', 'error');

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      const profile = await getOwnProfile(session.user.id);
      routeByProfile(profile, redirectTarget());
      return;
    } catch (_) {}
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const btn = $('#loginSubmit');
    btn.disabled = true;
    btn.textContent = '登入中…';
    setMessage('正在驗證會員資料…');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message.includes('Email not confirmed') ? '此 Email 尚未完成驗證，請先點擊驗證信中的連結。' : '登入失敗：Email、密碼或帳號狀態不正確。', 'error');
      btn.disabled = false;
      btn.textContent = '會員登入';
      return;
    }

    try {
      const profile = await getOwnProfile(data.user.id);
      setMessage('登入成功，正在檢查會員權限…', 'success');
      routeByProfile(profile, redirectTarget());
    } catch (profileError) {
      console.error(profileError);
      await supabase.auth.signOut();
      setMessage('登入成功但找不到會員資料，請聯絡管理員。', 'error');
      btn.disabled = false;
      btn.textContent = '會員登入';
    }
  });
}

async function initRegister() {
  const form = $('#registerForm');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const displayName = $('#registerName').value.trim();
    const email = $('#registerEmail').value.trim();
    const password = $('#registerPassword').value;
    const password2 = $('#registerPassword2').value;
    const btn = $('#registerSubmit');

    if (password.length < 8) {
      setMessage('密碼請至少設定 8 個字元。', 'error');
      return;
    }
    if (password !== password2) {
      setMessage('兩次輸入的密碼不一致。', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '建立帳號中…';
    const emailRedirectTo = new URL('verify.html', location.href).href;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo
      }
    });

    if (error) {
      setMessage(`註冊失敗：${error.message}`, 'error');
      btn.disabled = false;
      btn.textContent = '註冊會員';
      return;
    }

    if (data.session) {
      location.replace('pending.html?reason=pending');
    } else {
      setMessage('註冊資料已送出。請到信箱完成 Email 驗證；驗證後帳號仍需管理員審核才能使用系統。', 'success');
      form.reset();
      btn.textContent = '已送出驗證信';
    }
  });
}

async function initVerify() {
  const status = $('#verifyStatus');
  if (!status) return;
  status.textContent = '正在確認驗證結果…';

  // detectSessionInUrl 會處理驗證連結返回的 session。
  await new Promise(resolve => setTimeout(resolve, 450));
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    status.textContent = '若你已完成 Email 驗證，請返回登入頁登入。';
    $('#verifyLogin')?.removeAttribute('hidden');
    return;
  }

  try {
    const profile = await getOwnProfile(session.user.id);
    status.textContent = profile.status === 'active'
      ? 'Email 已驗證，會員權限已啟用。'
      : 'Email 已驗證成功。目前帳號等待管理員審核。';
    $('#verifyPending')?.removeAttribute('hidden');
  } catch (error) {
    console.error(error);
    status.textContent = 'Email 驗證完成，但會員資料尚未就緒；請稍後重新登入。';
    $('#verifyLogin')?.removeAttribute('hidden');
  }
}

async function initPending() {
  const statusEl = $('#pendingStatus');
  if (!statusEl) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    statusEl.textContent = '目前沒有登入中的會員。請先登入。';
    $('#pendingLogin')?.removeAttribute('hidden');
    return;
  }

  try {
    const profile = await getOwnProfile(session.user.id);
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

    if (profile.status === 'active') {
      const expired = profile.expires_at && new Date(profile.expires_at).getTime() <= Date.now();
      const notStarted = profile.starts_at && new Date(profile.starts_at).getTime() > Date.now();
      if (!expired && !notStarted) $('#pendingEnter')?.removeAttribute('hidden');
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = '無法取得會員狀態，請重新登入或聯絡管理員。';
  }

  $('#pendingLogout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace('login.html');
  });
}

initLogin();
initRegister();
initVerify();
initPending();
