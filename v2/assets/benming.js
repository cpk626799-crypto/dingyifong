const BM_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BM_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BM_CYCLE = Array.from({ length: 60 }, (_, i) => BM_STEMS[i % 10] + BM_BRANCHES[i % 12]);
const BM_FLY = [
  { short: '中', label: '中宮5', num: 5, dir: '中央', mountains: '中宮' },
  { short: '乾', label: '乾宮6', num: 6, dir: '西北', mountains: '戌乾亥' },
  { short: '兌', label: '兌宮7', num: 7, dir: '西', mountains: '庚酉辛' },
  { short: '艮', label: '艮宮8', num: 8, dir: '東北', mountains: '丑艮寅' },
  { short: '離', label: '離宮9', num: 9, dir: '南', mountains: '丙午丁' },
  { short: '坎', label: '坎宮1', num: 1, dir: '北', mountains: '壬子癸' },
  { short: '坤', label: '坤宮2', num: 2, dir: '西南', mountains: '未坤申' },
  { short: '震', label: '震宮3', num: 3, dir: '東', mountains: '甲卯乙' },
  { short: '巽', label: '巽宮4', num: 4, dir: '東南', mountains: '辰巽巳' }
];
const BM_LUCK_BRANCH = { '甲':'寅', '乙':'卯', '丙':'巳', '丁':'午', '戊':'巳', '己':'午', '庚':'申', '辛':'酉', '壬':'亥', '癸':'子' };
const BM_HORSE_BRANCH = {
  '申':'寅','子':'寅','辰':'寅',
  '寅':'申','午':'申','戌':'申',
  '巳':'亥','酉':'亥','丑':'亥',
  '亥':'巳','卯':'巳','未':'巳'
};
const BM_NOBLE_PAIR = {
  '甲':['丑','未'], '乙':['子','申'], '丙':['亥','酉'], '丁':['亥','酉'], '戊':['丑','未'],
  '己':['子','申'], '庚':['丑','未'], '辛':['寅','午'], '壬':['卯','巳'], '癸':['卯','巳']
};
const BM_TIGER_START = { '甲':2, '己':2, '乙':4, '庚':4, '丙':6, '辛':6, '丁':8, '壬':8, '戊':0, '癸':0 };

const bmEls = {
  workYear: document.querySelector('#workYearSelect'),
  birth: document.querySelector('#birthSelect'),
  onlyBirth: document.querySelector('#onlyBirthToggle'),
  search: document.querySelector('#benmingSearch'),
  workYearCard: document.querySelector('#workYearCard'),
  taiSuiCard: document.querySelector('#taiSuiCard'),
  birthCard: document.querySelector('#birthCard'),
  birthHintCard: document.querySelector('#birthHintCard'),
  rowCountCard: document.querySelector('#rowCountCard'),
  badge: document.querySelector('#benmingBadge'),
  cards: document.querySelector('#benmingResultCards'),
  tbody: document.querySelector('#benmingTableBody'),
  copy: document.querySelector('#benmingCopyBtn'),
  csv: document.querySelector('#benmingCsvBtn'),
  print: document.querySelector('#benmingPrintBtn')
};
let bmAllRows = [];
let bmVisibleRows = [];

