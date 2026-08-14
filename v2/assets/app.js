const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const CYCLE = Array.from({ length: 60 }, (_, i) => STEMS[i % 10] + BRANCHES[i % 12]);
const FLY_ORDER = ['中','乾','兌','艮','離','坎','坤','震','巽'];
const PALACE_DIR = {
  '中': '中央', '乾': '西北', '兌': '西', '艮': '東北', '離': '南',
  '坎': '北', '坤': '西南', '震': '東', '巽': '東南'
};
const GRID_ORDER = ['巽','離','坤','震','中','兌','艮','坎','乾'];
const OPPOSITE = { '坎':'離','離':'坎','艮':'坤','坤':'艮','震':'兌','兌':'震','巽':'乾','乾':'巽','中':'中' };
const MOUNTAINS = [
  ['不指定', ''],
  ['壬山', '坎'], ['子山', '坎'], ['癸山', '坎'],
  ['丑山', '艮'], ['艮山', '艮'], ['寅山', '艮'],
  ['甲山', '震'], ['卯山', '震'], ['乙山', '震'],
  ['辰山', '巽'], ['巽山', '巽'], ['巳山', '巽'],
  ['丙山', '離'], ['午山', '離'], ['丁山', '離'],
  ['未山', '坤'], ['坤山', '坤'], ['申山', '坤'],
  ['庚山', '兌'], ['酉山', '兌'], ['辛山', '兌'],
  ['戌山', '乾'], ['乾山', '乾'], ['亥山', '乾']
];

const LUCK_BRANCH = { '甲':'寅', '乙':'卯', '丙':'巳', '丁':'午', '戊':'巳', '己':'午', '庚':'申', '辛':'酉', '壬':'亥', '癸':'子' };
const HORSE_BRANCH_BY_GROUP = {
  '申':'寅','子':'寅','辰':'寅',
  '寅':'申','午':'申','戌':'申',
  '巳':'亥','酉':'亥','丑':'亥',
  '亥':'巳','卯':'巳','未':'巳'
};
const YANG_NOBLE = { '甲':'未', '乙':'申', '丙':'酉', '丁':'亥', '戊':'丑', '己':'子', '庚':'丑', '辛':'寅', '壬':'卯', '癸':'巳' };
const YIN_NOBLE = { '甲':'丑', '乙':'子', '丙':'亥', '丁':'酉', '戊':'未', '己':'申', '庚':'未', '辛':'午', '壬':'巳', '癸':'卯' };
const WENCHANG_BRANCH = { '甲':'巳', '乙':'午', '丙':'申', '丁':'酉', '戊':'申', '己':'酉', '庚':'亥', '辛':'子', '壬':'寅', '癸':'卯' };
const TIANGUAN_BRANCH = { '甲':'未', '乙':'辰', '丙':'巳', '丁':'酉', '戊':'戌', '己':'卯', '庚':'丑', '辛':'申', '壬':'寅', '癸':'午' };
const ROBBERY_BRANCH_BY_GROUP = {
  '申':'巳','子':'巳','辰':'巳',
  '亥':'申','卯':'申','未':'申',
  '寅':'亥','午':'亥','戌':'亥',
  '巳':'寅','酉':'寅','丑':'寅'
};
const DISASTER_BRANCH_BY_GROUP = {
  '申':'午','子':'午','辰':'午',
  '亥':'酉','卯':'酉','未':'酉',
  '寅':'子','午':'子','戌':'子',
  '巳':'卯','酉':'卯','丑':'卯'
};
const SHENSHA_TONES = {
  good: '吉神',
  illness: '病符',
  robbery: '劫煞',
  disaster: '災煞',
  grave: '墓煞'
};
const TIGER_START_STEM = { '甲':2, '己':2, '乙':4, '庚':4, '丙':6, '辛':6, '丁':8, '壬':8, '戊':0, '癸':0 };
const RAT_START_STEM = { '甲':0, '己':0, '乙':2, '庚':2, '丙':4, '辛':4, '丁':6, '壬':6, '戊':8, '癸':8 };

