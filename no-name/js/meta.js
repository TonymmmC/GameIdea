'use strict';
// ============================================================
//  PROGRESO, TIENDA, LOGROS
// ============================================================
const SAVE_KEY='noname-save-v1';
// borrar progreso de la versión anterior (Torre de Ascua): todos empiezan de cero
try{localStorage.removeItem('torre-ascua-v1');}catch(e){}

function freshSave(){return{
  v:1,acct:null,
  opt:{sfx:8,mus:6,shake:true,timer:true,touch:1,flash:true},
  prog:{best:{},sparks:{},coins:{},cleared:{},last:0},
  brasas:0,owned:{flame:['clasica'],trail:['nada'],hat:['nada'],fx:['normal']},
  equip:{flame:'clasica',trail:'nada',hat:'nada',fx:'normal',title:''},
  ach:{},stats:{deaths:0,jumps:0,dashes:0,time:0,coins:0,candles:0,crust:0,melt:0,bosses:0,secrets:0},
  runs:{},excl:{},updated:0,
};}
let save=freshSave();
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.v===1)save=deepMerge(freshSave(),s);}catch(e){}
function deepMerge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')deepMerge(a[k],b[k]);else a[k]=b[k];}return a;}
let persistT=0;
function persist(){save.updated=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}
  clearTimeout(persistT);persistT=setTimeout(()=>{if(typeof netPushSave==='function')netPushSave();},2500);}

// ---------- catálogo de la tienda
// price: brasas · ach: se gana con un logro · excl: premio del ranking (se pierde si te quitan el puesto)
const SHOP={
  flame:[
    {id:'clasica',n:'Clásica',price:0,c:['#ff5a1f','#ffa53d','#fff1b8'],eye:'#3a0d12',g:'255,140,50'},
    {id:'azul',n:'Azul fría',price:120,c:['#2b6cff','#5ab0ff','#e0f4ff'],eye:'#0a1840',g:'90,160,255'},
    {id:'esmeralda',n:'Esmeralda',price:120,c:['#14a05a','#6ee08f','#e6ffe8'],eye:'#06301a',g:'90,230,140'},
    {id:'violeta',n:'Violeta',price:180,c:['#8a3dff','#c28bff','#f4e8ff'],eye:'#240a40',g:'180,120,255'},
    {id:'rosa',n:'Rosa chicle',price:180,c:['#ff3d8a','#ff8fc0','#fff0f6'],eye:'#40061c',g:'255,110,170'},
    {id:'ceniza',n:'Ceniza',price:260,c:['#5a5560','#9a94a0','#e8e4ec'],eye:'#1a1820',g:'200,200,210'},
    {id:'sangre',n:'Sangre de dragón',price:400,c:['#8a0a1e','#e0203a','#ffb0b8'],eye:'#ffd166',g:'230,40,60'},
    {id:'estelar',n:'Estelar',price:650,c:['#9fb0ff','#e2e8ff','#ffffff'],eye:'#1a1a40',g:'220,225,255',sparkle:1},
    {id:'arcoiris',n:'Arcoíris',price:1200,rainbow:1,c:['#ff5a1f','#ffa53d','#fff1b8'],eye:'#1a0a2a',g:'255,200,120'},
    {id:'sombra',n:'Sombra viva',ach:'sinmorir1',c:['#12081e','#3a1f5c','#9a6ad8'],eye:'#ff5470',g:'150,90,220'},
    {id:'escarcha',n:'Escarcha',ach:'crust50',c:['#bfe8ff','#e8f8ff','#ffffff'],eye:'#1e5a7a',g:'180,230,255'},
    {id:'corona',n:'Corona de ascuas',excl:'r1',c:['#ffb700','#ffe066','#fffbe0'],eye:'#6a3a00',g:'255,210,80',sparkle:1},
  ],
  trail:[
    {id:'nada',n:'Ninguna',price:0},
    {id:'chispas',n:'Chispas',price:90},
    {id:'humo',n:'Humo',price:120},
    {id:'pixel',n:'Píxeles',price:220},
    {id:'notas',n:'Notas',price:300},
    {id:'nieve',n:'Copos',ach:'boss4'},
    {id:'oro',n:'Estela de oro',excl:'top1'},
    {id:'plata',n:'Estela de plata',excl:'top2'},
    {id:'bronce',n:'Estela de bronce',excl:'top3'},
  ],
  hat:[
    {id:'nada',n:'Nada',price:0},
    {id:'lazo',n:'Lazo',price:100},
    {id:'cuernos',n:'Cuernos',price:180},
    {id:'papel',n:'Corona de papel',price:220},
    {id:'bruja',n:'Sombrero de bruja',price:320},
    {id:'aureola',n:'Aureola',price:350},
    {id:'vela',n:'Velita',ach:'candles100'},
    {id:'gorro',n:'Gorro de lana',price:260},
    {id:'real',n:'Corona real',excl:'r1'},
  ],
  fx:[
    {id:'normal',n:'Chispazo',price:0},
    {id:'ceniza',n:'Nube de ceniza',price:120},
    {id:'confeti',n:'Confeti',price:200},
    {id:'pixeles',n:'Estallido',price:240},
    {id:'fantasma',n:'Fantasmita',price:320},
  ],
};
const SHOP_CAT={flame:'Llamas',trail:'Estelas',hat:'Sombreros',fx:'Apagones'};
const shopItem=(cat,id)=>SHOP[cat].find(i=>i.id===id)||SHOP[cat][0];
function owns(cat,id){const it=shopItem(cat,id);if(it.excl)return !!save.excl[it.excl];return save.owned[cat].includes(id);}
function equipped(cat){const id=save.equip[cat];return owns(cat,id)?shopItem(cat,id):SHOP[cat][0];}

