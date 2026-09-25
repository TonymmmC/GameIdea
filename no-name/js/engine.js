'use strict';
// ============================================================
//  MOTOR: niveles, física y mecánicas
// ============================================================
const TS=16,VW=384,VH=216,STEP=1/120;
const RUN=118,GRAV=950,JUMP=330,MAXFALL=380,SLIDE=65,WJX=140,WJY=315,SPRING=560,CONV=55,DASHV=300,DASHT=.16;
// dificultad única (fija): antes "Difícil"
const K={en:1.35,haz:1.3,lava:1.15,crumble:.32,orb:3,coyote:.075,buf:.1,candle:5,heat:3.2,cold:2.6,crust:2.4,bossSpd:1.15};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- reinos
const REALMS=[
 {name:'La Cripta de Ceniza',roman:'I',kind:'crypt',seed:11,sky:['#120b22','#2a1840'],far:'#23163a',near:'#170f28',stone:'#4b3d63',light:'#6f5c8c',dark:'#2a2140',cap:'#a58fcf',spike:'#e8dcf5',plank:'#8a6a4a',crumb:'#8d7aa8',tag:'#b59cff',root:57,bpm:92,
  lore:'Bajo la torre duermen los que se apagaron antes que tú. Sus velas aún recuerdan cómo arder.'},
 {name:'La Forja Escarchada',roman:'II',kind:'frost',seed:41,sky:['#08121f','#3a1620'],far:'#1a2638',near:'#0e1626',stone:'#4a4a5e',light:'#7a7a96',dark:'#23232f',cap:'#dff4ff',spike:'#e8f0ff',plank:'#7a5a3a',crumb:'#7a8aa0',tag:'#8fd8ff',root:52,bpm:100,
  lore:'Aquí el fuego y el hielo firmaron una tregua. Tú eres la brasa que viene a romperla.'},
 {name:'La Marea Negra',roman:'III',kind:'soon',seed:53,sky:['#04101a','#0a2a3a'],far:'#0c2230',near:'#081820',stone:'#2a4050',light:'#4a6a80',dark:'#142430',cap:'#6ad0d0',spike:'#d0f0f0',plank:'#4a5a60',crumb:'#5a7080',tag:'#3ad0c0',root:50,bpm:88,soon:1},
 {name:'El Observatorio Invertido',roman:'IV',kind:'soon',seed:67,sky:['#100a2a','#2a1a4a'],far:'#1a1440',near:'#100c2a',stone:'#4a4070',light:'#7a70a8',dark:'#241e40',cap:'#ffe6a0',spike:'#fff1e8',plank:'#6a5a8a',crumb:'#8a7ab0',tag:'#ffe066',root:55,bpm:96,soon:1},
 {name:'El Compás',roman:'V',kind:'soon',seed:83,sky:['#1a0a1a','#4a1a3a'],far:'#2a1030',near:'#1a0a20',stone:'#5a3a5a',light:'#8a5a8a',dark:'#2a1a2a',cap:'#ff8ad8',spike:'#ffe0f4',plank:'#8a5a6a',crumb:'#9a6a8a',tag:'#ff6fb5',root:57,bpm:120,soon:1},
 {name:'El Reloj de Arena',roman:'VI',kind:'soon',seed:97,sky:['#1a1408','#4a3a18'],far:'#2e2410',near:'#1c160a',stone:'#6a5a3c',light:'#9a8456',dark:'#3a3020',cap:'#e3c46e',spike:'#ece4cc',plank:'#8a6d3a',crumb:'#a38c62',tag:'#e3c46e',root:53,bpm:104,soon:1},
];

// ---------- estado
let L=null,P=null,shake=0;
const parts=[],cam={x:0,y:0};
const ov=(ax,ay,aw,ah,bx,by,bw,bh)=>ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
const shk=v=>{if(save.opt.shake&&!RM)shake=Math.max(shake,v);};
const EMBER=['#fff1b8','#ffd166','#ff8a3d','#ff5a1f'];
const FROST=['#ffffff','#dff4ff','#8fd8ff','#5ab0ff'];

