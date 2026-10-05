// 2026-10-06：保留 09-27 分級，新增年／月／日紫白，開放一般、正式及永久 VIP。
// 新功能需先指定一般、正式會員的開放範圍，再加入本表。
export const PERMISSIONS_VERSION = '20261006';
export const MEMBER_HOME = 'member-tools.html';
export const PLAN_LABELS = Object.freeze({
  free: '一般（學生）',
  formal: '正式（付費會員）',
  permanent: '永久（VIP）'
});

export const PAGE_PERMISSIONS = Object.freeze(Object.fromEntries([
  ['index.html', '流年祿馬貴人', 'formal'],
  ['benming.html', '個人流年祿馬貴人', 'formal'],
  ['renming.html', '六十甲子人命擇日', 'formal'],
  ['renming-query.html', '六十甲子年命擇日查詢', 'formal'],
  ['zibai.html', '流年紫白查詢', 'free'],
  ['zibai-ymd.html', '流年・流月・流日紫白飛星查詢', 'free'],
  ['dehu.html', '逐日的呼查詢', 'permanent'],
  ['fourtime.html', '四大吉時月表', 'free'],
  ['yongji.html', '永吉造命課', 'formal'],
  ['tongshu.html', '通書六十甲子造命', 'formal'],
  ['taixuan.html', '太玄甲子數查詢', 'permanent'],
  ['zhen-luma.html', '真祿馬貴人', 'formal'],
  ['wenchang.html', '文昌', 'free'],
  ['caiwei.html', '財位', 'free'],
  ['taohua.html', '桃花位', 'free'],
  ['buzhen.html', '流年佈陣用日', 'permanent'],
  ['xicai-guihe.html', '喜財貴人鶴神方位查詢', 'formal'],
  ['caiguan-shishen.html', '財・官・十神相配查詢', 'formal'],
  ['liufu.html', '六富日查詢', 'formal'],
  ['bajie-sanqi.html', '八節三奇', 'formal'],
  ['xuankong.html', '玄空飛星', 'permanent'],
  ['liunian-rules.html', '流年法說明', 'permanent'],
  ['benming-rules.html', '個人流年法說明', 'permanent'],
  ['renming-rules.html', '人命擇日說明', 'permanent'],
  ['rules.html', '本版採用規則', 'permanent'],
  ['dehu-rules.html', '的呼規則', 'permanent']
].map(([file, label, minimumPlan]) => [file, Object.freeze({ label, minimumPlan })])));

const PLAN_RANK = Object.freeze({ free: 0, formal: 1, permanent: 2 });
const LEGACY_PAGES = Object.freeze({
  'jishi.html': 'fourtime.html',
  'extended-tools.html': MEMBER_HOME
});

export function canonicalPage(page) {
  return Object.hasOwn(LEGACY_PAGES, page) ? LEGACY_PAGES[page] : page;
}

export function accountRestriction(profile, now = Date.now()) {
  if (!profile) return 'profile';
  if (profile.status !== 'active') return profile.status || 'pending';
  const starts = profile.starts_at ? new Date(profile.starts_at).getTime() : null;
  const expires = profile.expires_at ? new Date(profile.expires_at).getTime() : null;
  if (Number.isNaN(starts) || Number.isNaN(expires)) return 'profile';
  if (starts !== null && starts > now) return 'not_started';
  if (expires !== null && expires <= now) return 'expired';
  return null;
}

export function canAccessPage(profile, page, now = Date.now()) {
  if (accountRestriction(profile, now)) return false;
  page = canonicalPage(page);
  if (page === 'admin.html') return profile.role === 'admin';
  if (profile.role === 'admin' || profile.plan === 'permanent') return true;
  if (!Object.hasOwn(PLAN_RANK, profile.plan)) return false;
  if (page === MEMBER_HOME) return true;
  const rule = Object.hasOwn(PAGE_PERMISSIONS, page) ? PAGE_PERMISSIONS[page] : null;
  return Boolean(rule) && PLAN_RANK[profile.plan] >= PLAN_RANK[rule.minimumPlan];
}

export function denialMessage(profile, page) {
  if (page === 'admin.html') return '僅供管理員使用';
  // 一般會員沿用老師指定的警示文字。
  if (profile?.plan === 'free') return '僅供正式會員使用';
  if (PAGE_PERMISSIONS[canonicalPage(page)]?.minimumPlan === 'permanent') {
    return '僅供永久（VIP）會員使用';
  }
  return '此會員等級尚未開通本項功能';
}
