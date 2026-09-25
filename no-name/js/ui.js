'use strict';
// ============================================================
//  INTERFAZ, MODOS DE JUEGO, ENTRADA Y BUCLE PRINCIPAL
// ============================================================
const $=id=>document.getElementById(id);
const stage=$('stage'),wrap=$('wrap');
const SCR=['sMain','sTower','sRun','sShop','sAch','sRank','sOpt','sAcct','sMail','sCred','sPause','sWin','sEnd'];
let state='menu',mode={kind:'story'},backTo='sMain';
const pad2=n=>String(n).padStart(2,'0');
const fmt=t=>{if(t==null||!isFinite(t))return '—';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(2);};
const lvId=i=>LEVELS[i].id,lvName=i=>`${REALMS[LEVELS[i].r].roman}-${LEVELS[i].id.split('-')[1]}`;
const cleared=i=>!!save.prog.cleared[lvId(i)];
const unlocked=i=>i===0||cleared(i-1)||cleared(i)||!!window.__devAll;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.title=GAME_NAME;

// ---------- escalado
function fit(){
  const r=wrap.getBoundingClientRect(),touch=!$('touch').hidden,portrait=r.height>r.width;
  const availH=r.height-(touch&&portrait?140:0);
  let s=Math.min(r.width/VW,availH/VH);if(s>=2)s=Math.floor(s*4)/4;
  const w=Math.floor(VW*s),h=Math.floor(VH*s);
  stage.style.width=w+'px';stage.style.height=h+'px';
  stage.style.fontSize=Math.max(8,Math.min(20,w/44))+'px';
  if(touch&&portrait)stage.style.marginBottom='120px';else stage.style.marginBottom='0';
}
addEventListener('resize',fit);

// ---------- avisos
let hintT=0,cardT=0;
function showHint(txt,sec){$('hint').textContent=txt;$('hint').style.opacity=1;hintT=sec||5;}
function showToast(a,b){const d=document.createElement('div');d.innerHTML=`<b>${esc(a)}</b><span>${esc(b||'')}</span>`;$('toast').appendChild(d);setTimeout(()=>d.remove(),3600);}
function showCard(html,sec,cls){const c=$('card');c.className=cls||'';c.innerHTML=html;c.style.opacity=1;cardT=sec;}

// ---------- navegación universal (teclado · mando · ratón · táctil)
const nav={
  el:null,
  root(){return SCR.map($).find(e=>!e.hidden);},
  items(){const s=this.root();if(!s)return[];return[...s.querySelectorAll('[data-n]')].filter(e=>e.offsetParent!==null&&!e.disabled);},
  reset(pref){const it=this.items();this.set(pref&&it.includes(pref)?pref:(it.find(e=>'first' in e.dataset)||it[0]),true);},
  set(e,quiet){if(this.el)this.el.classList.remove('sel');this.el=e||null;
    if(e){e.classList.add('sel');if(e.scrollIntoView)e.scrollIntoView({block:'nearest',inline:'nearest'});if(e._sel)e._sel();}},
  move(dx,dy){
    const it=this.items();if(!it.length)return;
    if(!this.el||!it.includes(this.el)){this.reset();return;}
    if(dx&&this.el._lr){this.el._lr(dx);return;}
    const a=this.el.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,bd=1e9;
    for(const e of it){if(e===this.el)continue;const b=e.getBoundingClientRect(),bx=b.left+b.width/2,by=b.top+b.height/2,ddx=bx-ax,ddy=by-ay;
      if(dx&&(Math.sign(ddx)!==dx||Math.abs(ddx)<3))continue;if(dy&&(Math.sign(ddy)!==dy||Math.abs(ddy)<3))continue;
      const d=dx?Math.abs(ddx)+Math.abs(ddy)*4:Math.abs(ddy)+Math.abs(ddx)*2.5;if(d<bd){bd=d;best=e;}}
    if(best){this.set(best);sfx('mv');}
  },
  ok(){const e=this.el;if(!e)return;if(e.tagName==='INPUT'||e.tagName==='TEXTAREA'){e.focus();return;}sfx('ok');e.click();},
};
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-n]');if(t&&nav.items().includes(t)&&t!==nav.el)nav.set(t);});

