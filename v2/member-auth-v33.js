(() => {
  'use strict';
  const A = window.TianShuAuth;
  const LOGIN_PAGE = 'login.html';
  const JISHI_PAGE = 'jishi.html';
  const FORMAL_LOCKED = new Set(['liunian-rules.html', 'benming-rules.html', 'renming-rules.html']);

  const currentFile = () => location.pathname.split('/').pop() || 'index.html';
  const normalize = (v) => String(v ?? '').trim().toLowerCase();
  const isExpired = (p) => Boolean(p?.expires_at) && new Date(p.expires_at).getTime() <= Date.now();
  const isNotStarted = (p) => Boolean(p?.starts_at) && new Date(p.starts_at).getTime() > Date.now();
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function unlock() {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  }

  function renderGate(title, message, primaryHref, primaryText, code = '') {
    unlock();
    const codeHtml = code ? `<p class="fine-print" style="margin-top:12px">狀態碼：${esc(code)}</p>` : '';
    document.body.innerHTML = `<main class="auth-shell"><section class="auth-card" style="max-width:760px;margin:10vh auto">
      <p class="eyebrow">MEMBER ACCESS</p><h2>${esc(title)}</h2><p>${esc(message)}</p>${codeHtml}
      <div class="auth-actions"><a class="auth-primary-btn" href="${esc(primaryHref)}">${esc(primaryText)}</a></div>
    </section></main>`;
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
    if (normalize(profile.role) === 'admin') return;
    const plan = normalize(profile.plan) || 'free';
    document.querySelectorAll('a[href]').forEach((a) => {
      const file = linkedFile(a);
      if (!file) return;
      if (plan === 'free' && file !== JISHI_PAGE && file !== LOGIN_PAGE) {
        lockLink(a, '一般會員僅可使用四大吉時月表。');
      }
      if (plan === 'formal' && FORMAL_LOCKED.has(file)) {
        lockLink(a, '正式會員不開放此說明頁。');
      }
    });
  }

  function injectBar(profile) {
    const header = document.querySelector('.system-header');
    if (!header || document.querySelector('.member-session-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'member-session-bar';
    const label = profile.display_name?.trim() || profile.email || '會員';
    const role = normalize(profile.role);
    const plan = normalize(profile.plan) || 'free';
    const roleText = role === 'admin' ? '管理員' : '會員';
    const planText = ({ free: '一般', formal: '正式', permanent: '永久' })[plan] || plan;
    bar.innerHTML = `<span class="member-chip"><b>${esc(label)}</b><small>${roleText}・${planText}</small></span>${role === 'admin' ? '<a class="member-admin-link" href="admin.html">會員管理</a>' : ''}<button class="member-logout-btn" type="button">登出</button>`;
    header.appendChild(bar);
    bar.querySelector('.member-logout-btn')?.addEventListener('click', async () => {
      await A.signOut();
      location.href = LOGIN_PAGE;
    });
  }

  function accessDecision(profile, page) {
    const role = normalize(profile.role);
    const plan = normalize(profile.plan) || 'free';
    if (role === 'admin') return { allow: true };
    if (page === 'admin.html') return { allow: false, title: '管理員專用', message: '此頁僅供管理員使用。', href: plan === 'free' ? JISHI_PAGE : 'index.html', text: '返回可用功能', code: 'ADMIN_ONLY' };
    if (plan === 'free' && page !== JISHI_PAGE) return { allow: false, title: '一般會員權限', message: '一般會員僅可使用四大吉時月表，其他術數查詢不開放。', href: JISHI_PAGE, text: '前往四大吉時', code: 'FREE_JISHI_ONLY' };
    if (plan === 'formal' && FORMAL_LOCKED.has(page)) return { allow: false, title: '正式會員權限', message: '正式會員可使用查詢功能，但不開放流年法說明、個人流年法說明與人命擇日說明。', href: 'index.html', text: '返回術數系統', code: 'FORMAL_RULES_LOCKED' };
    return { allow: true };
  }

  async function guard() {
    // v3.3 原則：守門程式不做任何自動頁面重新導向，避免 login ↔ jishi 循環。
    try {
      if (!A) {
        renderGate('登入核心未載入', '會員登入核心檔案沒有成功載入，請確認部署檔案完整。', LOGIN_PAGE, '返回登入', 'AUTH_CORE_MISSING');
        return;
      }
      const session = await A.getSession();
      if (!session?.user) {
        const next = encodeURIComponent(currentFile());
        renderGate('需要登入', '目前找不到有效的會員登入狀態。請重新登入後再進入。', `${LOGIN_PAGE}?next=${next}`, '前往登入', 'NO_SESSION');
        return;
      }

      let profile;
      try {
        profile = await A.getOwnProfile(session);
      } catch (error) {
        console.error('[v3.3 profile]', error);
        renderGate('會員資料讀取失敗', error?.message || '無法取得會員 profiles 資料。', LOGIN_PAGE, '重新登入', 'PROFILE_READ_FAILED');
        return;
      }

      const status = normalize(profile.status) || 'pending';
      if (status !== 'active') {
        const msg = status === 'suspended' ? '此會員帳號目前已停權，請聯絡管理員。' : '此會員目前尚未啟用，請等待管理員審核。';
        renderGate('會員目前無法使用', msg, LOGIN_PAGE, '返回登入', `STATUS_${status.toUpperCase()}`);
        return;
      }
      if (isNotStarted(profile)) {
        renderGate('會員資格尚未開始', '此會員資格尚未到啟用日期。', LOGIN_PAGE, '返回登入', 'NOT_STARTED');
        return;
      }
      if (isExpired(profile)) {
        renderGate('會員使用期限已到期', '此會員使用期限已到期，請聯絡管理員辦理續期。', LOGIN_PAGE, '返回登入', 'EXPIRED');
        return;
      }

      const page = currentFile();
      const decision = accessDecision(profile, page);
      if (!decision.allow) {
        renderGate(decision.title, decision.message, decision.href, decision.text, decision.code);
        return;
      }

      window.TIANSHU_MEMBER = Object.freeze({ profile, user: session.user, accessToken: session.access_token });
      document.documentElement.dataset.memberPlan = normalize(profile.role) === 'admin' ? 'permanent' : (normalize(profile.plan) || 'free');
      injectBar(profile);
      applyNavigationRestrictions(profile);
      unlock();
      window.dispatchEvent(new CustomEvent('tianshu:member-ready', { detail: profile }));
    } catch (error) {
      console.error('[v3.3 member-auth]', error);
      renderGate('會員驗證失敗', error?.message || '會員驗證發生未預期錯誤。', LOGIN_PAGE, '重新登入', 'GUARD_EXCEPTION');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guard, { once: true });
  else guard();
})();