// 中央氣象署「中華民國115年日曆資料表」節氣資料。
// 時間為臺灣時（UTC+8）。用於 2026 年柱、月建切換。
const CWA_SOLAR_TERMS = [
  { year: 2026, name: '小寒', month: 1, day: 5, hour: 16, minute: 23, branch: '丑', kind: '節' },
  { year: 2026, name: '大寒', month: 1, day: 20, hour: 9, minute: 45, branch: '丑', kind: '氣' },
  { year: 2026, name: '立春', month: 2, day: 4, hour: 4, minute: 2, branch: '寅', kind: '節', yearChange: true },
  { year: 2026, name: '雨水', month: 2, day: 18, hour: 23, minute: 52, branch: '寅', kind: '氣' },
  { year: 2026, name: '驚蟄', month: 3, day: 5, hour: 21, minute: 59, branch: '卯', kind: '節' },
  { year: 2026, name: '春分', month: 3, day: 20, hour: 22, minute: 46, branch: '卯', kind: '氣' },
  { year: 2026, name: '清明', month: 4, day: 5, hour: 2, minute: 40, branch: '辰', kind: '節' },
  { year: 2026, name: '穀雨', month: 4, day: 20, hour: 9, minute: 39, branch: '辰', kind: '氣' },
  { year: 2026, name: '立夏', month: 5, day: 5, hour: 19, minute: 49, branch: '巳', kind: '節' },
  { year: 2026, name: '小滿', month: 5, day: 21, hour: 8, minute: 37, branch: '巳', kind: '氣' },
  { year: 2026, name: '芒種', month: 6, day: 5, hour: 23, minute: 48, branch: '午', kind: '節' },
  { year: 2026, name: '夏至', month: 6, day: 21, hour: 16, minute: 24, branch: '午', kind: '氣' },
  { year: 2026, name: '小暑', month: 7, day: 7, hour: 9, minute: 57, branch: '未', kind: '節' },
  { year: 2026, name: '大暑', month: 7, day: 23, hour: 3, minute: 13, branch: '未', kind: '氣' },
  { year: 2026, name: '立秋', month: 8, day: 7, hour: 19, minute: 43, branch: '申', kind: '節' },
  { year: 2026, name: '處暑', month: 8, day: 23, hour: 10, minute: 19, branch: '申', kind: '氣' },
  { year: 2026, name: '白露', month: 9, day: 7, hour: 22, minute: 41, branch: '酉', kind: '節' },
  { year: 2026, name: '秋分', month: 9, day: 23, hour: 8, minute: 5, branch: '酉', kind: '氣' },
  { year: 2026, name: '寒露', month: 10, day: 8, hour: 14, minute: 29, branch: '戌', kind: '節' },
  { year: 2026, name: '霜降', month: 10, day: 23, hour: 17, minute: 38, branch: '戌', kind: '氣' },
  { year: 2026, name: '立冬', month: 11, day: 7, hour: 17, minute: 52, branch: '亥', kind: '節' },
  { year: 2026, name: '小雪', month: 11, day: 22, hour: 15, minute: 23, branch: '亥', kind: '氣' },
  { year: 2026, name: '大雪', month: 12, day: 7, hour: 10, minute: 52, branch: '子', kind: '節' },
  { year: 2026, name: '冬至', month: 12, day: 22, hour: 4, minute: 50, branch: '子', kind: '氣' },
  // 同一張資料表下方附列 2027 年初節氣，用於 2027 年 1 月至立春前後銜接。
  { year: 2027, name: '小寒', month: 1, day: 5, hour: 22, minute: 10, branch: '丑', kind: '節' },
  { year: 2027, name: '大寒', month: 1, day: 20, hour: 15, minute: 30, branch: '丑', kind: '氣' },
  { year: 2027, name: '立春', month: 2, day: 4, hour: 9, minute: 46, branch: '寅', kind: '節', yearChange: true },
  { year: 2027, name: '雨水', month: 2, day: 19, hour: 5, minute: 33, branch: '寅', kind: '氣' }
];
const CWA_JIE_TERMS = CWA_SOLAR_TERMS.filter(term => term.kind === '節');
const CWA_YEAR_RANGE_TEXT = '中華民國115年日曆資料表（2026；並附2027年初銜接資料）';


