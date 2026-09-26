(function () {
  'use strict';

  const STEMS = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const DAYS = '日一二三四五六';
  const TERMS = '小寒 大寒 立春 雨水 驚蟄 春分 清明 穀雨 立夏 小滿 芒種 夏至 小暑 大暑 立秋 處暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至'.split(' ');
  const DAY_NAMES = '初一 初二 初三 初四 初五 初六 初七 初八 初九 初十 十一 十二 十三 十四 十五 十六 十七 十八 十九 二十 廿一 廿二 廿三 廿四 廿五 廿六 廿七 廿八 廿九 三十'.split(' ');
  // 交通部中央氣象署《中華民國115年日曆資料表》，臺灣時間 UTC+8。
  const TERMS_2026 = '01-05 16:23|01-20 09:45|02-04 04:02|02-18 23:52|03-05 21:59|03-20 22:46|04-05 02:40|04-20 09:39|05-05 19:49|05-21 08:37|06-05 23:48|06-21 16:24|07-07 09:57|07-23 03:13|08-07 19:43|08-23 10:19|09-07 22:41|09-23 08:05|10-08 14:29|10-23 17:38|11-07 17:52|11-22 15:23|12-07 10:52|12-22 04:50'.split('|');
  const DAY_MS = 86400000;
  const termCache = new Map();

  function mod(n, d) { return ((n % d) + d) % d; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function sexagenary(n) { return STEMS[mod(n, 10)] + BRANCHES[mod(n, 12)]; }
  function radians(deg) { return deg * Math.PI / 180; }

  // NOAA 公開的太陽視黃經公式。其他年份推算節氣名稱；2026 採官方分鐘值。
  function solarLongitude(instant) {
    const jd = instant / DAY_MS + 2440587.5;
    const t = (jd - 2451545.0) / 36525;
    const l = mod(280.46646 + t * (36000.76983 + .0003032 * t), 360);
    const m = 357.52911 + t * (35999.05029 - .0001537 * t);
    const c = (1.914602 - t * (.004817 + .000014 * t)) * Math.sin(radians(m))
      + (.019993 - .000101 * t) * Math.sin(radians(2 * m)) + .000289 * Math.sin(radians(3 * m));
    return mod(l + c - .00569 - .00478 * Math.sin(radians(125.04 - 1934.136 * t)), 360);
  }

  function estimatedTerm(year, index) {
    const target = mod(285 + 15 * index, 360);
    let time = Date.UTC(year, 0, 5) + index * 15.2184 * DAY_MS;
    for (let step = 0; step < 8; step++) {
      const error = mod(solarLongitude(time) - target + 180, 360) - 180;
      time -= error / .985647 * DAY_MS;
    }
    return time;
  }

  function termsOfYear(year) {
    if (!termCache.has(year)) {
      termCache.set(year, TERMS.map((name, index) => ({
        name, index, time: year === 2026
          ? Date.parse(`${year}-${TERMS_2026[index].replace(' ', 'T')}:00+08:00`)
          : estimatedTerm(year, index)
      })));
    }
    return termCache.get(year);
  }

  function termAt(now) {
    const year = now.getFullYear();
    let current = null;
    for (let y = year - 1; y <= year + 1; y++) {
      for (const term of termsOfYear(y)) {
        if (term.time <= now.getTime() && (!current || term.time > current.time)) current = term;
      }
    }
    return current;
  }

  // 與本站「六十甲子人命擇日」相同：2000-01-07 為甲子日。
  function julianDayNumber(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
      - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function lunarDate(now) {
    try {
      const fmt = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' });
      const parts = Object.fromEntries(fmt.formatToParts(now).map(({type, value}) => [type, value]));
      const number = Number(parts.day);
      const day = Number.isInteger(number) && number >= 1 && number <= 30 ? DAY_NAMES[number - 1] : parts.day;
      return `${(parts.month || '').replace(/^闰/, '閏')}${day || ''}` || '—';
    } catch (_) { return '農曆日期不支援'; }
  }

  function snapshot(input) {
    const now = input instanceof Date ? input : new Date(input === undefined ? Date.now() : input);
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const annualYear = now.getTime() >= termsOfYear(y)[2].time ? y : y - 1;
    const annualIndex = mod(annualYear - 1984, 60);
    let latestJie = null;
    for (let year = y - 1; year <= y + 1; year++) {
      for (const t of termsOfYear(year)) {
        if (t.index % 2 === 0 && t.time <= now.getTime() && (!latestJie || t.time > latestJie.time)) latestJie = t;
      }
    }
    const monthIndex = latestJie ? mod(latestJie.index - 2, 24) / 2 : 0;
    const firstStem = (annualIndex % 5 * 2 + 2) % 10;
    const monthPillar = STEMS[mod(firstStem + monthIndex, 10)] + BRANCHES[mod(2 + monthIndex, 12)];
    const dayPillar = sexagenary(julianDayNumber(y, m, d) + 49);
    const term = termAt(now);
    return {
      gregorian: `${y}年${m}月${d}日 星期${DAYS[now.getDay()]}`,
      lunar: `${lunarDate(now)} · ${sexagenary(annualIndex)}年 ${monthPillar}月 ${dayPillar}日`,
      solarTerm: term ? term.name : '—',
      clock: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || '本機時區').replaceAll('_', ' '),
    };
  }

  // 同一計算入口供離線驗證與後續網站整合使用。
  window.TianshuLiveCalendar = Object.freeze({ snapshot });

  function mount() {
    if (document.getElementById('ts-live-banner') || !document.body) return;
    const card = document.createElement('aside');
    card.id = 'ts-live-banner';
    card.className = 'ts-live-banner';
    card.setAttribute('aria-label', '目前國曆農曆節氣與時間');
    card.title = '以瀏覽器本機日期時間為準；干支年從立春起、月從節令起、日於午夜更新。2026 年節氣採中央氣象署資料。';
    card.innerHTML = '<div class="ts-live-banner__line">'
      + '<span class="ts-live-banner__field"><span>國曆：</span><strong id="ts-now-gregorian"></strong></span>'
      + '<span class="ts-live-banner__field ts-live-banner__clock"><span>時鐘：</span><strong id="ts-now-clock" role="timer"></strong></span></div>'
      + '<div class="ts-live-banner__line">'
      + '<span class="ts-live-banner__field"><span>農曆：</span><strong id="ts-now-lunar"></strong></span>'
      + '<span class="ts-live-banner__field ts-live-banner__term"><span>節氣：</span><strong id="ts-now-term"></strong></span></div>';
    document.body.insertBefore(card, document.body.firstChild);
    const refs = Object.fromEntries(['gregorian','lunar','term','clock'].map(name => [name, document.getElementById(`ts-now-${name}`)]));
    let signature = '';

    function refresh() {
      const now = new Date();
      refs.clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const minuteKey = Math.floor(now.getTime() / 60000);
      if (minuteKey === signature) return;
      signature = minuteKey;
      const state = snapshot(now);
      refs.gregorian.textContent = state.gregorian;
      refs.lunar.textContent = state.lunar;
      refs.term.textContent = state.solarTerm;
      requestAnimationFrame(measure);
    }

    function measure() {
      document.documentElement.style.setProperty('--ts-live-banner-height', `${Math.ceil(card.getBoundingClientRect().height) + 2}px`);
      const viewport = window.innerWidth;
      const selectors = ['.system-header', '#taixuan-app', 'main', '.wrap'];
      const anchors = selectors.map(selector => document.querySelector(selector)).filter(Boolean);
      let rect = anchors.map(element => element.getBoundingClientRect())
        .find(box => box.width > 0 && box.left >= 15 && box.width < viewport - 30);
      if (!rect) rect = anchors.map(element => element.getBoundingClientRect()).find(box => box.width > 0);
      const left = Math.max(10, Math.min(Math.round(rect?.left || 10), viewport - card.getBoundingClientRect().width - 10));
      document.documentElement.style.setProperty('--ts-live-banner-left', `${left}px`);
    }

    refresh();
    setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('resize', () => requestAnimationFrame(measure));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