// ---------- carga de nivel (mapas ASCII)
function loadLevel(i){
  const d=LEVELS[i],rows=d.map,H=rows.length,W=Math.max(...rows.map(r=>r.length));
  const g=rows.map(r=>r.padEnd(W,'.').split(''));
  const Lv={i,d,W,H,g,Z:REALMS[d.r],start:null,exit:null,spark:null,springs:[],orbs:[],plats:[],enemies:[],keys:[],cps:[],jets:[],glows:[],
    crumble:new Map(),thin:new Map(),crust:new Map(),burn:new Map(),doorOpen:[],doorGid:new Map(),keyCount:0,cp:null,snap:null,gotSpark:false,won:false,wonT:0,
    clock:0,hclock:0,time:0,deaths:0,lava:null,portals:[],cannons:[],balls:[],phase:0,pend:new Set(),hasToggle:false,lever:0,levers:[],pups:[],
    broken:new Set(),melted:new Set(),revealed:new Set(),slowT:0,boss:null,bossSpawn:null,exitOn:!d.boss,candles:[],ghostOf:new Map(),coins:[],notes:[],
    abil:d.abil||{},flipT:0,noteN:0,hitsTaken:0};
  let noteI=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=g[y][x],k=y*W+x;let clear=true;
    switch(c){
      case 'P':Lv.start={x,y};break;
      case 'E':Lv.exit={x,y};break;
      case '*':Lv.spark={x,y};break;
      case 'S':Lv.springs.push({x,y,a:0});break;
      case 'o':Lv.orbs.push({x,y,on:true,t:0});break;
      case 'K':Lv.keys.push({x,y,taken:false});break;
      case 'F':Lv.cps.push({x,y});break;
      case 'L':Lv.levers.push({x,y});break;
      case 'a':case 'd':case 'h':case 't':Lv.pups.push({x,y,k:c,taken:false});break;
      case '+':Lv.glows.push({x,y});break;
      case 'c':Lv.coins.push({x,y,taken:false,t:Math.random()*6});break;
      case 'n':Lv.notes.push({x,y,txt:(d.notes||[])[noteI]||'…',id:d.id+'#'+noteI,read:false});noteI++;break;
      case 'i':Lv.candles.push({x,y,t:0});break;
      case 'e':Lv.enemies.push({k:'w',x0:x*TS+2,y0:y*TS+6,w:12,h:10});break;
      case 'b':Lv.enemies.push({k:'b',x0:x*TS+2,y0:y*TS+4,w:12,h:8});break;
      case 'y':Lv.enemies.push({k:'y',x0:x*TS+2,y0:y*TS+4,w:12,h:12});break;
      case 'j':Lv.enemies.push({k:'j',x0:x*TS+2,y0:y*TS+6,w:12,h:10});break;
      case 'X':Lv.bossSpawn={x,y};break;
      case '1':case '2':case '3':case '4':Lv.portals.push({x,y,id:c});break;
      case 'C':Lv.crumble.set(k,{st:0,t:0});clear=false;break;
      case '_':Lv.thin.set(k,{st:0,t:0});clear=false;break;
      case 'R':case 'B':Lv.hasToggle=true;clear=false;break;
      case '<':case '>':Lv.cannons.push({x,y,dir:c==='<'?-1:1,off:((x*5+y*3)%5)*.4});clear=false;break;
      default:clear=false;
    }
    if(clear)g[y][x]='.';
  }
  // plataformas móviles
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x];
    if((c==='M'||c==='N')&&(x===0||g[y][x-1]!==c)){let n=0;while(x+n<W&&g[y][x+n]===c)n++;
      Lv.plats.push({ax:c==='M'?'x':'y',x0:x*TS,y0:y*TS,w:n*TS,sp:c==='M'?44:38,d0:c==='M'?1:-1});}}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='M'||g[y][x]==='N')g[y][x]='.';
  // chorros de fuego
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='T'){
    let r=0;while(r<3&&y-r-1>=0&&!'#ICD()T<>RBQZYx_g'.includes(g[y-r-1][x]))r++;
    Lv.jets.push({x,y,r,off:((x*7+y*3)%4)*.65});
  }
  // rejas: bloques contiguos de 'D'
  let gid=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='D'&&!Lv.doorGid.has(y*W+x)){
    const st=[[x,y]];Lv.doorGid.set(y*W+x,gid);
    while(st.length){const[cx,cy]=st.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;
      if(nx>=0&&ny>=0&&nx<W&&ny<H&&g[ny][nx]==='D'&&!Lv.doorGid.has(ny*W+nx)){Lv.doorGid.set(ny*W+nx,gid);st.push([nx,ny]);}}}
    Lv.doorOpen.push(false);gid++;
  }
  // bloques fantasma: cada grupo obedece a la vela más cercana
  // (una vela nunca controla el grupo sobre el que está apoyada)
  Lv.ghostGroups=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='g'&&!Lv.ghostOf.has(y*W+x)){
    const tiles=[],st=[[x,y]];Lv.ghostOf.set(y*W+x,-1);
    while(st.length){const[cx,cy]=st.pop();tiles.push([cx,cy]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;
      if(nx>=0&&ny>=0&&nx<W&&ny<H&&g[ny][nx]==='g'&&!Lv.ghostOf.has(ny*W+nx)){Lv.ghostOf.set(ny*W+nx,-1);st.push([nx,ny]);}}}
    const on=new Set(tiles.map(([a,b])=>b*W+a));
    let best=-1,bd=1e9;
    Lv.candles.forEach((c,ci)=>{if(on.has((c.y+1)*W+c.x))return;for(const[tx,ty]of tiles){const dd=Math.abs(c.x-tx)+Math.abs(c.y-ty)*1.2;if(dd<bd){bd=dd;best=ci;}}});
    for(const[tx,ty]of tiles)Lv.ghostOf.set(ty*W+tx,best);
    let sx=0,sy=0;for(const[tx,ty]of tiles){sx+=tx;sy+=ty;}
    Lv.ghostGroups.push({ci:best,x:sx/tiles.length,y:sy/tiles.length});
  }
  for(const p of Lv.portals)p.to=Lv.portals.find(q=>q!==p&&q.id===p.id)||null;
  if(d.rise)Lv.lava={y:H*TS+4,sp:d.rise*K.lava,delay:2.5};
  return Lv;
}
function tileAt(tx,ty){if(tx<0||tx>=L.W||ty<0)return '#';if(ty>=L.H)return '.';return L.g[ty][tx];}
const ghostLit=k=>{const ci=L.ghostOf.get(k);return ci>=0&&L.candles[ci].t>0;};
function solidAt(tx,ty){
  if(tx<0||tx>=L.W||ty<0)return true;if(ty>=L.H)return false;
  const c=L.g[ty][tx],k=ty*L.W+tx;
  switch(c){
    case '#':case 'I':case '(':case ')':case 'T':case '<':case '>':case 'W':return true;
    case 'C':return L.crumble.get(k).st<2;
    case '_':return L.thin.get(k).st<2;
    case 'D':return !L.doorOpen[L.doorGid.get(k)];
    case 'Q':return !L.broken.has(k);
    case 'x':return !L.melted.has(k);
    case 'g':return ghostLit(k)&&!L.pend.has(k);
    case '~':return L.crust.has(k);
    case 'Z':case 'Y':return (c==='Z')===(L.lever===0)&&!L.pend.has(k);
    case 'R':case 'B':return (c==='R')===(L.phase===0)&&!L.pend.has(k);
  }
  return false;
}
const isPlank=(tx,ty)=>tileAt(tx,ty)==='='&&!(L.burn.get(ty*L.W+tx)<0);
function snapshot(){return{kc:L.keyCount,taken:L.keys.map(k=>k.taken),doors:L.doorOpen.slice(),lever:L.lever,broken:[...L.broken],melted:[...L.melted],
  coins:L.coins.map(c=>c.taken),pups:L.pups.map(p=>p.taken),wings:P.wings,shield:P.shield};}
