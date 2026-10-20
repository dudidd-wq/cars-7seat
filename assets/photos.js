(function(){
'use strict';
var ORDER=['carnival','ioniq9','mgs9','mifa7','santafe','jaecoo8','tiggo9','tiggo8'];
var byId={}; SITE.cars.forEach(function(c){byId[c.id]=c;});
var cars=ORDER.map(function(id){var c=byId[id];return {id:id,name:c.short,full:c.name,color:c.color,L:c.L,W:c.W,H:c.H,WB:c.WB,boot7:c.boot7,boot5:c.boot5,photo:MEDIA.photos[id]};});
var nf=new Intl.NumberFormat('he-IL');
var st={mode:'lineup',a:'carnival',b:'mgs9',op:.55,metric:'L',grid:true};
var cv=document.getElementById('stage'),ctx=cv.getContext('2d'),statusEl=document.getElementById('status');
var imgs={},loaded=0;
function $(id){return document.getElementById(id);}
// selects
['carA','carB'].forEach(function(id,i){var s=$(id);s.innerHTML=cars.map(function(c){return '<option value="'+c.id+'">'+c.full+'</option>';}).join('');s.value=i?st.b:st.a;});
// table
$('ptbl').innerHTML=cars.map(function(c){var d=c.photo.hDiscPct;return '<tr><th scope="row"><span class="swatch" style="background:'+c.color+'" aria-hidden="true"></span>'+c.full+'</th><td class="num">'+nf.format(c.L)+'</td><td class="num">'+nf.format(c.W)+'</td><td class="num">'+nf.format(c.H)+'</td><td class="num">'+nf.format(c.WB)+'</td><td class="num '+(Math.abs(d)>5?'warn':'')+'">'+(d>0?'+':'')+d+'%</td><td class="small"><a href="'+c.photo.url+'" target="_blank" rel="noopener">'+c.photo.src+'</a></td></tr>';}).join('');
function load(){
  cars.forEach(function(c){
    var im=new Image(); im.decoding='async';
    im.onload=function(){loaded++;statusEl.textContent=loaded<cars.length?('נטענו '+loaded+'/'+cars.length+' תמונות…'):'';draw();};
    im.onerror=function(){loaded++;statusEl.textContent='שגיאה בטעינת התמונה של '+c.full;};
    im.src='img/side/'+c.id+'.webp'; imgs[c.id]=im;
  });
}
function setupCanvas(h){
  var w=$('stageWrap').clientWidth-16; var dpr=Math.min(window.devicePixelRatio||1,2);
  cv.style.width=w+'px'; cv.style.height=h+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h); return w;
}
function txt(s,x,y,o){o=o||{};ctx.save();ctx.direction='rtl';ctx.font=(o.b?'bold ':'')+(o.s||13)+'px system-ui,Arial,sans-serif';ctx.fillStyle=o.c||'#16202b';ctx.textAlign=o.a||'right';ctx.textBaseline=o.bl||'alphabetic';ctx.fillText(s,x,y);ctx.restore();}
function grid(x0,w,yTop,yBot,pxmm){
  if(!st.grid)return; ctx.save(); ctx.strokeStyle='rgba(11,92,173,.18)'; ctx.lineWidth=1;
  for(var m=0;m*1000*pxmm<=w+1;m++){var x=x0+m*1000*pxmm;ctx.beginPath();ctx.moveTo(x+.5,yTop);ctx.lineTo(x+.5,yBot);ctx.stroke();if(m>0)txt(m+' מ׳',x-2,yBot+12,{s:10,c:'#5a6b7d',a:'center'});}
  ctx.restore();
}
function drawCar(c,x,yGround,pxmm,alpha){
  var im=imgs[c.id]; if(!im||!im.complete||!im.naturalWidth)return;
  var w=c.L*pxmm, h=w*im.naturalHeight/im.naturalWidth;
  ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.drawImage(im,x,yGround-h,w,h); ctx.restore();
}
function lineup(){
  var narrow=$('stageWrap').clientWidth<600;
  var maxL=Math.max.apply(null,cars.map(function(c){return c.L;}));
  var wTmp=$('stageWrap').clientWidth-16, padX=narrow?8:16;
  var pxmm=(wTmp-2*padX)/maxL; var rowH=Math.max(1850*pxmm+30,60);
  var sorted=cars.slice().sort(function(a,b){return b.L-a.L;});
  var h=Math.round(sorted.length*rowH+24); var w=setupCanvas(h);
  sorted.forEach(function(c,i){
    var yG=(i+1)*rowH-4;
    ctx.strokeStyle='#c5ccd5';ctx.beginPath();ctx.moveTo(padX,yG+.5);ctx.lineTo(w-padX,yG+.5);ctx.stroke();
    if(st.grid){ctx.save();ctx.strokeStyle='rgba(11,92,173,.15)';for(var m=1;m*1000*pxmm<w-2*padX;m++){var gx=padX+m*1000*pxmm;ctx.beginPath();ctx.moveTo(gx+.5,yG-rowH+22);ctx.lineTo(gx+.5,yG);ctx.stroke();}ctx.restore();}
    drawCar(c,padX,yG,pxmm);
    txt(c.full,w-padX,yG-rowH+16,{b:1,s:narrow?12:14,c:'#16202b'});
    txt('אורך '+nf.format(c.L)+' · גובה '+nf.format(c.H),padX,yG-rowH+16,{s:narrow?11:12,c:'#4f5b69',a:'left'});
  });
  if(st.grid)txt('קווי רשת כל 1 מ׳ מקצה החזית',w-padX,h-6,{s:11,c:'#4f5b69'});
  cv.setAttribute('aria-label','שורת תמונות צד בקנה מידה אחיד, מהארוך לקצר: '+sorted.map(function(c){return c.full+' '+c.L+' מ״מ';}).join(', '));
}
function overlay(){
  var A=cars.filter(function(c){return c.id===st.a;})[0],B=cars.filter(function(c){return c.id===st.b;})[0];
  var wTmp=$('stageWrap').clientWidth-16,pad=12,maxL=Math.max(A.L,B.L);
  var pxmm=(wTmp-2*pad)/(maxL*1.02); var h=Math.round(1900*pxmm+90); var w=setupCanvas(h); var yG=h-40;
  grid(pad,w-2*pad,24,yG,pxmm);
  drawCar(A,pad,yG,pxmm,1); drawCar(B,pad,yG,pxmm,st.op);
  ctx.strokeStyle='#8893a0';ctx.beginPath();ctx.moveTo(0,yG+.5);ctx.lineTo(w,yG+.5);ctx.stroke();
  // length markers
  [[A,yG+14],[B,yG+28]].forEach(function(p){var c=p[0],y=p[1];ctx.strokeStyle=c.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(pad+c.L*pxmm,y);ctx.stroke();ctx.lineWidth=1;});
  var dL=A.L-B.L,dH=A.H-B.H,dW=A.W-B.W;
  txt(A.full+' (אטום) מול '+B.full+' ('+Math.round(st.op*100)+'% שקיפות)',w-pad,16,{b:1,s:13});
  txt('הפרש: אורך '+(dL>0?'+':'')+nf.format(dL)+' · רוחב '+(dW>0?'+':'')+nf.format(dW)+' · גובה '+(dH>0?'+':'')+nf.format(dH)+' מ״מ',w-pad,34,{s:12,c:'#4f5b69'});
  cv.setAttribute('aria-label','חפיפת '+A.full+' ו־'+B.full+'. הפרש אורך '+dL+' מ״מ, הפרש גובה '+dH+' מ״מ');
}
function front(){
  var wTmp=$('stageWrap').clientWidth-16,pad=12;
  var maxW=Math.max.apply(null,cars.map(function(c){return c.W;}));
  var pxmm=Math.min((wTmp-2*pad)/(maxW*1.15),0.22); var h=Math.round(1900*pxmm+60+cars.length*18); var w=setupCanvas(h);
  var yG=Math.round(1900*pxmm+30), cx=w/2;
  if(st.grid){ctx.save();ctx.strokeStyle='rgba(11,92,173,.15)';for(var m=-1;m<=1;m++){var gx=cx+m*1000*pxmm;ctx.beginPath();ctx.moveTo(gx+.5,10);ctx.lineTo(gx+.5,yG);ctx.stroke();}for(var k=1;k*1000*pxmm<yG;k++){var gy=yG-k*1000*pxmm;ctx.beginPath();ctx.moveTo(cx-1100*pxmm,gy+.5);ctx.lineTo(cx+1100*pxmm,gy+.5);ctx.stroke();}ctx.restore();}
  var sel=cars.slice().sort(function(a,b){return b.W*b.H-a.W*a.H;});
  sel.forEach(function(c){
    var ww=c.W*pxmm,hh=c.H*pxmm,x=cx-ww/2,y=yG-hh,r=Math.min(ww*.18,hh*.3);
    ctx.save();ctx.strokeStyle=c.color;ctx.lineWidth=2.5;ctx.beginPath();
    ctx.moveTo(x,yG);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.lineTo(x+ww-r,y);ctx.quadraticCurveTo(x+ww,y,x+ww,y+r);ctx.lineTo(x+ww,yG);ctx.stroke();ctx.restore();
  });
  ctx.strokeStyle='#8893a0';ctx.beginPath();ctx.moveTo(0,yG+.5);ctx.lineTo(w,yG+.5);ctx.stroke();
  sel.forEach(function(c,i){var y=yG+22+i*18;ctx.fillStyle=c.color;ctx.fillRect(w-pad-12,y-10,12,12);txt(c.full+' — רוחב '+nf.format(c.W)+' × גובה '+nf.format(c.H),w-pad-18,y,{s:12});});
  cv.setAttribute('aria-label','מתארי חזית סכמטיים (רוחב × גובה) של כל הרכבים בקנה מידה אחיד');
}
var LABELS={L:'אורך (מ״מ)',W:'רוחב (מ״מ)',H:'גובה (מ״מ)',WB:'בסיס גלגלים (מ״מ)',boot7:'תא מטען עם 7 מושבים (ל׳)',boot5:'תא מטען עם שורה 3 מקופלת (ל׳)'};
function bars(){
  var m=st.metric,list=cars.slice().sort(function(a,b){return (b[m]==null?-1:b[m])-(a[m]==null?-1:a[m]);});
  var max=Math.max.apply(null,list.map(function(c){return c[m]||0;}));
  $('bars').innerHTML='<h3 style="margin:.3rem 0 .6rem">'+LABELS[m]+'</h3>'+list.map(function(c){var v=c[m];return '<div class="bar-row"><div>'+c.full+'</div><div class="bar-track" role="img" aria-label="'+c.full+': '+(v==null?'לא פורסם':v)+'"><div class="bar-fill" style="width:'+(v==null?0:v/max*100)+'%;background:'+c.color+'"></div></div><div class="num">'+(v==null?'לא פורסם':nf.format(v))+'</div></div>';}).join('');
}
function draw(){
  var isBars=st.mode==='bars';
  cv.hidden=isBars; $('bars').hidden=!isBars;
  document.querySelectorAll('.ov').forEach(function(e){e.hidden=st.mode!=='overlay';});
  document.querySelectorAll('.bm').forEach(function(e){e.hidden=!isBars;});
  document.querySelectorAll('.cv').forEach(function(e){e.hidden=isBars;});
  if(isBars)return bars();
  if(st.mode==='lineup')lineup();else if(st.mode==='overlay')overlay();else front();
}
$('modes').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;st.mode=b.dataset.m;document.querySelectorAll('#modes button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});draw();});
$('carA').addEventListener('change',function(e){st.a=e.target.value;draw();});
$('carB').addEventListener('change',function(e){st.b=e.target.value;draw();});
$('op').addEventListener('input',function(e){st.op=e.target.value/100;$('opV').textContent=e.target.value+'%';draw();});
$('metric').addEventListener('change',function(e){st.metric=e.target.value;draw();});
$('grid').addEventListener('change',function(e){st.grid=e.target.checked;draw();});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(draw,120);});
var h=new URLSearchParams(location.hash.slice(1)); if(h.get('mode'))st.mode=h.get('mode'); if(h.get('a'))st.a=h.get('a'); if(h.get('b'))st.b=h.get('b');
document.querySelectorAll('#modes button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.m===st.mode?'true':'false');});
$('carA').value=st.a;$('carB').value=st.b;
draw(); load();
})();
