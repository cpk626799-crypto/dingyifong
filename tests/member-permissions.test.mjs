import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PAGE_PERMISSIONS, accountRestriction, canAccessPage, canonicalPage, denialMessage } from '../v2/assets/member-permissions.js';

// Expected lists come from the teacher's 2026-09-27 tier confirmation.
const student = ['zibai.html', 'fourtime.html', 'wenchang.html', 'caiwei.html', 'taohua.html'];
const paid = [...student, 'index.html', 'benming.html', 'renming.html', 'renming-query.html',
  'yongji.html', 'tongshu.html', 'zhen-luma.html', 'xicai-guihe.html', 'caiguan-shishen.html',
  'liufu.html', 'bajie-sanqi.html'];
const vipOnly = ['dehu.html', 'taixuan.html', 'buzhen.html', 'xuankong.html', 'liunian-rules.html',
  'benming-rules.html', 'renming-rules.html', 'rules.html', 'dehu-rules.html'];
const all = [...paid, ...vipOnly];
const profile = (plan, changes = {}) => ({ role: 'member', status: 'active', plan, starts_at: null, expires_at: null, ...changes });

test('all 75 tier/page combinations match the confirmed 5, 16, 25 entries', () => {
  assert.deepEqual(Object.keys(PAGE_PERMISSIONS).sort(), [...all].sort());
  for (const [plan, expected] of [['free', student], ['formal', paid], ['permanent', all]]) {
    for (const page of all) assert.equal(canAccessPage(profile(plan), page), expected.includes(page), `${plan}: ${page}`);
    assert.equal(all.filter(page => canAccessPage(profile(plan), page)).length, expected.length);
    assert.equal(canAccessPage(profile(plan), 'member-tools.html'), true);
    assert.equal(canAccessPage(profile(plan), 'admin.html'), false);
  }
});

test('inactive, future and expired accounts stay blocked, including VIP and admins', () => {
  const now = Date.parse('2026-09-27T04:20:50Z');
  for (const plan of ['free', 'formal', 'permanent']) {
    for (const role of ['member', 'admin']) {
      for (const [changes, reason] of [
        [{ status: 'pending' }, 'pending'], [{ status: 'suspended' }, 'suspended'],
        [{ starts_at: '2026-09-28T00:00:00Z' }, 'not_started'],
        [{ expires_at: '2026-09-27T04:20:50Z' }, 'expired'], [{ expires_at: 'invalid' }, 'profile']
      ]) {
        const p = profile(plan, { role, ...changes });
        assert.equal(accountRestriction(p, now), reason);
        for (const page of all) assert.equal(canAccessPage(p, page, now), false);
      }
    }
  }
  assert.equal(canAccessPage(null, 'member-tools.html'), false);
});

test('new features default to VIP until the teacher explicitly assigns a tier', () => {
  for (const page of ['new-tool.html', 'toString', '__proto__']) {
    assert.equal(canAccessPage(profile('free'), page), false);
    assert.equal(canAccessPage(profile('formal'), page), false);
  }
  assert.equal(canAccessPage(profile('permanent'), 'new-tool.html'), true);
  assert.equal(canAccessPage(profile('unrecognized'), 'member-tools.html'), false);
  assert.equal(canAccessPage(profile('free', { role: 'admin' }), 'admin.html'), true);
});

test('legacy entry points and alert messages are consistent', () => {
  assert.equal(canonicalPage('jishi.html'), 'fourtime.html');
  assert.equal(canonicalPage('extended-tools.html'), 'member-tools.html');
  assert.equal(canAccessPage(profile('free'), 'jishi.html'), true);
  assert.equal(denialMessage(profile('free'), 'renming.html'), '僅供正式會員使用');
  assert.equal(denialMessage(profile('free'), 'taixuan.html'), '僅供正式會員使用');
  assert.equal(denialMessage(profile('formal'), 'taixuan.html'), '僅供永久（VIP）會員使用');
});

test('every protected HTML page uses the new guard, and all 25 homepage cards are mapped', () => {
  const root = new URL('../v2/', import.meta.url);
  const publicPages = ['login.html', 'register.html', 'verify.html', 'pending.html'];
  for (const file of readdirSync(root).filter(file => file.endsWith('.html') && !publicPages.includes(file))) {
    const html = readFileSync(new URL(file, root), 'utf8');
    assert.match(html, /class="auth-pending"/, file);
    assert.match(html, /assets\/member-auth\.js\?v=20260927-permissions/, file);
    assert.ok(Object.hasOwn(PAGE_PERMISSIONS, file) || ['member-tools.html', 'admin.html', 'jishi.html', 'extended-tools.html'].includes(file), file);
  }
  const home = readFileSync(new URL('member-tools.html', root), 'utf8');
  const hrefs = [...home.matchAll(/class="tool" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(hrefs.sort(), [...all].sort());
});
