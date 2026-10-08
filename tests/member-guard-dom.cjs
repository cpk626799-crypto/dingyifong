// Run with: NODE_PATH=<directory containing jsdom> node --experimental-vm-modules tests/member-guard-dom.cjs
// Uses real HTML and guard modules with a local Supabase fixture; no real accounts are changed.
const { JSDOM } = require('jsdom');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../v2');
const authSource = fs.readFileSync(path.join(root, 'assets/member-auth.js'), 'utf8');
const permissionsSource = fs.readFileSync(path.join(root, 'assets/member-permissions.js'), 'utf8');
const student = ['zibai-ymd.html', 'zibai.html', 'fourtime.html', 'wenchang.html', 'caiwei.html', 'taohua.html'];
const paid = [...student, 'index.html', 'benming.html', 'renming.html', 'renming-query.html',
  'yongji.html', 'tongshu.html', 'zhen-luma.html', 'xicai-guihe.html', 'caiguan-shishen.html', 'liufu.html', 'bajie-sanqi.html'];
const vipOnly = ['longde-fude.html', 'dehu.html', 'taixuan.html', 'buzhen.html', 'xuankong.html', 'liunian-rules.html',
  'benming-rules.html', 'renming-rules.html', 'rules.html', 'dehu-rules.html'];
const all = [...paid, ...vipOnly];

async function pageFixture(file, profile, options = {}) {
  const url = new URL(options.extensionless ? file.replace(/\.html$/, '') : file, 'https://test.invalid/v2/');
  const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), { url: url.href, runScripts: 'outside-only' });
  await new Promise(resolve => dom.window.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  if (options.duplicateNavigation) {
    const nav = dom.window.document.querySelector('.system-header .tool-subnav');
    nav.after(nav.cloneNode(true));
    const special = dom.window.document.querySelector('.member-special-nav');
    special.after(special.cloneNode(true));
  }
  const redirects = [], alerts = [], errors = [];
  const location = { pathname: url.pathname, search: url.search, hash: url.hash, href: url.href,
    replace: value => redirects.push(value), reload: () => redirects.push('RELOAD') };
  const session = options.anonymous ? null : { user: { id: 'fixture-user', email: 'fixture@example.invalid' } };
  const supabase = {
    auth: { getSession: async () => ({ data: { session }, error: null }), signOut: async () => ({ error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: structuredClone(profile), error: options.profileError ? new Error('fixture failure') : null }) }) }) })
  };
  const context = vm.createContext({ window: dom.window, document: dom.window.document, location, URL,
    alert: value => alerts.push(value), console: { error: (...args) => errors.push(args) } });
  const permissions = new vm.SourceTextModule(permissionsSource, { context });
  const client = new vm.SyntheticModule(['supabase'], function () { this.setExport('supabase', supabase); }, { context });
  const auth = new vm.SourceTextModule(authSource, { context });
  await auth.link(specifier => specifier.includes('member-permissions') ? permissions : client);
  await auth.evaluate();
  await new Promise(setImmediate);
  return { dom, document: dom.window.document, alerts, redirects, errors, close: () => dom.window.close() };
}