function bmMod(n, m) { return ((n % m) + m) % m; }
function bmStem(gz) { return gz.slice(0, 1); }
function bmBranch(gz) { return gz.slice(1, 2); }
function bmCycleIndex(gz) { return BM_CYCLE.indexOf(gz); }
function bmYearGanzhi(year) { return BM_CYCLE[bmMod(year - 1984, 60)]; }
function bmTrueGanzhi(birthStem, targetBranch) {
  const start = BM_TIGER_START[birthStem];
  const offset = bmMod(BM_BRANCHES.indexOf(targetBranch) - 2, 12); // 寅為起點
  return BM_STEMS[bmMod(start + offset, 10)] + targetBranch;
}
function bmPalaceOf(entryGz, targetGz) {
  const diff = bmMod(bmCycleIndex(targetGz) - bmCycleIndex(entryGz), 60);
  return BM_FLY[diff % 9];
}
function bmNobleText(stem) {
  const pair = BM_NOBLE_PAIR[stem];
  return `${stem}貴人在${pair[0]}${pair[1]}`;
}
function bmTrueGodRowsForBirth(birthGz, entryGz, groupIndex) {
  const stem = bmStem(birthGz);
  const branch = bmBranch(birthGz);
  const luckBranch = BM_LUCK_BRANCH[stem];
  const horseBranch = BM_HORSE_BRANCH[branch];
  const noble = BM_NOBLE_PAIR[stem];
  const defs = [
    { type: '個人真祿', branch: luckBranch, note: `${stem}祿在${luckBranch}，以${stem}年五虎遁得` },
    { type: '個人真馬', branch: horseBranch, note: `${horseBranchByText(branch)}，以${stem}年五虎遁得` },
    { type: '個人陽貴', branch: noble[0], note: `${bmNobleText(stem)}；${noble[0]}上遁得` },
    { type: '個人陰貴', branch: noble[1], note: `${bmNobleText(stem)}；${noble[1]}上遁得` }
  ];
  return defs.map((d, idx) => {
    const trueGz = bmTrueGanzhi(stem, d.branch);
    const palace = bmPalaceOf(entryGz, trueGz);
    const seq = groupIndex * 4 + idx + 1;
    const note = d.note + trueGz;
    return {
      seq,
      birth: birthGz,
      birthStem: stem,
      birthBranch: branch,
      type: d.type,
      originalBranch: d.branch,
      trueGz,
      methodNote: note,
      palaceLabel: palace.label,
      palaceNum: palace.num,
      dir: palace.dir,
      mountains: palace.mountains,
      usage: `以${entryGz}太歲入中，${trueGz}落${palace.label}，應${palace.mountains}方`,
      groupIndex
    };
  });
}
function horseBranchByText(branch) {
  if ('申子辰'.includes(branch)) return '申子辰馬在寅';
  if ('寅午戌'.includes(branch)) return '寅午戌馬在申';
  if ('巳酉丑'.includes(branch)) return '巳酉丑馬在亥';
  return '亥卯未馬在巳';
}
function buildBmRows(workYear) {
  const entryGz = bmYearGanzhi(workYear);
  return BM_CYCLE.flatMap((birthGz, groupIndex) => bmTrueGodRowsForBirth(birthGz, entryGz, groupIndex));
}
function populateBmControls() {
  bmEls.workYear.innerHTML = Array.from({ length: 2200 - 2026 + 1 }, (_, i) => {
    const year = 2026 + i;
    return `<option value="${year}">${year}</option>`;
  }).join('');
  bmEls.workYear.value = '2026';
  bmEls.birth.innerHTML = BM_CYCLE.map(gz => `<option value="${gz}">${gz}</option>`).join('');
  bmEls.birth.value = '甲子';
}
function groupHue(groupIndex) { return (groupIndex * 47) % 360; }
function escapeCsvCell(value) { return `"${String(value).replaceAll('"','""')}"`; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}
function rowSearchText(row) {
  return [row.seq,row.birth,row.birthStem,row.birthBranch,row.type,row.originalBranch,row.trueGz,row.methodNote,row.palaceLabel,row.palaceNum,row.dir,row.mountains,row.usage].join('');
}
function filterBmRows() {
  const selectedBirth = bmEls.birth.value;
  const q = bmEls.search.value.trim();
  return bmAllRows.filter(row => {
    const birthOk = !bmEls.onlyBirth.checked || row.birth === selectedBirth;
    const searchOk = !q || rowSearchText(row).includes(q);
    return birthOk && searchOk;
  });
}
function renderBmCards() {
  const year = Number(bmEls.workYear.value);
  const entryGz = bmYearGanzhi(year);
  const birth = bmEls.birth.value;
  const selectedRows = bmAllRows.filter(row => row.birth === birth);
  bmEls.badge.textContent = `${year} ${entryGz}太歲入中｜${birth}年命`;
  bmEls.cards.innerHTML = selectedRows.map(row => {
    const hue = groupHue(row.groupIndex);
    return `<article class="benming-result-card" style="--group-hue:${hue}">
      <div class="topline"><h3>${row.type}</h3><strong>${row.trueGz}</strong></div>
      <p>原取支：<b>${row.originalBranch}</b>｜${row.methodNote}</p>
      <p>落宮：<b>${row.palaceLabel}</b>（${row.dir}）</p>
      <span class="tag good">${row.mountains}方</span>
    </article>`;
  }).join('');
}
function renderBmTable() {
  bmVisibleRows = filterBmRows();
  const selectedBirth = bmEls.birth.value;
  bmEls.tbody.innerHTML = bmVisibleRows.map(row => {
    const hue = groupHue(row.groupIndex);
    const selected = row.birth === selectedBirth ? ' is-selected-birth' : '';
    return `<tr class="benming-group-row${selected}" style="--group-hue:${hue}">
      <td>${row.seq}</td>
      <td><b>${row.birth}</b></td>
      <td>${row.birthStem}</td>
      <td>${row.birthBranch}</td>
      <td>${row.type}</td>
      <td>${row.originalBranch}</td>
      <td><b>${row.trueGz}</b></td>
      <td>${escapeHtml(row.methodNote)}</td>
      <td>${row.palaceLabel}</td>
      <td>${row.palaceNum}</td>
      <td>${row.dir}</td>
      <td>${row.mountains}</td>
      <td>${escapeHtml(row.usage)}</td>
    </tr>`;
  }).join('');
  bmEls.rowCountCard.textContent = bmVisibleRows.length;
}
function renderBmSummary() {
  const year = Number(bmEls.workYear.value);
  const entryGz = bmYearGanzhi(year);
  const birth = bmEls.birth.value;
  bmEls.workYearCard.textContent = year;
  bmEls.taiSuiCard.textContent = entryGz;
  bmEls.birthCard.textContent = birth;
  bmEls.birthHintCard.textContent = bmEls.onlyBirth.checked ? '完整表僅顯示此年命' : '完整表顯示60甲子，並高亮此年命';
}
function updateBm() {
  const year = Number(bmEls.workYear.value);
  bmAllRows = buildBmRows(year);
  renderBmSummary();
  renderBmCards();
  renderBmTable();
}
async function copyBmResult() {
  const year = Number(bmEls.workYear.value);
  const entryGz = bmYearGanzhi(year);
  const birth = bmEls.birth.value;
  const selectedRows = bmAllRows.filter(row => row.birth === birth);
  const text = [
    `個人流年祿馬貴人查詢`,
    `用事年：${year} ${entryGz}太歲入中`,
    `年命：${birth}`,
    ...selectedRows.map(r => `${r.type}｜${r.trueGz}：${r.palaceLabel}（${r.dir}）／${r.mountains}方`)
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showBmToast('已複製所選年命結果');
  } catch (err) {
    showBmToast('瀏覽器不支援自動複製');
  }
}
function downloadBmCsv() {
  const header = ['序號','年命','命干','命支','真神類別','原取支','真神干支','取法簡註','太歲入中後落宮','宮數','方位','二十四山','用法備註'];
  const lines = [header, ...bmVisibleRows.map(r => [r.seq,r.birth,r.birthStem,r.birthBranch,r.type,r.originalBranch,r.trueGz,r.methodNote,r.palaceLabel,r.palaceNum,r.dir,r.mountains,r.usage])];
  const csv = lines.map(line => line.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `個人流年祿馬貴人_${bmEls.workYear.value}_${bmEls.birth.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function showBmToast(text) {
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
function initBm() {
  populateBmControls();
  updateBm();
  [bmEls.workYear, bmEls.birth, bmEls.onlyBirth, bmEls.search].forEach(el => el.addEventListener('input', updateBm));
  bmEls.copy.addEventListener('click', copyBmResult);
  bmEls.csv.addEventListener('click', downloadBmCsv);
  bmEls.print.addEventListener('click', () => window.print());
}
document.addEventListener('DOMContentLoaded', initBm);
