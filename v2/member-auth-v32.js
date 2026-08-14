(() => {
  'use strict';
  const A = window.TianShuAuth;
  const LOGIN_PAGE = 'login.html';
  const PENDING_PAGE = 'pending.html';
  const JISHI_PAGE = 'jishi.html';
  const ADMIN_PAGE = 'admin.html';
  const FORMAL_LOCKED = new Set(['liunian-rules.html', 'benming-rules.html', 'renming-rules.html']);

  const currentFile = () => location.pathname.split('/').pop() || 'index.html';
  const isExpired = (p) => Boolean(p?.expires_at) && new Date(p.expires_at).getTime() <= Date.now();
  const isNotStarted = (p) => Boolean(p?.starts_at) && new Date(p.starts_at).getTime() > Date.now();
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function unlock() {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  }

  function showError(message) {
    unlock();
    document.body.innerHTML = `<main class="auth-shell"><section class="auth-card" style="max-width:760px;margin:10vh auto"><p class="eyebrow">MEMBER ACCESS</p><h2>會員權限讀取失敗</h2><p>${esc(message)}</p><div class="auth-actions"><a class="auth-primary-btn" href="login.html">重新登入</a><button class="auth-secondary-btn" id="retryAuth" type="button">重新整理</button></div></section></main>`;
    document.querySelector('#retryAuth')?.addEventListener('click', () => location.reload());
  }

  function linkedFile(a) {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(https?:|mailto:|javascript:)/i.test(href)) return '';
    return href.split('#')[0].split('?')[0];
  }

  function lockLink(a, reason) {
    if (!a || a.dataset.planLocked === '1') return;
    a.dataset.planLocked = '1';
    a.removeAttribute('href');
    a.setAttribute('aria-disabled', 'true');
    a.setAttribute('tabindex', '-1');
    a.title = reason;
    a.style.opacity = '0.38';
    a.style.cursor = 'not-allowed';
    a.addEventListener('click', (e) => e.preventDefault());
  }

  function applyNavigationRestrictions(profile) {
    if (profile.role === 'admin') return;
    const plan = profile.plan || 'free';
    document.querySelectorAll('a[href]').forEach((a) => {
      const file = linkedFile(a);
      if (!file) return;
      if (plan === 'free' && file !== JISHI_PAGE) lockLink(a, '一般會員僅可使用四大吉時月表。');
      if (plan === 'formal' && FORMAL_LOCKED.has(file)) lockLink(a, '正式會員不開放此說明頁。');
    });
  }

  function injectBar(profile) {
    const header = document.querySelector('.system-header');
    if (!header || document.querySelector('.member-session-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'member-session-bar';
    const label = profile.display_name?.trim() || profile.email || '會員';
    const roleText = profile.role === 'admin' ? '管理員' : '會員';
    const planText = ({ free: '一般', formal: '正式', permanent: '永久' })[profile.plan] || profile.plan || '一般';
    bar.innerHTML = `<span class="member-chip"><b>${esc(label)}</b><small>${roleText}・${planText}</small></span>${profile.role === 'admin' ? '<a class="member-admin-link" href="admin.html">會員管理</a>' : ''}<button class="member-logout-btn" type="button">登出</button>`;
    header.appendChild(bar);
    bar.querySelector('.member-logout-btn')?.addEventListener('click', async () => {
      await A.signOut();
      location.replace(LOGIN_PAGE);
    });
  }

  function directTarget(profile, page) {
    if (profile.role === 'admin') return null;
    const plan = profile.plan || 'free';
    if (page === ADMIN_PAGE) return plan === 'free' ? JISHI_PAGE : 'index.html';
    if (plan === 'free' && page !== JISHI_PAGE) return JISHI_PAGE;
    if (plan === 'formal' && FORMAL_LOCKED.has(page)) return 'index.html';
    return null;
  }

  async function guard() {
    try {
      const session = await A.getSession();
      if (!session?.user) {
        location.replace(`${LOGIN_PAGE}?next=${encodeURIComponent(currentFile())}`);
        return;
      }
      const profile = await A.getOwnProfile(session);
      if (profile.status !== 'active') { location.replace(`${PENDING_PAGE}?reason=${encodeURIComponent(profile.status || 'pending')}`); return; }
      if (isNotStarted(profile)) { location.replace(`${PENDING_PAGE}?reason=not_started`); return; }
      if (isExpired(profile)) { location.replace(`${PENDING_PAGE}?reason=expired`); return; }

      const page = currentFile();
      const target = directTarget(profile, page);
      if (target) { location.replace(target); return; }

      window.TIANSHU_MEMBER = Object.freeze({ profile, user: session.user, accessToken: session.access_token });
      document.documentElement.dataset.memberPlan = profile.role === 'admin' ? 'permanent' : (profile.plan || 'free');
      injectBar(profile);
      applyNavigationRestrictions(profile);
      unlock();
      window.dispatchEvent(new CustomEvent('tianshu:member-ready', { detail: profile }));
    } catch (error) {
      console.error('[v3.2 member-auth]', error);
      showError(error?.message || '無法取得會員資料。');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guard, { once: true });
  else guard();
})();
