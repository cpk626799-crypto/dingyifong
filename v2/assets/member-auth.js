import { supabase } from './supabase-client.js';
import { MEMBER_HOME, PLAN_LABELS, PAGE_PERMISSIONS, PERMISSIONS_VERSION,
  accountRestriction, canonicalPage, canAccessPage, denialMessage
} from './member-permissions.js?v=20261008-longde';

const LOGIN_PAGE = 'login.html';
const PENDING_PAGE = 'pending.html';
const ADMIN_PAGE = 'admin.html';

function currentFile() {
  const name = location.pathname.split('/').pop();
  if (!name) return 'index.html';
  // Cloudflare Pages 會把 *.html 正規化為不含副檔名的網址。
  return name.includes('.') ? name : `${name}.html`;
}

function safeNext() {
  const here = currentFile();
  return encodeURIComponent(here + location.search + location.hash);
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
    theme.href = 'assets/site-theme.css?v=20261006-zibai';
    document.head.appendChild(theme);
  }
  if (!document.getElementById('ts-site-calendar')) {
    const calendar = document.createElement('script');
    calendar.id = 'ts-site-calendar';
    calendar.src = 'assets/site-calendar.js?v=20261006-zibai';
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
    const planText = PLAN_LABELS[profile.plan] || '未設定等級';

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
      const style = document.createElement('link');
      style.id = 'member-nav-unified-style';
      style.rel = 'stylesheet';
      style.href = 'assets/member-navigation.css?v=20261008-longde';
      document.head.appendChild(style);
    }

    const page = currentFile();
    if (page === MEMBER_HOME || page === ADMIN_PAGE) return;
    const navs = [...document.querySelectorAll('.system-header .tool-subnav, .ts-shared-nav-shell .tool-subnav')];
    let nav = navs.shift();
    // 每頁只保留一個共用工具列，避免舊版標記與新版導覽同時顯示。
    navs.forEach(duplicate => duplicate.remove());
    if (!nav) {
      const header = document.querySelector('.system-header');
      if (!header) return;
      nav = document.createElement('nav');
      nav.className = 'tool-subnav';
      nav.setAttribute('aria-label', '術數工具導覽');
      header.appendChild(nav);
    }

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
      ['taixuan.html', '太玄數計算'],
      ['zibai-ymd.html', '流年紫白飛星']
    ];
    nav.innerHTML = tools.map(([href, label]) =>
      `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`
    ).join('');
    const sections = [...document.querySelectorAll('.member-special-nav')];
    let special = sections.shift();
    sections.forEach(duplicate => duplicate.remove());
    if (!special) {
      special = document.createElement('section');
      special.className = 'member-special-nav';
      special.setAttribute('aria-label', '四吉鎮八煞專區');
    }
    special.innerHTML = `<a class="member-special-link" href="longde-fude.html"${page === 'longde-fude.html' ? ' aria-current="page"' : ''}>
      <span class="member-special-mark" aria-hidden="true">德</span>
      <span class="member-special-text"><strong>龍德福德定局</strong><small>四吉鎮八煞</small></span>
      <span class="member-special-vip">VIP 專用</span><span class="member-special-arrow" aria-hidden="true">→</span></a>`;
    nav.insertAdjacentElement('afterend', special);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
}

