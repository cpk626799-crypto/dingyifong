(function(){
 'use strict';
 const E=LongdeFude,$=id=>document.getElementById(id);
 let state={year:2026,month:1};
 const numerals='一二三四五六七八九';
 const palaceLabel=n=>numerals[n-1]+(n===5?'中宮':E.PALACES[n].name);
 const auspicious=['sun','moon','dragon','fortune'];
 const ids=[...auspicious,'taisui'];
 const deityName=id=>E.DEITIES.find(d=>d.id===id).name;
 $('month').innerHTML=E.MONTHS.map((m,i)=>`<option value="${i+1}">${m}・${E.BRANCHES[(i+2)%12]}月</option>`).join('');
 function error(message){$('year-error').textContent=message;$('year-error').hidden=!message;$('year').setAttribute('aria-invalid',message?'true':'false');}
 function render(){
  const r=E.calculate(state.year,state.month),p=r.positions;
  $('year').value=state.year;$('month').value=state.month;
  $('selection-year').textContent=`${r.year} ${r.yearGanzhi}年`;
  $('selection-month').textContent=`${r.monthName}・${r.monthGanzhi}月`;
  $('term-range').textContent=`${r.termStart}起，至${r.termEnd}交節前`;
  $('chart-title').textContent=`${r.yearGanzhi}年 ${r.monthName}`;
  $('annual-title').textContent=`${r.year} ${r.yearGanzhi}年・全年落宮`;
  $('prev').disabled=state.year===2000&&state.month===1;
  $('next').disabled=state.year===2200&&state.month===12;
  const shown=ids;
  $('palace-grid').innerHTML=E.DISPLAY.map(n=>{
   const palace=E.PALACES[n],marks=shown.filter(id=>p[id]===n),classes=marks.filter(x=>auspicious.includes(x)).map(x=>'tag-'+x).join(' ');
   const tags=marks.map(id=>{const d=E.DEITIES.find(x=>x.id===id);return `<span class="palace-tag ${id}">${d.name}</span>`;}).join('');
   return `<div class="palace ${classes}" data-palace="${n}" aria-label="${palaceLabel(n)}，${palace.dir}${marks.length?'，'+marks.map(id=>E.DEITIES.find(d=>d.id===id).name).join('、'):''}"><div class="palace-top"><div><strong>${palaceLabel(n)}</strong><small>${palace.dir}</small></div><span class="trigram" aria-hidden="true">${palace.symbol}</span></div><div class="palace-tags">${tags}</div></div>`;
  }).join('');
  $('result-summary').innerHTML=auspicious.map(id=>`<div class="result-item"><span class="${id}-text">${deityName(id)}</span><div><strong>${palaceLabel(p[id])}・${E.PALACES[p[id]].dir}</strong></div></div>`).join('');
  $('deity-results').innerHTML=auspicious.map(id=>`<div class="deity-card ${id}"><span class="${id}-text">${deityName(id)}</span><strong>${palaceLabel(p[id])}</strong><small>${E.PALACES[p[id]].dir}${id==='fortune'?'・太歲同宮':''}</small></div>`).join('');
  $('annual-body').innerHTML=E.MONTHS.map((m,i)=>{
   const row=E.calculate(state.year,i+1),pos=row.positions;
   return `<tr class="${state.month===i+1?'selected':''}" ${state.month===i+1?'aria-current="true"':''}><td><button type="button" class="month-link" data-month="${i+1}" aria-label="查看${row.year}年${m}九宮圖">${m}</button></td><td>${row.monthGanzhi}</td><td>${row.termStart}</td>${['taisui','dragon','fortune','sun','moon'].map(id=>`<td class="${auspicious.includes(id)?id+'-text':''}">${palaceLabel(pos[id])}<span class="cell-dir">${E.PALACES[pos[id]].dir}</span></td>`).join('')}</tr>`;
  }).join('');
  return r;
 }
 function setQuery(year,month){E.calculate(year,month);state={year,month};error('');return render();}
 $('query-form').addEventListener('submit',e=>{e.preventDefault();try{setQuery(Number($('year').value),Number($('month').value));}catch(err){error(err.message);}});
 $('month').addEventListener('change',()=>{try{setQuery(Number($('year').value),Number($('month').value));}catch(err){error(err.message);}});
 $('year').addEventListener('change',()=>{try{setQuery(Number($('year').value),Number($('month').value));}catch(err){error(err.message);}});
 function move(d){let y=state.year,m=state.month+d;if(m<1){m=12;y--;}if(m>12){m=1;y++;}if(y>=2000&&y<=2200)setQuery(y,m);}
 $('prev').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));
 $('annual-body').addEventListener('click',e=>{const b=e.target.closest('button[data-month]');if(b){setQuery(state.year,Number(b.dataset.month));$('query').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}});
 window.LongdeFudeUI={setQuery,getState:()=>({...state}),getResult:()=>E.calculate(state.year,state.month)};
 render();
 if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  try{Promise.resolve(document.modelContext.registerTool({name:'query_longde_fude',title:'查詢龍德福德落宮',description:'依年份與節氣月查詢龍德、福德、太陽、太陰與太歲，並更新頁面的九宮圖和全年表。',inputSchema:{type:'object',properties:{year:{type:'integer',minimum:2000,maximum:2200},month:{type:'integer',minimum:1,maximum:12}},required:['year','month'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['year','month'].includes(k)))throw new Error('請提供 year 與 month。');const r=setQuery(input.year,input.month);return{year:r.year,yearGanzhi:r.yearGanzhi,month:r.month,monthGanzhi:r.monthGanzhi,steps:r.steps,positions:r.positions};}},{signal:lifecycle.signal})).catch(()=>{});}catch(_){ }
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
})();
