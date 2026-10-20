import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ORDER=['carnival','ioniq9','mgs9','mifa7','santafe','jaecoo8','tiggo9','tiggo8'];
const byId=Object.fromEntries(SITE.cars.map(c=>[c.id,c]));
const MOD=Object.fromEntries(MEDIA.models.map(m=>[m.id,m]));
const CARS=ORDER.map(id=>{const c=byId[id];const m=MOD[id];return {id,name:c.short,full:c.name,color:c.color,L:c.L,W:c.W,H:c.H,WB:c.WB,kind:m?'glb':'billboard',model:m||null};});
const MM=0.001, nf=new Intl.NumberFormat('he-IL');
const $=id=>document.getElementById(id);
const state={mode:'lineup',cam:'iso',a:'carnival',b:'tiggo8',op:.45,dims:true,grid:true};
const groups={}, loading={};
let started=false;

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

// WebGL setup
const canvas=$('view');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true}); }
catch(e){ $('status').textContent='הדפדפן אינו תומך ב־WebGL, ולכן לא ניתן להציג את המודלים. נסו את עמוד התמונות בקנה מידה.'; $('loadBtn').hidden=true; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0d141c); scene.fog=new THREE.Fog(0x0d141c,30,75);
const camera=new THREE.PerspectiveCamera(38,2,0.05,150);
const controls=new OrbitControls(camera,canvas); controls.enableDamping=true; controls.target.set(0,.85,0);
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
scene.add(new THREE.HemisphereLight(0xb0c4de,0x2a2118,.55));
const sun=new THREE.DirectionalLight(0xfff2e0,1.35); sun.position.set(8,14,6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-24,right:24,top:14,bottom:-8}); scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,60),new THREE.ShadowMaterial({opacity:.4})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const gridHelper=new THREE.GridHelper(60,60,0x3a4a5a,0x1c2733); gridHelper.position.y=.002; scene.add(gridHelper);