function resetDynamic(){
  L.enemies=L.enemies.filter(e=>!e.spawned);
  for(const e of L.enemies){e.x=e.x0;e.y=e.y0;e.vx=(e.k==='w'?-30:e.k==='b'?46:0)*K.en;e.vy=0;e.alive=true;e.t=Math.random()*2;e.cd=1+Math.random();}
  for(const p of L.plats){p.x=p.x0;p.y=p.y0;p.dir=p.d0;}
  L.crumble.forEach(c=>{c.st=0;c.t=0;});L.thin.forEach(c=>{c.st=0;c.t=0;});
  L.crust.clear();L.burn.clear();
  for(const o of L.orbs){o.on=true;o.t=0;}
  for(const c of L.candles)c.t=0;
  for(const c of L.cannons){c.t=(.8+c.off)/K.haz;c.flash=0;}
  L.balls.length=0;L.phase=0;L.pend.clear();L.slowT=0;
  const S=L.cp?L.snap:null;
  L.keyCount=S?S.kc:0;L.keys.forEach((k,i)=>k.taken=S?S.taken[i]:false);
  L.doorOpen=S?S.doors.slice():L.doorOpen.map(()=>false);
  L.lever=S?S.lever:0;L.broken=new Set(S?S.broken:[]);L.melted=new Set(S?S.melted:[]);
  L.coins.forEach((c,i)=>c.taken=S?S.coins[i]:false);
  L.pups.forEach((p,i)=>p.taken=S?S.pups[i]:false);
  if(L.d.boss&&!L.exitOn&&typeof makeBoss==='function')L.boss=makeBoss();
}
function spawn(){
  const s=L.cp||L.start,S=L.cp?L.snap:null;
  P={x:s.x*TS+3,y:(s.y+1)*TS-12,w:10,h:12,vx:0,vy:0,onGround:false,coyote:0,jumpBuf:0,lock:0,lockDir:0,airJump:0,face:1,dead:false,deadT:0,plat:null,
    canCut:false,cut:false,sq:0,wall:0,prevBottom:0,spawnT:.35,blink:2,dashT:0,invT:0,canDash:true,wings:S?S.wings:false,shield:S?S.shield:false,
    heat:0,heatT:0,trailT:0};
}
const hasDash=()=>!!(L.abil.dash||L.gotDash);

// ---------- colisiones
function moveX(o,dx){
  o.x+=dx;
  const t=Math.floor(o.y/TS),b=Math.floor((o.y+o.h-.01)/TS);
  if(dx>0){const tx=Math.floor((o.x+o.w-.001)/TS);for(let ty=t;ty<=b;ty++)if(solidAt(tx,ty)){o.x=tx*TS-o.w;return true;}}
  else if(dx<0){const tx=Math.floor(o.x/TS);for(let ty=t;ty<=b;ty++)if(solidAt(tx,ty)){o.x=(tx+1)*TS;return true;}}
  return false;
}
function moveY(o,dy,plats){
  const pb=o.y+o.h;o.y+=dy;o.platHit=null;
  const l=Math.floor(o.x/TS),r=Math.floor((o.x+o.w-.001)/TS);
  if(dy>0){
    const ty=Math.floor((o.y+o.h-.001)/TS);
    for(let tx=l;tx<=r;tx++){
      if(solidAt(tx,ty)||(isPlank(tx,ty)&&pb<=ty*TS+.5)){o.y=ty*TS-o.h;return 1;}
    }
    if(plats)for(const pl of L.plats){
      if(o.x+o.w>pl.x&&o.x<pl.x+pl.w&&pb<=pl.y+.5&&o.y+o.h>=pl.y){o.y=pl.y-o.h;o.platHit=pl;return 1;}
    }
  }else if(dy<0){
    const ty=Math.floor(o.y/TS);
    for(let tx=l;tx<=r;tx++)if(solidAt(tx,ty)){o.y=(ty+1)*TS;return -1;}
  }
  return 0;
}
function platBlock(tx,ty){if(tx<0||tx>=L.W||ty<0||ty>=L.H)return true;const c=L.g[ty][tx];return c==='|'||solidAt(tx,ty);}
function movePlat(pl,dt){
  const d=pl.sp*pl.dir*dt;
  if(pl.ax==='x'){
    const nx=pl.x+d,lead=pl.dir>0?Math.floor((nx+pl.w-.01)/TS):Math.floor(nx/TS);
    if(platBlock(lead,Math.floor(pl.y/TS))){pl.dir*=-1;return[0,0];}
    pl.x=nx;return[d,0];
  }
  const ny=pl.y+d,lead=pl.dir>0?Math.floor((ny+TS-.01)/TS):Math.floor(ny/TS);
  const l=Math.floor(pl.x/TS),r=Math.floor((pl.x+pl.w-.01)/TS);
  for(let tx=l;tx<=r;tx++)if(platBlock(tx,lead)){pl.dir*=-1;return[0,0];}
  pl.y=ny;return[0,d];
}
function wallAt(d){
  const tx=Math.floor((d>0?P.x+P.w+1:P.x-1)/TS);
  const t=Math.floor((P.y+2)/TS),b=Math.floor((P.y+P.h-2)/TS);
  for(let ty=t;ty<=b;ty++){const c=tileAt(tx,ty);if(solidAt(tx,ty)&&c!=='I'&&c!=='~')return true;}
  return false;
}
function groundInfo(){
  const ty=Math.floor((P.y+P.h+1)/TS),l=Math.floor(P.x/TS),r=Math.floor((P.x+P.w-.001)/TS);
  const c=Math.floor((P.x+P.w/2)/TS);let ice=false,conv=0;
  const cc=tileAt(c,ty);
  if(cc==='I')ice=true;if(cc==='(')conv=-1;if(cc===')')conv=1;
  for(let tx=l;tx<=r;tx++){
    const t=tileAt(tx,ty),k=ty*L.W+tx;
    if(!solidAt(c,ty)){if(t==='I')ice=true;if(t==='(')conv=-1;if(t===')')conv=1;}
    if(t==='C'){const cr=L.crumble.get(k);if(cr&&cr.st===0){cr.st=1;cr.t=K.crumble;}}
    if(t==='_'&&P.heat>0){const cr=L.thin.get(k);if(cr&&cr.st===0){cr.st=1;cr.t=.12;sfx('melt');}}
    if(t==='='&&P.heat>0&&!L.burn.has(k)){L.burn.set(k,.45);sfx('hot');}
  }
  return{ice,conv};
}
const jetOn=j=>((L.hclock+j.off)%2.6)<1;
const jetWarn=j=>((L.hclock+j.off)%2.6)>2.05;