function show(id){
  if(id&&id!=='sPause'){$('hint').style.opacity=0;hintT=0;$('card').style.opacity=0;cardT=0;}
  for(const s of SCR)$(s).hidden=s!==id;
  $('hud').hidden=!(state==='play'||state==='pause');
  $('bossBar').hidden=!(L&&L.boss&&(state==='play'||state==='pause'));
  $('runT').hidden=!(mode.kind==='run'&&(state==='play'||state==='pause'));
  updateTouchVis();
  if(id)requestAnimationFrame(()=>nav.reset());
}
function mk(tag,cls,html,attrs){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function navBtn(cls,html,fn,parent){const b=mk('button',cls,html,{'data-n':''});b.onclick=()=>{initAudio();fn&&fn(b);};if(parent)parent.appendChild(b);return b;}

// ============================================================
//  MENÚ PRINCIPAL
// ============================================================
let champion=null;
function firstPending(){for(let i=0;i<LEVELS.length;i++)if(!cleared(i))return i;return Math.min(save.prog.last||0,LEVELS.length-1);}
function toMenu(){
  state='menu';mode={kind:'story'};L=null;clearKeys();
  const m=$('mainMenu');m.querySelectorAll('.mi').forEach(e=>e.remove());
  $('logo').innerHTML=esc(GAME_NAME)+'<small>UNA BRASA CONTRA LA TORRE</small>';
  const any=Object.keys(save.prog.cleared).length>0,nx=firstPending();
  const add=(label,sub,fn,first)=>{const b=navBtn('mi',esc(label)+(sub?`<small>${esc(sub)}</small>`:''),fn,m);if(first)b.dataset.first='';return b;};
  add(any?'Continuar':'Empezar',any?lvName(nx)+' · '+LEVELS[nx].n:'',()=>startLevel(nx,{kind:'story'}),true);
  add('La torre','',openTower);
  add('Carrera','speedrun',openRun);
  add('El taller','◆ '+save.brasas,openShop);
  add('Logros',Object.keys(save.ach).length+'/'+ACH.length,openAch);
  add('Ranking',netOn()?'':'sin conexión',openRank);
  add('Opciones','',openOpt);
  add(save.acct?'Cuenta':'Crear cuenta',save.acct?save.acct.name:'guarda en la nube',openAcct);
  add('Buzón','ideas y bugs',openMail);
  add('Créditos','',openCred);
  const sp=Object.keys(save.prog.sparks).length,tot=LEVELS.filter(l=>!l.boss).length;
  $('mainFoot').innerHTML=`<span>v${GAME_VER}</span><span>✦ <b>${sp}/${tot}</b></span><span>✝ <b>${save.stats.deaths}</b></span>`+(champion?`<span>Leyenda: <b>${esc(champion.name)}</b> ${fmt(champion.t)}</span>`:'');
  const tt=save.equip.title;
  $('acctTag').innerHTML=save.acct?`<b>${esc(save.acct.name)}</b>${tt?`<br><i>${esc(tt)}</i>`:''}`:'';
  show('sMain');
}
function back(){
  sfx('back');
  if(state==='pause'){resume();return;}
  if(state==='sub'){if(backTo==='sPause'){state='pause';openPause();}else toMenu();return;}
  if(state==='win'){openTower();return;}
  if(state==='end'){toMenu();}
}
function openSub(id,from){state='sub';backTo=from||'sMain';show(id);}

// ============================================================
//  LA TORRE (selector de pisos)
// ============================================================
function openTower(){
  const list=$('towerList');list.innerHTML='';let cur=null;
  REALMS.forEach((Z,r)=>{
    const row=mk('div','realm'+(Z.soon?' soon':''));row.style.setProperty('--z',Z.tag);
    row.appendChild(mk('div','rn',Z.roman));
    const fl=mk('div','floors');row.appendChild(fl);
    const idx=LEVELS.map((l,i)=>l.r===r?i:-1).filter(i=>i>=0);
    for(let k=0;k<12;k++){
      const i=idx[k];
      if(i==null){const b=mk('button','fl','');b.disabled=true;fl.appendChild(b);continue;}
      const d=LEVELS[i],cl=cleared(i);
      const b=navBtn('fl'+(cl?' clr':'')+(d.boss?' boss':'')+(save.prog.sparks[d.id]?' spk':''),d.boss?'☠':String(k+1),()=>{if(unlocked(i))startLevel(i,{kind:'story'});},fl);
      b.disabled=!unlocked(i);b._sel=()=>floorInfo(i);
      if(i===firstPending()){b.classList.add('cur');cur=b;}
    }
    list.appendChild(row);
  });
  const n=Object.keys(save.prog.cleared).length;
  $('towerSub').textContent=`${n}/${LEVELS.length} FAROLES · FASE 1`;
  openSub('sTower',state==='pause'?'sPause':'sMain');
  requestAnimationFrame(()=>nav.reset(cur));
}
let wrTimer=0;
function floorInfo(i){
  const d=LEVELS[i],Z=REALMS[d.r],b=save.prog.best[d.id],el=$('floorInfo');
  const flat=d.map.join(''),coins=(flat.match(/c/g)||[]).length,got=save.prog.coins[d.id]||0;
  el.style.setProperty('--z',Z.tag);
  el.innerHTML=`<div class="fz">REINO ${Z.roman} · ${esc(Z.name.toUpperCase())}</div>
  <div class="fname">${lvName(i)} · ${esc(d.n)}</div>
  <dl class="kv"><dt>Mejor</dt><dd>${b?fmt(b.t):'—'}</dd><dt>Apagones</dt><dd>${b?b.d:'—'}</dd>
  ${d.boss?'':`<dt>Chispa</dt><dd class="gold">${save.prog.sparks[d.id]?'✦ encontrada':'<span class="dimt">sin encontrar</span>'}</dd><dt>Brasas</dt><dd>${got}/${coins}</dd>`}
  <dt>Mundial</dt><dd id="wr" class="dimt">${netOn()?'…':'sin conexión'}</dd></dl>
  <div class="lore">${esc(d.boss?(BOSS[d.boss].title+'. '+(BOSS[d.boss].intro||'')):(d.hint||''))}</div>`;
  clearTimeout(wrTimer);
  if(netOn())wrTimer=setTimeout(async()=>{try{const r=await netBoard('lvl:'+d.id);const w=$('wr');if(w)w.innerHTML=r.length?`${fmt(r[0].t)} <span class="dimt">${esc(r[0].name)}</span>`:'nadie aún';}catch(e){const w=$('wr');if(w)w.textContent='—';}},350);
}

// ============================================================
//  CARRERA (speedrun)
// ============================================================
const bossIdx=()=>LEVELS.map((l,i)=>l.boss?i:-1).filter(i=>i>=0);
function runDefs(){
  const all=LEVELS.map((l,i)=>i),defs=[];
  defs.push({cat:'full',n:'Torre completa',d:'Todos los pisos disponibles, de principio a fin.',lv:all,ok:all.every(cleared),need:'Supera todos los pisos'});
  REALMS.forEach((Z,r)=>{if(Z.soon)return;const lv=all.filter(i=>LEVELS[i].r===r);defs.push({cat:'realm'+(r+1),n:'Reino '+Z.roman,d:Z.name+'. Los 12 pisos seguidos.',lv,ok:lv.every(cleared),need:'Supera el Reino '+Z.roman});});
  const bi=bossIdx();defs.push({cat:'boss',n:'Desfile de jefes',d:'Todos los jefes, uno detrás de otro. Sin respiro.',lv:bi,ok:bi.every(cleared),need:'Derrota a todos los jefes'});
  return defs;
}
function openRun(){
  const list=$('runList');list.innerHTML='';
  for(const R of runDefs()){
    const pb=save.runs[R.cat];
    const b=navBtn('mi',esc(R.n)+`<small>${pb?fmt(pb.t):R.ok?'sin marca':'bloqueado'}</small>`,()=>{if(R.ok||window.__devAll)startRun(R);else{sfx('no');}},list);
    b._sel=()=>{$('runInfo').innerHTML=`<p class="vt muted" style="font-size:1.2em;margin:0 0 .5em">${esc(R.d)}</p>
      <dl class="kv"><dt>Pisos</dt><dd>${R.lv.length}</dd><dt>Tu marca</dt><dd class="gold">${pb?fmt(pb.t):'—'}</dd>${pb?`<dt>Apagones</dt><dd>${pb.d}</dd>`:''}</dl>
      <p class="vt ${R.ok?'dimt':'gold'}" style="font-size:1.1em">${R.ok?'El crono no se detiene entre pisos. Reiniciar un piso no te devuelve el tiempo.':'🔒 '+esc(R.need)}</p>`;};
  }
  openSub('sRun');
}
function startRun(R){mode={kind:'run',cat:R.cat,name:R.n,list:R.lv,pos:0,total:0,splits:[],deaths:0};startLevel(R.lv[0],mode);}

// ============================================================
//  TIENDA
// ============================================================
let shopCat='flame';
function openShop(){
  shopSel=null;
  const tabs=$('shopTabs');tabs.innerHTML='';
  for(const c in SHOP_CAT){const t=navBtn('tab'+(c===shopCat?' on':''),SHOP_CAT[c],()=>{shopCat=c;shopSel=null;openShopGrid();[...tabs.children].forEach(x=>x.classList.toggle('on',x===t));},tabs);}
  openShopGrid();openSub('sShop');
}
function itemState(cat,it){
  if(owns(cat,it.id))return save.equip[cat]===it.id?'eq':'own';
  if(it.excl)return 'excl';if(it.ach)return 'ach';return 'buy';
}
function openShopGrid(){
  const g=$('shopGrid');g.innerHTML='';
  for(const it of SHOP[shopCat]){
    const st=itemState(shopCat,it);
    const pr=st==='eq'?'EQUIPADO':st==='own'?'tuyo':st==='excl'?'★ premio':st==='ach'?'logro':'◆ '+it.price;
    const b=navBtn('it'+(st==='eq'?' eq':'')+(st==='own'||st==='eq'?' own':'')+((st==='excl'||st==='ach')?' lock':''),'',()=>shopAct(it,b),g);
    const cv=mk('canvas');cv.width=32;cv.height=32;b.appendChild(cv);b.appendChild(mk('span','',esc(it.n)));b.appendChild(mk('span','pr',pr));
    drawPreview(cv,shopCat,it,0);b._cv=cv;
    b._sel=()=>{shopSel=it;const how=st==='excl'?EXCL_HOW[it.excl]:st==='ach'?'Logro: '+ACH.find(a=>a.id===it.ach).n:'';$('shopName').innerHTML=esc(it.n)+(how?`<div class="vt dimt" style="font-size:.95em">${esc(how)}</div>`:'');$('shopMsg').textContent='';};
  }
  $('purse').textContent='◆ '+save.brasas;
  requestAnimationFrame(()=>nav.reset(g.querySelector('.eq')||undefined));
}
const EXCL_HOW={r1:'Sé el nº 1 de la Torre completa',top1:'Nº 1 de cualquier ranking',top2:'Nº 2 de cualquier ranking',top3:'Nº 3 de cualquier ranking'};
let shopSel=null;
function shopAct(it,b){
  const st=itemState(shopCat,it);
  if(st==='own'){save.equip[shopCat]=it.id;persist();sfx('ok');openShopGrid();return;}
  if(st==='eq')return;
  if(st!=='buy'){sfx('no');$('shopMsg').className='msg err';$('shopMsg').textContent='No se vende';return;}
  if(save.brasas<it.price){sfx('no');$('shopMsg').className='msg err';$('shopMsg').textContent=`Te faltan ${it.price-save.brasas} brasas`;return;}
  save.brasas-=it.price;save.owned[shopCat].push(it.id);save.equip[shopCat]=it.id;unlock('compra');persist();sfx('buy');
  openShopGrid();$('shopMsg').className='msg ok';$('shopMsg').textContent='¡Tuyo!';
}
function drawPreview(cv,cat,it,t){
  const g=cv.getContext('2d'),W=cv.width,H=cv.height,s=W/32;g.imageSmoothingEnabled=false;
  g.clearRect(0,0,W,H);
  const fl=cat==='flame'?it:equipped('flame'),hat=cat==='hat'?it.id:equipped('hat').id;
  let cols=fl.c;if(fl.rainbow){const h=(t*120)%360;cols=[`hsl(${h|0},95%,55%)`,`hsl(${(h+50)%360|0},95%,68%)`,'#fff'];}
  XC=g;g.save();g.translate(W/2,H*.78);g.scale(s,s);
  if(cat==='trail'&&it.id!=='nada'){const tc={chispas:EMBER,humo:['#8a8290'],pixel:['#ff5470','#ffd166','#5ad1ff','#8ef07a'],notas:['#fff'],nieve:['#fff'],oro:['#ffd166','#ffb700'],plata:['#e8ecf4','#b8c0cc'],bronce:['#d08a4a','#f0b070']}[it.id]||['#fff'];
    for(let k=0;k<7;k++){g.fillStyle=tc[k%tc.length];g.globalAlpha=1-k/8;g.fillRect(-6-k*2.2,-2-Math.sin(k+t*6)*2,it.id==='humo'?3:2,it.id==='humo'?3:2);}g.globalAlpha=1;}
  if(cat==='fx'){const fc=it.id==='confeti'?['#ff5470','#ffd166','#5ad1ff','#8ef07a']:it.id==='ceniza'?['#6a6470','#4a4450']:it.id==='fantasma'?['#f4e8ff']:fl.c;
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2,r=6+((t*20+k*3)%6);g.fillStyle=fc[k%fc.length];g.fillRect(Math.cos(a)*r-1,-7+Math.sin(a)*r-1,2,2);}
    if(it.id==='fantasma'){g.fillStyle='#f4e8ff';g.fillRect(-4,-14,8,8);g.fillRect(-4,-6,2,2);g.fillRect(0,-6,2,2);g.fillStyle='#2a1040';g.fillRect(-2,-12,1,2);g.fillRect(1,-12,1,2);}
  }else{
    const fl2=Math.sin(t*20);
    g.fillStyle=cols[0];flame(6,16+fl2,Math.sin(t*6));g.fillStyle=cols[1];flame(4.6,12+fl2*.7,Math.sin(t*6)*.8);g.fillStyle=cols[2];flame(3,7,0);
    g.fillStyle=fl.eye;g.fillRect(-3,-6.5,1.5,2.5);g.fillRect(1.5,-6.5,1.5,2.5);
    drawHat(hat,t);
  }
  g.restore();XC=null;
}

