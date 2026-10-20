(function(){
'use strict';
var S=window.SITE, cars=S.cars;
var nf=new Intl.NumberFormat('he-IL');
function n(v){return v==null?'—':nf.format(v);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var TYPE_LABEL={EV:'חשמלי',PHEV:'היברידי נטען',HEV:'היברידי',ICE:'בנזין'};
function minPrice(c){return Math.min.apply(null,c.trims.map(function(t){return t.p;}));}
function maxPrice(c){return Math.max.apply(null,c.trims.map(function(t){return t.p;}));}
function stars(k){if(!k.stars)return '<span class="muted">'+esc(k.note||'לא נבדק')+'</span>';
  var s='★★★★★'.slice(0,k.stars)+'☆☆☆☆☆'.slice(0,5-k.stars);
  return '<span class="stars" aria-label="'+k.stars+' כוכבים">'+s+'</span> <span class="small">'+k.year+'</span><br><span class="small num">AOP '+k.aop+'% · COP '+k.cop+'% · VRU '+k.vru+'% · SA '+k.sa+'%</span>'+(k.note?'<br><span class="small muted">'+esc(k.note)+'</span>':'')+'<br><a class="small" href="'+k.url+'" target="_blank" rel="noopener">Euro NCAP</a>';}
function links(arr){return arr.map(function(l){return '<a href="'+l[1]+'" target="_blank" rel="noopener">'+esc(l[0])+'</a>';}).join(' · ');}
function priceCell(c){
  var lo=minPrice(c),hi=maxPrice(c),ps=c.priceSrc;
  var rows=c.trims.map(function(t){return '<li><span>'+esc(t.t)+'</span> <span class="num">'+n(t.p)+'</span>'+(t.pf?' <span class="muted num">(עם אגרה '+n(t.pf)+')</span>':'')+'</li>';}).join('');
  return '<b class="num">'+n(lo)+(hi!==lo?'–'+n(hi):'')+' ₪</b><ul class="trims">'+rows+'</ul><span class="small">מקור: <a href="'+ps.url+'" target="_blank" rel="noopener">'+esc(ps.label)+'</a>, '+esc(ps.date)+'</span>'+(ps.note?'<br><span class="small muted">'+esc(ps.note)+'</span>':'');
}
function hpCell(c){return '<b class="num">'+(c.hpText||n(c.hp))+'</b> כ״ס<br><span class="small muted">'+esc(c.hpNote)+'</span>';}
function bootCell(c){return '<span class="num">'+n(c.boot7)+' / '+n(c.boot5)+' / '+n(c.bootMax)+'</span>'+(c.bootNote?'<br><span class="small muted">'+esc(c.bootNote)+'</span>':'');}
function reviewCell(c){
  return '<details><summary>ביקורות ובעיות ידועות</summary>'+
   '<p class="small"><b>בישראל:</b> '+esc(c.reviewsIL.text)+'<br>'+links(c.reviewsIL.links)+'</p>'+
   '<p class="small"><b>בעולם:</b> '+esc(c.reviewsIntl.text)+'<br>'+links(c.reviewsIntl.links)+'</p>'+
   '<p class="small"><b>לתשומת לב:</b> '+esc(c.issues)+'</p>'+
   '<p class="small"><b>מקורות מפרט:</b> '+links(c.specSrc)+'</p></details>';
}
var COLS=[
 {k:'name',label:'דגם',sort:function(c){return c.name;},cell:function(c){return '<span class="car-name"><span class="swatch" style="background:'+c.color+'" aria-hidden="true"></span>'+esc(c.name)+'</span><br><span class="small muted">'+esc(c.importer)+'</span>';}},
 {k:'type',label:'הנעה',sort:function(c){return c.type;},cell:function(c){return '<span class="badge '+c.type+'">'+TYPE_LABEL[c.type]+'</span><br><span class="small">'+esc(c.powertrain)+'</span>';}},
 {k:'price',label:'מחיר מחירון',sort:minPrice,cell:priceCell},
 {k:'L',label:'אורך',sort:function(c){return c.L;},num:1,cell:function(c){return '<span class="num">'+n(c.L)+'</span>';}},
 {k:'W',label:'רוחב',sort:function(c){return c.W;},num:1,cell:function(c){return '<span class="num">'+n(c.W)+'</span>';}},
 {k:'H',label:'גובה',sort:function(c){return c.H;},num:1,cell:function(c){return '<span class="num">'+n(c.H)+'</span>'+(c.dimNote?'<br><span class="small muted">'+esc(c.dimNote)+'</span>':'');}},
 {k:'WB',label:'בסיס גלגלים',sort:function(c){return c.WB;},num:1,cell:function(c){return '<span class="num">'+n(c.WB)+'</span>';}},
 {k:'seats',label:'מושבים / שורה 3',sort:function(c){return c.seats*10+c.row3Score;},cell:function(c){return '<b>'+c.seats+'</b> ('+esc(c.layout)+')<br><span class="small">'+esc(c.row3)+'</span>';}},
 {k:'hp',label:'הספק',sort:function(c){return c.hp;},cell:hpCell},
 {k:'z',label:'0–100 (שנ׳)',sort:function(c){return c.zeroTo100;},num:1,cell:function(c){return '<span class="num">'+(c.zeroNote?esc(c.zeroNote):(c.zeroTo100==null?'—':c.zeroTo100))+'</span>';}},
 {k:'ev',label:'טווח / צריכה',sort:function(c){return c.evRange;},cell:function(c){return '<span class="small">'+esc(c.energy)+'</span>';}},
 {k:'dc',label:'טעינה מהירה',sort:function(c){return c.dc;},cell:function(c){return '<span class="small">'+esc(c.dcNote)+'</span>';}},
 {k:'boot',label:'תא מטען (ל׳) 7 / 5 / מקס׳',sort:function(c){return c.boot7;},cell:bootCell},
 {k:'ncap',label:'Euro NCAP',sort:function(c){return c.ncap.stars?c.ncap.stars*1000+c.ncap.aop:null;},cell:function(c){return stars(c.ncap);}},
 {k:'rev',label:'ביקורות',cell:reviewCell}
];
var state={sort:'price',dir:1,q:'',types:{EV:1,PHEV:1,HEV:1,ICE:1},body:'',max:''};
var thead=document.getElementById('thead');
thead.innerHTML=COLS.map(function(c){
  if(!c.sort)return '<th scope="col">'+c.label+'</th>';
  return '<th scope="col" data-k="'+c.k+'" aria-sort="none"><button type="button" class="sort" data-k="'+c.k+'">'+c.label+'<span class="arr" aria-hidden="true"></span></button></th>';
}).join('');
var sortSel=document.getElementById('sortSel');
COLS.filter(function(c){return c.sort;}).forEach(function(c){
  ['1','-1'].forEach(function(d){var o=document.createElement('option');o.value=c.k+'|'+d;o.textContent=c.label+(d==='1'?' (עולה)':' (יורד)');sortSel.appendChild(o);});
});
var chips=document.getElementById('typeChips');
chips.innerHTML=Object.keys(TYPE_LABEL).map(function(t){return '<label><input type="checkbox" value="'+t+'" checked> '+TYPE_LABEL[t]+'</label>';}).join('');
document.getElementById('priceNote').textContent=S.priceNote;
function filtered(){
  var q=state.q.trim().toLowerCase();
  return cars.filter(function(c){
    if(!state.types[c.type])return false;
    if(state.body&&c.body!==state.body)return false;
    if(state.max&&minPrice(c)>+state.max)return false;
    if(q&&(c.name+' '+c.short+' '+c.importer).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
}
function sorted(list){
  var col=COLS.filter(function(c){return c.k===state.sort;})[0];
  return list.slice().sort(function(a,b){
    var x=col.sort(a),y=col.sort(b);
    if(x==null&&y==null)return 0; if(x==null)return 1; if(y==null)return -1;
    if(typeof x==='string')return x.localeCompare(y,'he')*state.dir;
    return (x-y)*state.dir;
  });
}
function render(){
  var list=sorted(filtered());
  document.getElementById('tbody').innerHTML=list.map(function(c){
    return '<tr>'+COLS.map(function(col,i){return (i===0?'<th scope="row">':'<td'+(col.num?' class="num"':'')+'>')+col.cell(c)+(i===0?'</th>':'</td>');}).join('')+'</tr>';
  }).join('')||'<tr><td colspan="'+COLS.length+'">אין רכבים התואמים לסינון.</td></tr>';
  document.getElementById('cards').innerHTML=list.map(function(c){
    return '<article class="card"><h3><span class="swatch" style="background:'+c.color+'" aria-hidden="true"></span>'+esc(c.name)+' <span class="badge '+c.type+'">'+TYPE_LABEL[c.type]+'</span></h3>'+
     '<dl class="kv"><dt>מחיר</dt><dd>'+priceCell(c)+'</dd>'+
     '<dt>מידות</dt><dd class="num">'+n(c.L)+' × '+n(c.W)+' × '+n(c.H)+' · בסיס '+n(c.WB)+(c.dimNote?'<br><span class="small muted">'+esc(c.dimNote)+'</span>':'')+'</dd>'+
     '<dt>מושבים</dt><dd><b>'+c.seats+'</b> ('+esc(c.layout)+') — '+esc(c.row3)+'</dd>'+
     '<dt>הנעה</dt><dd>'+esc(c.powertrain)+'</dd>'+
     '<dt>הספק</dt><dd>'+hpCell(c)+'</dd>'+
     '<dt>0–100</dt><dd>'+(c.zeroNote?esc(c.zeroNote):(c.zeroTo100==null?'—':c.zeroTo100+' שנ׳'))+'</dd>'+
     '<dt>טווח / צריכה</dt><dd>'+esc(c.energy)+'</dd>'+
     '<dt>טעינה</dt><dd>'+esc(c.dcNote)+'</dd>'+
     '<dt>תא מטען</dt><dd>'+bootCell(c)+'</dd>'+
     '<dt>Euro NCAP</dt><dd>'+stars(c.ncap)+'</dd></dl>'+reviewCell(c)+'</article>';
  }).join('')||'<p>אין רכבים התואמים לסינון.</p>';
  document.querySelectorAll('#thead th[data-k]').forEach(function(th){
    th.setAttribute('aria-sort',th.dataset.k===state.sort?(state.dir===1?'ascending':'descending'):'none');
  });
  sortSel.value=state.sort+'|'+state.dir;
  document.getElementById('count').textContent='מוצגות '+list.length+' מתוך '+cars.length+' שורות';
}
thead.addEventListener('click',function(e){var b=e.target.closest('button.sort');if(!b)return;var k=b.dataset.k;if(state.sort===k)state.dir=-state.dir;else{state.sort=k;state.dir=1;}render();});
sortSel.addEventListener('change',function(){var p=sortSel.value.split('|');state.sort=p[0];state.dir=+p[1];render();});
document.getElementById('q').addEventListener('input',function(e){state.q=e.target.value;render();});
chips.addEventListener('change',function(e){state.types[e.target.value]=e.target.checked?1:0;render();});
document.getElementById('body').addEventListener('change',function(e){state.body=e.target.value;render();});
document.getElementById('maxPrice').addEventListener('change',function(e){state.max=e.target.value;render();});
document.getElementById('reset').addEventListener('click',function(){
  state={sort:'price',dir:1,q:'',types:{EV:1,PHEV:1,HEV:1,ICE:1},body:'',max:''};
  document.getElementById('filters').reset(); chips.querySelectorAll('input').forEach(function(i){i.checked=true;}); render();
});
render();
})();
