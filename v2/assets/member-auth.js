import { supabase } from './supabase-client.js';

const LOGIN_PAGE = 'login.html';
const PENDING_PAGE = 'pending.html';
const ADMIN_PAGE = 'admin.html';

function currentFile() {
  const name = location.pathname.split('/').pop();
  return name || 'index.html';
}

function safeNext() {
  const here = currentFile();
  return encodeURIComponent(here + location.search + location.hash);
}

function isExpired(profile) {
  return Boolean(profile?.expires_at) && new Date(profile.expires_at).getTime() <= Date.now();
}

function isNotStarted(profile) {
  return Boolean(profile?.starts_at) && new Date(profile.starts_at).getTime() > Date.now();
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,status,plan,starts_at,expires_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

function unlockPage() {
  document.documentElement.classList.remove('auth-pending');
  document.documentElement.classList.add('auth-ready');
}

function injectMemberBar(profile) {
  const render = () => {
    const header = document.querySelector('.system-header');
    if (!header || document.querySelector('.member-session-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'member-session-bar';
    const label = profile.display_name?.trim() || profile.email || '會員';
    const roleText = profile.role === 'admin' ? '管理員' : '會員';
    const planMap = { free: '一般', formal: '正式', permanent: '永久' };
    const planText = planMap[profile.plan] || profile.plan || '一般';

    bar.innerHTML = `
      <span class="member-chip"><b>${escapeHtml(label)}</b><small>${roleText}・${planText}</small></span>
      ${profile.role === 'admin' ? '<a class="member-admin-link" href="admin.html">會員管理</a>' : ''}
      <button class="member-logout-btn" type="button">登出</button>
    `;
    header.appendChild(bar);

    bar.querySelector('.member-logout-btn')?.addEventListener('click', async () => {
      const btn = bar.querySelector('.member-logout-btn');
      btn.disabled = true;
      btn.textContent = '登出中…';
      await supabase.auth.signOut();
      location.replace(LOGIN_PAGE);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function guard() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      location.replace(`${LOGIN_PAGE}?next=${safeNext()}`);
      return;
    }

    const profile = await loadProfile(session.user.id);
    const page = currentFile();

    if (profile.status !== 'active') {
      location.replace(`${PENDING_PAGE}?reason=${encodeURIComponent(profile.status || 'pending')}`);
      return;
    }
    if (isNotStarted(profile)) {
      location.replace(`${PENDING_PAGE}?reason=not_started`);
      return;
    }
    if (isExpired(profile)) {
      location.replace(`${PENDING_PAGE}?reason=expired`);
      return;
    }
    if (page === ADMIN_PAGE && profile.role !== 'admin') {
      location.replace('index.html');
      return;
    }

    window.TIANSHU_MEMBER = Object.freeze({ profile, user: session.user });
    injectMemberBar(profile);
    unlockPage();
  } catch (error) {
    console.error('[member-auth]', error);
    location.replace(`${LOGIN_PAGE}?error=profile`);
  }
}

guard();