// ---------- entrada (la llena ui.js)
const keys={left:false,right:false,up:false,down:false,jump:false,jumpPressed:false,dash:false,dashPressed:false};
function clearKeys(){for(const k in keys)keys[k]=false;}

// ---------- partículas
function puff(x,y,n,col,sp,life,g,size){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(sp||40)*(.3+Math.random()*.7);
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:(life||.5)*(.6+Math.random()*.6),max:life||.5,col:Array.isArray(col)?col[i%col.length]:col,g:g==null?0:g,s:size||1+(Math.random()*2|0)});}
}
function flipToggles(){
  if(!L.hasToggle)return;
  L.phase^=1;L.flipT=.18;sfx('tick');
  pendOverlap(c=>(c==='R'&&L.phase===0)||(c==='B'&&L.phase===1));
}
function pendOverlap(test){
  const l=Math.floor(P.x/TS),r=Math.floor((P.x+P.w-.001)/TS),t=Math.floor(P.y/TS),b=Math.floor((P.y+P.h-.001)/TS);
  for(let ty=t;ty<=b;ty++)for(let tx=l;tx<=r;tx++)if(test(tileAt(tx,ty),ty*L.W+tx))L.pend.add(ty*L.W+tx);
}
function flood(tx,ty,ch,set){
  const st=[[tx,ty]];set.add(ty*L.W+tx);
  while(st.length){const[x,y]=st.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*L.W+nx;
    if(nx>=0&&ny>=0&&nx<L.W&&ny<L.H&&L.g[ny][nx]===ch&&!set.has(k)){set.add(k);st.push([nx,ny]);}}}
}
function tryBreak(){
  const tx=Math.floor((P.face>0?P.x+P.w+1:P.x-1)/TS),t=Math.floor(P.y/TS),b=Math.floor((P.y+P.h-.01)/TS);
  for(let ty=t;ty<=b;ty++)if(tileAt(tx,ty)==='Q'&&!L.broken.has(ty*L.W+tx)){
    const grp=new Set();flood(tx,ty,'Q',grp);
    grp.forEach(k=>{L.broken.add(k);const x=k%L.W,y=(k/L.W)|0;puff(x*TS+8,y*TS+8,8,[L.Z.stone,L.Z.light,'#ffb13d'],90,.7,300,2);});
    sfx('break');shk(5);return true;
  }
  return false;
}
function flipLever(){
  L.lever^=1;sfx('lever');L.flipT=.18;
  pendOverlap(c=>(c==='Z'&&L.lever===0)||(c==='Y'&&L.lever===1));
}
function lightCandle(ci){
  const c=L.candles[ci],was=c.t>0;c.t=L.d.candleT||K.candle;
  if(!was){sfx('candle');save.stats.candles++;puff(c.x*TS+8,c.y*TS+6,12,EMBER,50,.5,-40,1);
    pendOverlap((ch,k)=>ch==='g'&&L.ghostOf.get(k)===ci);}
}
function setHeat(h){
  if(P.heat!==h){sfx(h>0?'hot':'cold');puff(P.x+P.w/2,P.y+P.h/2,14,h>0?EMBER:FROST,60,.5,0,1);}
  P.heat=h;P.heatT=h>0?K.heat:K.cold;
}
const PUP_TXT={a:'ALAS: tienes un salto extra en el aire',h:'ESCUDO: aguantas un golpe',t:'RELOJ: el mundo va más lento',d:'IMPULSO: pulsa SHIFT / X (o B en mando) para embestir. Rompe muros agrietados.'};
const tileCenter=()=>tileAt(Math.floor((P.x+P.w/2)/TS),Math.floor((P.y+P.h/2)/TS));