const els = {
  date: document.querySelector('#dateInput'),
  time: document.querySelector('#timeInput'),
  lateZi: document.querySelector('#lateZi'),
  entrySource: document.querySelector('#entrySource'),
  entryGanzhi: document.querySelector('#entryGanzhi'),
  birthGanzhi: document.querySelector('#birthGanzhi'),
  gender: document.querySelector('#genderInput'),
  mountain: document.querySelector('#mountainInput'),
  yearPillar: document.querySelector('#yearPillar'),
  monthPillar: document.querySelector('#monthPillar'),
  dayPillar: document.querySelector('#dayPillar'),
  hourPillar: document.querySelector('#hourPillar'),
  hourBranchText: document.querySelector('#hourBranchText'),
  yearRuleNote: document.querySelector('#yearRuleNote'),
  monthRuleNote: document.querySelector('#monthRuleNote'),
  precisionNote: document.querySelector('#precisionNote'),
  entryBadge: document.querySelector('#entryBadge'),
  resultCards: document.querySelector('#resultCards'),
  nineGrid: document.querySelector('#nineGrid'),
  flyingTable: document.querySelector('#flyingTable'),
  tableSearch: document.querySelector('#tableSearch'),
  copyBtn: document.querySelector('#copyBtn'),
  csvBtn: document.querySelector('#csvBtn'),
  printBtn: document.querySelector('#printBtn')
};

let currentRows = [];
let currentResults = [];

function mod(n, m) { return ((n % m) + m) % m; }
function cycleIndex(gz) { return CYCLE.indexOf(gz); }
function stemOf(gz) { return gz.slice(0, 1); }
function branchOf(gz) { return gz.slice(1, 2); }
function branchOffset(branch, offset) { return BRANCHES[mod(BRANCHES.indexOf(branch) + offset, 12)]; }
function pad(n) { return String(n).padStart(2, '0'); }

function populateSelects() {
  const options = CYCLE.map(gz => `<option value="${gz}">${gz}</option>`).join('');
  els.entryGanzhi.innerHTML = options;
  els.birthGanzhi.innerHTML = options;
  els.birthGanzhi.value = '甲子';
  els.mountain.innerHTML = MOUNTAINS.map(([label, value]) => `<option value="${value}" data-label="${label}">${label}</option>`).join('');
}

