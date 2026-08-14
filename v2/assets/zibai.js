const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const stars = {
  1: {name: "一白貪狼", element: "水", prop: "桃花位", use: "人緣、桃花、名聲、智慧", cls: "prop-blue"},
  2: {name: "二黑巨門", element: "土", prop: "病符位", use: "疾病、阻滯；忌動土、久臥", cls: "prop-bad"},
  3: {name: "三碧祿存", element: "木", prop: "是非位", use: "口舌、爭執、官非、衝突", cls: "prop-mid"},
  4: {name: "四綠文曲", element: "木", prop: "文昌位", use: "學習、研究、考試、文書、名譽", cls: "prop-good"},
  5: {name: "五黃廉貞", element: "土", prop: "五黃(大凶)", use: "災煞大凶，最忌動土、敲打、修造", cls: "prop-bad"},
  6: {name: "六白武曲", element: "金", prop: "偏財位", use: "偏財、官貴、權力、事業機會", cls: "prop-good"},
  7: {name: "七赤破軍", element: "金", prop: "破財位", use: "破耗、盜損、口舌、偏鋒", cls: "prop-mid"},
  8: {name: "八白左輔", element: "土", prop: "正財位", use: "傳統財星、田宅；九運已退氣，仍須合旺衰", cls: "prop-good"},
  9: {name: "九紫右弼", element: "火", prop: "喜慶位", use: "九運當令，喜慶、姻緣、人氣、曝光", cls: "prop-good"}
};

const palaces = [
  {key: "center", label: "中宮5(中央)", short: "中宮", direction: "中央", order: 0, row: 2, col: 2},
  {key: "qian", label: "乾宮6(西北)", short: "乾宮", direction: "西北", order: 1, row: 3, col: 3},
  {key: "dui", label: "兌宮7(正西)", short: "兌宮", direction: "正西", order: 2, row: 2, col: 3},
  {key: "gen", label: "艮宮8(東北)", short: "艮宮", direction: "東北", order: 3, row: 3, col: 1},
  {key: "li", label: "離宮9(正南)", short: "離宮", direction: "正南", order: 4, row: 1, col: 2},
  {key: "kan", label: "坎宮1(正北)", short: "坎宮", direction: "正北", order: 5, row: 3, col: 2},
  {key: "kun", label: "坤宮2(西南)", short: "坤宮", direction: "西南", order: 6, row: 1, col: 3},
  {key: "zhen", label: "震宮3(正東)", short: "震宮", direction: "正東", order: 7, row: 2, col: 1},
  {key: "xun", label: "巽宮4(東南)", short: "巽宮", direction: "東南", order: 8, row: 1, col: 1}
];

const monthList = [
  {seq: 1, name: "正月", branch: "寅", jieqi: "立春"},
  {seq: 2, name: "二月", branch: "卯", jieqi: "驚蟄"},
  {seq: 3, name: "三月", branch: "辰", jieqi: "清明"},
  {seq: 4, name: "四月", branch: "巳", jieqi: "立夏"},
  {seq: 5, name: "五月", branch: "午", jieqi: "芒種"},
  {seq: 6, name: "六月", branch: "未", jieqi: "小暑"},
  {seq: 7, name: "七月", branch: "申", jieqi: "立秋"},
  {seq: 8, name: "八月", branch: "酉", jieqi: "白露"},
  {seq: 9, name: "九月", branch: "戌", jieqi: "寒露"},
  {seq: 10, name: "十月", branch: "亥", jieqi: "立冬"},
  {seq: 11, name: "十一月", branch: "子", jieqi: "大雪"},
  {seq: 12, name: "十二月", branch: "丑", jieqi: "小寒"}
];

const keyStars = [
  {star: 4, label: "文昌位"},
  {star: 2, label: "病符位"},
  {star: 8, label: "正財位"},
  {star: 6, label: "偏財位"},
  {star: 1, label: "桃花位"},
  {star: 9, label: "喜慶位"},
  {star: 5, label: "五黃(大凶)"},
  {star: 3, label: "是非位"},
  {star: 7, label: "破財位"}
];

function positiveMod(n, m) {
  return ((n % m) + m) % m;
}

function ganzhiYear(year) {
  return stems[positiveMod(year - 4, 10)] + branches[positiveMod(year - 4, 12)];
}

function yearBranch(year) {
  return branches[positiveMod(year - 4, 12)];
}

function annualCenterStar(year) {
  return positiveMod(10 - positiveMod(year, 9), 9) + 1;
}

function firstMonthStarByBranch(branch) {
  if (["子", "午", "卯", "酉"].includes(branch)) return 8;
  if (["辰", "戌", "丑", "未"].includes(branch)) return 5;
  return 2;
}

function monthlyCenterStar(year, monthSeq) {
  const first = firstMonthStarByBranch(yearBranch(year));
  return positiveMod(first - monthSeq, 9) + 1;
}