// ============================================================
//  LOGROS
// ============================================================
function openAch(){
  const l=$('achList');l.innerHTML='';
  const got=ACH.filter(a=>save.ach[a.id]);
  for(const a of[...got,...ACH.filter(a=>!save.ach[a.id])]){
    const g=!!save.ach[a.id];
    const e=mk('div','li ach'+(g?' got':' lk'),`<span class="ic"></span><span>${esc(a.n)}${a.title?`<span class="ttl">«${esc(a.title)}»</span>`:''}<span class="d">${esc(a.d)}</span></span><span class="gold">+${a.r}</span>`,{'data-n':''});
    l.appendChild(e);
  }
  $('achSub').textContent=`${got.length}/${ACH.length}`;
  const tb=$('bTitle');tb.setAttribute('data-n','');tb.dataset.first='';
  const setT=()=>{tb.textContent=save.equip.title?'«'+save.equip.title+'»':'(ninguno)';};setT();
  tb.onclick=()=>{const ts=['',...titles()];const i=ts.indexOf(save.equip.title||'');save.equip.title=ts[(i+1)%ts.length];persist();setT();};
  tb._lr=d=>{const ts=['',...titles()];const i=ts.indexOf(save.equip.title||'');save.equip.title=ts[(i+d+ts.length)%ts.length];persist();setT();sfx('mv');};
  openSub('sAch');
}

// ============================================================
//  RANKING
// ============================================================
let rankCat='full',rankLvl=0;
function openRank(){
  const tabs=$('rankTabs');tabs.innerHTML='';
  const cats=[['full','Torre completa'],...REALMS.filter(z=>!z.soon).map((z,r)=>['realm'+(r+1),'Reino '+z.roman]),['boss','Jefes'],['lvl','Por piso']];
  for(const[c,n]of cats){const t=navBtn('tab'+(c===rankCat?' on':''),n,()=>{rankCat=c;[...tabs.children].forEach(x=>x.classList.toggle('on',x===t));loadRank();},tabs);if(c===rankCat)t.dataset.first='';}
  $('rankSub').textContent=netOn()?RANK_VER.toUpperCase():'SIN CONEXIÓN';
  openSub('sRank');loadRank();
}
async function loadRank(){
  const l=$('rankList'),side=$('rankSide');
  const cat=rankCat==='lvl'?'lvl:'+LEVELS[rankLvl].id:rankCat;
  const mine=rankCat==='lvl'?save.prog.best[LEVELS[rankLvl].id]:save.runs[rankCat];
  side.innerHTML='';
  if(rankCat==='lvl'){
    const b=navBtn('btn',`◀ ${lvName(rankLvl)} · ${esc(LEVELS[rankLvl].n)} ▶`,()=>{rankLvl=(rankLvl+1)%LEVELS.length;loadRank();},side);
    b._lr=d=>{rankLvl=(rankLvl+d+LEVELS.length)%LEVELS.length;sfx('mv');loadRank();requestAnimationFrame(()=>nav.set(side.querySelector('.btn')));};
  }
  side.appendChild(mk('dl','kv',`<dt>Tu marca</dt><dd class="gold">${mine?fmt(mine.t):'—'}</dd>`));
  side.appendChild(mk('p','vt dimt',`Premios: el nº 1 de la Torre completa lleva la <span class="gold">Corona de ascuas</span>. Los tres primeros de cualquier tabla ganan estelas de oro, plata y bronce. Se pierden si te quitan el puesto.`));
  if(!save.acct)side.appendChild(mk('p','vt gold','Crea una cuenta para aparecer aquí.'));
  if(!netOn()){l.innerHTML='<p class="vt muted" style="font-size:1.2em">El ranking en línea no está disponible en esta copia.</p>';return;}
  l.innerHTML='<p class="vt dimt">Cargando…</p>';
  try{
    const rows=await netBoard(cat);
    if(!rows.length){l.innerHTML='<p class="vt muted" style="font-size:1.2em">Nadie todavía. El primer puesto está libre.</p>';return;}
    l.innerHTML='';
    rows.forEach((r,k)=>{const me=save.acct&&r.name.toLowerCase()===save.acct.name.toLowerCase();
      l.appendChild(mk('div','li'+(me?' me':''),`<span class="n">${k+1}</span><span>${esc(r.name)}${r.title?`<span class="ttl">«${esc(r.title)}»</span>`:''}</span><span class="t">${fmt(r.t)}</span>`));});
  }catch(e){l.innerHTML=`<p class="vt muted">No se pudo cargar (${esc(e.message)}).</p>`;}
}

