(function(root){
  'use strict';
  const STEMS='甲乙丙丁戊己庚辛壬癸';
  const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
  const CYCLE=Array.from({length:60},(_,i)=>STEMS[i%10]+BRANCHES[i%12]);
  const PALACES={1:{name:'坎',dir:'北',symbol:'☵'},2:{name:'坤',dir:'西南',symbol:'☷'},3:{name:'震',dir:'東',symbol:'☳'},4:{name:'巽',dir:'東南',symbol:'☴'},5:{name:'中宮',dir:'中央',symbol:'五'},6:{name:'乾',dir:'西北',symbol:'☰'},7:{name:'兌',dir:'西',symbol:'☱'},8:{name:'艮',dir:'東北',symbol:'☶'},9:{name:'離',dir:'南',symbol:'☲'}};
  // 後天八卦九宮：南上北下、東左西右（由左至右、由上至下）。
  const DISPLAY=[4,9,2,3,5,7,8,1,6];
  const MONTHS=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const TERMS=['立春','驚蟄','清明','立夏','芒種','小暑','立秋','白露','寒露','立冬','大雪','小寒','立春'];
  const DEITIES=[{id:'taisui',name:'太歲',offset:0},{id:'sun',name:'太陽',offset:1},{id:'sangmen',name:'喪門',offset:2},{id:'moon',name:'太陰',offset:3},{id:'guanfu',name:'官符',offset:4},{id:'sifu',name:'死符',offset:5},{id:'suipo',name:'歲破',offset:6},{id:'dragon',name:'龍德',offset:7},{id:'baihu',name:'白虎',offset:8},{id:'fortune',name:'福德',offset:9},{id:'diaoke',name:'吊客',offset:10},{id:'bingfu',name:'病符',offset:11}];
  const mod=(n,m)=>((n%m)+m)%m;
  const advance=(palace,steps)=>mod(palace-1+steps,9)+1;
  function calculate(year,month){
    if(!Number.isInteger(year)||year<2000||year>2200)throw new RangeError('請輸入 2000–2200 之間的整數年份。');
    if(!Number.isInteger(month)||month<1||month>12)throw new RangeError('請選擇正月至十二月。');
    const yearIndex=mod(year-4,60);
    const monthStem=mod(2*(yearIndex%10%5)+2+month-1,10);
    const monthBranch=mod(month+1,12);
    const monthGanzhi=STEMS[monthStem]+BRANCHES[monthBranch];
    const monthIndex=CYCLE.indexOf(monthGanzhi);
    const steps=mod(yearIndex-monthIndex,60);
    const taisui=advance(5,steps);
    const deities=DEITIES.map(d=>({...d,palace:advance(taisui,d.offset),ganzhi:CYCLE[mod(yearIndex+d.offset,60)]}));
    const positions=Object.fromEntries(deities.map(d=>[d.id,d.palace]));
    return {year,month,yearIndex,yearGanzhi:CYCLE[yearIndex],monthIndex,monthGanzhi,monthName:MONTHS[month-1],monthBranch:BRANCHES[monthBranch],termStart:TERMS[month-1],termEnd:TERMS[month],steps,taisui,deities,positions};
  }
  const api={STEMS,BRANCHES,CYCLE,PALACES,DISPLAY,MONTHS,TERMS,DEITIES,mod,advance,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.LongdeFude=api;
})(typeof globalThis!=='undefined'?globalThis:this);