(async () => {
  let checked = 0;
  for (const [plan, expected] of [['free', student], ['formal', paid], ['permanent', all]]) {
    const profile = { role: 'member', status: 'active', plan, display_name: '測試會員' };
    const home = await pageFixture('member-tools.html', profile);
    assert.equal(home.document.querySelectorAll('a.tool:not(.member-feature-locked)').length, expected.length, `${plan}: homepage`);
    assert.equal(home.document.querySelectorAll('a.tool').length, 27);
    assert.match(home.document.querySelector('.member-permission-note').textContent, /20261008-longde/);
    for (const page of all.filter(page => !expected.includes(page))) {
      const link = home.document.querySelector(`a.tool[href="${page}"]`);
      const event = new home.dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
      assert.equal(link.dispatchEvent(event), false, `${plan}: blocked click ${page}`);
      assert.equal(home.alerts.at(-1), page === 'longde-fude.html' ? '僅供 VIP 會員使用' : plan === 'free' ? '僅供正式會員使用' : '僅供永久（VIP）會員使用');
    }
    assert.equal(home.document.querySelector('a[href="bajie-sanqi.html"]').nextElementSibling.getAttribute('href'), 'longde-fude.html');
    assert.equal(home.document.querySelector('.longde-signature').textContent, '四吉鎮八煞');
    assert.deepEqual(home.errors, []);
    home.close();
    for (const page of all) {
      for (const extensionless of [false, true]) {
        const fixture = await pageFixture(page, profile, { extensionless });
        assert.equal(fixture.document.documentElement.classList.contains('auth-ready'), expected.includes(page), `${plan}: ${page}, extensionless=${extensionless}`);
        if (!expected.includes(page)) assert.deepEqual(fixture.redirects, ['member-tools.html']);
        else {
          assert.deepEqual(fixture.redirects, []);
          assert.ok(fixture.document.querySelector('a.ts-member-home-top'), `${page}: home link`);
          const navs = fixture.document.querySelectorAll('.system-header .tool-subnav, .ts-shared-nav-shell .tool-subnav');
          assert.equal(navs.length, 1, `${page}: exactly one shared tool navigation`);
          const nav = navs[0];
          assert.equal(nav.querySelectorAll('a').length, 12, `${page}: twelve persistent buttons`);
          const special = fixture.document.querySelectorAll('.member-special-nav');
          assert.equal(special.length, 1);
          assert.equal(nav.nextElementSibling, special[0]);
          assert.equal(special[0].querySelector('small').textContent, '四吉鎮八煞');
          const newLink = special[0].querySelector('a');
          assert.equal(newLink.getAttribute('href'), 'longde-fude.html');
          assert.equal(newLink.getAttribute('aria-current'), page === 'longde-fude.html' ? 'page' : null);
          assert.equal(newLink.classList.contains('member-feature-locked'), plan !== 'permanent');
          const zibai = nav.querySelector('a[href="zibai-ymd.html"]');
          assert.ok(zibai, `${page}: zibai entry remains present`);
          assert.equal(zibai.classList.contains('member-feature-locked'), false, `${plan}: zibai is available`);
          assert.equal(zibai.getAttribute('aria-current'), page === 'zibai-ymd.html' ? 'page' : null);
        }
        assert.deepEqual(fixture.errors, []);
        fixture.close();
        checked++;
      }
    }
    console.log(`${plan}: homepage ${expected.length}/27, all card alerts and 54 URL variants passed`);
  }
  const active = { role: 'member', status: 'active', plan: 'free' };
  const affected = ['zhen-luma.html', 'wenchang.html', 'caiwei.html', 'taohua.html', 'bajie-sanqi.html'];
  for (const file of affected) {
    const raw = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'));
    assert.equal(raw.window.document.querySelectorAll('.system-header .tool-subnav').length, 1, `${file}: no static duplicate`);
    raw.window.close();
    const f = await pageFixture(file, { ...active, plan: 'permanent' }, { duplicateNavigation: true });
    assert.equal(f.document.querySelectorAll('.system-header .tool-subnav').length, 1, `${file}: duplicate normalized`);
    assert.equal(f.document.querySelectorAll('.system-header .tool-subnav > a').length, 12);
    assert.equal(f.document.querySelectorAll('.system-header .tool-subnav a[href="zibai-ymd.html"]').length, 1);
    assert.equal(f.document.querySelector(`.system-header .tool-subnav a[href="${file}"]`).getAttribute('aria-current'), 'page');
    assert.equal(f.document.querySelectorAll('.member-special-nav').length, 1);
    assert.deepEqual(f.errors, []);
    f.close();
  }
  console.log('PASS: five affected pages have one static navigation; duplicated markup is normalized to one 12-button navigation');
  for (const file of ['wenchang.html', 'caiwei.html', 'taohua.html']) {
    const f = await pageFixture(file, active);
    assert.equal(f.document.querySelector('#tabLuma').disabled, true);
    assert.equal(f.document.querySelector('#tabBajie').disabled, true);
    assert.ok(f.document.querySelector('#pageLuma').classList.contains('member-restricted-pane'));
    assert.ok(f.document.querySelector('#pageBajie').classList.contains('member-restricted-pane'));
    f.close();
  }
  for (const [file, destination] of [['jishi.html', 'fourtime.html'], ['extended-tools.html', 'member-tools.html']]) {
    const f = await pageFixture(file, active);
    assert.deepEqual(f.redirects, [destination]);
    assert.equal(f.document.documentElement.classList.contains('auth-ready'), false);
    f.close();
  }
  for (const [changes, reason] of [[{ status: 'suspended' }, 'suspended'], [{ status: 'pending' }, 'pending'],
    [{ starts_at: '2999-01-01' }, 'not_started'], [{ expires_at: '2000-01-01' }, 'expired']]) {
    const f = await pageFixture('member-tools.html', { ...active, ...changes });
    assert.deepEqual(f.redirects, [`pending.html?reason=${reason}`]);
    assert.equal(f.document.documentElement.classList.contains('auth-ready'), false);
    f.close();
  }
  const anonymous = await pageFixture('taixuan.html', null, { anonymous: true });
  assert.deepEqual(anonymous.redirects, ['login.html?next=taixuan.html']); anonymous.close();
  for (const extensionless of [false, true]) {
    const anonymousZibai = await pageFixture('zibai-ymd.html', null, { anonymous: true, extensionless });
    assert.deepEqual(anonymousZibai.redirects, ['login.html?next=zibai-ymd.html']);
    assert.equal(anonymousZibai.document.documentElement.classList.contains('auth-ready'), false);
    anonymousZibai.close();
  }
  const failure = await pageFixture('member-tools.html', active, { profileError: true });
  assert.deepEqual(failure.redirects, ['login.html?error=profile']); failure.close();
  const admin = await pageFixture('admin.html', { ...active, role: 'admin' });
  assert.equal(admin.document.documentElement.classList.contains('auth-ready'), true); admin.close();
  const fakeAdmin = await pageFixture('admin.html', { ...active, plan: 'permanent' });
  assert.deepEqual(fakeAdmin.redirects, ['member-tools.html']); fakeAdmin.close();
  console.log(`PASS: ${checked} direct URL cases; card click gates, embedded tabs, legacy aliases, login, account states and admin role`);
})().catch(error => { console.error(error); process.exitCode = 1; });
