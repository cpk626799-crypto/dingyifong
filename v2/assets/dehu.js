const DEHU_STATE = {
  data: window.DEHU_DATA || [],
  toneRules: window.DEHU_TONE_RULES || [],
  currentDay: '甲子'
};

const DEHU_ELEMENT_CLASS = { 金: 'metal', 木: 'wood', 水: 'water', 火: 'fire', 土: 'earth' };
const DEHU_ELEMENT_COLOR = { 金: 'var(--dehu-metal)', 木: 'var(--dehu-wood)', 水: 'var(--dehu-water)', 火: 'var(--dehu-fire)', 土: 'var(--dehu-earth)' };

function dehu$(selector) { return document.querySelector(selector); }
function dehuEscape(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function dehuRecord(day) { return DEHU_STATE.data.find(item => item.day === day) || DEHU_STATE.data[0]; }
function dehuElementBadge(element, extra = '') {
  const color = DEHU_ELEMENT_COLOR[element] || 'var(--accent)';
  return `<span class="dehu-mini-badge ${extra}" style="border-color:${color}; color:${color};">${dehuEscape(element)}</span>`;
}
function dehuElementText(element) {
  const cls = DEHU_ELEMENT_CLASS[element] || '';
  return `<span class="dehu-element-text dehu-element-${cls}">${dehuEscape(element)}</span>`;
}
function dehuFlattenRows() {
  const rows = [];
  DEHU_STATE.data.forEach(rec => rec.results.forEach(result => rows.push({ rec, result })));
  return rows;
}
function dehuPopulateSelect() {
  const select = dehu$('#dehuDaySelect');
  if (!select) return;
  select.innerHTML = DEHU_STATE.data.map(item => `<option value="${item.day}">${item.day}日｜${item.naYin}｜${item.element}</option>`).join('');
  select.value = DEHU_STATE.currentDay;
  select.addEventListener('change', event => {
    DEHU_STATE.currentDay = event.target.value;
    dehuRender();
  });
}
function dehuRender() {
  const rec = dehuRecord(DEHU_STATE.currentDay);
  dehu$('#dehuDayTitle').textContent = `${rec.day}日`;
  dehu$('#dehuDayElement').textContent = rec.element;
  dehu$('#dehuDayElementCard')?.style.setProperty('--element-glow', DEHU_ELEMENT_COLOR[rec.element] || 'var(--accent)');
  dehu$('#dehuNaYin').textContent = `${rec.naYin}｜納音${rec.element}`;
  dehu$('#dehuBranchPosition').textContent = rec.branchPosition;
  dehu$('#dehuTone').textContent = rec.toneFull;
  dehu$('#dehuCount').textContent = String(rec.results.length);
  dehu$('#dehuBadge').textContent = `日柱：${rec.day}日`;
  dehu$('#dehuFlow').innerHTML = `${rec.day}日 → ${dehuEscape(rec.naYin)} ${dehuElementBadge(rec.element)} → ${dehuEscape(rec.toneFull)} → ${dehuEscape(rec.branchPosition)} → 的呼`;
  dehu$('#dehuResultCards').innerHTML = rec.results.map(result => `
    <article class="dehu-result-card">
      <div class="topline">
        <h3>${dehuEscape(result.person)}人 ${dehuElementBadge(result.personElement)}</h3>
        <strong>${dehuEscape(result.tableToneFull)}</strong>
      </div>
      <p>生人納音：<b>${dehuEscape(result.personNaYin)}</b>｜生人五行：${dehuElementText(result.personElement)}</p>
      <p>表內標記：${dehuEscape(result.person)}人 → <b>${dehuEscape(result.tableToneFull)}</b></p>
      <span class="tag good">實務上宜避之</span>
    </article>`).join('');
}
function dehuRenderToneRules() {
  const box = dehu$('#dehuToneRules');
  if (!box) return;
  box.innerHTML = DEHU_STATE.toneRules.map(rule => `
    <article class="dehu-tone-card">
      <strong>${dehuEscape(rule.tone)}</strong>
      <span>${dehuEscape(rule.sequence)}</span>
      <p>納音：${dehuElementText(rule.naYinElement)}｜${dehuEscape(rule.memo)}</p>
    </article>`).join('');
}
function dehuRenderTable(filter = '') {
  const body = dehu$('#dehuDataBody');
  if (!body) return;
  const q = filter.trim().toLowerCase();
  const rows = dehuFlattenRows().filter(({ rec, result }) => {
    if (!q) return true;
    return [rec.day, rec.naYin, rec.element, rec.toneFull, rec.branchPosition, result.person, result.personNaYin, result.personElement, result.tableToneFull]
      .join(' ').toLowerCase().includes(q);
  });
  body.innerHTML = rows.map(({ rec, result }) => `
    <tr>
      <td><b>${dehuEscape(rec.day)}日</b></td>
      <td>${dehuEscape(rec.naYin)}</td>
      <td>${dehuElementText(rec.element)}</td>
      <td>${dehuEscape(rec.toneFull)}</td>
      <td>${dehuEscape(rec.branchPosition)}</td>
      <td><b>${dehuEscape(result.person)}人</b></td>
      <td>${dehuEscape(result.personNaYin)}</td>
      <td>${dehuElementText(result.personElement)}</td>
      <td>${dehuEscape(result.tableToneFull)}</td>
    </tr>`).join('');
}
function dehuDownloadCSV() {
  const header = ['日柱','日柱納音','日柱五行','所屬五音','日支位置','的呼生人','生人納音','生人五行','表內五音分類'];
  const rows = dehuFlattenRows().map(({ rec, result }) => [
    `${rec.day}日`, rec.naYin, rec.element, rec.toneFull, rec.branchPosition,
    `${result.person}人`, result.personNaYin, result.personElement, result.tableToneFull
  ]);
  const csv = [header, ...rows].map(line => line.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '逐日入殮移柩安葬的呼_標註五行.csv';
  a.click();
  URL.revokeObjectURL(url);
}
function dehuToast(text) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}
async function dehuCopy() {
  const rec = dehuRecord(DEHU_STATE.currentDay);
  const resultLines = rec.results.map(r => `${r.person}人（${r.personNaYin}，${r.personElement}）→ ${r.tableToneFull}`);
  const text = [
    `逐日入殮移柩安葬的呼`,
    `日柱：${rec.day}日`,
    `納音：${rec.naYin}（${rec.element}）`,
    `所屬五音：${rec.toneFull}`,
    `日支位置：${rec.branchPosition}`,
    `的呼：${resultLines.join('；')}`
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    dehuToast('已複製的呼結果');
  } catch (err) {
    dehuToast('瀏覽器不支援自動複製');
  }
}
function dehuBind() {
  dehu$('#dehuSearch')?.addEventListener('input', e => dehuRenderTable(e.target.value));
  dehu$('#dehuCsvBtn')?.addEventListener('click', dehuDownloadCSV);
  dehu$('#dehuCopyBtn')?.addEventListener('click', dehuCopy);
  dehu$('#dehuResetBtn')?.addEventListener('click', () => {
    DEHU_STATE.currentDay = '甲子';
    const select = dehu$('#dehuDaySelect');
    if (select) select.value = '甲子';
    dehuRender();
  });
}
function dehuInit() {
  if (!DEHU_STATE.data.length) return;
  dehuPopulateSelect();
  dehuRender();
  dehuRenderToneRules();
  dehuRenderTable();
  dehuBind();
}
document.addEventListener('DOMContentLoaded', dehuInit);