// ============================================================
//  OPCIONES
// ============================================================
function openOpt(from){
  const l=$('optList');l.innerHTML='';
  const bars=v=>'<span class="bars">'+'▮'.repeat(v)+'<span class="dimt">'+'▮'.repeat(10-v)+'</span></span>';
  const row=(label,get,lr,ok)=>{const b=navBtn('opt',`<span>${label}</span><span class="v"></span>`,()=>{ok?ok():lr(1);upd();},l);const upd=()=>{b.querySelector('.v').innerHTML=get();};b._lr=d=>{lr(d);upd();sfx('mv');};upd();return b;};
  row('Efectos',()=>bars(save.opt.sfx),d=>{save.opt.sfx=Math.max(0,Math.min(10,save.opt.sfx+d));applyAudioPrefs();persist();}).dataset.first='';
  row('Música',()=>bars(save.opt.mus),d=>{save.opt.mus=Math.max(0,Math.min(10,save.opt.mus+d));applyAudioPrefs();persist();});
  row('Temblor de pantalla',()=>save.opt.shake?'sí':'no',()=>{save.opt.shake=!save.opt.shake;persist();});
  row('Cronómetro',()=>save.opt.timer?'sí':'no',()=>{save.opt.timer=!save.opt.timer;persist();});
  row('Botones táctiles',()=>['pequeños','normales','grandes'][save.opt.touch],d=>{save.opt.touch=(save.opt.touch+d+3)%3;persist();applyTouch();});
  row('Pantalla completa',()=>document.fullscreenElement?'sí':'no',()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch(e){}setTimeout(()=>openOpt(from),300);});
  let conf=0;
  const del=row('Borrar progreso',()=>conf?'<span style="color:var(--danger)">¿seguro? pulsa otra vez</span>':'',()=>{},()=>{if(!conf){conf=1;return;}const a=save.acct,o=save.opt;save=freshSave();save.opt=o;save.acct=a;persist();conf=0;showToast('Progreso borrado','Empiezas de cero');});
  $('optHelp').innerHTML=`<p style="margin:0 0 .4em" class="gold">Controles</p>
  <p style="margin:0">Teclado: <b>← →</b> / <b>A D</b> mover · <b>ESPACIO</b> / <b>Z</b> / <b>↑</b> saltar · <b>SHIFT</b> / <b>X</b> impulso · <b>R</b> reiniciar piso · <b>ESC</b> pausa</p>
  <p style="margin:.4em 0 0">Mando: stick o cruceta mover · <b>A</b> saltar · <b>B</b> / <b>X</b> impulso · <b>START</b> pausa · <b>SELECT</b> reiniciar</p>
  <p style="margin:.4em 0 0">En los menús: flechas para moverte, ←→ cambia valores, <b>ENTER</b>/<b>A</b> elige, <b>ESC</b>/<b>B</b> vuelve.</p>`;
  openSub('sOpt',state==='pause'?'sPause':'sMain');
}

// ============================================================
//  CUENTA
// ============================================================
let acctTab='login';
function openAcct(){
  const b=$('acctBody');b.innerHTML='';
  if(!netOn()){b.innerHTML=`<div class="col vt muted" style="font-size:1.2em;max-width:28em">Las cuentas en línea no están activadas en esta copia del juego. Tu progreso se guarda en este dispositivo.<br><br><span class="dimt">(Para activarlas, quien publica el juego debe configurar Supabase: ver LEEME.md)</span></div>`;$('acctSub').textContent='SIN CONEXIÓN';openSub('sAcct');return;}
  if(save.acct){
    $('acctSub').textContent='CONECTADO';
    const c=mk('div','col');c.style.gap='.5em';b.appendChild(c);
    c.appendChild(mk('dl','kv',`<dt>Nombre</dt><dd>${esc(save.acct.name)}</dd><dt>Título</dt><dd class="gold">${esc(save.equip.title||'—')}</dd><dt>Brasas</dt><dd>${save.brasas}</dd>`));
    const msg=mk('div','msg');
    const r=mk('div','row');c.appendChild(r);c.appendChild(msg);
    navBtn('btn pri','Sincronizar ahora',async()=>{msg.className='msg';msg.textContent='…';await netPushSave();await netRefreshRewards();msg.className='msg ok';msg.textContent='Listo';},r).dataset.first='';
    navBtn('btn','Cerrar sesión',()=>{netLogout();openAcct();},r);
    c.appendChild(mk('p','vt dimt','Tu progreso, compras y logros viajan contigo: entra con el mismo nombre y PIN en otro PC o celular.'));
    openSub('sAcct');return;
  }
  $('acctSub').textContent='NOMBRE + PIN';
  const c=mk('div','col');c.style.cssText='gap:.5em;flex:1;max-width:20em';b.appendChild(c);
  const tabs=mk('div','tabs');c.appendChild(tabs);
  const t1=navBtn('tab'+(acctTab==='login'?' on':''),'Entrar',()=>{acctTab='login';openAcct();},tabs);
  const t2=navBtn('tab'+(acctTab==='new'?' on':''),'Crear cuenta',()=>{acctTab='new';openAcct();},tabs);
  const f1=mk('label','field','Nombre');const n=mk('input','',null,{maxlength:'14',autocomplete:'username',spellcheck:'false','data-n':''});f1.appendChild(n);c.appendChild(f1);
  const f2=mk('label','field','PIN (4 a 6 números)');const p=mk('input','',null,{maxlength:'6',inputmode:'numeric',type:'password',autocomplete:'current-password','data-n':''});f2.appendChild(p);c.appendChild(f2);
  const msg=mk('div','msg');
  const go=async()=>{msg.className='msg';msg.textContent='Conectando…';
    try{acctTab==='new'?await netRegister(n.value,p.value):await netLogin(n.value,p.value);msg.className='msg ok';msg.textContent='¡Hecho!';sfx('ach');await netRefreshRewards();setTimeout(openAcct,600);}
    catch(e){sfx('no');msg.className='msg err';msg.textContent=e.message;}};
  const r=mk('div','row');c.appendChild(r);navBtn('btn pri',acctTab==='new'?'Crear':'Entrar',go,r);c.appendChild(msg);
  [n,p].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();i===n?p.focus():go();}}));
  const side=mk('div','col vt muted');side.style.cssText='flex:1;font-size:1.1em;line-height:1.15';
  side.innerHTML=acctTab==='new'?'Elige un nombre único (3 a 14 caracteres) y un PIN que recuerdes. <span class="gold">El PIN no se puede recuperar: apúntalo.</span><br><br>Tu progreso actual se sube a la cuenta nueva.':'Entra con tu nombre y PIN. Tu progreso de la nube se combina con el de este dispositivo (se queda lo mejor de cada uno).';
  b.appendChild(side);
  openSub('sAcct');
  requestAnimationFrame(()=>nav.set(n));
}