function flyGrid(centerStar) {
  const grid = {};
  palaces.forEach(p => {
    const starNum = positiveMod(centerStar - 1 + p.order, 9) + 1;
    grid[p.key] = {...p, starNum, star: stars[starNum]};
  });
  return grid;
}

function getPalaceByStar(grid, starNum) {
  return Object.values(grid).find(p => p.starNum === starNum);
}

function renderPalaceGrid(containerId, grid) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const ordered = Object.values(grid).sort((a, b) => (a.row - b.row) || (a.col - b.col));
  ordered.forEach(p => {
    const div = document.createElement("div");
    div.className = "zibai-palace";
    div.innerHTML = `
      <div class="palace-head">
        <div>
          <div class="palace-title">${p.short}</div>
          <div class="palace-dir">${p.direction}</div>
        </div>
        <span class="zibai-star-number">${p.starNum}</span>
      </div>
      <div class="zibai-star-name">${p.star.name}</div>
      <div class="zibai-star-detail">五行：${p.star.element}</div>
      <div class="zibai-prop ${p.star.cls}">${p.star.prop}</div>
    `;
    container.appendChild(div);
  });
}

function renderKeyTable(tableId, grid) {
  const table = document.getElementById(tableId);
  table.innerHTML = `
    <thead><tr><th>星性</th><th>飛星</th><th>所在宮位</th><th>用法提示</th></tr></thead>
    <tbody>
      ${keyStars.map(k => {
        const p = getPalaceByStar(grid, k.star);
        return `<tr><td>${k.label}</td><td>${stars[k.star].name}</td><td>${p.label}</td><td>${stars[k.star].use}</td></tr>`;
      }).join("")}
    </tbody>
  `;
}

function renderMonthlyOverview(year) {
  const table = document.getElementById("monthlyOverviewTable");
  const rows = monthList.map(m => {
    const center = monthlyCenterStar(year, m.seq);
    const grid = flyGrid(center);
    const palaceCells = palaces.map(p => {
      const cell = grid[p.key];
      return `<td>${cell.star.name}<br><span class="small">${cell.star.prop}</span></td>`;
    }).join("");
    return `
      <tr>
        <td>${m.name}${m.branch}月<br><span class="small">${m.jieqi}起</span></td>
        <td>${stars[center].name}<br><span class="small">${stars[center].prop}</span></td>
        ${palaceCells}
      </tr>
    `;
  }).join("");
  table.innerHTML = `
    <thead>
      <tr>
        <th>月份</th><th>入中星</th>
        ${palaces.map(p => `<th>${p.label}</th>`).join("")}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = Object.keys(stars).map(num => {
    const s = stars[num];
    return `<div class="zibai-legend-item"><strong>${s.name}</strong><span>${s.element}</span><p>${s.prop}</p><small>${s.use}</small></div>`;
  }).join("");
}

function renderAll() {
  const year = Number(document.getElementById("yearSelect").value);
  const monthSeq = Number(document.getElementById("monthSelect").value);
  const gz = ganzhiYear(year);
  const annualCenter = annualCenterStar(year);
  const monthlyCenter = monthlyCenterStar(year, monthSeq);
  const selectedMonth = monthList.find(m => m.seq === monthSeq);

  document.getElementById("ganzhiBox").textContent = `${gz}年`;
  document.getElementById("annualCenterBox").textContent = `${stars[annualCenter].name}入中`;
  document.getElementById("monthCenterBox").textContent = `${stars[monthlyCenter].name}入中`;
  document.getElementById("monthJieqiBox").textContent = `${selectedMonth.name}${selectedMonth.branch}月／${selectedMonth.jieqi}起`;
  document.getElementById("annualTitle").textContent = `${year}年 ${gz}年｜流年紫白九宮`;
  document.getElementById("monthTitle").textContent = `${year}年 ${selectedMonth.name}${selectedMonth.branch}月（${selectedMonth.jieqi}起）｜流月紫白九宮`;

  const annualGrid = flyGrid(annualCenter);
  const monthGrid = flyGrid(monthlyCenter);
  renderPalaceGrid("annualGrid", annualGrid);
  renderPalaceGrid("monthGrid", monthGrid);
  renderMonthlyOverview(year);
}

function init() {
  const yearSelect = document.getElementById("yearSelect");
  for (let y = 2000; y <= 2200; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = `${y} 年`;
    if (y === 2026) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  const monthSelect = document.getElementById("monthSelect");
  monthList.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.seq;
    opt.textContent = `${m.name}${m.branch}月（${m.jieqi}起）`;
    monthSelect.appendChild(opt);
  });
  document.getElementById("printZibaiBtn").addEventListener("click", () => window.print());
  document.getElementById("rerenderZibaiBtn").addEventListener("click", renderAll);
  yearSelect.addEventListener("change", renderAll);
  monthSelect.addEventListener("change", renderAll);
  renderLegend();
  renderAll();
}

init();
