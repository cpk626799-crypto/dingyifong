(() => {
  'use strict';

  const JISHI_PAGE = 'jishi.html';
  const FORMAL_LOCKED = new Set(['liunian-rules.html', 'benming-rules.html', 'renming-rules.html']);
  const CHECK_MS = 40;

  function currentFile() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function linkedFile(anchor) {
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(https?:|mailto:|javascript:)/i.test(href)) return '';
    return href.split('#')[0].split('?')[0];
  }

  function lockLink(anchor, reason) {
    if (!anchor || anchor.dataset.planLocked === '1') return;
    anchor.dataset.planLocked = '1';
    anchor.dataset.originalHref = anchor.getAttribute('href') || '';
    anchor.removeAttribute('href');
    anchor.setAttribute('aria-disabled', 'true');
    anchor.setAttribute('tabindex', '-1');
    anchor.title = reason;
    anchor.style.opacity = '0.38';
    anchor.style.cursor = 'not-allowed';
    anchor.addEventListener('click', (event) => event.preventDefault());
  }

  function apply(profile) {
    if (!profile) return;
    if (profile.role === 'admin') {
      window.dispatchEvent(new CustomEvent('tianshu:plan-ready', { detail: profile }));
      return;
    }

    const plan = profile.plan || 'free';
    const page = currentFile();

    // Direct URL enforcement. Authentication itself is handled only by the original stable v2.0 guard.
    if (plan === 'free' && page !== JISHI_PAGE) {
      location.replace(`${JISHI_PAGE}?access=free`);
      return;
    }
    if (plan === 'formal' && FORMAL_LOCKED.has(page)) {
      location.replace('index.html?access=formal');
      return;
    }

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const file = linkedFile(anchor);
      if (!file) return;
      if (plan === 'free' && file !== JISHI_PAGE) {
        lockLink(anchor, '一般會員僅可使用四大吉時月表（當月份＋下一月份）。');
      } else if (plan === 'formal' && FORMAL_LOCKED.has(file)) {
        lockLink(anchor, '正式會員不開放此說明頁。');
      }
    });

    document.documentElement.dataset.memberPlan = plan;
    window.dispatchEvent(new CustomEvent('tianshu:plan-ready', { detail: profile }));
  }

  function waitForStableMember() {
    if (window.TIANSHU_MEMBER?.profile) {
      apply(window.TIANSHU_MEMBER.profile);
      return;
    }
    const timer = setInterval(() => {
      if (!window.TIANSHU_MEMBER?.profile) return;
      clearInterval(timer);
      apply(window.TIANSHU_MEMBER.profile);
    }, CHECK_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForStableMember, { once: true });
  } else {
    waitForStableMember();
  }
})();