function injectMemberHomeNavigation(profile) {
  const render = () => {
    const page = currentFile();
    if (page === MEMBER_HOME) return;
    if (page === ADMIN_PAGE) return;
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

function memberLinkPage(link) {
  const href = link?.getAttribute('href');
  if (!href || href.startsWith('#')) return null;
  const target = new URL(href, location.href);
  const directory = new URL('.', location.href);
  if (target.origin !== directory.origin || new URL('.', target).pathname !== directory.pathname) return null;
  const name = target.pathname.split('/').pop() || 'index.html';
  const page = name.includes('.') ? name : `${name}.html`;
  if (!page.endsWith('.html') || ['login.html', 'register.html', 'verify.html', 'pending.html'].includes(page)) return null;
  return page;
}

function injectPermissionNavigation(profile) {
  const render = () => {
    const style = document.createElement('style');
    style.textContent = `
      a.member-feature-locked{opacity:.58;cursor:not-allowed}
      .member-permission-note{margin:8px auto 0;color:#b7c0d2;font-size:.82rem;line-height:1.6;text-align:center}
      .member-restricted-pane{display:none!important}
    `;
    document.head.appendChild(style);
    document.querySelectorAll('a[href]').forEach(link => {
      const page = memberLinkPage(link);
      if (!page || canAccessPage(profile, page)) return;
      link.classList.add('member-feature-locked');
      link.setAttribute('aria-disabled', 'true');
      link.title = denialMessage(profile, page);
    });

    const intercept = event => {
      const link = event.target.closest?.('a[href]');
      const page = memberLinkPage(link);
      if (!page || canAccessPage(window.TIANSHU_MEMBER?.profile, page)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      alert(denialMessage(window.TIANSHU_MEMBER?.profile, page));
    };
    document.addEventListener('click', intercept, true);
    document.addEventListener('auxclick', intercept, true);

    // 舊工具頁共用五個分頁；禁止一般會員切換到未授權的內嵌分頁。
    const panes = [
      ['tabLuma', 'pageLuma', 'zhen-luma.html'],
      ['tabWenchang', 'pageWenchang', 'wenchang.html'],
      ['tabWealth', 'pageWealth', 'caiwei.html'],
      ['tabPeach', 'pagePeach', 'taohua.html'],
      ['tabBajie', 'pageBajie', 'bajie-sanqi.html']
    ];
    panes.forEach(([tabId, paneId, page]) => {
      if (canAccessPage(profile, page)) return;
      const tab = document.getElementById(tabId);
      const pane = document.getElementById(paneId);
      if (tab) tab.disabled = true;
      if (pane) {
        pane.classList.add('member-restricted-pane');
        pane.inert = true;
        pane.setAttribute('aria-hidden', 'true');
      }
    });

    if (currentFile() === MEMBER_HOME) {
      const count = Object.keys(PAGE_PERMISSIONS).filter(page => canAccessPage(profile, page)).length;
      const note = document.createElement('p');
      note.className = 'member-permission-note';
      note.textContent = `${PLAN_LABELS[profile.plan] || '管理員'}｜${profile.role === 'admin' || profile.plan === 'permanent' ? '全部功能開放' : `已開放 ${count} 項功能`}｜權限版本 ${PERMISSIONS_VERSION}`;
      document.querySelector('.system-header')?.appendChild(note);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
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

    const restriction = accountRestriction(profile);
    if (restriction) {
      location.replace(`${PENDING_PAGE}?reason=${encodeURIComponent(restriction)}`);
      return;
    }
    if (!canAccessPage(profile, page)) {
      alert(denialMessage(profile, page));
      // 未知方案不能進首頁，避免重導迴圈。
      location.replace(page === MEMBER_HOME ? `${PENDING_PAGE}?reason=plan` : MEMBER_HOME);
      return;
    }
    if (canonicalPage(page) !== page) {
      location.replace(canonicalPage(page) + location.search + location.hash);
      return;
    }

    window.TIANSHU_MEMBER = Object.freeze({ profile, user: session.user,
      canAccessPage: page => canAccessPage(profile, page), permissionsVersion: PERMISSIONS_VERSION });
    injectSiteAppearance();
    injectMemberBar(profile);
    injectUnifiedMemberNavigation();
    injectMemberHomeNavigation(profile);
    injectPermissionNavigation(profile);
    unlockPage();
  } catch (error) {
    console.error('[member-auth]', error);
    location.replace(`${LOGIN_PAGE}?error=profile`);
  }
}

guard();

// 返回上一頁若使用瀏覽器快取，重新讀取會員等級與停權／到期狀態。
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    document.documentElement.classList.remove('auth-ready');
    document.documentElement.classList.add('auth-pending');
    location.reload();
  }
});
