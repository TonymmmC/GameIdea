'use strict';
// ============================================================
//  RED — Supabase por REST (sin librerías). Todo pasa por funciones RPC
//  del servidor (ver supabase/schema.sql), nunca se escribe directo en tablas.
// ============================================================
const netOn=()=>!!(SUPABASE_URL&&SUPABASE_KEY);
const QKEY='noname-queue-v1';
let netQueue=[];try{netQueue=JSON.parse(localStorage.getItem(QKEY))||[];}catch(e){}
const saveQ=()=>{try{localStorage.setItem(QKEY,JSON.stringify(netQueue.slice(-60)));}catch(e){}};

async function rpc(fn,args){
  if(!netOn())throw new Error('offline');
  const r=await fetch(SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/'+fn,{
    method:'POST',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(args||{})});
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null;}catch(e){}
  if(!r.ok){const m=(j&&(j.message||j.hint))||('Error '+r.status);throw new Error(m);}
  return j;
}
const cleanName=n=>(n||'').trim().replace(/\s+/g,' ').slice(0,14);
const validName=n=>/^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñÜü _.\-]{3,14}$/.test(n);
const validPin=p=>/^\d{4,6}$/.test(p);

// ---------- cuenta
async function netRegister(name,pin){
  name=cleanName(name);
  if(!validName(name))throw new Error('Nombre: 3 a 14 letras o números');
  if(!validPin(pin))throw new Error('El PIN son 4 a 6 números');
  const res=await rpc('nn_register',{p_name:name,p_pin:pin,p_data:exportSave()});
  save.acct={name:res.name,token:res.token};unlock('cuenta');persist();netFlush();
  return res;
}
async function netLogin(name,pin){
  name=cleanName(name);
  if(!validPin(pin))throw new Error('El PIN son 4 a 6 números');
  const res=await rpc('nn_login',{p_name:name,p_pin:pin});
  if(!res||res.error)throw new Error(res?res.error:'Sin respuesta');
  if(res.data)mergeSave(res.data);
  save.acct={name:res.name,token:res.token};unlock('cuenta');persist();netFlush();
  return res;
}
function netLogout(){save.acct=null;persist();}
function exportSave(){const s=JSON.parse(JSON.stringify(save));delete s.acct;delete s.opt;return s;}
// combina el progreso de la nube con el local quedándose con lo mejor de cada uno
function mergeSave(d){
  if(!d||typeof d!=='object')return;
  const P=save.prog,Q=d.prog||{};
  for(const k in Q.best||{}){const a=P.best[k],b=Q.best[k];if(!a||b.t<a.t)P.best[k]=b;}
  for(const k of['sparks','cleared','notes','coins']){P[k]=P[k]||{};for(const i in Q[k]||{})P[k][i]=Math.max(P[k][i]||0,Q[k][i]);}
  save.brasas=Math.max(save.brasas,d.brasas|0);
  for(const c in d.owned||{})for(const id of d.owned[c])if(!save.owned[c].includes(id))save.owned[c].push(id);
  for(const k in d.ach||{})if(!save.ach[k])save.ach[k]=d.ach[k];
  for(const k in d.stats||{})save.stats[k]=Math.max(save.stats[k]||0,d.stats[k]||0);
  for(const k in d.runs||{}){const a=save.runs[k],b=d.runs[k];if(!a||b.t<a.t)save.runs[k]=b;}
  if(d.equip)save.equip=Object.assign(save.equip,d.equip);
}
let pushing=false;
async function netPushSave(){
  if(!netOn()||!save.acct||pushing)return;pushing=true;
  try{await rpc('nn_save',{p_token:save.acct.token,p_data:exportSave()});}catch(e){if(/sesi/i.test(e.message)){save.acct=null;}}
  pushing=false;
}

// ---------- puntuaciones
// categorías: full · realm1 · realm2 · boss · lvl:1-4   (+ versión de ranking)
const catKey=c=>c+'@'+RANK_VER;
function netSubmit(cat,t,splits){
  if(!save.acct)return;
  netQueue.push({k:'score',cat:catKey(cat),t:+t.toFixed(3),splits:(splits||[]).map(x=>+x.toFixed(3)),at:Date.now()});saveQ();netFlush();
}
function netFeedback(kind,msg){
  netQueue.push({k:'fb',kind,msg:msg.slice(0,600),name:save.acct?save.acct.name:'anónimo',ver:GAME_VER,at:Date.now()});saveQ();return netFlush();
}
let flushing=false;
async function netFlush(){
  if(!netOn()||flushing||!netQueue.length)return;flushing=true;
  try{
    while(netQueue.length){
      const q=netQueue[0];
      if(q.k==='score'){if(!save.acct)break;await rpc('nn_submit',{p_token:save.acct.token,p_cat:q.cat,p_t:q.t,p_splits:q.splits});}
      else if(q.k==='fb'){await rpc('nn_feedback',{p_name:q.name,p_kind:q.kind,p_msg:q.msg,p_ver:q.ver});}
      netQueue.shift();saveQ();
    }
  }catch(e){if(/inv[aá]lid|rechaz/i.test(e.message)){netQueue.shift();saveQ();}}
  flushing=false;
}
setInterval(netFlush,30000);addEventListener('online',netFlush);
async function netBoard(cat){return await rpc('nn_board',{p_cat:catKey(cat),p_limit:20})||[];}
// premios exclusivos según tus puestos actuales
async function netRefreshRewards(){
  if(!netOn()||!save.acct)return;
  try{
    const r=await rpc('nn_my_ranks',{p_token:save.acct.token,p_ver:RANK_VER})||[];
    const best=Math.min(99,...r.map(x=>x.rank));
    const ex={r1:r.some(x=>x.cat===catKey('full')&&x.rank===1),top1:best===1,top2:best===2,top3:best===3};
    const was=JSON.stringify(save.excl);save.excl=ex;
    if(JSON.stringify(ex)!==was){persist();if(ex.top1||ex.r1)showToast('¡Eres el nº 1!','Tienes premios exclusivos en el taller');}
    if(!owns('flame',save.equip.flame))save.equip.flame='clasica';
    if(!owns('trail',save.equip.trail))save.equip.trail='nada';
    if(!owns('hat',save.equip.hat))save.equip.hat='nada';
  }catch(e){}
}
async function netChampion(){try{const r=await netBoard('full');return r&&r[0]?r[0]:null;}catch(e){return null;}}