function setDefaults() {
  const now = new Date();
  els.date.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  els.time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function ganzhiFromStemAndBranch(yearStem, branch) {
  const start = TIGER_START_STEM[yearStem];
  const branchIdx = BRANCHES.indexOf(branch);
  const offset = mod(branchIdx - 2, 12); // 寅為起點
  return STEMS[mod(start + offset, 10)] + branch;
}

function getDateParts() {
  const [y, m, d] = els.date.value.split('-').map(Number);
  const [hh, mm] = els.time.value.split(':').map(Number);
  return { y, m, d, hh: hh || 0, mm: mm || 0 };
}

function dateUTC(y, m, d) { return Date.UTC(y, m - 1, d); }

function termKey(term) {
  return (((term.year * 100 + term.month) * 100 + term.day) * 100 + term.hour) * 100 + term.minute;
}

function partsKey(parts) {
  return (((parts.y * 100 + parts.m) * 100 + parts.d) * 100 + parts.hh) * 100 + parts.mm;
}

function cwaTermDateText(term) {
  return `${term.year}-${pad(term.month)}-${pad(term.day)} ${pad(term.hour)}:${pad(term.minute)}`;
}

function findLatestCwaTerm(parts, terms = CWA_SOLAR_TERMS) {
  const key = partsKey(parts);
  return terms
    .filter(term => termKey(term) <= key)
    .sort((a, b) => termKey(b) - termKey(a))[0] || null;
}

function isWithinCwaRange(parts) {
  return parts.y === 2026 || (parts.y === 2027 && parts.m <= 2);
}

function yearPillar(dateParts) {
  let y = dateParts.y;
  const liChun = CWA_SOLAR_TERMS.find(term => term.year === dateParts.y && term.name === '立春');
  if (liChun) {
    if (partsKey(dateParts) < termKey(liChun)) y -= 1;
    return CYCLE[mod(y - 1984, 60)];
  }
  // 若超出目前內建的中央氣象署115年資料範圍，才退回近似法。
  if (dateParts.m < 2 || (dateParts.m === 2 && dateParts.d < 4)) y -= 1;
  return CYCLE[mod(y - 1984, 60)];
}

function monthBranchByCwaSolarTerm(dateParts) {
  const latestJie = findLatestCwaTerm(dateParts, CWA_JIE_TERMS);
  if (latestJie) return latestJie.branch;
  // 2026 年小寒前仍屬前一年大雪後之子月。
  if (dateParts.y === 2026) return '子';
  return monthBranchByApproxSolarTerm(dateParts.m, dateParts.d);
}

function monthBranchByApproxSolarTerm(m, d) {
  const md = m * 100 + d;
  if (md >= 1207 || md < 106) return '子';
  if (md >= 106 && md < 204) return '丑';
  if (md >= 204 && md < 306) return '寅';
  if (md >= 306 && md < 405) return '卯';
  if (md >= 405 && md < 506) return '辰';
  if (md >= 506 && md < 606) return '巳';
  if (md >= 606 && md < 707) return '午';
  if (md >= 707 && md < 808) return '未';
  if (md >= 808 && md < 908) return '申';
  if (md >= 908 && md < 1008) return '酉';
  if (md >= 1008 && md < 1107) return '戌';
  return '亥';
}

function monthPillar(dateParts, yPillar) {
  const yStem = stemOf(yPillar);
  const mBranch = monthBranchByCwaSolarTerm(dateParts);
  return ganzhiFromStemAndBranch(yStem, mBranch);
}

function dayPillar(dateParts) {
  let y = dateParts.y, m = dateParts.m, d = dateParts.d;
  if (els.lateZi.checked && dateParts.hh === 23) {
    const shifted = new Date(dateUTC(y, m, d) + 86400000);
    y = shifted.getUTCFullYear();
    m = shifted.getUTCMonth() + 1;
    d = shifted.getUTCDate();
  }
  const base = dateUTC(2026, 1, 1); // 2026-01-01 乙亥
  const target = dateUTC(y, m, d);
  const days = Math.round((target - base) / 86400000);
  return CYCLE[mod(11 + days, 60)];
}

function hourBranch(hh) {
  if (hh === 23 || hh === 0) return '子';
  return BRANCHES[Math.floor((hh + 1) / 2) % 12];
}

function hourRangeText(branch) {
  const ranges = {
    '子':'23:00–01:00', '丑':'01:00–03:00', '寅':'03:00–05:00', '卯':'05:00–07:00',
    '辰':'07:00–09:00', '巳':'09:00–11:00', '午':'11:00–13:00', '未':'13:00–15:00',
    '申':'15:00–17:00', '酉':'17:00–19:00', '戌':'19:00–21:00', '亥':'21:00–23:00'
  };
  return `${branch}時 ${ranges[branch]}`;
}

function hourPillar(dateParts, dPillar) {
  const branch = hourBranch(dateParts.hh);
  const start = RAT_START_STEM[stemOf(dPillar)];
  const idx = BRANCHES.indexOf(branch);
  return STEMS[mod(start + idx, 10)] + branch;
}

function getPillars() {
  const parts = getDateParts();
  const yp = yearPillar(parts);
  const mp = monthPillar(parts, yp);
  const dp = dayPillar(parts);
  const hp = hourPillar(parts, dp);
  return { parts, year: yp, month: mp, day: dp, hour: hp };
}

function entryGanzhiFromSource(pillars) {
  switch (els.entrySource.value) {
    case 'year': return pillars.year;
    case 'month': return pillars.month;
    case 'day': return pillars.day;
    case 'hour': return pillars.hour;
    default: return els.entryGanzhi.value;
  }
}

function palaceOf(entryGz, targetGz) {
  const start = cycleIndex(entryGz);
  const target = cycleIndex(targetGz);
  const offset = mod(target - start, 60);
  return FLY_ORDER[offset % 9];
}

function flyingRows(entryGz) {
  const start = cycleIndex(entryGz);
  return Array.from({ length: 60 }, (_, i) => {
    const gz = CYCLE[(start + i) % 60];
    const palace = FLY_ORDER[i % 9];
    return { seq: i + 1, gz, palace, dir: PALACE_DIR[palace], note: i === 0 ? '入中' : '' };
  });
}

function buildShensha(entryGz, birthGz, pillars) {
  const bStem = stemOf(birthGz);
  const bBranch = branchOf(birthGz);
  const yearStem = stemOf(pillars.year);
  const yearBranch = branchOf(pillars.year);
  const auspicious = [
    { key: '祿', name: '命祿', branch: LUCK_BRANCH[bStem], basisStem: bStem, tone: 'good', group: '吉神', desc: '爵祿、福祿之位。' },
    { key: '馬', name: '真馬', branch: HORSE_BRANCH_BY_GROUP[bBranch], basisStem: bStem, tone: 'good', group: '吉神', desc: '驛馬，主變動、往來、扶身。' },
    { key: '陽貴', name: '陽貴', branch: YANG_NOBLE[bStem], basisStem: bStem, tone: 'good', group: '吉神', desc: '天乙陽貴，取晝貴系統。' },
    { key: '陰貴', name: '陰貴', branch: YIN_NOBLE[bStem], basisStem: bStem, tone: 'good', group: '吉神', desc: '天乙陰貴，取夜貴系統。' },
    { key: '文昌', name: '文昌', branch: WENCHANG_BRANCH[bStem], basisStem: bStem, tone: 'good', group: '吉神', desc: '文星、科名、學習之象。' },
    { key: '天官', name: '天官', branch: TIANGUAN_BRANCH[bStem], basisStem: bStem, tone: 'good', group: '吉神', desc: '正官所臨，官貴堂格之義。' }
  ];
  const caution = [
    { key: '病符', name: '病符', branch: branchOffset(yearBranch, -1), basisStem: yearStem, tone: 'illness', group: '凶煞', desc: '取太歲後一辰；本版以太歲年干五虎遁成完整干支。' },
    { key: '劫煞', name: '劫煞', branch: ROBBERY_BRANCH_BY_GROUP[bBranch], basisStem: bStem, tone: 'robbery', group: '凶煞', desc: '依年命地支三合局取五行絕處。' },
    { key: '災煞', name: '災煞', branch: DISASTER_BRANCH_BY_GROUP[bBranch], basisStem: bStem, tone: 'disaster', group: '凶煞', desc: '依年命地支三合局取衝破將星之支。' },
    { key: '墓煞', name: '墓煞', branch: branchOffset(bBranch, -5), basisStem: bStem, tone: 'grave', group: '凶煞', desc: '宅墓煞系統：命後五辰為墓。' }
  ];
  return [...auspicious, ...caution].map(item => {
    const gz = ganzhiFromStemAndBranch(item.basisStem, item.branch);
    const palace = palaceOf(entryGz, gz);
    return { ...item, gz, palace, dir: PALACE_DIR[palace] };
  });
}

function relationToMountain(palace) {
  const mountainPalace = els.mountain.value;
  if (!mountainPalace) return { text: '未指定坐山', cls: '' };
  if (palace === mountainPalace) return { text: '到山', cls: 'good' };
  if (palace === OPPOSITE[mountainPalace]) return { text: '到向', cls: 'good' };
  return { text: `未到山向（坐山屬${mountainPalace}宮）`, cls: 'warn' };
}

function renderSummary(pillars, entryGz) {
  els.yearPillar.textContent = pillars.year;
  els.monthPillar.textContent = pillars.month;
  els.dayPillar.textContent = pillars.day;
  els.hourPillar.textContent = pillars.hour;
  els.hourBranchText.textContent = hourRangeText(branchOf(pillars.hour));

  const latestJie = findLatestCwaTerm(pillars.parts, CWA_JIE_TERMS);
  const currentYearLiChun = CWA_SOLAR_TERMS.find(term => term.year === pillars.parts.y && term.name === '立春');
  const usingCwaYear = Boolean(currentYearLiChun);
  const usingCwaMonth = Boolean(latestJie) || pillars.parts.y === 2026;
  if (els.yearRuleNote) {
    els.yearRuleNote.textContent = usingCwaYear
      ? `立春切換：${cwaTermDateText(currentYearLiChun)}（臺灣時）`
      : '非115年內建資料，暫以2/4近似切換';
  }
  if (els.monthRuleNote) {
    els.monthRuleNote.textContent = usingCwaMonth && latestJie
      ? `月建切換：${latestJie.name} ${cwaTermDateText(latestJie)}（臺灣時）`
      : (pillars.parts.y === 2026 ? '小寒前沿用前一年大雪後子月' : '非115年內建資料，暫以固定節氣近似');
  }
  if (els.precisionNote) {
    els.precisionNote.textContent = isWithinCwaRange(pillars.parts)
      ? `本日期節氣採 ${CWA_YEAR_RANGE_TEXT}。`
      : `提醒：目前內建精密節氣以 ${CWA_YEAR_RANGE_TEXT} 為主；其他年份請手動指定入中干支或補入該年中央氣象署資料。`;
  }

  els.entryBadge.textContent = `入中：${entryGz}`;
  if (els.entrySource.value !== 'custom') els.entryGanzhi.value = entryGz;
  els.entryGanzhi.disabled = els.entrySource.value !== 'custom';
}

function renderResults(results) {
  els.resultCards.innerHTML = results.map(item => {
    const rel = relationToMountain(item.palace);
    return `
      <article class="result-card tone-${item.tone}">
        <div class="topline">
          <h3>${item.name}</h3>
          <strong>${item.gz}</strong>
        </div>
        <span class="shensha-type ${item.group === '吉神' ? 'type-good' : 'type-caution'}">${item.group}</span>
        <p>${item.desc}</p>
        <p>落宮：<b>${item.palace}宮</b>（${item.dir}）</p>
        <span class="tag ${rel.cls}">${rel.text}</span>
      </article>`;
  }).join('');
}

function renderNineGrid(rows, results) {
  const markersByGz = new Map();
  const markersByPalace = Object.fromEntries(FLY_ORDER.map(p => [p, []]));
  results.forEach(item => {
    if (!markersByGz.has(item.gz)) markersByGz.set(item.gz, []);
    markersByGz.get(item.gz).push(item);
    markersByPalace[item.palace].push(item);
  });
  const hitPalaces = new Set(results.map(item => item.palace));
  const grouped = Object.fromEntries(FLY_ORDER.map(p => [p, []]));
  rows.forEach(row => grouped[row.palace].push(row.gz));
  els.nineGrid.innerHTML = GRID_ORDER.map(palace => {
    const palaceMarkers = markersByPalace[palace].map(item => `<span class="palace-marker tone-${item.tone}" title="${item.gz}">${item.name}</span>`).join('');
    const chips = grouped[palace].map(gz => {
      const marks = markersByGz.get(gz) || [];
      const markNames = marks.map(m => m.name).join('／');
      const tone = marks[0]?.tone || '';
      return `<span class="gz-chip ${marks.length ? 'mark tone-' + tone : ''}" title="${markNames}">${gz}${marks.length ? '・' + markNames : ''}</span>`;
    }).join('');
    return `
      <article class="palace-cell ${hitPalaces.has(palace) ? 'is-hit' : ''}">
        <div class="palace-head">
          <span class="palace-title">${palace}宮</span>
          <span class="palace-dir">${PALACE_DIR[palace]}</span>
        </div>
        <div class="palace-markers">${palaceMarkers}</div>
        <div class="gz-list">${chips}</div>
      </article>`;
  }).join('');
}

function renderTable(rows) {
  const q = els.tableSearch.value.trim();
  const filtered = q ? rows.filter(r => `${r.seq}${r.gz}${r.palace}${r.dir}${r.note}`.includes(q)) : rows;
  els.flyingTable.innerHTML = filtered.map(row => `
    <tr>
      <td>${row.seq}</td>
      <td><b>${row.gz}</b></td>
      <td>${row.palace}宮</td>
      <td>${row.dir}</td>
      <td>${row.note}</td>
    </tr>`).join('');
}

function update() {
  const pillars = getPillars();
  const entryGz = entryGanzhiFromSource(pillars);
  const birthGz = els.birthGanzhi.value;
  currentRows = flyingRows(entryGz);
  currentResults = buildShensha(entryGz, birthGz, pillars);
  renderSummary(pillars, entryGz);
  renderResults(currentResults);
  renderNineGrid(currentRows, currentResults);
  renderTable(currentRows);
}

function showToast(text) {
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

async function copyResult() {
  const mountainLabel = els.mountain.selectedOptions[0]?.dataset.label || '不指定';
  const text = [
    `祿馬貴吊替飛宮計算`,
    `日期：${els.date.value} ${els.time.value}`,
    `入中干支：${els.entryGanzhi.value}`,
    `年命：${els.birthGanzhi.value}`,
    `坐山：${mountainLabel}`,
    ...currentResults.map(r => `${r.group}｜${r.name} ${r.gz}：${r.palace}宮（${r.dir}）／${relationToMountain(r.palace).text}`)
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('已複製結果');
  } catch (err) {
    showToast('瀏覽器不支援自動複製');
  }
}

function downloadCSV() {
  const header = ['序','干支','宮位','方位','備註'];
  const lines = [header, ...currentRows.map(r => [r.seq, r.gz, `${r.palace}宮`, r.dir, r.note])];
  const csv = lines.map(line => line.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `吊替飛宮_${els.entryGanzhi.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  ['change', 'input'].forEach(eventName => {
    [els.date, els.time, els.lateZi, els.entrySource, els.entryGanzhi, els.birthGanzhi, els.gender, els.mountain]
      .forEach(el => el.addEventListener(eventName, update));
  });
  els.tableSearch.addEventListener('input', () => renderTable(currentRows));
  els.copyBtn.addEventListener('click', copyResult);
  els.csvBtn.addEventListener('click', downloadCSV);
  els.printBtn.addEventListener('click', () => window.print());
}

populateSelects();
setDefaults();
bindEvents();
update();
