(() => {
  "use strict";

  const data = Array.isArray(window.RENMING_TABLE) ? window.RENMING_TABLE : [];
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const solarMonthBranches = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  const solarMonthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const jieNames = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];
  const hourTimes = ["23–00", "01–02", "03–04", "05–06", "07–08", "09–10", "11–12", "13–14", "15–16", "17–18", "19–20", "21–22"];

  const goodKeys = ["三合", "六合", "堆貴", "進貴", "進長生", "堆長生", "進旺", "堆旺", "進祿", "堆祿", "進馬", "堆馬"];
  const badKeys = ["相沖", "三殺", "回頭貢殺", "三刑", "箭刃"];
  const resolverKeys = new Set(["三合", "六合", "堆貴", "進貴", "進祿", "堆祿"]);

  const $ = (id) => document.getElementById(id);
  const birthSelect = $("birthGanzhi");
  const yearSelect = $("useYear");
  const monthSelect = $("useMonth");
  const daySelect = $("useDay");
  const hourSelect = $("useHour");
  const hourGrid = $("twelveHourGrid");
  const reasonBox = $("hourReasonBox");

  function mod(value, n) {
    return ((value % n) + n) % n;
  }

  function ganzhiAt(index) {
    const i = mod(index, 60);
    return stems[i % 10] + branches[i % 12];
  }

  function sexagenaryNames() {
    return Array.from({ length: 60 }, (_, index) => ganzhiAt(index));
  }

  function yearGanzhi(year) {
    return ganzhiAt(year - 1984);
  }

  function monthGanzhi(yearPillar, monthIndex) {
    const yearStemIndex = stems.indexOf(yearPillar[0]);
    const firstStemIndex = mod(yearStemIndex * 2 + 2, 10); // 五虎遁：寅月起干
    const stem = stems[mod(firstStemIndex + monthIndex, 10)];
    return stem + solarMonthBranches[monthIndex];
  }

  function hourGanzhi(dayPillar, hourBranchIndex) {
    const dayStemIndex = stems.indexOf(dayPillar[0]);
    const firstStemIndex = mod((dayStemIndex % 5) * 2, 10); // 五鼠遁：子時起干
    return stems[mod(firstStemIndex + hourBranchIndex, 10)] + branches[hourBranchIndex];
  }

  function normalize(value) {
    return String(value || "").replace(/[\s、，,。；;／/]+/g, "").trim();
  }

  function valueText(value) {
    return value === undefined || value === null || value === "" ? "—" : String(value);
  }

  function rawBranches(value) {
    return branches.filter((branch) => normalize(value).includes(branch));
  }

  function matchField(fieldValue, pillar) {
    const value = normalize(fieldValue).replace(/全/g, "");
    if (!value || value === "—") return false;
    return value.includes(pillar[0]) || value.includes(pillar[1]);
  }

  function selectedBirthRow() {
    return data.find((row) => row["本命"] === birthSelect.value) || data[0] || null;
  }

  function selectedYear() {
    return Number.parseInt(yearSelect.value, 10) || 2026;
  }

  function selectedYearPillar() {
    return yearGanzhi(selectedYear());
  }

  function selectedMonthIndex() {
    return Number.parseInt(monthSelect.value, 10) || 0;
  }

  function selectedMonthPillar() {
    return monthGanzhi(selectedYearPillar(), selectedMonthIndex());
  }

  function selectedDayPillar() {
    return daySelect.value || "甲子";
  }

  function selectedHourIndex() {
    return Number.parseInt(hourSelect.value, 10) || 0;
  }

  function selectedHourPillar() {
    return hourGanzhi(selectedDayPillar(), selectedHourIndex());
  }

  function cardHint(key) {
    if (key === "相沖") return "日、時沖命大凶；月沖可用；年沖從俗不忌。";
    if (key === "三殺") return "通書註明日、時均忌；真三殺／非真三殺須另辨。";
    if (key === "回頭貢殺") return "須四柱中三合全局始成；非單一柱命中即凶。";
    if (key === "三刑") return "僅論忌日；得六合、三合、祿貴可作解化。";
    if (key === "箭刃") return "須四柱中箭刃全；本命貴人或柱中三六合可作解化。";
    return "";
  }

  function ruleCard(key, row, warning = false) {
    const hint = cardHint(key);
    return `<article class="renming-result-card ${warning ? "is-warning" : ""}">
      <p>${key}${key === "回頭貢殺" ? "（全局）" : key === "箭刃" ? "（全）" : ""}</p>
      <strong>${valueText(row[key])}</strong>
      ${hint ? `<small>${hint}</small>` : ""}
    </article>`;
  }

  function populateBirths() {
    const map = new Map(data.map((row) => [row["本命"], row]));
    birthSelect.innerHTML = sexagenaryNames().map((name) => {
      const row = map.get(name);
      const label = row ? `${name}｜${row["納音五行"]}` : name;
      return `<option value="${name}">${label}</option>`;
    }).join("");
    birthSelect.value = "甲子";
  }

  function populateYears() {
    const start = 1900;
    const end = 2200;
    yearSelect.innerHTML = Array.from({ length: end - start + 1 }, (_, index) => {
      const year = start + index;
      return `<option value="${year}">${year}｜${yearGanzhi(year)}</option>`;
    }).join("");
    yearSelect.value = "2026";
  }

  function populateMonths() {
    const yearPillar = selectedYearPillar();
    monthSelect.innerHTML = solarMonthBranches.map((branch, index) => {
      const pillar = monthGanzhi(yearPillar, index);
      return `<option value="${index}">${solarMonthNames[index]}${branch}月｜${pillar}｜${jieNames[index]}起</option>`;
    }).join("");
    if (!monthSelect.dataset.initialized) {
      monthSelect.value = "6"; // 預設丙午年丙申月示例
      monthSelect.dataset.initialized = "1";
    }
  }

  function populateDays() {
    daySelect.innerHTML = sexagenaryNames().map((name, index) => `<option value="${name}">${String(index + 1).padStart(2, "0")}｜${name}</option>`).join("");
    daySelect.value = "丙辰";
  }

  function populateHours(keepBranchIndex = null) {
    const dayPillar = selectedDayPillar();
    const wanted = keepBranchIndex === null ? selectedHourIndex() : keepBranchIndex;
    hourSelect.innerHTML = branches.map((branch, index) => {
      const pillar = hourGanzhi(dayPillar, index);
      return `<option value="${index}">${branch}時 ${hourTimes[index]}｜${pillar}</option>`;
    }).join("");
    hourSelect.value = String(Number.isFinite(wanted) ? wanted : 8);
  }

  function renderBirthData() {
    const row = selectedBirthRow();
    if (!row) return;
    $("birthSummary").textContent = row["本命"];
    $("birthNayin").textContent = row["本命納音"];
    $("birthGoodGrid").innerHTML = goodKeys.map((key) => ruleCard(key, row)).join("");
    $("birthBadGrid").innerHTML = badKeys.map((key) => ruleCard(key, row, true)).join("");
  }

  function pillarEntries(hourIndex = selectedHourIndex()) {
    const yearPillar = selectedYearPillar();
    const monthPillar = selectedMonthPillar();
    const dayPillar = selectedDayPillar();
    const hourPillar = hourGanzhi(dayPillar, hourIndex);
    return [
      { label: "年", pillar: yearPillar },
      { label: "月", pillar: monthPillar },
      { label: "日", pillar: dayPillar },
      { label: "時", pillar: hourPillar }
    ];
  }

  function goodReasons(row, entries) {
    const items = [];
    entries.forEach((entry) => {
      goodKeys.forEach((key) => {
        if (matchField(row[key], entry.pillar)) {
          items.push({ key, source: entry.label, text: `${entry.label}柱${entry.pillar}命中${key}（${valueText(row[key])}）` });
        }
      });
    });
    return items;
  }

  function hardBadReasons(row, entries) {
    const items = [];
    const day = entries.find((entry) => entry.label === "日");
    const hour = entries.find((entry) => entry.label === "時");
    [day, hour].forEach((entry) => {
      if (!entry) return;
      ["相沖", "三殺"].forEach((key) => {
        if (matchField(row[key], entry.pillar)) {
          items.push({ key, source: entry.label, text: `${entry.label}柱${entry.pillar}命中${key}（${valueText(row[key])}）` });
        }
      });
    });

    const tributeBranches = [...new Set(rawBranches(row["回頭貢殺"]))];
    if (tributeBranches.length >= 3) {
      const present = new Set(entries.map((entry) => entry.pillar[1]));
      if (tributeBranches.every((branch) => present.has(branch))) {
        items.push({ key: "回頭貢殺", source: "四柱", text: `四柱支已成回頭貢殺全局（${tributeBranches.join("")}全）` });
      }
    }
    return items;
  }

  function softBadReasons(row, entries) {
    const items = [];
    const day = entries.find((entry) => entry.label === "日");
    if (day && matchField(row["三刑"], day.pillar)) {
      items.push({ key: "三刑", source: "日", text: `日柱${day.pillar}命中三刑（${valueText(row["三刑"])}；通書僅論忌日）` });
    }

    const arrowBranches = [...new Set(rawBranches(row["箭刃"]))];
    if (arrowBranches.length >= 2) {
      const present = new Set(entries.map((entry) => entry.pillar[1]));
      if (arrowBranches.every((branch) => present.has(branch))) {
        items.push({ key: "箭刃", source: "四柱", text: `四柱支已見箭刃全（${arrowBranches.join("")}）` });
      }
    }
    return items;
  }

  function informationalNotes(row, entries) {
    const notes = [];
    const year = entries.find((entry) => entry.label === "年");
    const month = entries.find((entry) => entry.label === "月");
    if (year && matchField(row["相沖"], year.pillar)) notes.push(`年柱${year.pillar}沖命：通書註「年沖命從俗不忌可用」，不列入本頁凶色。`);
    if (month && matchField(row["相沖"], month.pillar)) notes.push(`月柱${month.pillar}沖命：通書註「月沖之可用」，不列入本頁凶色。`);
    return notes;
  }

  function evaluate(hourIndex = selectedHourIndex()) {
    const row = selectedBirthRow();
    const entries = pillarEntries(hourIndex);
    const goodItems = goodReasons(row, entries);
    const hardBad = hardBadReasons(row, entries);
    const softBad = softBadReasons(row, entries);
    const resolver = goodItems.filter((item) => resolverKeys.has(item.key));
    const notes = informationalNotes(row, entries);

    let key = "neutral";
    let label = "平";
    if (hardBad.length) {
      key = "bad";
      label = "凶";
    } else if (softBad.length) {
      if (resolver.length) {
        key = "mixed";
        label = "吉凶各半";
        notes.push(`三刑／箭刃見解化項：${[...new Set(resolver.map((item) => item.key))].join("、")}。`);
      } else {
        key = "bad";
        label = "凶";
      }
    } else if (goodItems.length) {
      key = "good";
      label = "吉";
    }

    return {
      key,
      label,
      entries,
      good: goodItems.map((item) => item.text),
      bad: [...hardBad, ...softBad].map((item) => item.text),
      notes
    };
  }

  function resultClass(result) {
    return `is-${result.key}`;
  }

  function resultHTML(title, result) {
    const good = result.good.length ? result.good.join("；") : "無";
    const bad = result.bad.length ? result.bad.join("；") : "無";
    const notes = result.notes.length ? result.notes.join("；") : "無";
    return `<strong>${title}｜${result.label}</strong><span>宜取用命中：${good}</span><span>慎用／忌用：${bad}</span><span>規則提示：${notes}</span>`;
  }

  function renderCourseSummary() {
    const year = selectedYear();
    const monthIndex = selectedMonthIndex();
    const dayPillar = selectedDayPillar();
    const hourIndex = selectedHourIndex();
    const yearPillar = selectedYearPillar();
    const monthPillar = selectedMonthPillar();
    const hourPillar = hourGanzhi(dayPillar, hourIndex);

    $("yearPillarBox").textContent = yearPillar;
    $("yearNote").textContent = `${year} 年｜立春後採此年柱`;
    $("monthPillarBox").textContent = monthPillar;
    $("monthNote").textContent = `${solarMonthNames[monthIndex]}${solarMonthBranches[monthIndex]}月｜${jieNames[monthIndex]}起`;
    $("dayPillarBox").textContent = dayPillar;
    $("hourPillarBox").textContent = hourPillar;
    $("hourNote").textContent = `${branches[hourIndex]}時 ${hourTimes[hourIndex]}`;

    const selectedResult = evaluate(hourIndex);
    const selectedHourTitle = `${yearPillar}年・${monthPillar}月・${dayPillar}日・${hourPillar}時`;
    $("selectedCourseResult").className = `renming-query-selected-result ${resultClass(selectedResult)}`;
    $("selectedCourseResult").innerHTML = `<span>目前課式總評</span><strong>${selectedResult.label}</strong><small>${selectedHourTitle}</small>`;
  }

  function renderTwelveHours() {
    const dayPillar = selectedDayPillar();
    const selected = selectedHourIndex();
    hourGrid.innerHTML = branches.map((branch, index) => {
      const pillar = hourGanzhi(dayPillar, index);
      const result = evaluate(index);
      const detail = encodeURIComponent(resultHTML(`${branch}時 ${pillar}`, result));
      return `<button type="button" class="renming-query-hour-card ${resultClass(result)} ${index === selected ? "is-selected" : ""}" data-hour-index="${index}" data-detail="${detail}">
        <span>${branch}時 <small>${hourTimes[index]}</small></span>
        <strong>${pillar}</strong>
        <b>${result.label}</b>
      </button>`;
    }).join("");

    const current = evaluate(selected);
    reasonBox.innerHTML = resultHTML(`${branches[selected]}時 ${selectedHourPillar()}`, current);
  }

  function updateAll() {
    renderBirthData();
    renderCourseSummary();
    renderTwelveHours();
  }

  populateBirths();
  populateYears();
  populateMonths();
  populateDays();
  populateHours(8); // 預設申時；配合丙午／丙申／丙辰／丙申示例
  updateAll();

  birthSelect.addEventListener("change", updateAll);
  yearSelect.addEventListener("change", () => {
    const monthIndex = selectedMonthIndex();
    populateMonths();
    monthSelect.value = String(monthIndex);
    updateAll();
  });
  monthSelect.addEventListener("change", updateAll);
  daySelect.addEventListener("change", () => {
    const hourIndex = selectedHourIndex();
    populateHours(hourIndex);
    updateAll();
  });
  hourSelect.addEventListener("change", updateAll);

  hourGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-hour-index]");
    if (!card) return;
    const index = Number.parseInt(card.dataset.hourIndex, 10);
    if (!Number.isFinite(index)) return;
    hourSelect.value = String(index);
    renderCourseSummary();
    renderTwelveHours();
  });
})();
