// Bot de verificación: juega cada nivel con el motor real mediante búsqueda en haz.
const fs=require('fs'),vm=require('vm');
const G=require('path').join(__dirname,'../no-name/js/')+'/';
const ctx={structuredClone,console,Math,Map,Set,JSON,Array,Object,String,Number,Infinity,isFinite,parseInt,Error,
  localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  matchMedia:()=>({matches:true}),setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>0,performance:{now:()=>0},
  document:{getElementById:()=>null},window:{}};
ctx.window=ctx;vm.createContext(ctx);
for(const f of['config.js','meta.js','audio.js','engine.js','levels.js'])vm.runInContext(fs.readFileSync(G+f,'utf8').replace(/^'use strict';/,''),ctx,{filename:f});
vm.runInContext(`
  var sfx=()=>{};var showHint=()=>{};var showToast=()=>{};var unlock=()=>{};var persist=()=>{};var checkStatAch=()=>{};
  var flameCols=()=>({c:['#f00','#f00','#f00']});var trailFx=()=>{};var deathFx=()=>{};var readNote=()=>{};var bakeLevel=()=>{};
  var puff=()=>{};
  var WON=false;var onLevelWon=()=>{WON=true;};
  function snapState(){const g=L.g,d=L.d,g0=L.g0;L.g=null;L.d=null;L.g0=null;const s=structuredClone({L,P});L.g=g;L.d=d;L.g0=g0;s.L.g=g;s.L.d=d;return s;}
  function loadState(s){const c=structuredClone({L:Object.assign({},s.L,{g:null,d:null}),P:s.P});c.L.g=s.L.g;c.L.d=s.L.d;L=c.L;P=c.P;parts.length=0;}
  function setup(i){L=loadLevel(i);resetDynamic();spawn();parts.length=0;WON=false;}
  function simAct(mx,j,dsh,steps){
    keys.left=mx<0;keys.right=mx>0;
    for(let s=0;s<steps;s++){
      if(s===0&&j!=='n')keys.jumpPressed=true;
      keys.jump=(j==='h'||(j==='t'&&s<3));
      if(s===0&&dsh)keys.dashPressed=true;
      step(STEP);parts.length=0;
      if(P.dead)return 'dead';
      if(WON||L.won)return 'won';
    }
    return 'ok';
  }
  function info(){return [P.x+P.w/2,P.y+P.h/2,[Math.round(P.x/3),Math.round(P.y/3),Math.round(P.vx/40),Math.round(P.vy/70),P.onGround?1:0,P.airJump,P.canDash?1:0,P.heat,L.keyCount,L.lever,L.phase,L.keys.filter(k=>k.taken).length,L.candles.map(c=>c.t>0?1:0).join(''),L.gotDash?1:0,L.doorOpen.filter(x=>x).length,L.melted.size,P.wings?1:0].join(','),hasDash(),L.time];}
  function exitOf(i){const l=loadLevel(i);return [l.exit.x,l.exit.y];}
`,ctx);
const run=c=>vm.runInContext(c,ctx);

// campo de distancias (Dijkstra sobre casillas) hacia un objetivo
const HAZ=new Set(['^','v','[',']']);
const SOFT=new Set(['D','Z','Y','R','B','g','x','_','C','Q','~','=','(',')','T']);
function field(d,tx,ty){
  const H=d.map.length,W=d.map[0].length,INF=1e9,dist=new Float64Array(W*H).fill(INF);
  const cost=(x,y)=>{const c=d.map[y][x];if(c==='#'||c==='I'||c==='<'||c==='>')return INF;if(HAZ.has(c))return INF;if(SOFT.has(c))return 3;return 1;};
  const q=[[tx,ty]];dist[ty*W+tx]=0;
  // BFS con costes pequeños (deque simple)
  const heap=[[0,tx,ty]];
  while(heap.length){heap.sort((a,b)=>b[0]-a[0]);const[dd,x,y]=heap.pop();if(dd>dist[y*W+x])continue;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const c=cost(nx,ny);if(c>=INF)continue;const nd=dd+c;if(nd<dist[ny*W+nx]){dist[ny*W+nx]=nd;heap.push([nd,nx,ny]);}}}
  return(px,py)=>{const x=Math.max(0,Math.min(W-1,Math.floor(px/16))),y=Math.max(0,Math.min(H-1,Math.floor(py/16)));let v=dist[y*W+x];
    if(v>=INF){let b=INF;for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0],[0,2],[1,1],[-1,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H)b=Math.min(b,dist[yy*W+xx]+1);}v=b;}
    return v;};
}
const ACTS=[];
for(const mx of[-1,0,1])for(const j of['n','h','t'])ACTS.push({mx,j,d:0});
for(const mx of[-1,1])for(const j of['n','h'])ACTS.push({mx,j,d:1});