function makeLabel(c){
  const cv=document.createElement('canvas'); cv.width=640; cv.height=150; const x=cv.getContext('2d');
  x.fillStyle='rgba(0,0,0,.62)'; x.fillRect(0,0,640,150); x.direction='rtl'; x.textAlign='center';
  x.fillStyle='#fff'; x.font='bold 40px system-ui,Arial'; x.fillText(c.name,320,56);
  x.font='28px system-ui,Arial'; x.fillStyle='#a8d4ff'; x.fillText(`${nf.format(c.L)} × ${nf.format(c.W)} × ${nf.format(c.H)}`,320,104);
  if(c.kind==='billboard'){x.fillStyle='#ffc58a'; x.font='24px system-ui,Arial'; x.fillText('לוח תמונה',320,138);}
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(2.4,.56,1); s.userData.isLabel=true; s.renderOrder=10; return s;
}
function frontSilhouette(c){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=Math.round(512*c.H/c.W); const x=cv.getContext('2d');
  const w=cv.width,h=cv.height,r=w*.16; x.fillStyle=c.color; x.globalAlpha=.55;
  x.beginPath(); x.moveTo(0,h); x.lineTo(0,r); x.quadraticCurveTo(0,0,r,0); x.lineTo(w-r,0); x.quadraticCurveTo(w,0,w,r); x.lineTo(w,h); x.closePath(); x.fill();
  x.globalAlpha=1; x.fillStyle='#fff'; x.textAlign='center'; x.direction='rtl'; x.font='bold 34px system-ui,Arial'; x.fillText('מתאר חזית',w/2,h*.45); x.font='26px system-ui,Arial'; x.fillText(`${nf.format(c.W)} × ${nf.format(c.H)}`,w/2,h*.45+40);
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeBillboard(c){
  return new Promise((res,rej)=>{
    new THREE.TextureLoader().load(`models/billboards/${c.id}_side.webp`,tex=>{
      tex.colorSpace=THREE.SRGBColorSpace;
      const g=new THREE.Group(); const Lm=c.L*MM,Wm=c.W*MM,Hm=c.H*MM;
      const img=tex.image; const hImg=Lm*img.height/img.width;
      const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.2,side:THREE.DoubleSide});
      const geo=new THREE.PlaneGeometry(Lm,hImg);
      for(const z of [Wm/2,-Wm/2]){const m=new THREE.Mesh(geo,mat); m.position.set(Lm/2,hImg/2,z); g.add(m);}
      const f=new THREE.Mesh(new THREE.PlaneGeometry(Wm,Hm),new THREE.MeshBasicMaterial({map:frontSilhouette(c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
      f.position.set(0,Hm/2,0); f.rotation.y=-Math.PI/2; g.add(f);
      const foot=new THREE.Mesh(new THREE.PlaneGeometry(Lm,Wm),new THREE.MeshBasicMaterial({color:c.color,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));
      foot.rotation.x=-Math.PI/2; foot.position.set(Lm/2,.01,0); g.add(foot);
      res(g);
    },undefined,rej);
  });
}
const gltfLoader=new GLTFLoader(); gltfLoader.setMeshoptDecoder(MeshoptDecoder);
function fixMaterials(root,id){
  const paint=id==='santafe'?new THREE.MeshStandardMaterial({color:0x9ea7b0,metalness:.3,roughness:.45}):null;
  const glass=id==='santafe'?new THREE.MeshStandardMaterial({color:0x0c1218,metalness:.1,roughness:.1,transparent:true,opacity:.55,depthWrite:false}):null;
  root.traverse(o=>{
    if(!o.isMesh) return; o.castShadow=true; o.receiveShadow=true;
    if(paint){const n=(o.material?.name||o.name||'').toLowerCase(); o.material=/glass|window/.test(n)?glass:paint; return;}
    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
      if(!m) return; const isGlass=/glass|window/.test((m.name||'').toLowerCase());
      if(m.map) m.map.colorSpace=THREE.SRGBColorSpace;
      if(!isGlass){m.transparent=false;m.opacity=1;m.depthWrite=true;m.alphaMap=null;if('alphaTest' in m)m.alphaTest=0;}
      else{m.transparent=true;m.opacity=Math.min(m.opacity??.6,.65);m.depthWrite=false;}
      if(!m.map&&m.color&&m.color.r>.9&&m.color.b>.9&&m.color.g<.2) m.color=new THREE.Color(0xc8c8c8);
      m.needsUpdate=true;
    });
  });
}
const progress={};
function updateProgress(){
  const ids=Object.keys(progress); if(!ids.length) return;
  const tot=ids.reduce((s,k)=>s+progress[k].total,0), got=ids.reduce((s,k)=>s+progress[k].loaded,0);
  $('bar').style.width=(tot?Math.min(100,got/tot*100):0)+'%';
}
async function loadGlb(c){
  progress[c.id]={loaded:0,total:c.model.size*1e6};
  const gltf=await gltfLoader.loadAsync(`models/${c.id}.glb`,e=>{progress[c.id].loaded=e.loaded; if(e.total) progress[c.id].total=e.total; updateProgress();});
  progress[c.id].loaded=progress[c.id].total; updateProgress();
  fixMaterials(gltf.scene,c.id);
  // runtime rescale: baked dims -> current spec dims (e.g. Carnival H 1775 -> 1785)
  const [bL,bW,bH]=c.model.baked; gltf.scene.scale.multiply(new THREE.Vector3(c.L/bL,c.H/bH,c.W/bW));
  // source models face +x; turn them so the front is at x=0 and the body extends along +x (same as billboards/photos)
  const inner=new THREE.Group(); inner.add(gltf.scene); inner.rotation.y=Math.PI; inner.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(inner);
  inner.position.set(-box.min.x,-box.min.y,-(box.min.z+box.max.z)/2);
  const g=new THREE.Group(); g.add(inner); g.userData.bbox=box.getSize(new THREE.Vector3()); return g;
}
function ensure(ids){
  return Promise.all(ids.map(id=>{
    if(groups[id]) return groups[id];
    if(!loading[id]){
      const c=CARS.find(x=>x.id===id);
      loading[id]=(c.kind==='glb'?loadGlb(c):makeBillboard(c)).then(g=>{
        const lab=makeLabel(c); lab.position.set(c.L*MM/2,c.H*MM+.3,0); lab.userData.baseY=lab.position.y; g.add(lab);
        g.userData.car=c; groups[id]=g; scene.add(g); return g;
      }).catch(err=>{console.error(id,err); $('status').textContent=`שגיאה בטעינת ${c.full}: ${err.message||err}`; throw err;});
    }
    return loading[id];
  }));
}
function setOpacity(root,o,onTop){root.traverse(obj=>{
  if(obj.userData.isLabel){obj.position.y=obj.userData.baseY+(onTop?.62:0);return;}
  if(!obj.isMesh)return; obj.renderOrder=onTop?5:0;
  (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>{if(!m)return;
    if(m.userData.baseT===undefined){m.userData.baseT=m.transparent;m.userData.baseO=m.opacity;m.userData.baseD=m.depthWrite;}
    if(o<.999){m.transparent=true;m.opacity=m.userData.baseO*o;m.depthWrite=false;m.depthTest=!onTop;}
    else{m.transparent=m.userData.baseT;m.opacity=m.userData.baseO;m.depthWrite=m.userData.baseD;m.depthTest=true;}
    m.needsUpdate=true;});
});}
function fitDist(span,vert){
  const vt=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), ht=vt*camera.aspect;
  return Math.max((span/2)/ht,(vert/2)/vt)*1.1;
}
function setCam(mode,midX,spanX,spanZ){
  spanZ=spanZ||2.2; gridHelper.position.x=Math.round(midX); ground.position.x=midX;
  controls.target.set(midX,.8,0);
  if(mode==='iso'){const d=fitDist(spanX,3)*1.25+spanZ; camera.position.set(midX+d*.42,d*.36,d*.83);}
  else if(mode==='side'){const d=fitDist(spanX*1.06,2.8)+spanZ/2; camera.position.set(midX,1.0,d);}
  else if(mode==='front'){const d=fitDist(spanZ*1.08,2.8)+1; controls.target.set(0,.85,0); camera.position.set(-d,1.1,.001);}
  else {const d=fitDist(spanX*1.08,spanZ*1.1)+1.5; camera.position.set(midX,d,.2);}
  controls.update();
}
function neededIds(){return state.mode==='lineup'?ORDER.slice():[state.a,state.b];}
async function layout(){
  syncUI();
  if(!started) return;
  const need=neededIds();
  const pending=need.filter(id=>!groups[id]);
  if(pending.length){ $('overlay').hidden=false; $('loadBtn').hidden=true; $('status').textContent='טוען מודלים…'; }
  let loaded=0;
  await Promise.allSettled(need.map(id=>ensure([id]).then(()=>{loaded++; $('status').textContent=`נטענו ${loaded}/${need.length}`;})));
  $('overlay').hidden=true;
  Object.values(groups).forEach(g=>g.visible=false);
  const vis=need.map(id=>groups[id]).filter(Boolean);
  if(state.mode==='lineup'){
    const gap=1.0; let x=0;
    const sorted=vis.slice().sort((a,b)=>b.userData.car.L-a.userData.car.L);
    if(state.cam==='front'){ // front: spread across width
      let z=0; const tot=sorted.reduce((s,g)=>s+g.userData.car.W*MM+.5,0)-.5; z=-tot/2;
      sorted.forEach(g=>{const c=g.userData.car; g.visible=true; setOpacity(g,1); g.position.set(0,0,z+c.W*MM/2); z+=c.W*MM+.5;});
      setCam('front',0,5,tot+.6);
    } else {
      sorted.forEach(g=>{g.visible=true; setOpacity(g,1); g.position.set(x,0,0); x+=g.userData.car.L*MM+gap;});
      setCam(state.cam,(x-gap)/2,x-gap,2.2);
    }
  } else if(state.mode==='pair'){
    const [ga,gb]=[groups[state.a],groups[state.b]]; if(!ga||!gb) return;
    ga.visible=gb.visible=true; setOpacity(ga,1); setOpacity(gb,1);
    ga.position.set(0,0,-1.3); gb.position.set(0,0,1.3);
    const L=Math.max(ga.userData.car.L,gb.userData.car.L)*MM; setCam(state.cam,L/2,L+.6,5.0);
  } else {
    const [ga,gb]=[groups[state.a],groups[state.b]]; if(!ga||!gb) return;
    ga.visible=gb.visible=true; setOpacity(ga,1); setOpacity(gb,state.op,true);
    ga.position.set(0,0,0); gb.position.set(0,0,0);
    const L=Math.max(ga.userData.car.L,gb.userData.car.L)*MM; setCam(state.cam,L/2,L+.6,2.4);
  }
  Object.values(groups).forEach(g=>g.traverse(o=>{if(o.userData.isLabel)o.visible=state.dims&&g.visible;}));
  gridHelper.visible=state.grid;
  canvas.setAttribute('aria-label','מציג תלת־ממד: '+vis.map(g=>g.userData.car.full).join(', '));
  window.__ready=true;
}
function resize(){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||400;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
let raf=0; function animate(){raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
function start(){ if(started) return; started=true; $('loadBtn').hidden=true; animate(); layout(); }
$('loadBtn').addEventListener('click',start);
$('modes').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.mode=b.dataset.m;layout();});
$('cam').addEventListener('change',e=>{state.cam=e.target.value;layout();});
$('carA').addEventListener('change',e=>{state.a=e.target.value;layout();});
$('carB').addEventListener('change',e=>{state.b=e.target.value;layout();});
$('op').addEventListener('input',e=>{state.op=e.target.value/100;$('opV').textContent=e.target.value+'%';if(started&&state.mode==='ghost'&&groups[state.b])setOpacity(groups[state.b],state.op,true);});
$('dims').addEventListener('change',e=>{state.dims=e.target.checked;layout();});
$('grid').addEventListener('change',e=>{state.grid=e.target.checked;gridHelper.visible=state.grid;});
addEventListener('resize',resize); new ResizeObserver(resize).observe(canvas); resize();
renderer.render(scene,camera);
if(new URLSearchParams(location.hash.slice(1)).get('autoload')==='1') start();
window.__viewer={renderer,scene,camera,state,groups,layout,start};
