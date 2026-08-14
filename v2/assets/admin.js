import { supabase } from './supabase-client.js';

const tbody = document.querySelector('#memberTableBody');
const searchInput = document.querySelector('#memberSearch');
const statusFilter = document.querySelector('#memberStatusFilter');
const planFilter = document.querySelector('#memberPlanFilter');
const summary = document.querySelector('#adminSummary');
let rows = [];
let currentUserId = null;

const STATUS_LABELS = { pending: '待審核', active: '已啟用', suspended: '已停權' };
const PLAN_LABELS = { free: '一般', formal: '正式', permanent: '永久' };

function esc(v) {
  return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function dateInputValue(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function filteredRows() {
  const q = (searchInput?.value || '').trim().toLowerCase();
  const st = statusFilter?.value || '';
  const pl = planFilter?.value || '';
  return rows.filter(r => {
    const hay = `${r.email || ''} ${r.display_name || ''} ${r.role || ''} ${r.status || ''} ${r.plan || ''}`.toLowerCase();
    return (!q || hay.includes(q)) && (!st || r.status === st) && (!pl || r.plan === pl);
  });
}

function render() {
  if (!tbody) return;
  const list = filteredRows();
  tbody.innerHTML = list.map(r => `
    <tr data-id="${esc(r.id)}">
      <td><strong>${esc(r.display_name || '未填姓名')}</strong><small>${esc(r.email || '')}</small></td>
      <td><span class="admin-role ${r.role === 'admin' ? 'is-admin' : ''}">${r.role === 'admin' ? '管理員' : '會員'}</span></td>
      <td>
        <select class="admin-status-select" data-field="status" ${r.id===currentUserId?'disabled title="目前登入的管理員不可在此停權自己"':''}>
          ${['pending','active','suspended'].map(v => `<option value="${v}" ${r.status===v?'selected':''}>${STATUS_LABELS[v]}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="admin-plan-select" data-field="plan">
          ${['free','formal','permanent'].map(v => `<option value="${v}" ${r.plan===v?'selected':''}>${PLAN_LABELS[v]}</option>`).join('')}
        </select>
      </td>
      <td><input class="admin-date-input" data-field="starts_at" type="date" value="${dateInputValue(r.starts_at)}"></td>
      <td><input class="admin-date-input" data-field="expires_at" type="date" value="${dateInputValue(r.expires_at)}" ${r.plan==='permanent'?'disabled':''}></td>
      <td><small>建立 ${fmtDate(r.created_at)}</small><br><small>更新 ${fmtDate(r.updated_at)}</small></td>
      <td><button type="button" class="admin-save-btn">儲存</button></td>
    </tr>
  `).join('');

  const counts = rows.reduce((a,r) => { a[r.status]=(a[r.status]||0)+1; return a; }, {});
  if (summary) summary.textContent = `會員 ${rows.length} 人｜待審核 ${counts.pending||0}｜已啟用 ${counts.active||0}｜已停權 ${counts.suspended||0}`;
}

async function loadMembers() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUserId = session?.user?.id || null;
  if (summary) summary.textContent = '讀取會員資料中…';
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,status,plan,starts_at,expires_at,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    if (summary) summary.textContent = `讀取失敗：${error.message}`;
    return;
  }
  rows = data || [];
  render();
}

async function saveRow(tr, button) {
  const id = tr.dataset.id;
  const status = tr.querySelector('[data-field="status"]').value;
  const plan = tr.querySelector('[data-field="plan"]').value;
  const starts = tr.querySelector('[data-field="starts_at"]').value;
  const expiresInput = tr.querySelector('[data-field="expires_at"]');
  const expires = plan === 'permanent' ? null : expiresInput.value;

  button.disabled = true;
  button.textContent = '儲存中…';
  const payload = {
    status,
    plan,
    starts_at: starts ? new Date(`${starts}T00:00:00`).toISOString() : null,
    expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('profiles').update(payload).eq('id', id);
  if (error) {
    alert(`儲存失敗：${error.message}`);
    button.disabled = false;
    button.textContent = '儲存';
    return;
  }
  button.textContent = '已儲存';
  await loadMembers();
}

searchInput?.addEventListener('input', render);
statusFilter?.addEventListener('change', render);
planFilter?.addEventListener('change', render);
tbody?.addEventListener('change', event => {
  if (event.target.matches('[data-field="plan"]')) {
    const tr = event.target.closest('tr');
    const expiry = tr.querySelector('[data-field="expires_at"]');
    expiry.disabled = event.target.value === 'permanent';
    if (expiry.disabled) expiry.value = '';
  }
});
tbody?.addEventListener('click', event => {
  const button = event.target.closest('.admin-save-btn');
  if (!button) return;
  saveRow(button.closest('tr'), button);
});

document.querySelector('#adminRefresh')?.addEventListener('click', loadMembers);

loadMembers();
