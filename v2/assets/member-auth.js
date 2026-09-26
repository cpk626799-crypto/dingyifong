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

function injectSiteAppearance() {
  if (!document.getElementById('ts-site-theme')) {
    const theme = document.createElement('link');
    theme.id = 'ts-site-theme';
    theme.rel = 'stylesheet';
    theme.href = 'assets/site-theme.css';
    document.head.appendChild(theme);
  }
  if (!document.getElementById('ts-site-calendar')) {
    const calendar = document.createElement('script');
    calendar.id = 'ts-site-calendar';
    calendar.src = 'assets/site-calendar.js';
    document.head.appendChild(calendar);
  }
}

function injectMemberBar(profile) {
  const render = () => {
    const header = document.querySelector('.system-header, .tx-topbar__inner');
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

function injectUnifiedMemberNavigation() {
  const render = () => {
    if (!document.getElementById('member-nav-unified-style')) {
      const style = document.createElement('style');
      style.id = 'member-nav-unified-style';
      style.textContent = `
        /* 會員頁共用導覽：主導覽 7×2，工具列桌機 6＋5 */
        .system-header .top-nav{
          display:grid!important;
          grid-template-columns:repeat(7,minmax(0,1fr))!important;
          grid-auto-flow:row!important;
          width:100%!important;
          max-width:1280px!important;
          margin:20px auto 0!important;
          padding:8px!important;
          gap:8px!important;
          align-items:stretch!important;
          justify-items:stretch!important;
          border-radius:24px!important;
          box-sizing:border-box!important;
          overflow:visible!important;
        }
        .system-header .top-nav>a{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:100%!important;
          min-width:0!important;
          min-height:54px!important;
          margin:0!important;
          padding:8px 7px!important;
          box-sizing:border-box!important;
          text-align:center!important;
          white-space:normal!important;
          word-break:keep-all!important;
          overflow-wrap:normal!important;
          line-height:1.35!important;
          border-radius:18px!important;
          flex:none!important;
        }
        .system-header .tool-subnav{
          width:100%!important;
          max-width:1280px!important;
          margin:10px auto 0!important;
          padding:7px!important;
          display:grid!important;
          grid-template-columns:repeat(6,minmax(0,1fr))!important;
          gap:8px!important;
          border:1px solid rgba(115,132,176,.22)!important;
          border-radius:18px!important;
          background:rgba(8,12,24,.78)!important;
          box-shadow:0 18px 46px rgba(0,0,0,.26)!important;
          box-sizing:border-box!important;
          overflow:visible!important;
        }
        .system-header .tool-subnav>a{
          min-width:0!important;
          min-height:48px!important;
          padding:9px 10px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          border:1px solid transparent!important;
          border-radius:12px!important;
          color:#aab4c7!important;
          background:transparent!important;
          text-decoration:none!important;
          font-weight:900!important;
          line-height:1.35!important;
          text-align:center!important;
          white-space:normal!important;
          word-break:keep-all!important;
        }
        .system-header .tool-subnav>a[aria-current="page"]{
          color:#17120a!important;
          border-color:rgba(224,184,86,.52)!important;
          background:linear-gradient(145deg,#f2d477,#d4a035)!important;
          box-shadow:0 8px 22px rgba(217,168,58,.2)!important;
        }
        /* 右上會員資訊固定橫排，避免姓名與會員方案被擠成直排 */
        .system-header .member-session-bar{
          width:max-content!important;
          max-width:calc(100% - 24px)!important;
          display:flex!important;
          flex-direction:row!important;
          align-items:center!important;
          justify-content:flex-end!important;
          gap:8px!important;
          flex-wrap:nowrap!important;
        }
        .system-header .member-chip{
          min-width:max-content!important;
          width:max-content!important;
          display:grid!important;
          text-align:right!important;
        }
        .system-header .member-chip b,
        .system-header .member-chip small,
        .system-header .member-admin-link,
        .system-header .member-logout-btn{
          white-space:nowrap!important;
          word-break:keep-all!important;
        }

        @media(max-width:1100px){
          .system-header .top-nav{grid-template-columns:repeat(4,minmax(0,1fr))!important}
          .system-header .tool-subnav{grid-template-columns:repeat(3,minmax(0,1fr))!important}
          .system-header .tool-subnav>a:nth-child(n){grid-column:auto!important}
        }
        @media(max-width:700px){
          .system-header .top-nav{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .system-header .top-nav>a{min-height:48px!important;padding:8px 5px!important}
          .system-header .tool-subnav{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .system-header .member-session-bar{
            position:static!important;
            margin:12px auto 0!important;
            max-width:100%!important;
            justify-content:center!important;
            flex-wrap:wrap!important;
          }
          .system-header .member-chip{text-align:center!important}
        }
      `;
      document.head.appendChild(style);
    }

    const nav = document.querySelector('.system-header .tool-subnav');
    if (!nav) return;

    const tools = [
      ['zhen-luma.html', '真祿馬貴人'],
      ['wenchang.html', '文昌'],
      ['caiwei.html', '財位'],
      ['taohua.html', '桃花位'],
      ['buzhen.html', '流年佈陣用日'],
      ['xicai-guihe.html', '喜財貴人鶴神方'],
      ['caiguan-shishen.html', '財．官，十神相配'],
      ['liufu.html', '六富日查詢'],
      ['bajie-sanqi.html', '八節三奇'],
      ['xuankong.html', '玄空飛星'],
      ['taixuan.html', '太玄數計算']
    ];
    const page = currentFile();
    nav.innerHTML = tools.map(([href, label]) =>
      `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`
    ).join('');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
}

function canUseMemberTools(profile) {
  return profile.role === 'admin' || profile.plan === 'formal' || profile.plan === 'permanent';
}

function injectMemberHomeNavigation(profile) {
  const render = () => {
    const page = currentFile();
    if (page === 'member-tools.html') {
      const card = document.querySelector('a.tool[href="taixuan.html"]');
      if (card && !canUseMemberTools(profile)) {
        card.removeAttribute('href');
        card.setAttribute('aria-disabled', 'true');
        card.style.opacity = '.58';
        card.style.cursor = 'not-allowed';
        const description = card.querySelector('p');
        if (description) description.textContent = '正式會員與永久會員可使用。';
      }
      return;
    }
    if (page === ADMIN_PAGE) return;
    const toolLink = document.querySelector('.tool-subnav a[href="taixuan.html"]');
    if (toolLink && !canUseMemberTools(profile)) {
      toolLink.removeAttribute('href');
      toolLink.setAttribute('aria-disabled', 'true');
      toolLink.style.opacity = '.58';
      toolLink.style.cursor = 'not-allowed';
      toolLink.title = '正式會員與永久會員可使用';
    }
    if (!document.getElementById('ts-member-home-style')) {
      const style = document.createElement('style');
      style.id = 'ts-member-home-style';
      style.textContent = `
        .ts-member-home-top-wrap{display:flex;justify-content:flex-end;width:100%;margin:8px 0 10px;box-sizing:border-box}
        .ts-member-home-top{
          display:inline-flex!important;align-items:center;justify-content:center;
          width:auto!important;max-width:max-content!important;min-height:38px;
          padding:8px 14px!important;border:1px solid rgba(224,184,78,.48)!important;
          border-radius:999px!important;background:rgba(7,11,20,.96)!important;
          color:#f2d578!important;text-decoration:none!important;
          font:800 13px/1.35 "Noto Sans TC","Microsoft JhengHei",sans-serif!important;
          letter-spacing:.02em;box-shadow:0 10px 27px rgba(0,0,0,.32)!important;
          white-space:nowrap;box-sizing:border-box;cursor:pointer
        }
        .ts-member-home-top:hover{border-color:#f2d578!important;background:#172039!important}
        .ts-member-home-top:focus-visible{outline:3px solid #f2d578;outline-offset:3px}
        @media(min-width:1201px){
          .system-header .ts-member-home-top-wrap{position:absolute;top:132px;right:0;width:auto;margin:0;z-index:30}
        }
        @media(max-width:700px){
          .ts-member-home-top-wrap{margin:10px 0}
        }
        @media print{.ts-member-home-top-wrap{display:none!important}}
      `;
      document.head.appendChild(style);
    }
    const header = document.querySelector('.system-header');
    const existing = header?.querySelector('a.member-home-link');
    if (existing) {
      existing.href = 'member-tools.html';
      existing.textContent = '← 回到會員首頁';
      existing.classList.add('ts-member-home-top');
    }
    const nav = header?.querySelector('.top-nav');
    const container = header || document.querySelector('main') || document.querySelector('.wrap');
    if (container && !existing && !container.querySelector('.ts-member-home-top-wrap')) {
      const row = document.createElement('div');
      row.className = 'ts-member-home-top-wrap';
      const link = document.createElement('a');
      link.className = 'ts-member-home-top';
      link.href = 'member-tools.html';
      link.textContent = '← 回到會員首頁';
      row.appendChild(link);
      if (nav) header.insertBefore(row, nav);
      else container.insertBefore(row, container.firstChild);
    }
    document.querySelectorAll('a.member-home-link[href="member-tools.html"]').forEach(link => {
      if (link !== existing) link.remove();
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
    if (page === 'taixuan.html' && !canUseMemberTools(profile)) {
      location.replace('member-tools.html');
      return;
    }
    if (page === ADMIN_PAGE && profile.role !== 'admin') {
      location.replace('index.html');
      return;
    }

    window.TIANSHU_MEMBER = Object.freeze({ profile, user: session.user });
    injectSiteAppearance();
    injectMemberBar(profile);
    injectUnifiedMemberNavigation();
    injectMemberHomeNavigation(profile);
    unlockPage();
  } catch (error) {
    console.error('[member-auth]', error);
    location.replace(`${LOGIN_PAGE}?error=profile`);
  }
}

guard();
