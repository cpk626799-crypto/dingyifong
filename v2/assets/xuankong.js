(() => {
"use strict";

const STEMS=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const STAR_NAMES={1:"一白貪狼",2:"二黑巨門",3:"三碧祿存",4:"四綠文曲",5:"五黃廉貞",6:"六白武曲",7:"七赤破軍",8:"八白左輔",9:"九紫右弼"};
const CN={1:"一",2:"二",3:"三",4:"四",5:"五",6:"六",7:"七",8:"八",9:"九"};
const POS_ORDER=["C","NW","W","NE","S","N","SW","E","SE"];
const GRID_ORDER=["SE","S","SW","E","C","W","NE","N","NW"];
const PALACE_LABEL={SE:"巽宮",S:"離宮",SW:"坤宮",E:"震宮",C:"中宮",W:"兌宮",NE:"艮宮",N:"坎宮",NW:"乾宮"};
const PALACE_NAME={N:"坎宮",NE:"艮宮",E:"震宮",SE:"巽宮",S:"離宮",SW:"坤宮",W:"兌宮",NW:"乾宮"};
const PALACE_MOUNTAINS={N:["壬","子","癸"],NE:["丑","艮","寅"],E:["甲","卯","乙"],SE:["辰","巽","巳"],S:["丙","午","丁"],SW:["未","坤","申"],W:["庚","酉","辛"],NW:["戌","乾","亥"]};
const MOUNTAIN_ORDER=["壬","子","癸","丑","艮","寅","甲","卯","乙","辰","巽","巳","丙","午","丁","未","坤","申","庚","酉","辛","戌","乾","亥"];
const MOUNTAIN_PALACE={};
const YUAN_INDEX={};
Object.entries(PALACE_MOUNTAINS).forEach(([p,arr])=>arr.forEach((m,i)=>{MOUNTAIN_PALACE[m]=p;YUAN_INDEX[m]=i;}));
const YUAN_NAME=["地元龍","天元龍","人元龍"];
const STAR_PALACE={1:"N",2:"SW",3:"E",4:"SE",6:"NW",7:"W",8:"NE",9:"S"};
const YANG_MOUNTAINS=new Set(["壬","艮","寅","甲","巽","巳","丙","坤","申","庚","乾","亥"]);
const OPPOSITE={壬:"丙",子:"午",癸:"丁",丑:"未",艮:"坤",寅:"申",甲:"庚",卯:"酉",乙:"辛",辰:"戌",巽:"乾",巳:"亥",丙:"壬",午:"子",丁:"癸",未:"丑",坤:"艮",申:"寅",庚:"甲",酉:"卯",辛:"乙",戌:"辰",乾:"巽",亥:"巳"};
const CENTER_DEG={子:0,癸:15,丑:30,艮:45,寅:60,甲:75,卯:90,乙:105,辰:120,巽:135,巳:150,丙:165,午:180,丁:195,未:210,坤:225,申:240,庚:255,酉:270,辛:285,戌:300,乾:315,亥:330,壬:345};

const $=id=>document.getElementById(id);
const mod=(n,m)=>((n%m)+m)%m;
const ganzhi=y=>STEMS[mod(y-4,10)]+BRANCHES[mod(y-4,12)];

function yearInfo(year){
  const pos=mod(year-1864,180);
  const period=Math.floor(pos/20)+1;
  const yuan=["上元","中元","下元"][Math.floor((period-1)/3)];
  const start=year-(pos%20);
  return {period,yuan,start,end:start+19};
}
function fly(center,forward=true){
  const seq=forward?POS_ORDER:[POS_ORDER[0],...POS_ORDER.slice(1).reverse()];
  const out={}; seq.forEach((pos,i)=>out[pos]=mod(center-1+i,9)+1); return out;
}
function directionFor(initialStar,actualMountain,period){
  const idx=YUAN_INDEX[actualMountain];
  let palace;
  if(initialStar===5){
    palace=STAR_PALACE[period]||MOUNTAIN_PALACE[actualMountain];
  }else{
    palace=STAR_PALACE[initialStar];
  }
  const keyMountain=PALACE_MOUNTAINS[palace][idx];
  return YANG_MOUNTAINS.has(keyMountain);
}
function buildChart(period,sit){
  const face=OPPOSITE[sit];
  const periodPlate=fly(period,true);
  const sitPal=MOUNTAIN_PALACE[sit], facePal=MOUNTAIN_PALACE[face];
  const mountainCenter=periodPlate[sitPal], facingCenter=periodPlate[facePal];
  const mountainPlate=fly(mountainCenter,directionFor(mountainCenter,sit,period));
  const facingPlate=fly(facingCenter,directionFor(facingCenter,face,period));
  return {face,periodPlate,mountainPlate,facingPlate,sitPal,facePal};
}
function classify(period,sit){
  const c=buildChart(period,sit),sp=c.sitPal,fp=c.facePal,m=c.mountainPlate,f=c.facingPlate;
  const mSit=m[sp]===period,mFace=m[fp]===period,fSit=f[sp]===period,fFace=f[fp]===period;
  if(mSit&&fFace)return "旺山旺向";
  if(mFace&&fFace)return "雙星到向";
  if(mSit&&fSit)return "雙星到坐";
  if(mFace&&fSit)return "上山下水";
  return "其他格局";
}
function degRange(m){
  const c=CENTER_DEG[m],lo=mod(c-7.5,360),hi=mod(c+7.5,360);
  return {center:c,lo,hi};
}
function fmtRange(m){
  const d=degRange(m);
  if(m==="子")return "352.5°–7.5°（中心 0.0°）";
  return `${d.lo.toFixed(1)}°–${d.hi.toFixed(1)}°（中心 ${d.center.toFixed(1)}°）`;
}

function renderGrid(period,sit){
  const c=buildChart(period,sit),g=$("starGrid"); g.innerHTML="";
  GRID_ORDER.forEach(pos=>{
    const div=document.createElement("div");
    div.className="xk-cell";
    if(pos===c.sitPal)div.classList.add("sit");
    if(pos===c.facePal)div.classList.add("face");
    div.innerHTML=`<span class="palace">${PALACE_LABEL[pos]}</span>${pos===c.sitPal?'<span class="mark sit">坐</span>':""}${pos===c.facePal?'<span class="mark face">向</span>':""}<div class="pair">${c.mountainPlate[pos]}&nbsp;&nbsp;${c.facingPlate[pos]}</div><div class="base-star">${CN[c.periodPlate[pos]]}</div>`;
    g.appendChild(div);
  });
}
function renderStars(period){
  const root=$("starStrip"); root.innerHTML="";
  for(let n=1;n<=9;n++){
    const d=document.createElement("div"); d.className="star-card"+(n===period?" wang":"");
    d.innerHTML=`<div class="num">${n}</div><div class="name">${STAR_NAMES[n]}</div><div class="state">${n===period?"旺":"衰／失運"}</div>`;
    root.appendChild(d);
  }
}
function renderMountainTable(period){
  const body=$("mountainTable"); body.innerHTML="";
  MOUNTAIN_ORDER.forEach(sit=>{
    const face=OPPOSITE[sit],pat=classify(period,sit),tr=document.createElement("tr");
    tr.innerHTML=`<td>${PALACE_NAME[MOUNTAIN_PALACE[sit]]}</td><td><b>${sit}山</b></td><td>${fmtRange(sit)}</td><td><b>${face}向</b></td><td>${fmtRange(face)}</td><td>${YUAN_NAME[YUAN_INDEX[sit]]}</td><td><span class="mini-badge ${pat.includes("旺")||pat.includes("雙星")?"hot":""}">${pat}</span></td>`;
    tr.addEventListener("click",()=>{$("sitSelect").value=sit;update();window.scrollTo({top:0,behavior:"smooth"});});
    body.appendChild(tr);
  });
}
function periodCounts(p){
  const c={"旺山旺向":0,"雙星到向":0,"雙星到坐":0,"上山下水":0,"其他格局":0};
  MOUNTAIN_ORDER.forEach(s=>c[classify(p,s)]++);
  return c;
}
function renderPeriodSummary(){
  const root=$("periodSummary"); root.innerHTML="";
  const starts=[1864,1884,1904,1924,1944,1964,1984,2004,2024];
  for(let p=1;p<=9;p++){
    const c=periodCounts(p),yuan=["上元","中元","下元"][Math.floor((p-1)/3)],div=document.createElement("div");
    div.className="period-card";
    div.innerHTML=`<div class="p">${yuan}・${CN[p]}運｜${STAR_NAMES[p]}</div><div class="meta">${starts[p-1]}–${starts[p-1]+19}（本輪）</div><div class="counts">旺山旺向 ${c["旺山旺向"]} 局｜雙星到向 ${c["雙星到向"]} 局<br>雙星到坐 ${c["雙星到坐"]} 局｜上山下水 ${c["上山下水"]} 局${c["其他格局"]?`｜其他 ${c["其他格局"]} 局`:""}</div>`;
    root.appendChild(div);
  }
}
function renderPeriodQuick(activePeriod){
  const root=$("periodQuick"); root.innerHTML="";
  const starts=[1864,1884,1904,1924,1944,1964,1984,2004,2024];
  for(let p=1;p<=9;p++){
    const b=document.createElement("button"); b.type="button"; b.className="xk-period-btn"+(p===activePeriod?" active":"");
    b.innerHTML=`<b>${CN[p]}運</b><small>${starts[p-1]}–${starts[p-1]+19}</small>`;
    b.addEventListener("click",()=>{$("yearSelect").value=starts[p-1];update();});
    root.appendChild(b);
  }
}
function update(){
  const year=Number($("yearSelect").value),sit=$("sitSelect").value,face=OPPOSITE[sit],info=yearInfo(year),p=info.period,pat=classify(p,sit);
  $("faceInput").value=face+"向";
  $("ganzhi").textContent=ganzhi(year); $("yuan").textContent=info.yuan; $("period").textContent=CN[p]+"運";
  $("periodYears").textContent=`${info.start}–${info.end}`; $("wangStar").textContent=STAR_NAMES[p]; $("pattern").textContent=pat;
  $("patternBadge").textContent=pat; $("directionTitle").textContent=`${sit}山${face}向`;
  $("periodText").textContent=`${year}（${ganzhi(year)}）｜${info.yuan}${CN[p]}運｜當運旺星：${STAR_NAMES[p]}`;
  $("sitDeg").textContent=`${sit}山 ${fmtRange(sit)}`; $("faceDeg").textContent=`${face}向 ${fmtRange(face)}`;
  $("ruleText").innerHTML=`坐山屬 <b>${YUAN_NAME[YUAN_INDEX[sit]]}</b>，坐宮為 <b>${PALACE_NAME[MOUNTAIN_PALACE[sit]]}</b>；向首為 <b>${face}向</b>，向宮為 <b>${PALACE_NAME[MOUNTAIN_PALACE[face]]}</b>。本局判為 <b>${pat}</b>。`;
  renderGrid(p,sit); renderStars(p); renderMountainTable(p); renderPeriodQuick(p);
}
function initApp(){
  const yearSelect=$("yearSelect"),sitSelect=$("sitSelect");
  for(let y=1864;y<=2223;y++){const o=document.createElement("option");o.value=y;o.textContent=y+" 年";yearSelect.appendChild(o);}
  MOUNTAIN_ORDER.forEach(m=>{const o=document.createElement("option");o.value=m;o.textContent=`${m}山`;sitSelect.appendChild(o);});
  const y=new Date().getFullYear();yearSelect.value=(y>=1864&&y<=2223)?y:2026;sitSelect.value="午";
  yearSelect.addEventListener("change",update);sitSelect.addEventListener("change",update);
  $("prevYear").addEventListener("click",()=>{const y=Number(yearSelect.value);if(y>1864){yearSelect.value=y-1;update();}});
  $("nextYear").addEventListener("click",()=>{const y=Number(yearSelect.value);if(y<2223){yearSelect.value=y+1;update();}});
  $("copyBtn").addEventListener("click",async()=>{
    const y=Number(yearSelect.value),s=sitSelect.value,f=OPPOSITE[s],info=yearInfo(y),p=info.period;
    const text=[`西元年：${y}（${ganzhi(y)}）`,`三元九運：${info.yuan}${CN[p]}運（${info.start}–${info.end}）`,`當運旺星：${STAR_NAMES[p]}`,`山向：${s}山${f}向`,`坐山度數：${fmtRange(s)}`,`朝向度數：${fmtRange(f)}`,`格局：${classify(p,s)}`].join("\n");
    try{await navigator.clipboard.writeText(text);alert("已複製查詢結果");}catch(e){window.prompt("請複製以下文字：",text);}
  });
  renderPeriodSummary(); update();
}
function applyMemberGate(){
  const profile=window.TIANSHU_MEMBER?.profile;
  if(!profile)return false;
  const allowed=profile.role==="admin"||profile.plan==="formal"||profile.plan==="permanent";
  $("planLock").classList.toggle("show",!allowed);
  $("xuankongApp").hidden=!allowed;
  if(allowed)initApp();
  return true;
}
function waitForAuth(){
  if(applyMemberGate())return;
  const observer=new MutationObserver(()=>{
    if(document.documentElement.classList.contains("auth-ready")&&applyMemberGate())observer.disconnect();
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  setTimeout(()=>{observer.disconnect();applyMemberGate();},10000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",waitForAuth,{once:true});else waitForAuth();
})();