// ============================================================
//  BUZÓN
// ============================================================
let mailKind='idea';
function openMail(){
  const k=$('mailKinds');k.innerHTML='';
  for(const[id,n]of[['bug','Bug'],['idea','Idea'],['nivel','Nivel'],['jefe','Jefe'],['otro','Otro']]){
    const t=navBtn('tab'+(id===mailKind?' on':''),n,()=>{mailKind=id;[...k.children].forEach(x=>x.classList.toggle('on',x===t));},k);if(id===mailKind)t.dataset.first='';}
  $('mailText').setAttribute('data-n','');$('bMailSend').setAttribute('data-n','');
  $('mailMsg').textContent='';
  $('mailSide').innerHTML=`Todo lo que escribas llega a quien hace el juego y sirve para decidir las próximas versiones: reinos, jefes, mecánicas, lo que sea.<br><br><span class="dimt">Si reportas un bug, di en qué piso fue y qué hacías.</span>${netOn()?'':'<br><br><span class="gold">Sin conexión: el mensaje se guarda y se enviará cuando la haya.</span>'}`;
  openSub('sMail');
}
$('bMailSend').onclick=async()=>{
  const t=$('mailText').value.trim(),m=$('mailMsg');
  if(t.length<4){m.className='msg err';m.textContent='Escribe algo más';sfx('no');return;}
  const where=L?` [${LEVELS[L.i].id}]`:'';
  await netFeedback(mailKind,t+where);unlock('buzon');
  $('mailText').value='';m.className='msg ok';m.textContent=netOn()?'¡Recibido! Gracias.':'Guardado. Se enviará cuando haya conexión.';sfx('ok');
};

// ============================================================
//  CRÉDITOS
// ============================================================
function openCred(){
  $('credTitle').textContent=GAME_NAME;
  $('credBody').innerHTML=CREDITS.map(([a,b])=>`<div class="dimt">${esc(a)}</div><div style="margin-bottom:.5em">${esc(b)}</div>`).join('')+`<div class="gold" style="margin-top:.6em">Gracias por jugar</div><div class="dimt">v${GAME_VER}</div>`;
  openSub('sCred');
}

