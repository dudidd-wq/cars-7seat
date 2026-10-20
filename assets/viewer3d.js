(function(){
const ORDER=['carnival','ioniq9','mgs9','mifa7','santafe','jaecoo8','tiggo9','tiggo8'];
const byId=Object.fromEntries(SITE.cars.map(c=>[c.id,c]));
const MOD=Object.fromEntries(MEDIA.models.map(m=>[m.id,m]));
const CARS=ORDER.map(id=>{const c=byId[id];const m=MOD[id];return {id,name:c.short,full:c.name,color:c.color,L:c.L,W:c.W,H:c.H,WB:c.WB,kind:m?'glb':'billboard',model:m||null};});
const MM=0.001, nf=new Intl.NumberFormat('he-IL');
const $=id=>document.getElementById(id);
const state={mode:'lineup',cam:'iso',a:'carnival',b:'tiggo8',op:.45,dims:true,grid:true};

// UI (works before WebGL)
$('legend').innerHTML=CARS.map(c=>`<span><span class="swatch" style="background:${c.color}" aria-hidden="true"></span>${c.full}${c.kind==='billboard'?' <span class="badge">לוח תמונה</span>':''}</span>`).join('');
['carA','carB'].forEach((id,i)=>{const s=$(id);s.innerHTML=CARS.map(c=>`<option value="${c.id}">${c.full}</option>`).join('');s.value=i?state.b:state.a;});
$('tbl').innerHTML=CARS.map(c=>`<tr><th scope="row"><span class="swatch" style="background:${c.color}" aria-hidden="true"></span>${c.full}</th><td>${c.kind==='glb'?'מודל GLB':'לוח תמונה'}</td><td class="num">${nf.format(c.L)}</td><td class="num">${nf.format(c.W)}</td><td class="num">${nf.format(c.H)}</td><td class="num">${nf.format(c.WB)}</td><td class="small">${c.model?`<a href="${c.model.model_url}" target="_blank" rel="noopener">${c.model.title}</a> מאת <a href="${c.model.author_url}" target="_blank" rel="noopener">${c.model.author}</a> · <a href="${c.model.license_url}" target="_blank" rel="noopener">CC BY 4.0</a> · שונה`:`תמונת צד: <a href="${MEDIA.photos[c.id].url}" target="_blank" rel="noopener">${MEDIA.photos[c.id].src}</a>`}</td></tr>`).join('');
function syncUI(){
  document.querySelectorAll('#modes button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===state.mode?'true':'false'));
  document.querySelectorAll('.pr').forEach(e=>e.hidden=state.mode==='lineup');
  document.querySelectorAll('.gh').forEach(e=>e.hidden=state.mode!=='ghost');
  $('cam').value=state.cam; $('carA').value=state.a; $('carB').value=state.b;
}
(function applyHash(){
  const h=new URLSearchParams(location.hash.slice(1));
  for(const k of ['mode','cam','a','b']) if(h.get(k)) state[k]=h.get(k);
  if(h.get('op')) state.op=+h.get('op');
})();
syncUI();


// pre-boot listeners (state only; the GL module adds its own on boot)
$('modes').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.mode=b.dataset.m;syncUI();});
['cam','carA','carB'].forEach(id=>$(id).addEventListener('change',e=>{state[{cam:'cam',carA:'a',carB:'b'}[id]]=e.target.value;syncUI();}));
let glMod=null, booting=null;
async function boot(){
  if(!booting){
    $('loadBtn').disabled=true; $('status').textContent='טוען את מנוע התלת־ממד…';
    booting=import('./assets/viewer3d-gl.js').then(m=>{glMod=m; return m.boot({CARS,state,syncUI,MM,nf});})
      .catch(e=>{console.error(e); $('status').textContent='שגיאה בטעינת מנוע התלת־ממד: '+(e.message||e); $('loadBtn').disabled=false; booting=null;});
  }
  return booting;
}
$('loadBtn').addEventListener('click',boot);
if(new URLSearchParams(location.hash.slice(1)).get('autoload')==='1') boot();

})();
