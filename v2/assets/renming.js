(() => {
  "use strict";

  const data = Array.isArray(window.RENMING_TABLE) ? window.RENMING_TABLE : [];
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  // 《七政經緯通書》110–113頁原表欄序。
  const goodKeys = ["三合", "六合", "堆貴", "進貴", "進長生", "堆長生", "進旺", "堆旺", "進祿", "堆祿", "進馬", "堆馬"];
  const badKeys = ["相沖", "三殺", "回頭貢殺", "三刑", "箭刃"];
  const resolverKeys = new Set(["三合", "六合", "堆貴", "進貴", "進祿", "堆祿"]);
  const hourLabels = [
    ["子", "23–00"], ["丑", "01–02"], ["寅", "03–04"], ["卯", "05–06"],
    ["辰", "07–08"], ["巳", "09–10"], ["午", "11–12"], ["未", "13–14"],
    ["申", "15–16"], ["酉", "17–18"], ["戌", "19–20"], ["亥", "21–22"]
  ];

  const $ = (id) => document.getElementById(id);
  const input = $("renmingInput");
  const yearInput = $("calendarYear");
  const monthSelect = $("calendarMonth");
  const searchInput = $("renmingSearch");
  const goodCards = $("goodCards");
  const badCards = $("badCards");
  const calendarHead = $("renmingCalendarHead");
  const calendarBody = $("renmingCalendarBody");
  const detailBox = $("judgementDetail");
  const validation = $("renmingValidation");

  const now = new Date();
  const defaultYear = Math.min(2200, Math.max(1900, now.getFullYear()));
  const defaultMonth = now.getMonth() + 1;

  function valueText(value) {
    return value === undefined || value === null || value === "" ? "—" : String(value);
  }

  function normalize(value) {
    return String(value || "")
      .replace(/[\s、，,。；;／/]+/g, "")
      .trim();
  }

  function rawBranches(value) {
    return branches.filter((branch) => normalize(value).includes(branch));
  }

  function sexagenaryNames() {
    return Array.from({ length: 60 }, (_, index) => ganzhiAt(index));
  }

  function populateControls() {
    const rowMap = new Map(data.map((row) => [row["本命"], row]));
    input.innerHTML = sexagenaryNames().map((name) => {
      const row = rowMap.get(name);
      const label = row ? `${name}｜${row["納音五行"]}` : name;
      return `<option value="${name}">${label}</option>`;
    }).join("");
    input.value = rowMap.has("甲子") ? "甲子" : (input.options[0]?.value || "");

    monthSelect.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return `<option value="${month}">${month} 月</option>`;
    }).join("");
    yearInput.value = String(defaultYear);
    monthSelect.value = String(defaultMonth);
  }

  function selectedRow() {
    const wanted = normalize(input.value).slice(0, 2);
    return data.find((row) => row["本命"] === wanted) || null;
  }

  function validateBirthInput() {
    const row = selectedRow();
    if (!row) {
      validation.textContent = "請從六十甲子下拉選單選擇出生年干支。";
      validation.className = "renming-validation is-error";
      return null;
    }
    validation.textContent = `目前年命：${row["本命納音"]}。本頁依《七政經緯通書》110–113頁原表與頁113用法註解判讀。`;
    validation.className = "renming-validation is-ok";
    return row;
  }

  function clampYear() {
    let year = Number.parseInt(yearInput.value, 10);
    if (!Number.isFinite(year)) year = defaultYear;
    year = Math.min(2200, Math.max(1900, year));
    yearInput.value = String(year);
    return year;
  }

  function selectedMonth() {
    const month = Number.parseInt(monthSelect.value, 10);
    return Math.min(12, Math.max(1, Number.isFinite(month) ? month : defaultMonth));
  }

  function cardLabel(key) {
    if (key === "回頭貢殺") return "回頭貢殺（全局）";
    if (key === "箭刃") return "箭刃（全）";
    return key;
  }

  function cardHint(key) {
    if (key === "回頭貢殺") return "四柱中三合全局始成，不以單一日、時一字判凶。";
    if (key === "三刑") return "通書註明僅論忌日；六合、三合、祿貴可解化。";
    if (key === "箭刃") return "四柱中箭刃全始忌；本命貴人或柱中三六合可解。";
    if (key === "相沖") return "本頁月表只自動判日、時沖命；年沖、月沖不據此色格判凶。";
    if (key === "三殺") return "日、時均忌；原註另分真三殺與非真三殺，本表不臆判真偽。";
    return "";
  }

  function cardHTML(key, row, warning = false) {
    const hint = cardHint(key);
    return `<article class="renming-result-card ${warning ? "is-warning" : ""}">
      <p>${cardLabel(key)}</p>
      <strong>${valueText(row[key])}</strong>
      ${hint ? `<small>${hint}</small>` : ""}
    </article>`;
  }

  function renderSelected(row) {
    $("renmingCard").textContent = row["本命"];
    $("nayinCard").textContent = `${row["本命納音"]}｜納音五行 ${row["納音五行"]}`;
    $("renmingBadge").textContent = row["本命納音"];
    goodCards.innerHTML = goodKeys.map((key) => cardHTML(key, row)).join("");
    badCards.innerHTML = badKeys.map((key) => cardHTML(key, row, true)).join("");
  }

  // 格里曆日期轉儒略日數；(JDN + 49) mod 60 以 2000-01-07 甲子日為校驗點。
  function julianDayNumber(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
      - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function ganzhiAt(index) {
    const safeIndex = ((index % 60) + 60) % 60;
    return stems[safeIndex % 10] + branches[safeIndex % 12];
  }

  function dayGanzhi(year, month, day) {
    return ganzhiAt((julianDayNumber(year, month, day) + 49) % 60);
  }

  function hourGanzhi(dayPillar, branchIndex) {
    const dayStemIndex = stems.indexOf(dayPillar[0]);
    const firstStem = (dayStemIndex % 5) * 2;
    return stems[(firstStem + branchIndex) % 10] + branches[branchIndex];
  }

  function matchField(fieldValue, pillar) {
    const value = normalize(fieldValue).replace(/全/g, "");
    if (!value || value === "—") return false;
    const stem = pillar[0];
    const branch = pillar[1];
    return value.includes(stem) || value.includes(branch);
  }

  function goodReasonsForPillar(row, pillar, prefix) {
    return goodKeys
      .filter((key) => matchField(row[key], pillar))
      .map((key) => ({ key, text: `${prefix}${key}（${valueText(row[key])}）` }));
  }

  function hardBadReasonsForPillar(row, pillar, prefix) {
    return ["相沖", "三殺"]
      .filter((key) => matchField(row[key], pillar))
      .map((key) => ({ key, text: `${prefix}${key}（${valueText(row[key])}）` }));
  }

  function dayThreePunishment(row, dayPillar) {
    if (!matchField(row["三刑"], dayPillar)) return [];
    return [{ key: "三刑", text: `日・三刑（${valueText(row["三刑"])}；通書僅論忌日）` }];
  }

  function arrowBladeFull(row, dayPillar, hourPillar) {
    const required = [...new Set(rawBranches(row["箭刃"]))];
    if (required.length < 2) return [];
    const present = new Set([dayPillar[1], hourPillar[1]]);
    if (!required.every((branch) => present.has(branch))) return [];
    return [{ key: "箭刃", text: `日・時已見箭刃全（${required.join("")}）；仍須合參四柱解化` }];
  }

  function makeResult(goodItems, hardBadItems, softBadItems, extraNotes = []) {
    const good = goodItems.map((item) => item.text);
    const hardBad = hardBadItems.map((item) => item.text);
    const softBad = softBadItems.map((item) => item.text);
    const bad = [...hardBad, ...softBad];
    const resolver = goodItems.filter((item) => resolverKeys.has(item.key));
    let key = "neutral";
    let label = "平";

    // 日時相沖、三殺依頁113原註從嚴，不因一般吉項直接改成黃色。
    if (hardBad.length) {
      key = "bad";
      label = "凶";
    } else if (softBad.length) {
      if (resolver.length) {
        key = "mixed";
        label = "吉凶各半";
      } else {
        key = "bad";
        label = "凶";
      }
    } else if (good.length) {
      key = "good";
      label = "吉";
    }

    const notes = [...extraNotes];
    if (softBad.some((item) => item.key === "三刑") && resolver.length) {
      notes.push(`三刑見解化項：${resolver.map((item) => item.key).join("、")}`);
    }
    if (softBad.some((item) => item.key === "箭刃") && resolver.length) {
      notes.push(`箭刃見解化項：${resolver.map((item) => item.key).join("、")}`);
    }
    return { key, label, good, bad, notes };
  }

  function evaluateDay(row, pillar) {
    const good = goodReasonsForPillar(row, pillar, "日・");
    const hardBad = hardBadReasonsForPillar(row, pillar, "日・");
    const softBad = dayThreePunishment(row, pillar);
    return makeResult(good, hardBad, softBad, ["回頭貢殺須四柱三合全局，本日單柱不自動判定；箭刃須見全局，本日單柱不自動判定。"]);
  }

  function evaluateHour(row, dayPillar, hourPillar) {
    const good = [
      ...goodReasonsForPillar(row, dayPillar, "日・"),
      ...goodReasonsForPillar(row, hourPillar, "時・")
    ];
    const hardBad = [
      ...hardBadReasonsForPillar(row, dayPillar, "日・"),
      ...hardBadReasonsForPillar(row, hourPillar, "時・")
    ];
    const softBad = [
      ...dayThreePunishment(row, dayPillar),
      ...arrowBladeFull(row, dayPillar, hourPillar)
    ];
    return makeResult(good, hardBad, softBad, ["回頭貢殺須四柱三合全局；本月表未以公曆年、月直接代替節令四柱，故不作自動判定。"]);
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function buildMonthRows(row, year, month) {
    const count = daysInMonth(year, month);
    return Array.from({ length: count }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month - 1, day, 12, 0, 0);
      const dayPillar = dayGanzhi(year, month, day);
      const dayResult = evaluateDay(row, dayPillar);
      const hours = hourLabels.map(([branch, time], branchIndex) => {
        const pillar = hourGanzhi(dayPillar, branchIndex);
        return {
          branch,
          time,
          pillar,
          result: evaluateHour(row, dayPillar, pillar)
        };
      });
      return {
        day,
        dateLabel: `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`,
        weekday: `星期${weekdays[date.getDay()]}`,
        dayPillar,
        dayResult,
        hours
      };
    });
  }

  function statusClass(result) {
    return `is-${result.key}`;
  }

  function resultSearchText(result) {
    return [result.label, ...result.good, ...result.bad, ...(result.notes || [])].join(" ");
  }

  function monthRowSearchText(monthRow) {
    return [
      monthRow.dateLabel,
      monthRow.weekday,
      monthRow.dayPillar,
      resultSearchText(monthRow.dayResult),
      ...monthRow.hours.flatMap((hour) => [hour.branch, hour.time, hour.pillar, resultSearchText(hour.result)])
    ].join(" ");
  }

  function detailText(title, result) {
    const goodText = result.good.length ? result.good.join("、") : "無";
    const badText = result.bad.length ? result.bad.join("、") : "無";
    const noteText = result.notes?.length ? result.notes.join("；") : "無";
    return `<strong>${title}｜${result.label}</strong><span>宜取用命中：${goodText}</span><span>慎用／忌用：${badText}</span><span>通書規則提示：${noteText}</span>`;
  }

  function renderCalendar(row) {
    const year = clampYear();
    const month = selectedMonth();
    const allRows = buildMonthRows(row, year, month);
    const query = normalize(searchInput.value);
    const rows = query ? allRows.filter((item) => normalize(monthRowSearchText(item)).includes(query)) : allRows;

    $("monthCard").textContent = `${year} 年 ${month} 月`;
    $("daysCard").textContent = `整月 ${allRows.length} 日`;
    $("visibleCount").textContent = query ? `搜尋顯示 ${rows.length}／${allRows.length} 日` : `完整顯示 ${allRows.length} 日 × 十二時辰`;

    calendarHead.innerHTML = [
      "日期", "星期", "日干支", "日評",
      ...hourLabels.map(([branch, time]) => `${branch}時<br><small>${time}</small>`)
    ].map((label) => `<th>${label}</th>`).join("");

    calendarBody.innerHTML = rows.map((item) => {
      const dayTitle = `${item.dateLabel} ${item.dayPillar}`;
      const dayCell = `<button type="button" class="renming-status-cell ${statusClass(item.dayResult)}" data-detail="${encodeURIComponent(detailText(dayTitle, item.dayResult))}">
        <strong>${item.dayResult.label}</strong>
      </button>`;
      const hourCells = item.hours.map((hour) => {
        const title = `${item.dateLabel} ${hour.branch}時 ${hour.pillar}（日柱 ${item.dayPillar}）`;
        return `<td class="renming-hour-td">
          <button type="button" class="renming-hour-cell ${statusClass(hour.result)}" data-detail="${encodeURIComponent(detailText(title, hour.result))}">
            <span>${hour.pillar}</span>
            <strong>${hour.result.label}</strong>
          </button>
        </td>`;
      }).join("");
      return `<tr>
        <td class="renming-date-cell"><strong>${item.day}</strong><small>${item.dateLabel}</small></td>
        <td>${item.weekday}</td>
        <td class="renming-day-pillar">${item.dayPillar}</td>
        <td class="renming-day-status">${dayCell}</td>
        ${hourCells}
      </tr>`;
    }).join("");

    if (!rows.length) {
      calendarBody.innerHTML = `<tr><td colspan="16" class="renming-empty">沒有符合「${searchInput.value.trim()}」的日期或時辰資料。</td></tr>`;
    }
  }

  function attachDetailHandler() {
    calendarBody.addEventListener("click", (event) => {
      const target = event.target.closest("[data-detail]");
      if (!target) return;
      detailBox.innerHTML = decodeURIComponent(target.dataset.detail || "");
      document.querySelectorAll(".renming-hour-cell.is-selected, .renming-status-cell.is-selected")
        .forEach((element) => element.classList.remove("is-selected"));
      target.classList.add("is-selected");
    });
  }

  function currentMonthData() {
    const row = selectedRow();
    if (!row) return null;
    const year = clampYear();
    const month = selectedMonth();
    return { row, year, month, rows: buildMonthRows(row, year, month) };
  }

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const current = currentMonthData();
    if (!current) return;
    const headers = ["日期", "星期", "日干支", "日評", ...hourLabels.map(([branch]) => `${branch}時`)];
    const lines = [headers.map(csvEscape).join(",")];
    current.rows.forEach((item) => {
      const values = [
        item.dateLabel,
        item.weekday,
        item.dayPillar,
        item.dayResult.label,
        ...item.hours.map((hour) => `${hour.pillar} ${hour.result.label}`)
      ];
      lines.push(values.map(csvEscape).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${current.row["本命"]}_${current.year}年${current.month}月_人命擇日時辰宜忌.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    const current = currentMonthData();
    if (!current) return;
    const counts = { good: 0, bad: 0, mixed: 0, neutral: 0 };
    current.rows.forEach((item) => item.hours.forEach((hour) => { counts[hour.result.key] += 1; }));
    const text = [
      `六十甲子人命擇日｜${current.row["本命納音"]}`,
      `查詢月份：${current.year}年${current.month}月`,
      `十二時辰色格合計：吉 ${counts.good}、凶 ${counts.bad}、吉凶各半 ${counts.mixed}、平 ${counts.neutral}`,
      "",
      `宜取用：${goodKeys.map((key) => `${key}${valueText(current.row[key])}`).join("；")}`,
      `慎用／忌用：${badKeys.map((key) => `${cardLabel(key)}${valueText(current.row[key])}`).join("；")}`,
      "",
      "判定注意：回頭貢殺須四柱三合全局；三刑僅論忌日；箭刃須見全；日時相沖、三殺從嚴標凶。"
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      $("renmingCopyBtn").textContent = "已複製";
      setTimeout(() => { $("renmingCopyBtn").textContent = "複製本月摘要"; }, 1200);
    } catch (error) {
      window.prompt("請手動複製以下內容", text);
    }
  }

  function resetToCurrentMonth() {
    yearInput.value = String(defaultYear);
    monthSelect.value = String(defaultMonth);
    searchInput.value = "";
    updateAll();
  }

  function updateAll() {
    const row = validateBirthInput();
    if (!row) {
      goodCards.innerHTML = "";
      badCards.innerHTML = "";
      calendarBody.innerHTML = `<tr><td class="renming-empty">請先從六十甲子下拉選單選擇出生年干支。</td></tr>`;
      return;
    }
    renderSelected(row);
    renderCalendar(row);
  }

  populateControls();
  attachDetailHandler();
  updateAll();

  input.addEventListener("change", updateAll);
  yearInput.addEventListener("change", updateAll);
  monthSelect.addEventListener("change", updateAll);
  searchInput.addEventListener("input", () => {
    const row = selectedRow();
    if (row) renderCalendar(row);
  });
  $("renmingResetBtn").addEventListener("click", resetToCurrentMonth);
  $("renmingCopyBtn").addEventListener("click", copySummary);
  $("renmingCsvBtn").addEventListener("click", downloadCsv);
  $("renmingPrintBtn").addEventListener("click", () => window.print());
})();
