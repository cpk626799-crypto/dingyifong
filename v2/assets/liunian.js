const FLOW_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const FLOW_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const FLOW_MONTH_ORDER = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
const FLOW_CYCLE = Array.from({ length: 60 }, (_, i) => FLOW_STEMS[i % 10] + FLOW_BRANCHES[i % 12]);
const FLOW_FLY = [
  { short:'中', label:'中宮5', num:5, dir:'中央', mountains:'中宮' },
  { short:'乾', label:'乾宮6', num:6, dir:'西北', mountains:'戌乾亥' },
  { short:'兌', label:'兌宮7', num:7, dir:'西', mountains:'庚酉辛' },
  { short:'艮', label:'艮宮8', num:8, dir:'東北', mountains:'丑艮寅' },
  { short:'離', label:'離宮9', num:9, dir:'南', mountains:'丙午丁' },
  { short:'坎', label:'坎宮1', num:1, dir:'北', mountains:'壬子癸' },
  { short:'坤', label:'坤宮2', num:2, dir:'西南', mountains:'未坤申' },
  { short:'震', label:'震宮3', num:3, dir:'東', mountains:'甲卯乙' },
  { short:'巽', label:'巽宮4', num:4, dir:'東南', mountains:'辰巽巳' }
];
const FLOW_GRID_ORDER = ['巽','離','坤','震','中','兌','艮','坎','乾'];
const FLOW_LUCK_BRANCH = { '甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子' };
const FLOW_HORSE_BRANCH = {
  '申':'寅','子':'寅','辰':'寅',
  '寅':'申','午':'申','戌':'申',
  '巳':'亥','酉':'亥','丑':'亥',
  '亥':'巳','卯':'巳','未':'巳'
};
const FLOW_NOBLE_PAIR = {
  '甲':['丑','未'], '乙':['子','申'], '丙':['亥','酉'], '丁':['亥','酉'], '戊':['丑','未'],
  '己':['子','申'], '庚':['丑','未'], '辛':['寅','午'], '壬':['卯','巳'], '癸':['卯','巳']
};
const FLOW_TIGER_START = { '甲':2, '己':2, '乙':4, '庚':4, '丙':6, '辛':6, '丁':8, '壬':8, '戊':0, '癸':0 };
const FLOW_TYPE_META = {
  '流年真歲祿': { key:'luck', label:'祿', className:'luck' },
  '流年真歲馬': { key:'horse', label:'馬', className:'horse' },
  '歲陽貴': { key:'yang', label:'陽貴', className:'yang' },
  '歲陰貴': { key:'yin', label:'陰貴', className:'yin' }
};
const flowEls = {
  year: document.querySelector('#flowYearSelect'),
  month: document.querySelector('#monthBranchSelect'),
  search: document.querySelector('#flowSearch'),
  yearCard: document.querySelector('#flowYearCard'),
  taiSuiCard: document.querySelector('#flowTaiSuiCard'),
  monthCard: document.querySelector('#flowMonthCard'),
  entryCard: document.querySelector('#flowEntryCard'),
  badge: document.querySelector('#flowBadge'),
  cards: document.querySelector('#flowResultCards'),
  grid: document.querySelector('#flowNineGrid'),
  tbody: document.querySelector('#flowTableBody'),
  copy: document.querySelector('#flowCopyBtn'),
  csv: document.querySelector('#flowCsvBtn'),
  print: document.querySelector('#flowPrintBtn')
};
let flowAllRows = [];
let flowVisibleRows = [];
function flowMod(n, m) { return ((n % m) + m) % m; }
function flowStem(gz) { return gz.slice(0, 1); }
function flowBranch(gz) { return gz.slice(1, 2); }
function flowCycleIndex(gz) { return FLOW_CYCLE.indexOf(gz); }
function flowYearGanzhi(year) { return FLOW_CYCLE[flowMod(year - 1984, 60)]; }
function flowMonthGanzhi(yearStem, monthBranch) {
  const start = FLOW_TIGER_START[yearStem];
  const offset = flowMod(FLOW_BRANCHES.indexOf(monthBranch) - 2, 12);
  return FLOW_STEMS[flowMod(start + offset, 10)] + monthBranch;
}
function flowTrueGanzhi(yearStem, targetBranch) { return flowMonthGanzhi(yearStem, targetBranch); }
function flowPalaceOf(entryGz, targetGz) {
  const diff = flowMod(flowCycleIndex(targetGz) - flowCycleIndex(entryGz), 60);
  return FLOW_FLY[diff % 9];
}
function flowHorseText(branch) {
  if ('申子辰'.includes(branch)) return '申子辰馬在寅';
  if ('寅午戌'.includes(branch)) return '寅午戌馬在申';
  if ('巳酉丑'.includes(branch)) return '巳酉丑馬在亥';
  return '亥卯未馬在巳';
}
function flowNobleText(stem) {
  const p = FLOW_NOBLE_PAIR[stem];
  return `${stem}貴人在${p[0]}${p[1]}`;
}
function flowDefsForYear(yearGz) {
  const stem = flowStem(yearGz);
  const branch = flowBranch(yearGz);
  const noble = FLOW_NOBLE_PAIR[stem];
  return [
    { type:'流年真歲祿', branch:FLOW_LUCK_BRANCH[stem], note:`${stem}祿在${FLOW_LUCK_BRANCH[stem]}，五虎遁成真歲祿` },
    { type:'流年真歲馬', branch:FLOW_HORSE_BRANCH[branch], note:`${flowHorseText(branch)}，五虎遁成真歲馬` },
    { type:'歲陽貴', branch:noble[0], note:`${flowNobleText(stem)}；${noble[0]}上遁得歲陽貴` },
    { type:'歲陰貴', branch:noble[1], note:`${flowNobleText(stem)}；${noble[1]}上遁得歲陰貴` }
  ].map(d => ({ ...d, trueGz: flowTrueGanzhi(stem, d.branch) }));
}
function flowRowsForMonth(year, monthBranch) {
  const yearGz = flowYearGanzhi(year);
  const yearStem = flowStem(yearGz);
  const monthGz = flowMonthGanzhi(yearStem, monthBranch);
  return flowDefsForYear(yearGz).map((d, idx) => {
    const palace = flowPalaceOf(monthGz, d.trueGz);
    return {
      monthBranch,
      monthGz,
      type:d.type,
      originalBranch:d.branch,
      trueGz:d.trueGz,
      palaceLabel:palace.label,
      palaceShort:palace.short,
      palaceNum:palace.num,
      dir:palace.dir,
      mountains:palace.mountains,
      note:d.note,
      usage:`${monthGz}月建入中，${d.trueGz}落${palace.label}，應${palace.mountains}方`,
      meta:FLOW_TYPE_META[d.type],
      sort:idx
    };
  });
}
function buildFlowRows(year) { return FLOW_MONTH_ORDER.flatMap(m => flowRowsForMonth(year, m)); }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
function escapeCsv(value) { return `"${String(value).replaceAll('"','""')}"`; }
function populateFlowControls() {
  flowEls.year.innerHTML = Array.from({length: 2200 - 2026 + 1}, (_, i) => {
    const year = 2026 + i;
    return `<option value="${year}">${year}</option>`;
  }).join('');
  flowEls.year.value = '2026';
  flowEls.month.innerHTML = FLOW_MONTH_ORDER.map(b => `<option value="${b}">${b}月</option>`).join('');
  flowEls.month.value = '午';
}
function selectedRows() {
  const month = flowEls.month.value;
  return flowAllRows.filter(r => r.monthBranch === month);
}
function rowText(row) { return [row.monthBranch,row.monthGz,row.type,row.originalBranch,row.trueGz,row.palaceLabel,row.palaceNum,row.dir,row.mountains,row.note,row.usage].join(''); }
function renderFlowSummary() {
  const year = Number(flowEls.year.value);
  const yearGz = flowYearGanzhi(year);
  const month = flowEls.month.value;
  const monthGz = flowMonthGanzhi(flowStem(yearGz), month);
  flowEls.yearCard.textContent = year;
  flowEls.taiSuiCard.textContent = yearGz;
  flowEls.monthCard.textContent = `${month}月`;
  flowEls.entryCard.textContent = monthGz;
  flowEls.badge.textContent = `${year} ${yearGz}｜${monthGz}月建入中`;
}
function renderFlowCards() {
  const rows = selectedRows();
  flowEls.cards.innerHTML = rows.map(row => `<article class="liunian-result-card ${row.meta.className}">
    <div class="topline"><h3>${row.type}</h3><strong>${row.trueGz}</strong></div>
    <p>原取支：<b>${row.originalBranch}</b>｜${escapeHtml(row.note)}</p>
    <p>落宮：<b>${row.palaceLabel}</b>（${row.dir}）</p>
    <span class="tag good">${row.mountains}方</span>
  </article>`).join('');
}
function renderFlowGrid() {
  const rows = selectedRows();
  flowEls.grid.innerHTML = FLOW_GRID_ORDER.map(short => {
    const palace = FLOW_FLY.find(p => p.short === short);
    const hits = rows.filter(r => r.palaceShort === short);
    return `<div class="palace-cell flow-palace ${hits.length ? 'is-hit' : ''}">
      <div class="palace-head"><span class="palace-title">${palace.label}</span><span class="palace-dir">${palace.dir}</span></div>
      <div class="palace-markers">${hits.map(h => `<span class="flow-marker ${h.meta.className}">${h.meta.label} ${h.trueGz}</span>`).join('')}</div>
      <p class="flow-mountains">${palace.mountains}</p>
    </div>`;
  }).join('');
}
function renderFlowTable() {
  const q = flowEls.search.value.trim();
  flowVisibleRows = flowAllRows.filter(row => !q || rowText(row).includes(q));
  const selectedMonth = flowEls.month.value;
  flowEls.tbody.innerHTML = flowVisibleRows.map(row => {
    const selected = row.monthBranch === selectedMonth ? ' is-selected-month' : '';
    return `<tr class="flow-row ${row.meta.className}${selected}">
      <td>${row.monthBranch}月</td>
      <td><b>${row.monthGz}</b></td>
      <td>${row.type}</td>
      <td><b>${row.trueGz}</b></td>
      <td>${row.palaceLabel}</td>
      <td>${row.palaceNum}</td>
      <td>${row.dir}</td>
      <td>${row.mountains}</td>
      <td>${escapeHtml(row.usage)}</td>
    </tr>`;
  }).join('');
}
function updateFlow() {
  const year = Number(flowEls.year.value);
  flowAllRows = buildFlowRows(year);
  renderFlowSummary();
  renderFlowCards();
  renderFlowGrid();
  renderFlowTable();
}
async function copyFlowResult() {
  const year = Number(flowEls.year.value);
  const yearGz = flowYearGanzhi(year);
  const month = flowEls.month.value;
  const rows = selectedRows();
  const text = [`流年祿馬貴人查詢`, `用事年：${year} ${yearGz}`, `選定月建：${rows[0].monthGz}（${month}月）`, ...rows.map(r => `${r.type}｜${r.trueGz}：${r.palaceLabel}（${r.dir}）／${r.mountains}方`)].join('\n');
  try { await navigator.clipboard.writeText(text); showFlowToast('已複製選定月建結果'); }
  catch (err) { showFlowToast('瀏覽器不支援自動複製'); }
}
function downloadFlowCsv() {
  const header = ['月建支','月建干支','真神','真神干支','落宮','宮數','方位','二十四山','用法備註'];
  const lines = [header, ...flowVisibleRows.map(r => [`${r.monthBranch}月`,r.monthGz,r.type,r.trueGz,r.palaceLabel,r.palaceNum,r.dir,r.mountains,r.usage])];
  const csv = lines.map(line => line.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `流年祿馬貴人_${flowEls.year.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function showFlowToast(text) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}
function initFlow() {
  populateFlowControls();
  updateFlow();
  [flowEls.year, flowEls.month, flowEls.search].forEach(el => el.addEventListener('input', updateFlow));
  flowEls.copy.addEventListener('click', copyFlowResult);
  flowEls.csv.addEventListener('click', downloadFlowCsv);
  flowEls.print.addEventListener('click', () => window.print());
}
document.addEventListener('DOMContentLoaded', initFlow);