// ============================================================
//  JUEGO
// ============================================================
function startLevel(i,m){
  if(m)mode=m;
  initAudio();
  L=loadLevel(i);bakeLevel();resetDynamic();spawn();parts.length=0;amb.length=0;
  $('hint').style.opacity=0;hintT=0;
  if(LEVELS[i].id==='1-1'&&champion)L.plaque={x:5,y:11,name:champion.name};
  state='play';updateCam(0,true);clearKeys();hud={};acc=0;
  save.prog.last=i;persist();
  const d=LEVELS[i],Z=REALMS[d.r],prev=LEVELS[i-1];
  $('hudLvl').textContent=lvName(i);$('hudName').textContent=d.n;
  $('hudSpark').hidden=!L.spark;$('hudKey').hidden=!L.keys.length;$('hudCoin').hidden=!L.coins.length;
  if(L.boss){$('bossName').textContent=L.boss.name;$('bossSegs').innerHTML=L.boss.D.phases.map(()=>'<div class="seg"><i style="width:100%"></i></div>').join('');}
  show(null);
  if(d.boss){const Bd=BOSS[d.boss];showCard(`<div class="k">${d.id.endsWith('-6')?'GUARDIÁN':'JEFE DEL REINO'}</div><div class="t">${esc(Bd.name)}</div><div class="s">${esc(Bd.title)}</div><div class="q">${esc(Bd.intro||'')}</div>`,2.6,'boss');}
  else if(!prev||prev.r!==d.r)showCard(`<div class="k">REINO ${Z.roman}</div><div class="t">${esc(Z.name)}</div><div class="q">${esc(Z.lore||'')}</div>`,3.2);
  else showCard(`<div class="k">${esc(Z.name.toUpperCase())}</div><div class="t">${lvName(i)}</div><div class="s">${esc(d.n)}</div>`,1.6);
  if(d.hint)setTimeout(()=>{if(L&&L.i===i&&state==='play')showHint(d.hint,6);},d.boss?2700:900);else{$('hint').style.opacity=0;hintT=0;}
}
function onDeath(){if(mode.kind==='run')mode.deaths++;}
function restartLevel(){
  if(!L)return;
  if(mode.kind==='run'){mode.total+=L.time;mode.deaths+=0;}
  startLevel(L.i);
}
function coinsGot(){return L.coins.filter(c=>c.taken).length;}
function onLevelWon(){
  if(state!=='play')return;
  const i=L.i,d=LEVELS[i],id=d.id,P0=save.prog,prev=P0.best[id],rec=!prev||L.time<prev.t,first=!P0.cleared[id];
  P0.best[id]={t:rec?L.time:prev.t,d:prev?Math.min(prev.d,L.deaths):L.deaths};
  let gain=0;const cg=coinsGot(),oldC=P0.coins[id]||0;if(cg>oldC){gain+=cg-oldC;P0.coins[id]=cg;save.stats.coins+=cg-oldC;}
  if(first)gain+=d.boss?60:20;else gain+=3;
  const newSpark=L.gotSpark&&!P0.sparks[id];if(newSpark){P0.sparks[id]=1;gain+=25;}
  P0.cleared[id]=1;save.brasas+=gain;save.stats.time+=L.time;
  if(id==='1-1'){unlock('p1');if(L.time<30)unlock('veloz');}
  if(!d.boss&&L.deaths===0&&L.W*L.H>1500)unlock('limpio');
  if(id==='1-12')unlock('r1');if(id==='2-12')unlock('r2');
  for(const[r,a]of[[0,'chispas1'],[1,'chispas2']]){const ls=LEVELS.filter(l=>l.r===r&&!l.boss);if(ls.every(l=>P0.sparks[l.id]))unlock(a);}
  checkStatAch();persist();
  if(rec&&save.acct)netSubmit('lvl:'+id,L.time,[L.time]);
  if(mode.kind==='run'){
    mode.total+=L.time;mode.splits.push(L.time);mode.pos++;
    if(mode.pos<mode.list.length){showCard(`<div class="k">PARCIAL</div><div class="t">${fmt(mode.total)}</div>`,1);startLevel(mode.list[mode.pos]);return;}
    return finishRun();
  }
  state='win';clearKeys();
  const bossD=d.boss?BOSS[d.boss]:null;
  $('winInner').innerHTML=`<div class="k">${lvName(i)} · ${esc(d.n.toUpperCase())}</div>
    <h2>${d.boss?'¡DERROTADO!':'FAROL ENCENDIDO'}</h2>${rec&&prev?'<div><span class="rec">NUEVO RÉCORD</span></div>':''}
    <dl class="kv"><dt>Tiempo</dt><dd>${fmt(L.time)}</dd><dt>Mejor</dt><dd class="gold">${fmt(P0.best[id].t)}</dd><dt>Apagones</dt><dd>${L.deaths}</dd>
    ${L.coins.length?`<dt>Brasas</dt><dd>${cg}/${L.coins.length}</dd>`:''}${L.spark?`<dt>Chispa</dt><dd class="gold">${L.gotSpark?'✦':'<span class="dimt">no esta vez</span>'}</dd>`:''}
    <dt>Ganas</dt><dd class="gold">◆ ${gain}</dd></dl><div class="row" id="winBtns" style="margin-top:.3em"></div>`;
  const wb=$('winBtns'),last=i===LEVELS.length-1;
  navBtn('btn pri',last?'Final de la Fase 1':'Siguiente',()=>{last?showEnd():startLevel(i+1,{kind:'story'});},wb).dataset.first='';
  navBtn('btn','Repetir',()=>startLevel(i,{kind:'story'}),wb);
  navBtn('btn','La torre',openTower,wb);
  show('sWin');
}
function finishRun(){
  state='end';clearKeys();
  const cat=mode.cat,t=mode.total,pb=save.runs[cat],rec=!pb||t<pb.t;
  if(rec)save.runs[cat]={t,d:mode.deaths,splits:mode.splits};
  if(cat==='full')unlock('carrera');if(cat==='boss')unlock('bossrush');if(cat==='realm1'&&mode.deaths===0)unlock('sinmorir1');
  persist();
  if(rec)netSubmit(cat,t,mode.splits);
  const share=`🔥 ${GAME_NAME} · ${mode.name}: ${fmt(t)} con ${mode.deaths} apagones. ¿Me superas?`;
  $('endInner').innerHTML=`<p class="vt" style="color:var(--ember);letter-spacing:.3em;margin:0">CARRERA TERMINADA</p><h2 style="font-size:2.4em">${esc(mode.name)}</h2>
   ${rec?'<div><span class="rec">NUEVA MARCA</span></div>':''}
   <dl class="kv"><dt>Tiempo</dt><dd class="gold">${fmt(t)}</dd><dt>Mejor</dt><dd>${fmt(save.runs[cat].t)}</dd><dt>Apagones</dt><dd>${mode.deaths}</dd></dl>
   <p class="vt dimt">${save.acct?(netOn()?'Marca enviada al ranking.':'Sin conexión: se enviará después.'):'Crea una cuenta para entrar al ranking.'}</p>
   <div class="share">${esc(share)}</div><div class="row" id="endBtns" style="margin-top:.5em"></div>`;
  const eb=$('endBtns');
  navBtn('btn pri','Copiar marca',b=>{try{navigator.clipboard.writeText(share).then(()=>b.textContent='¡Copiado!');}catch(e){}},eb);
  navBtn('btn','Otra vez',()=>startRun(runDefs().find(r=>r.cat===cat)),eb).dataset.first='';
  navBtn('btn','Menú',toMenu,eb);
  show('sEnd');
}
function showEnd(){
  state='end';
  const sp=Object.keys(save.prog.sparks).length,tot=LEVELS.filter(l=>!l.boss).length;
  const sum=Object.values(save.prog.best).reduce((a,b)=>a+b.t,0);
  const share=`🔥 Terminé la Fase 1 de ${GAME_NAME}: ${LEVELS.length} pisos, 4 jefes, ${sp}/${tot} chispas y ${save.stats.deaths} apagones. ¿Te atreves?`;
  $('endInner').innerHTML=`<p class="vt" style="color:var(--ember);letter-spacing:.3em;margin:0">FIN DE LA FASE 1</p><h2 style="font-size:2.4em">La forja calla</h2>
   <p class="vt muted" style="font-size:1.2em;max-width:26em;margin:.3em 0">La Bicéfala cae y el hielo de la forja se agrieta. Más arriba, algo respira bajo el agua negra… Los reinos III a VI llegan en la próxima versión.</p>
   <dl class="kv"><dt>Suma de mejores</dt><dd class="gold">${fmt(sum)}</dd><dt>Chispas</dt><dd>${sp}/${tot}</dd><dt>Apagones</dt><dd>${save.stats.deaths}</dd></dl>
   <div class="share">${esc(share)}</div><div class="row" id="endBtns" style="margin-top:.5em"></div>`;
  const eb=$('endBtns');
  navBtn('btn pri','Copiar',b=>{try{navigator.clipboard.writeText(share).then(()=>b.textContent='¡Copiado!');}catch(e){}},eb);
  navBtn('btn','Carrera',openRun,eb).dataset.first='';
  navBtn('btn','Menú',toMenu,eb);
  show('sEnd');
}
function openPause(){
  if(state!=='play'&&state!=='pause'&&state!=='sub')return;
  state='pause';clearKeys();
  const m=$('pauseMenu');m.querySelectorAll('.mi').forEach(e=>e.remove());
  $('pauseLvl').textContent=`${lvName(L.i)} · ${LEVELS[L.i].n.toUpperCase()}${mode.kind==='run'?' · '+mode.name.toUpperCase():''}`;
  navBtn('mi','Continuar',resume,m).dataset.first='';
  navBtn('mi','Reiniciar piso',restartLevel,m);
  if(mode.kind==='run')navBtn('mi','Reiniciar carrera',()=>startRun(runDefs().find(r=>r.cat===mode.cat)),m);
  navBtn('mi','Opciones',()=>openOpt('pause'),m);
  if(mode.kind==='story')navBtn('mi','La torre',openTower,m);
  navBtn('mi','Buzón',()=>{openMail();backTo='sPause';},m);
  navBtn('mi','Salir al menú',toMenu,m);
  show('sPause');
}
function resume(){state='play';clearKeys();show(null);}