// ---------- simulación
function step(dt){
  L.clock+=dt;
  if(!L.won&&!P.dead)L.time+=dt;
  for(const pl of L.plats){const m=movePlat(pl,dt);if(P.plat===pl&&P.onGround&&!P.dead){if(m[0])moveX(P,m[0]);if(m[1])P.y+=m[1];}}
  L.crumble.forEach((c,k)=>{
    if(c.st===1){c.t-=dt;if(c.t<=0){c.st=2;c.t=2.6;const tx=k%L.W,ty=(k/L.W)|0;puff(tx*TS+8,ty*TS+8,10,[L.Z.crumb,L.Z.dark],50,.6,300,2);sfx('crumble');}}
    else if(c.st===2){c.t-=dt;if(c.t<=0){const tx=k%L.W,ty=(k/L.W)|0;if(P.dead||!ov(P.x,P.y,P.w,P.h,tx*TS,ty*TS,TS,TS))c.st=0;else c.t=.3;}}
  });
  L.thin.forEach((c,k)=>{if(c.st===1){c.t-=dt;if(c.t<=0){c.st=2;const tx=k%L.W,ty=(k/L.W)|0;puff(tx*TS+8,ty*TS+8,12,FROST,60,.6,300,2);}}});
  L.crust.forEach((t,k)=>{t-=dt;if(t<=0){L.crust.delete(k);const tx=k%L.W,ty=(k/L.W)|0;puff(tx*TS+8,ty*TS+6,5,EMBER,30,.4,-20,1);}else L.crust.set(k,t);});
  // tablas: >0 ardiendo (aún sólida) · <0 quemada (vuelve a crecer)
  L.burn.forEach((t,k)=>{const tx=k%L.W,ty=(k/L.W)|0;
    if(t>0){t-=dt;if(Math.random()<.4)puff(tx*TS+Math.random()*16,ty*TS+2,1,EMBER,20,.4,-40,1);
      if(t<=0){t=-4;puff(tx*TS+8,ty*TS+2,6,['#3a2010','#8a8288'],30,.6,100,1);}L.burn.set(k,t);}
    else{t+=dt;if(t>=0&&!(ov(P.x,P.y,P.w,P.h,tx*TS,ty*TS,TS,4)))L.burn.delete(k);else L.burn.set(k,Math.min(t,-.01));}});
  for(const c of L.candles)if(c.t>0){c.t-=dt;if(c.t<=0){c.t=0;sfx('candleout');puff(c.x*TS+8,c.y*TS+5,6,['#8a8290','#5a5460'],20,.8,-30,1);}}
  for(const o of L.orbs)if(!o.on){o.t-=dt;if(o.t<=0)o.on=true;}
  for(const s of L.springs)if(s.a>0)s.a-=dt;
  for(const c of L.coins)c.t+=dt;
  const ws=L.slowT>0?.45:1;
  if(L.slowT>0){const a=Math.ceil(L.slowT);L.slowT-=dt;if(Math.ceil(L.slowT)!==a)sfx('tick');}
  L.hclock+=dt*ws*K.haz;
  if(L.lava&&!L.won){if(L.lava.delay>0)L.lava.delay-=dt;else L.lava.y-=L.lava.sp*dt*ws;}
  if(L.flipT>0)L.flipT-=dt;
  for(const c of L.cannons){
    c.flash-=dt;c.t-=dt*ws;
    if(c.t<=0){c.t=2.2/K.haz;c.flash=.12;L.balls.push({x:c.x*TS+8+c.dir*10,y:c.y*TS+8,vx:c.dir*95*Math.sqrt(K.haz)});
      if(Math.abs(c.x*TS-(cam.x+VW/2))<VW*.7&&Math.abs(c.y*TS-(cam.y+VH/2))<VH)sfx('cannon');}
  }
  for(let i=L.balls.length-1;i>=0;i--){
    const b=L.balls[i];b.vy=(b.vy||0)+(b.g||0)*dt*ws;b.x+=b.vx*dt*ws;b.y+=b.vy*dt*ws;if(b.life!=null){b.life-=dt;if(b.life<=0){L.balls.splice(i,1);continue;}}
    const tx=Math.floor(b.x/TS),ty=Math.floor(b.y/TS);
    if(b.x<-40||b.x>L.W*TS+40||b.y<-80||b.y>L.H*TS+20||(!b.ghost&&tx>=0&&tx<L.W&&solidAt(tx,ty))){
      if(b.onHit)b.onHit(b);else puff(b.x,b.y,5,b.col?[b.col,'#fff']:EMBER,40,.3,0,1);L.balls.splice(i,1);}
  }
  if(L.pend.size)L.pend.forEach(k=>{const tx=k%L.W,ty=(k/L.W)|0;if(P.dead||!ov(P.x,P.y,P.w,P.h,tx*TS,ty*TS,TS,TS))L.pend.delete(k);});
  for(const e of L.enemies)if(e.alive)updEnemy(e,dt*ws);
  if(L.boss&&!L.won&&typeof updBoss==='function')updBoss(dt*ws*K.bossSpd);
  if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn();return;}
  if(L.won){L.wonT+=dt;if(L.wonT>1.1&&typeof onLevelWon==='function')onLevelWon();return;}
  updPlayer(dt);
  if(!P.dead)interactions();
}
function updPlayer(dt){
  if(P.spawnT>0)P.spawnT-=dt;
  let ix=(keys.right?1:0)-(keys.left?1:0);
  if(P.lock>0){P.lock-=dt;ix=P.lockDir;}
  if(keys.jumpPressed){P.jumpBuf=K.buf;keys.jumpPressed=false;}
  if(P.invT>0)P.invT-=dt;
  if(P.dashCD>0)P.dashCD-=dt;
  if(P.heat){P.heatT-=dt;if(P.heatT<=0){P.heat=0;}
    else if(Math.random()<.35)parts.push({x:P.x+Math.random()*P.w,y:P.y+Math.random()*P.h,vx:0,vy:P.heat>0?-30:10,life:.4,max:.4,col:(P.heat>0?EMBER:FROST)[Math.random()*4|0],g:0,s:1});}
  if(keys.dashPressed){keys.dashPressed=false;
    if(hasDash()&&P.canDash&&P.dashT<=0&&!(P.dashCD>0)){P.dashT=DASHT;P.dashCD=DASHT+.35;P.canDash=false;P.vx=P.face*DASHV;P.vy=0;P.lock=0;sfx('dash');shk(1.5);save.stats.dashes++;}}
  const gi=P.onGround?groundInfo():{ice:false,conv:0};
  let acc,dec;
  if(P.onGround){acc=gi.ice?300:1500;dec=gi.ice?110:1800;}else{acc=1100;dec=650;}
  if(P.dashT>0){P.dashT-=dt;if(Math.random()<.9)parts.push({x:P.x+P.w/2,y:P.y+P.h/2,vx:0,vy:0,life:.25,max:.25,col:flameCols().c[1],g:0,s:3});}
  else if(ix){if(P.vx*ix<0&&!gi.ice)acc*=1.6;P.vx=approach(P.vx,ix*RUN,acc*dt);P.face=ix;}
  else P.vx=approach(P.vx,0,dec*dt);
  P.jumpBuf-=dt;
  if(P.onGround){P.coyote=K.coyote;P.canDash=true;}else P.coyote-=dt;
  P.wall=P.onGround?0:(wallAt(1)?1:wallAt(-1)?-1:0);
  if(P.wall&&P.dashT<=0)P.canDash=true;
  if(P.jumpBuf>0){
    if(P.coyote>0)doJump();
    else if(P.wall){P.vx=-P.wall*WJX;P.vy=-WJY;P.lock=.13;P.lockDir=-P.wall;P.face=-P.wall;P.jumpBuf=0;P.canCut=true;P.cut=false;P.sq=-1;sfx('wall');flipToggles();save.stats.jumps++;
      puff(P.x+(P.wall>0?P.w:0),P.y+P.h/2,6,'#e8dcf5',40,.3,0,1);}
    else if(P.airJump>0){P.airJump--;doJump(true);}
  }
  if(!keys.jump&&P.canCut&&!P.cut&&P.vy<0){P.vy*=.45;P.cut=true;}
  if(P.dashT>0)P.vy=0;else P.vy+=GRAV*dt;
  const tc=tileCenter();
  if(tc==='w'){P.vy-=2300*dt;if(P.vy<-210)P.vy=-210;P.canCut=false;if(Math.random()<.15)puff(P.x+P.w/2,P.y+P.h,1,'rgba(220,255,240,.8)',20,.4,-60,1);}
  if(tc==='V'&&P.heat<=0)setHeat(1);else if(tc==='V')P.heatT=K.heat;
  if(tc==='f'&&P.heat>=0)setHeat(-1);else if(tc==='f')P.heatT=K.cold;
  if(P.wall&&ix===P.wall&&P.vy>SLIDE){P.vy=SLIDE;if(Math.random()<.3)puff(P.x+(P.wall>0?P.w:0),P.y+P.h,1,'#cbb8ff',10,.3,0,1);}
  if(P.vy>MAXFALL)P.vy=MAXFALL;
  // frío: la lava bajo los pies se vuelve costra
  if(P.heat<0&&P.vy>=0){
    const ty=Math.floor((P.y+P.h+P.vy*dt+1)/TS),l=Math.floor((P.x-2)/TS),r=Math.floor((P.x+P.w+1)/TS);
    for(let tx=l;tx<=r;tx++){if(tileAt(tx,ty)==='~'&&tileAt(tx,ty-1)!=='~'){const k=ty*L.W+tx;
      if(!L.crust.has(k)){save.stats.crust++;sfx('crust');puff(tx*TS+8,ty*TS+2,6,['#4a3a3a','#2a2020','#8fd8ff'],30,.4,0,1);}L.crust.set(k,K.crust);}}
  }
  const cx=P.onGround&&gi.conv?gi.conv*CONV:0;
  if(moveX(P,(P.vx+cx)*dt)){if(!(P.dashT>0&&tryBreak()))P.vx=0;}
  P.prevBottom=P.y+P.h;
  const wasG=P.onGround,fall=P.vy;
  const res=moveY(P,P.vy*dt,true);
  if(res===1){
    if(!wasG&&fall>150){P.sq=Math.min(1,fall/380);puff(P.x+P.w/2,P.y+P.h,5,'#d8c8b8',30,.35,0,1);sfx('land');}
    P.vy=0;P.onGround=true;P.plat=P.platHit;P.airJump=P.wings?1:0;P.canCut=false;P.canDash=true;
  }else{P.onGround=false;P.plat=null;if(res===-1)P.vy=0;}
  P.sq*=Math.pow(.0005,dt);
  // caliente: derrite la escarcha que tocas
  if(P.heat>0){
    const l=Math.floor((P.x-1)/TS),r=Math.floor((P.x+P.w+1)/TS),t=Math.floor((P.y-1)/TS),b=Math.floor((P.y+P.h+1)/TS);
    for(let ty=t;ty<=b;ty++)for(let tx=l;tx<=r;tx++)if(tileAt(tx,ty)==='x'&&!L.melted.has(ty*L.W+tx)){
      const grp=new Set();flood(tx,ty,'x',grp);
      grp.forEach(k=>{L.melted.add(k);const x=k%L.W,y=(k/L.W)|0;puff(x*TS+8,y*TS+8,6,['#dff4ff','#8fd8ff','#ffffff'],50,.6,120,2);});
      sfx('melt');save.stats.melt++;
    }
  }
  if(Math.random()<(Math.abs(P.vx)>20||!P.onGround?.5:.15))parts.push({x:P.x+P.w/2+(Math.random()*6-3),y:P.y+2,vx:(Math.random()-.5)*10-P.vx*.1,vy:-20-Math.random()*25,life:.45,max:.45,col:flameCols().c[Math.random()*3|0],g:-10,s:1});
  trailFx(dt);
}
function doJump(air){
  P.vy=-JUMP;P.jumpBuf=0;P.coyote=0;P.onGround=false;P.plat=null;P.canCut=true;P.cut=false;P.sq=-1;flipToggles();save.stats.jumps++;
  if(air){sfx('air');puff(P.x+P.w/2,P.y+P.h,10,['#8ff7ff','#ffffff'],60,.4,0,1);}
  else{sfx('jump');puff(P.x+P.w/2,P.y+P.h,4,'#d8c8b8',25,.3,0,1);}
}
function updEnemy(e,dt){
  e.t+=dt;
  if(e.k==='w'){
    e.vy=Math.min(e.vy+GRAV*dt,MAXFALL);
    const mx=Math.floor((e.vx>0?e.x+e.w+1:e.x-1)/TS),my=Math.floor((e.y+e.h/2)/TS);
    if(tileAt(mx,my)==='|')e.vx*=-1;
    if(moveX(e,e.vx*dt))e.vx*=-1;
    if(moveY(e,e.vy*dt,false)===1){
      e.vy=0;
      const tx=Math.floor((e.vx>0?e.x+e.w+1:e.x-1)/TS),ty=Math.floor((e.y+e.h+2)/TS);
      if(!(solidAt(tx,ty)||tileAt(tx,ty)==='='))e.vx*=-1;
    }
  }else if(e.k==='b'){
    const nx=e.x+e.vx*dt,lead=Math.floor((e.vx>0?nx+e.w:nx)/TS),row=Math.floor((e.y0+4)/TS);
    if(solidAt(lead,row)||tileAt(lead,row)==='|')e.vx*=-1;else e.x=nx;
    e.y=e.y0+Math.sin(e.t*2.6)*8;
  }else if(e.k==='y'){
    // gárgola: escupe brasas en arco hacia ti
    e.cd-=dt;const px=P.x+P.w/2,py=P.y+P.h/2,ex=e.x+6,ey=e.y+4;
    e.face=px<ex?-1:1;
    if(e.cd<=0&&Math.abs(px-ex)<TS*11&&Math.abs(py-ey)<TS*7&&!P.dead){
      e.cd=2.3/K.haz;const T=.9,vx=(px-ex)/T,vy=(py-ey)/T-.5*420*T;
      L.balls.push({x:ex,y:ey,vx:Math.max(-160,Math.min(160,vx)),vy:Math.max(-330,vy),g:420});e.flash=.15;sfx('cannon');
    }
    if(e.flash>0)e.flash-=dt;
  }else if(e.k==='j'){
    // saltarín: brinca hacia ti
    e.vy=Math.min(e.vy+GRAV*dt,MAXFALL);
    if(moveX(e,e.vx*dt))e.vx*=-1;
    const r=moveY(e,e.vy*dt,false);
    if(r===1){e.vy=0;e.vx=0;e.cd-=dt;const d=P.x-e.x;
      if(e.cd<=0&&Math.abs(d)<TS*9){e.cd=1.2;e.vy=-300;e.vx=Math.sign(d)*80*K.en;}}
  }
  if(e.y>L.H*TS+30)e.alive=false;
  if(L.lava&&e.y+e.h>L.lava.y)e.alive=false;
}
const PORTAL_COL={'1':'#ffd166','2':'#5ad1ff','3':'#ff6fb5','4':'#8ef07a'};
const HZ={'^':[2,9,12,7],'v':[2,0,12,7],']':[0,2,7,12],'[':[9,2,7,12],'~':[0,5,16,11]};
function interactions(){
  const hx=P.x+1,hy=P.y+2,hw=P.w-2,hh=P.h-3;
  const l=Math.floor(hx/TS),r=Math.floor((hx+hw)/TS),t=Math.floor(hy/TS),b=Math.floor((hy+hh)/TS);
  for(let ty=t;ty<=b;ty++)for(let tx=l;tx<=r;tx++){
    const c=tileAt(tx,ty),R=HZ[c];
    if(c==='~'&&L.crust.has(ty*L.W+tx))continue;
    if(R&&ov(hx,hy,hw,hh,tx*TS+R[0],ty*TS+R[1],R[2],R[3]))return die(c==='~');
  }
  if(P.y>L.H*TS+24)return die(true);
  for(const j of L.jets)if(j.r>0&&jetOn(j)&&ov(hx,hy,hw,hh,j.x*TS+3,(j.y-j.r)*TS+2,10,j.r*TS-2))return die();
  if(L.lava&&P.y+P.h>L.lava.y+3)return die(true);
  for(const bl of L.balls)if(!bl.safe&&ov(hx,hy,hw,hh,bl.x-(bl.r||3),bl.y-(bl.r||3),(bl.r||3)*2,(bl.r||3)*2))return die();
  if(L.boss&&typeof bossTouch==='function'&&bossTouch())return;
  for(const e of L.enemies){
    if(!e.alive||!ov(P.x,P.y,P.w,P.h,e.x,e.y,e.w,e.h))continue;
    if(P.vy>0&&P.prevBottom<=e.y+6){
      e.alive=false;P.vy=keys.jump?-360:-250;P.canCut=false;P.onGround=false;P.canDash=true;
      puff(e.x+e.w/2,e.y+e.h/2,16,['#1a1024','#3d2a55','#ff5470'],70,.6,200,2);sfx('stomp');shk(2);
    }else return die();
  }
  for(const s of L.springs){
    if(P.vy>=0&&ov(P.x,P.y,P.w,P.h,s.x*TS+2,s.y*TS+9,12,7)){
      P.vy=-SPRING;P.canCut=false;P.onGround=false;P.coyote=0;P.plat=null;P.sq=-1;s.a=.3;P.canDash=true;sfx('spring');
      puff(s.x*TS+8,s.y*TS+12,8,'#ffd166',50,.4,0,1);
    }
  }
  const pcx=P.x+P.w/2,pcy=P.y+P.h/2;
  for(const p of L.portals){
    if(!p.to)continue;const d=dist(pcx,pcy,p.x*TS+8,p.y*TS+8);
    if(P.portalLock===p){if(d>12)P.portalLock=null;continue;}
    if(d<8){const q=p.to;puff(pcx,pcy,14,PORTAL_COL[p.id],60,.5,0,1);
      P.x=q.x*TS+8-P.w/2;P.y=q.y*TS+8-P.h/2;P.portalLock=q;P.onGround=false;P.plat=null;
      puff(q.x*TS+8,q.y*TS+8,14,PORTAL_COL[p.id],60,.5,0,1);sfx('portal');return;}
  }
  for(const o of L.orbs)if(o.on&&dist(pcx,pcy,o.x*TS+8,o.y*TS+8)<13){
    o.on=false;o.t=K.orb;P.airJump=Math.max(P.airJump,1);P.canDash=true;P.dashCD=0;sfx('orb');puff(o.x*TS+8,o.y*TS+8,14,['#8ff7ff','#ffffff','#5ad1ff'],60,.5,0,1);
  }
  for(const c of L.coins)if(!c.taken&&dist(pcx,pcy,c.x*TS+8,c.y*TS+8)<11){c.taken=true;sfx('coin');puff(c.x*TS+8,c.y*TS+8,6,EMBER,40,.35,0,1);}
  L.candles.forEach((c,ci)=>{if(dist(pcx,pcy,c.x*TS+8,c.y*TS+8)<12&&P.heat>=0){if(c.t<(L.d.candleT||K.candle)-.3||c.t<=0)lightCandle(ci);}});
  if(L.spark&&!L.gotSpark&&dist(pcx,pcy,L.spark.x*TS+8,L.spark.y*TS+8)<12){
    L.gotSpark=true;sfx('spark');puff(L.spark.x*TS+8,L.spark.y*TS+8,22,['#ffd166','#fff1b8','#ffffff'],80,.8,0,1);
    showHint('Chispa dorada encontrada',2.2);
  }
  for(const n of L.notes)if(dist(pcx,pcy,n.x*TS+8,n.y*TS+8)<12){if(P.noteLock!==n){P.noteLock=n;readNote(n);}}else if(P.noteLock===n)P.noteLock=null;
  for(const k of L.keys)if(!k.taken&&dist(pcx,pcy,k.x*TS+8,k.y*TS+8)<12){
    k.taken=true;L.keyCount++;sfx('key');puff(k.x*TS+8,k.y*TS+8,20,['#9ff0ff','#ffd166','#ffffff'],70,.7,0,1);
    const left=L.keys.filter(q=>!q.taken).length;
    showHint(left?`Llave ${L.keys.length-left}/${L.keys.length} · cada llave abre una reja`:'Tienes todas las llaves',2.4);
  }
  if(L.doorOpen.length){
    const l2=Math.floor((P.x-2)/TS),r2=Math.floor((P.x+P.w+2)/TS),t2=Math.floor((P.y-2)/TS),b2=Math.floor((P.y+P.h+1)/TS);
    for(let ty=t2;ty<=b2;ty++)for(let tx=l2;tx<=r2;tx++){
      if(tileAt(tx,ty)!=='D')continue;const g=L.doorGid.get(ty*L.W+tx);
      if(!L.doorOpen[g]){
        if(L.keyCount>0){L.keyCount--;L.doorOpen[g]=true;sfx('door');
          L.doorGid.forEach((v,k)=>{if(v===g)puff((k%L.W)*TS+8,((k/L.W)|0)*TS+8,5,['#a99fb8','#ffd166'],50,.6,200,2);});}
        else if(!P.lockHint){P.lockHint=true;showHint('Reja cerrada: necesitas una llave',1.8);}
      }
    }
  }
  for(const lv of L.levers){
    const on=ov(P.x,P.y,P.w,P.h,lv.x*TS+2,lv.y*TS+4,12,12);
    if(on&&P.leverLock!==lv){P.leverLock=lv;flipLever();puff(lv.x*TS+8,lv.y*TS+8,8,['#ffd166','#3ee0c0'],40,.4,0,1);}
    else if(!on&&P.leverLock===lv)P.leverLock=null;
  }
  {const l3=Math.floor(P.x/TS),r3=Math.floor((P.x+P.w-.01)/TS),t3=Math.floor(P.y/TS),b3=Math.floor((P.y+P.h-.01)/TS);
    for(let ty=t3;ty<=b3;ty++)for(let tx=l3;tx<=r3;tx++)if(tileAt(tx,ty)==='H'&&!L.revealed.has(ty*L.W+tx)){
      flood(tx,ty,'H',L.revealed);sfx('pup');showHint('Un pasadizo secreto',1.8);save.stats.secrets++;unlock('secreto');}}
  for(const p of L.pups)if(!p.taken&&dist(pcx,pcy,p.x*TS+8,p.y*TS+8)<12){
    p.taken=true;sfx('pup');puff(p.x*TS+8,p.y*TS+8,18,['#ffffff','#ffd166','#8ff7ff'],70,.6,0,1);
    if(p.k==='a'){P.wings=true;P.airJump=Math.max(P.airJump,1);}
    else if(p.k==='d'){L.gotDash=true;P.canDash=true;}
    else if(p.k==='h')P.shield=true;
    else if(p.k==='t')L.slowT=6;
    showHint(PUP_TXT[p.k],p.k==='d'?5:2.6);
  }
  for(const c of L.cps)if(ov(P.x,P.y,P.w,P.h,c.x*TS,c.y*TS,TS,TS)){
    if(L.cp===c)continue;
    L.cp=c;L.snap=snapshot();sfx('cp');puff(c.x*TS+8,c.y*TS+4,16,EMBER,60,.7,-40,1);showHint('Brasero encendido',1.6);
  }
  const E=L.exit;
  if(E&&L.exitOn&&ov(P.x,P.y,P.w,P.h,E.x*TS+2,E.y*TS-4,12,20))win();
}
function readNote(n){
  sfx('note');showHint('📜 '+n.txt,Math.max(4,n.txt.length/14));
  save.prog.notes=save.prog.notes||{};
  if(!save.prog.notes[n.id]){save.prog.notes[n.id]=1;persist();
    const total=LEVELS.reduce((a,l)=>a+(l.map.join('').split('n').length-1),0);
    if(Object.keys(save.prog.notes).length>=total)unlock('lore');}
}
function die(fatal){
  if(P.dead||L.won)return;
  if(!fatal&&P.invT>0)return;
  if(!fatal&&P.shield){P.shield=false;P.invT=1.2;P.vy=-260;P.canCut=false;sfx('shield');shk(3);L.hitsTaken++;
    puff(P.x+P.w/2,P.y+P.h/2,24,['#8ff7ff','#ffffff','#5ad1ff'],90,.6,0,2);return;}
  P.dead=true;P.deadT=.75;L.deaths++;L.hitsTaken++;save.stats.deaths++;checkStatAch();
  sfx('die');shk(6);deathFx();
  if(typeof onDeath==='function')onDeath();
}
function respawn(){
  if(L.d.boss){L.cp=null;}
  resetDynamic();
  if(L.lava){
    const base=L.H*TS+4;
    if(L.cp)L.lava.y=Math.min(base,Math.max(L.lava.y,(L.cp.y+7)*TS));else L.lava.y=base;
    L.lava.delay=2;
  }
  spawn();
  if(L.boss&&typeof bossRespawn==='function')bossRespawn();
}
function win(){
  if(L.won)return;
  L.won=true;L.wonT=0;P.vx=0;sfx('win');
  const E=L.exit;puff(E.x*TS+8,E.y*TS-2,40,['#ffd166','#fff1b8','#ff8a3d','#ffffff'],120,1.2,-30,2);
}