function solve(i,opts){
  const d=run(`LEVELS[${i}]`);
  const W=opts.beam||160,MAXD=opts.maxDepth||2200,STEPS=opts.steps||10;
  const wps=(opts.wp||[]).concat([ctx.exitOf(i)]);
  const fields=wps.map(([x,y])=>field(d,x,y));
  ctx.setup(i);
  let beam=[{s:ctx.snapState(),w:0,h:0,path:[],dash:ctx.info()[3]}];
  const seen=new Set();let best=null;
  for(let depth=0;depth<MAXD;depth++){
    const cand=[];
    for(const b of beam){
      for(const a of ACTS){
        if(a.d&&!b.dash)continue;
        ctx.loadState(b.s);
        const r=ctx.simAct(a.mx,a.j,a.d,STEPS);
        if(r==='dead')continue;
        const I=ctx.info();
        if(r==='won'){return{ok:true,depth,time:I[4],path:b.path.concat(a)};}
        let w=b.w;
        const px=I[0],py=I[1];
        const wp=wps[w];if(wp&&w<wps.length-1&&Math.abs(px-(wp[0]*16+8))<14&&Math.abs(py-(wp[1]*16+8))<18)w++;
        const k=w+'|'+I[2];if(seen.has(k))continue;seen.add(k);
        const h=fields[w](px,py)-w*10000;
        cand.push({s:ctx.snapState(),w,h,path:b.path.concat(a),px,py,dash:I[3]});
      }
    }
    if(!cand.length)return{ok:false,depth,reason:'sin estados',best};
    cand.sort((a,b)=>a.h-b.h);
    // diversidad: limita estados por celda
    const per=new Map(),nb=[];
    for(const c of cand){const cell=c.w+':'+Math.floor(c.px/16)+':'+Math.floor(c.py/16);const n=per.get(cell)||0;if(n>=(opts.perCell||6))continue;per.set(cell,n+1);nb.push(c);if(nb.length>=W)break;}
    beam=nb;
    if(!best||beam[0].h<best.h)best={h:beam[0].h,x:(beam[0].px/16).toFixed(1),y:(beam[0].py/16).toFixed(1),w:beam[0].w,depth};
    if(opts.verbose&&depth%50===0)console.log('  d',depth,'h',beam[0].h.toFixed(1),'wp',beam[0].w,'pos',(beam[0].px/16).toFixed(1),(beam[0].py/16).toFixed(1),'seen',seen.size);
    if(seen.size>1.5e6)seen.clear();
  }
  return{ok:false,reason:'profundidad',best};
}
module.exports={solve,run};
if(require.main===module){
  const WP=require('./waypoints.js');
  const ids=process.argv.slice(2);const n=run('LEVELS.length');
  for(let i=0;i<n;i++){
    const d=run(`LEVELS[${i}]`);if(d.boss)continue;if(ids.length&&!ids.includes(d.id))continue;
    const t0=Date.now();const cfg=WP[d.id]||{};
    const r=solve(i,Object.assign({verbose:ids.length===1},cfg));
    console.log(`${d.id.padEnd(5)} ${r.ok?'OK   ':'FALLA'} ${r.ok?('t='+r.time.toFixed(1)+'s'):JSON.stringify(r.best)+' '+r.reason}  (${((Date.now()-t0)/1000).toFixed(0)}s)`);
    if(r.ok)fs.writeFileSync(__dirname+'/paths/'+d.id+'.json',JSON.stringify(r.path));
  }
}