// ============================================================
//  ESCENA DEL MENÚ: la torre muestra tu progreso
// ============================================================
const menuFx={ash:[],t:0,far:null};
function drawMenu(dt){
  const t=(menuFx.t+=dt);
  if(!menuFx.far){
    const c=mkc(VW,VH),g=c.getContext('2d'),R=rng(7);
    const sky=g.createLinearGradient(0,0,0,VH);sky.addColorStop(0,'#06030c');sky.addColorStop(.55,'#150c24');sky.addColorStop(1,'#2a1222');g.fillStyle=sky;g.fillRect(0,0,VW,VH);
    for(let i=0;i<110;i++){g.fillStyle=`rgba(255,240,225,${.08+R()*.5})`;g.fillRect(R()*VW|0,R()*VH*.7|0,1,1);}
    g.fillStyle='rgba(230,220,255,.8)';g.beginPath();g.arc(214,34,11,0,7);g.fill();g.fillStyle='#0c0718';g.beginPath();g.arc(219,31,10,0,7);g.fill();
    g.fillStyle='#1a1028';g.beginPath();g.moveTo(0,VH);for(let x=0;x<=VW;x+=6)g.lineTo(x,150-Math.sin(x*.015)*18-Math.sin(x*.05+1)*6);g.lineTo(VW,VH);g.fill();
    g.fillStyle='#120a1c';g.beginPath();g.moveTo(0,VH);for(let x=0;x<=VW;x+=4)g.lineTo(x,176-Math.sin(x*.03+2)*8-(R()*3));g.lineTo(VW,VH);g.fill();
    for(let i=0;i<9;i++){const x=R()*VW,h=6+R()*8;g.fillStyle='#0c0714';g.fillRect(x,196-h,5,h);g.beginPath();g.arc(x+2.5,196-h,2.5,Math.PI,0);g.fill();}
    menuFx.far=c;
  }
  ctx.drawImage(menuFx.far,0,0);
  // torre
  const tx=262,tw=72,base=198,bh=29;
  ctx.fillStyle='#0e0816';ctx.fillRect(tx-4,base-bh*6-6,tw+8,bh*6+6);
  REALMS.forEach((Z,r)=>{
    const y0=base-bh*(r+1);
    ctx.fillStyle=Z.soon?'#1a1224':Z.dark;ctx.fillRect(tx,y0,tw,bh);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(tx,y0+bh-2,tw,2);ctx.fillRect(tx+tw-6,y0,6,bh);
    ctx.fillStyle=Z.soon?'#241a30':Z.stone;ctx.fillRect(tx-3,y0,tw+6,2);
    const idx=LEVELS.map((l,i)=>l.r===r?i:-1).filter(i=>i>=0);
    for(let k=0;k<12;k++){const col=k%6,row=k<6?1:0,wx=tx+6+col*11,wy=y0+5+row*11,i=idx[k];
      const lit=i!=null&&cleared(i),boss=i!=null&&LEVELS[i].boss;
      if(lit){const f=.75+Math.sin(t*3+k*1.7+r)*.15;ctx.fillStyle=boss?`rgba(255,110,110,${f})`:`rgba(255,209,102,${f})`;ctx.fillRect(wx,wy,5,7);
        ctx.save();ctx.globalCompositeOperation='lighter';glow(wx+2.5,wy+3.5,9,boss?'rgba(255,90,90,A)':'rgba(255,190,90,A)',.25);ctx.restore();}
      else{ctx.fillStyle=Z.soon?'#120c1a':'#0a0610';ctx.fillRect(wx,wy,5,7);}
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(wx,wy+3,5,1);}
  });
  // chapitel y faro
  const top=base-bh*6;
  ctx.fillStyle='#0e0816';ctx.beginPath();ctx.moveTo(tx-6,top);ctx.lineTo(tx+tw/2,top-30);ctx.lineTo(tx+tw+6,top);ctx.fill();
  const allLit=LEVELS.every((l,i)=>cleared(i));
  ctx.fillStyle=allLit?'#ffd166':'#2a2036';ctx.fillRect(tx+tw/2-3,top-22,6,7);
  if(allLit){ctx.save();ctx.globalCompositeOperation='lighter';glow(tx+tw/2,top-18,30+Math.sin(t*4)*3,'rgba(255,200,90,A)',.4);ctx.restore();}
  // suelo, hoguera y la brasa
  ctx.fillStyle='#08050e';ctx.fillRect(0,base,VW,VH-base);
  const fx=222,fy=base;
  ctx.save();ctx.globalCompositeOperation='lighter';glow(fx,fy-6,46+Math.sin(t*9)*3,'rgba(255,120,40,A)',.35);ctx.restore();
  ctx.fillStyle='#3a2616';ctx.fillRect(fx-8,fy-2,16,3);ctx.fillRect(fx-6,fy-4,4,2);ctx.fillRect(fx+3,fy-4,4,2);
  for(let k=0;k<3;k++){ctx.fillStyle=EMBER[k+1];const h=6+Math.sin(t*14+k*2)*2;ctx.fillRect(fx-4+k*3,fy-3-h,3,h);}
  const SK=flameCols();
  ctx.save();ctx.translate(fx-22,fy);
  const br=Math.sin(t*2)*.6;
  ctx.fillStyle=SK.c[0];flame(6,15+br+Math.sin(t*17),Math.sin(t*3)*1.2);ctx.fillStyle=SK.c[1];flame(4.6,11+br,Math.sin(t*3));ctx.fillStyle=SK.c[2];flame(3,7,0);
  const bl=(t%4)<.12;ctx.fillStyle=SK.eye;ctx.fillRect(-1.5,bl?-5:-6.5,1.5,bl?1:2.5);ctx.fillRect(2.5,bl?-5:-6.5,1.5,bl?1:2.5);
  drawHat(equipped('hat').id,t);ctx.restore();
  // ceniza
  if(menuFx.ash.length<40&&Math.random()<.4)menuFx.ash.push({x:Math.random()*VW,y:-4,vx:4+Math.random()*6,vy:8+Math.random()*10,c:Math.random()<.15?EMBER[1]:'rgba(190,180,200,.55)'});
  for(let i=menuFx.ash.length-1;i>=0;i--){const a=menuFx.ash[i];a.x+=a.vx*dt+Math.sin(t+i)*.1;a.y+=a.vy*dt;if(a.y>VH){menuFx.ash.splice(i,1);continue;}ctx.fillStyle=a.c;ctx.fillRect(a.x|0,a.y|0,1,1);}
  if(Math.random()<.3)menuFx.ash.push({x:fx+(Math.random()*6-3),y:fy-8,vx:(Math.random()-.5)*10,vy:-20-Math.random()*20,c:EMBER[Math.random()*3|0]});
  const v=ctx.createRadialGradient(VW/2,VH/2,VH*.4,VW/2,VH/2,VW*.65);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=v;ctx.fillRect(0,0,VW,VH);
}

// ============================================================
//  MÚSICA según el momento
// ============================================================
const CHM=[[0,3,7,12],[0,4,7,12],[0,4,7,12],[0,3,7,10]];
function musicCfg(){
  if(L&&(state==='play'||state==='pause'||state==='win')){
    const Z=L.Z,boss=!!L.d.boss;
    return{root:Z.root,bpm:(Z.bpm||92)+(boss?30:0),prog:Z.kind==='frost'?[0,5,8,7]:[0,8,10,7],chords:CHM,drums:boss?2:0,arp:Z.kind==='frost'||boss,sparse:L.d.dark&&!boss,lead:boss?'square':'triangle'};
  }
  return{root:50,bpm:68,prog:[0,8,3,10],chords:CHM,sparse:true};
}