// ---------- logros
const ACH=[
  {id:'p1',n:'Primer chispazo',d:'Completa el piso 1-1',r:10},
  {id:'r1',n:'Cripta vencida',d:'Termina el Reino I',r:150,title:'Guardacriptas'},
  {id:'r2',n:'Fuego y escarcha',d:'Termina el Reino II',r:200,title:'Forjador'},
  {id:'boss1',n:'Silencio en el campanario',d:'Derrota a El Campanero',r:50},
  {id:'boss2',n:'Mecha cortada',d:'Derrota a Madre Cirio',r:80},
  {id:'boss3',n:'Deshielo',d:'Escapa de El Témpano',r:60},
  {id:'boss4',n:'Dos cabezas, cero',d:'Derrota a La Bicéfala',r:100,title:'Cazajefes'},
  {id:'intocable',n:'Intocable',d:'Derrota a un jefe sin perder ningún escudo',r:150,title:'Intocable'},
  {id:'limpio',n:'Pulcro',d:'Completa un piso largo sin morir',r:30},
  {id:'sinmorir1',n:'Luz perpetua',d:'Completa todo el Reino I en una carrera sin morir',r:400,title:'Inextinguible'},
  {id:'chispas1',n:'Buscachispas',d:'Todas las chispas doradas del Reino I',r:150},
  {id:'chispas2',n:'Ojo de forja',d:'Todas las chispas doradas del Reino II',r:200},
  {id:'monedas',n:'Hucha de brasas',d:'Recoge 300 brasas sueltas',r:50},
  {id:'muertes100',n:'Ceniza a ceniza',d:'Apágate 100 veces',r:20,title:'Terco'},
  {id:'muertes1k',n:'El que no se rinde',d:'Apágate 1000 veces',r:100,title:'Inmortal (casi)'},
  {id:'dash200',n:'Embestida',d:'Usa el impulso 200 veces',r:30},
  {id:'candles100',n:'Monaguillo',d:'Enciende 100 velas',r:40},
  {id:'crust50',n:'Pies fríos',d:'Congela 50 casillas de lava',r:60},
  {id:'secreto',n:'Paredes que hablan',d:'Encuentra un pasadizo secreto',r:20},
  {id:'lore',n:'Lector de ceniza',d:'Lee todos los pergaminos de la Fase 1',r:80,title:'Cronista'},
  {id:'veloz',n:'Relámpago',d:'Completa el piso 1-1 en menos de 30 s',r:40},
  {id:'carrera',n:'Carrera completa',d:'Termina el modo Carrera',r:250,title:'Corredor'},
  {id:'bossrush',n:'Sin respiro',d:'Termina el Desfile de Jefes',r:250,title:'Verdugo'},
  {id:'cuenta',n:'Con nombre propio',d:'Crea una cuenta',r:40},
  {id:'buzon',n:'Voz de la torre',d:'Envía un mensaje al buzón',r:25},
  {id:'compra',n:'Coqueta',d:'Compra algo en la tienda',r:10},
];
let achQueue=[];
function unlock(id){
  if(save.ach[id])return;const a=ACH.find(x=>x.id===id);if(!a)return;
  save.ach[id]=Date.now();save.brasas+=a.r;persist();
  achQueue.push(a);if(typeof showToast==='function')showToast('LOGRO · '+a.n,'+'+a.r+' brasas');sfx('ach');
}
function titles(){
  const t=ACH.filter(a=>a.title&&save.ach[a.id]).map(a=>a.title);
  for(const k in save.excl)if(save.excl[k]&&EXCL_TITLES[k])t.unshift(EXCL_TITLES[k]);
  return t;
}
const EXCL_TITLES={r1:'Leyenda de la torre',top1:'Campeón',top2:'Subcampeón',top3:'Podio'};
function checkStatAch(){
  const s=save.stats;
  if(s.deaths>=100)unlock('muertes100');if(s.deaths>=1000)unlock('muertes1k');
  if(s.dashes>=200)unlock('dash200');if(s.candles>=100)unlock('candles100');
  if(s.crust>=50)unlock('crust50');if(s.coins>=300)unlock('monedas');
}
