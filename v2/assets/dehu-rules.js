function rulesEscape(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function rulesElementText(element) {
  const map = { 金: 'metal', 木: 'wood', 水: 'water', 火: 'fire', 土: 'earth' };
  return `<span class="dehu-element-text dehu-element-${map[element] || ''}">${rulesEscape(element)}</span>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('#dehuRulesToneTable');
  const rules = window.DEHU_TONE_RULES || [];
  if (!body) return;
  body.innerHTML = rules.map(rule => {
    const fast = `${rule.naYinElement}歸${rule.tone.slice(0,1)}`;
    return `<tr>
      <td><b>${rulesEscape(rule.tone)}</b></td>
      <td>${rulesEscape(rule.sequence)}</td>
      <td>${rulesElementText(rule.naYinElement)}</td>
      <td>${rulesEscape(rule.memo)}</td>
      <td>${rulesEscape(fast)}</td>
    </tr>`;
  }).join('');
});
