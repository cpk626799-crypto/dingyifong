(() => {
'use strict';
  // Standalone calculator: no network requests, libraries, or stored personal data.
  // Source tables: male age 1 = 丙寅 (index 2), female age 1 = 壬申 (index 8).
  const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
  const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
  const ANIMALS = [...'鼠牛虎兔龍蛇馬羊猴雞狗豬'];
  const DIRECTIONS = ['正北','東北偏北','東北偏東','正東','東南偏東','東南偏南','正南','西南偏南','西南偏西','正西','西北偏西','西北偏北'];
  const mod = (n, base) => ((n % base) + base) % base;
  const ganzhiAt = index => STEMS[mod(index, 10)] + BRANCHES[mod(index, 12)];
  const yearGanzhi = year => ganzhiAt(year - 4);
  function calculate(birthYear, queryYear, gender) {
    if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > 2200) throw new Error('請輸入 1900–2200 之間的完整出生年份。');
    if (!Number.isInteger(queryYear) || queryYear < 1900 || queryYear > 2200) throw new Error('查詢年份須為 1900–2200 年。');
    if (birthYear > queryYear) throw new Error('出生年份不能晚於查詢年份，請調整年份。');
    if (!['male', 'female'].includes(gender)) throw new Error('請選擇男命或女命。');
    const age = queryYear - birthYear + 1;
    const index = mod((gender === 'male' ? 2 : 8) + (gender === 'male' ? 1 : -1) * (age - 1), 60);
    const branchIndex = index % 12;
    return {birthYear, queryYear, gender, age, index, ganzhi:ganzhiAt(index), branch:BRANCHES[branchIndex], branchIndex, direction:DIRECTIONS[branchIndex], azimuth:branchIndex * 30, birthGanzhi:yearGanzhi(birthYear), queryGanzhi:yearGanzhi(queryYear), zodiac:ANIMALS[mod(birthYear - 4, 12)]};
  }
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  let activeResult = null;
  function svgNode(tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs || {})) el.setAttribute(name, value);
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function polar(radius, angle) {
    const rad = angle * Math.PI / 180;
    return [250 + radius * Math.sin(rad), 250 - radius * Math.cos(rad)];
  }
  function ringPath(start, end) {
    const a = polar(186, start), b = polar(186, end), c = polar(112, end), d = polar(112, start);
    return `M ${a} A 186 186 0 0 1 ${b} L ${c} A 112 112 0 0 0 ${d} Z`;
  }
  function renderCompass(result) {
    const svg = $('compass'), offset = Number($('orientation').value);
    svg.replaceChildren();
    const viewName = offset === 180 ? '南上北下，東在左，西在右' : '北上南下，東在右，西在左';
    const desc = result ? `行年${result.ganzhi}，${result.branch}方，${result.direction}，方位角${result.azimuth}度。${viewName}。` : `十二地支方位盤，尚無有效查詢結果。${viewName}。`;
    svg.setAttribute('aria-label', desc);
    svg.append(svgNode('title', {}, desc), svgNode('circle',{cx:250,cy:250,r:199,fill:'none',stroke:'#344459','stroke-width':1}));
    for (let i = 0; i < 60; i++) {
      const angle = i * 6 + offset;
      const a = polar(i % 5 === 0 ? 190 : 195, angle), b = polar(199, angle);
      svg.append(svgNode('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:i%5===0?'#a18d65':'#415066','stroke-width':1}));
    }
    BRANCHES.forEach((branch, i) => {
      const selected = result && result.branchIndex === i;
      const angle = i * 30 + offset;
      const group = svgNode('g', {'data-branch':branch,'data-active':selected?'true':'false'});
      group.append(svgNode('path',{d:ringPath(angle-14.2,angle+14.2),fill:selected?'#debe80':'#18283b',stroke:selected?'#f3d8a1':'#344459','stroke-width':selected?2:1}));
      const p = polar(149, angle);
      group.append(svgNode('text',{x:p[0],y:p[1]+2,'text-anchor':'middle','dominant-baseline':'middle',class:'xn-branch',fill:selected?'#172234':'#cad3df'},branch));
      if (selected) {
        const point = polar(199, angle);
        group.append(svgNode('circle',{cx:point[0],cy:point[1],r:4,fill:'#f0cc89'}));
      }
      svg.append(group);
    });
    ['北','東北','東','東南','南','西南','西','西北'].forEach((direction,i) => {
      const p = polar(226,i*45+offset);
      svg.append(svgNode('text',{x:p[0],y:p[1],'text-anchor':'middle','dominant-baseline':'middle',class:'xn-cardinal'},direction));
    });
    svg.append(svgNode('circle',{cx:250,cy:250,r:103,fill:'#101c2c',stroke:'#344459','stroke-width':1}));
    svg.append(svgNode('text',{x:250,y:204,'text-anchor':'middle',class:'xn-center-label'},'行年落方'));
    svg.append(svgNode('text',{x:250,y:266,'text-anchor':'middle',class:'xn-center-branch'},result?result.branch:'—'));
    svg.append(svgNode('text',{x:250,y:299,'text-anchor':'middle',class:'xn-center-direction'},result?result.direction:'等待查詢'));
    svg.append(svgNode('text',{x:250,y:324,'text-anchor':'middle',class:'xn-center-degree'},result?result.azimuth+'°':''));
    $('orientationNote').textContent = offset === 180 ? ' · 東在左，西在右' : ' · 東在右，西在左';
  }
  function update() {
    const raw = $('birthYear').value.trim();
    const birthYear = /^\d{1,4}$/.test(raw) ? Number(raw) : NaN;
    const queryYear = Number($('queryYear').value);
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const male = gender === 'male';
    $('genderMeta').textContent = male ? '一歲起丙寅，每歲順行一位' : '一歲起壬申，每歲逆行一位';
    $('resultBadge').textContent = (male?'男命':'女命') + ' · ' + queryYear + ' 年';
    $('queryMeta').replaceChildren();
    const queryStrong = document.createElement('strong');
    queryStrong.textContent = yearGanzhi(queryYear) + '年';
    $('queryMeta').append(queryStrong,document.createTextNode(' · 1900–2200'));
    try {
      const r = calculate(birthYear, queryYear, gender);
      activeResult = r;
      $('errorMessage').hidden = true;
      $('errorMessage').textContent = '';
      $('birthYear').setAttribute('aria-invalid','false');
      $('resultContent').hidden = false;
      $('emptyResult').hidden = true;
      $('birthMeta').replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = r.birthGanzhi + '年';
      $('birthMeta').append(strong,document.createTextNode(' · ' + r.age + ' 虛歲'));
      $('resultGanzhi').textContent = r.ganzhi;
      $('resultAge').textContent = r.age;
      $('resultBranch').textContent = r.branch+'方';
      $('resultDirection').textContent = r.direction;
      $('resultDegree').textContent = r.azimuth+'°';
      $('resultBirth').textContent = birthYear+' · '+r.birthGanzhi+'年（'+r.zodiac+'）';
      $('resultYear').textContent = queryYear+' · '+r.queryGanzhi+'年';
      $('ageFormula').textContent = `${queryYear} − ${birthYear} ＋ 1 ＝ ${r.age} 虛歲`;
      $('cycleFormula').textContent = `一歲起${male?'丙寅':'壬申'}，${male?'順':'逆'}行 ${r.age-1} 位 → ${r.ganzhi}`;
      renderCompass(r);
    } catch (error) {
      activeResult = null;
      $('errorMessage').textContent = raw === '' ? '請輸入出生西元年。' : error.message;
      $('errorMessage').hidden = false;
      $('birthYear').setAttribute('aria-invalid','true');
      $('resultContent').hidden = true;
      $('emptyResult').hidden = false;
      $('birthMeta').textContent = '請確認出生年份';
      renderCompass(null);
    }
  }
  let currentYear;
  try { currentYear = Number(new Intl.DateTimeFormat('en-US',{year:'numeric',timeZone:'Asia/Taipei'}).format(new Date())); }
  catch { currentYear = new Date().getFullYear(); }
  const fragment = document.createDocumentFragment();
  for (let year=1900; year<=2200; year++) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = year+' 年';
    fragment.append(option);
  }
  $('queryYear').append(fragment);
  $('queryYear').value = String(Math.min(2200,Math.max(1900,currentYear)));
  if (currentYear<1900 || currentYear>2200) {
    $('thisYear').disabled = true;
    $('thisYear').title = '目前年份超出 1900–2200 年查詢範圍';
  }
  $('xnForm').addEventListener('submit',event=>{event.preventDefault();update();});
  $('birthYear').addEventListener('input',update);
  $('queryYear').addEventListener('change',update);
  document.querySelectorAll('input[name="gender"]').forEach(input=>input.addEventListener('change',update));
  $('thisYear').addEventListener('click',()=>{$('queryYear').value=String(currentYear);update();});
  $('orientation').addEventListener('change',()=>renderCompass(activeResult));
  update();
})();