// ============================================================
//  ENTRADA
// ============================================================
const kb={},tch={},gpad={};
const KMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyZ:'jump',KeyK:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyX:'dash',KeyJ:'dash',KeyC:'dash'};
const typing=()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA');};
function press(k){if(k==='jump'||k==='up'){if(!keys.jump)keys.jumpPressed=true;}if(k==='dash'&&!keys.dash)keys.dashPressed=true;}
addEventListener('keydown',e=>{
  initAudio();
  if(typing()){if(e.key==='Escape')document.activeElement.blur();return;}
  const k=KMAP[e.code];
  if(state==='play'){
    if(k){e.preventDefault();if(!e.repeat)press(k);kb[k]=true;return;}
    if(e.code==='KeyR'){restartLevel();return;}
    if(e.code==='Escape'||e.code==='KeyP'||e.code==='Enter'){openPause();return;}
    return;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='ArrowUp'||e.code==='KeyW')nav.move(0,-1);
  else if(e.code==='ArrowDown'||e.code==='KeyS')nav.move(0,1);
  else if(e.code==='ArrowLeft'||e.code==='KeyA')nav.move(-1,0);
  else if(e.code==='ArrowRight'||e.code==='KeyD')nav.move(1,0);
  else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyZ')nav.ok();
  else if(e.code==='Escape'||e.code==='Backspace'||e.code==='KeyX')back();
});
addEventListener('keyup',e=>{const k=KMAP[e.code];if(k)kb[k]=false;});
addEventListener('blur',()=>{for(const k in kb)kb[k]=false;if(state==='play')openPause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')openPause();});
// táctil
function bindTouch(id,k){
  const el=$(id);
  const on=e=>{e.preventDefault();initAudio();if(!tch[k])press(k);tch[k]=true;el.classList.add('on');try{el.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{tch[k]=false;el.classList.remove('on');};
  el.addEventListener('pointerdown',on);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,off));
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
bindTouch('tL','left');bindTouch('tR','right');bindTouch('tJ','jump');bindTouch('tD','dash');
$('tP').addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play')openPause();});
$('btnPause').addEventListener('click',()=>{if(state==='play')openPause();});
const isTouch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
function applyTouch(){document.documentElement.style.setProperty('--ts',[.8,1,1.25][save.opt.touch|0]);}
function updateTouchVis(){const t=$('touch'),want=isTouch&&(state==='play');if(t.hidden===want){t.hidden=!want;fit();}}
// mando
const gpPrev={};let gpRep=0;
function pollPad(dt){
  const pads=navigator.getGamepads?navigator.getGamepads():[];let gp=null;for(const p of pads)if(p&&p.connected){gp=p;break;}
  for(const k in gpad)gpad[k]=false;
  if(!gp)return;
  const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed),ax=gp.axes[0]||0,ay=gp.axes[1]||0;
  const c={left:b(14)||ax<-.45,right:b(15)||ax>.45,up:b(12)||ay<-.55,down:b(13)||ay>.55,a:b(0),b:b(1),x:b(2),y:b(3),start:b(9),sel:b(8),rt:b(7)||b(5)};
  const edge=k=>c[k]&&!gpPrev[k];
  if(c.a||c.b||c.start||c.left||c.right)initAudio();
  if(state==='play'){
    gpad.left=c.left;gpad.right=c.right;gpad.jump=c.a||c.y;gpad.dash=c.b||c.x||c.rt;
    if(edge('a')||edge('y'))press('jump');if(edge('b')||edge('x')||edge('rt'))press('dash');
    if(edge('start'))openPause();if(edge('sel'))restartLevel();
  }else{
    const dir=c.up?[0,-1]:c.down?[0,1]:c.left?[-1,0]:c.right?[1,0]:null;
    if(dir){const fresh=!(gpPrev.up||gpPrev.down||gpPrev.left||gpPrev.right);gpRep-=dt;if(fresh){nav.move(...dir);gpRep=.38;}else if(gpRep<=0){nav.move(...dir);gpRep=.11;}}
    if(edge('a'))nav.ok();if(edge('b'))back();if(edge('start')&&state==='pause')resume();
  }
  Object.assign(gpPrev,c);
}
function mergeInput(){
  keys.left=!!(kb.left||tch.left||gpad.left);keys.right=!!(kb.right||tch.right||gpad.right);
  keys.jump=!!(kb.jump||kb.up||tch.jump||gpad.jump);keys.dash=!!(kb.dash||tch.dash||gpad.dash);
}

// ============================================================
//  HUD
// ============================================================
let hud={};
function updHud(){
  const tt=save.opt.timer?fmt(L.time):'';if(hud.t!==tt){$('hudTime').textContent=tt;hud.t=tt;}
  if(hud.d!==L.deaths){$('hudDeaths').textContent=L.deaths;hud.d=L.deaths;}
  const sp=L.gotSpark;if(hud.s!==sp){$('hudSpark').classList.toggle('off',!sp);hud.s=sp;}
  const hk=L.keyCount;if(hud.k!==hk){$('hudKey').classList.toggle('off',!hk);$('hudKeyN').textContent=hk;hud.k=hk;}
  const cg=coinsGot();if(hud.c!==cg){$('hudCoinN').textContent=cg+'/'+L.coins.length;hud.c=cg;}
  const ht=P.heat>0?`<span style="color:#ffb13d">♨ ${P.heatT.toFixed(1)}</span>`:P.heat<0?`<span style="color:#8fd8ff">❄ ${P.heatT.toFixed(1)}</span>`:'';
  const ex=(P.shield?'<span style="color:#8ff7ff">◈</span> ':'')+(P.wings?'✧ ':'')+ht;
  if(hud.h!==ex){$('hudHeat').innerHTML=ex;hud.h=ex;}
  if(mode.kind==='run'){const r=fmt(mode.total+L.time);if(hud.r!==r){$('runT').textContent=r;hud.r=r;}}
  if(L.boss){const B0=L.boss,key=B0.ph+':'+B0.hp+':'+B0.dead;if(hud.b!==key){hud.b=key;
    [...$('bossSegs').children].forEach((s,i)=>{const w=B0.dead||i<B0.ph?0:i>B0.ph?100:B0.hp/B0.D.phases[i].hp*100;s.firstChild.style.width=w+'%';s.classList.toggle('done',B0.dead||i<B0.ph);});
    $('bossPhase').textContent=B0.dead?'':`FASE ${B0.ph+1}/${B0.D.phases.length}`;}}
  const tv=isTouch&&hasDash();$('tD').style.visibility=tv?'visible':'hidden';
}

// ============================================================
//  BUCLE
// ============================================================
let last=performance.now(),acc=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  pollPad(dt);mergeInput();
  if(state==='play'){acc+=dt;while(acc>=STEP&&state==='play'){step(STEP);acc-=STEP;}}
  else acc=0;
  if(L&&(state==='play'||state==='pause'||state==='win'||(state==='sub'&&backTo==='sPause')))render(dt,state!=='play');
  else drawMenu(dt);
  if(L&&(state==='play'||state==='pause'))updHud();
  if(hintT>0&&state==='play'){hintT-=dt;if(hintT<=0)$('hint').style.opacity=0;}
  if(cardT>0){cardT-=dt;if(cardT<=0)$('card').style.opacity=0;}
  if(state==='sub'&&!$('sShop').hidden){const t=now/1000,it=shopSel||equipped(shopCat);drawPreview($('shopPrev'),shopCat,it,t);
    for(const b of $('shopGrid').children)if(b.classList.contains('sel'))drawPreview(b._cv,shopCat,it,t);}
  requestAnimationFrame(frame);
}

// ---------- arranque
applyTouch();fit();if(isTouch)$('btnPause').hidden=true;
if(location.hash==='#dev')window.__devAll=true;
toMenu();
(async()=>{if(netOn()){netFlush();await netRefreshRewards();champion=await netChampion();if(state==='menu')toMenu();}})();
requestAnimationFrame(frame);
