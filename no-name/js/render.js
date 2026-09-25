'use strict';
// ============================================================
//  RENDER
// ============================================================
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;window.__ctx=ctx;
const mkc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const darkCv=mkc(VW,VH),dctx=darkCv.getContext('2d');
let XC=null;// contexto alternativo (vistas previas)
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0;};

// ---------- cosméticos
function flameCols(){
  const s=equipped('flame');
  if(!s.rainbow)return s;
  const h=(performance.now()/8)%360;
  return{eye:s.eye,g:'255,220,180',c:[`hsl(${h|0},95%,55%)`,`hsl(${(h+50)%360|0},95%,68%)`,'#ffffff']};
}
function trailFx(dt){
  const t=equipped('trail').id;if(t==='nada')return;
  P.trailT-=dt;if(P.trailT>0)return;P.trailT=Math.abs(P.vx)>30||!P.onGround?.03:.12;
  const x=P.x+P.w/2,y=P.y+P.h-3;
  const add=(col,vx,vy,life,g,s)=>parts.push({x:x+(Math.random()*6-3),y,vx,vy,life,max:life,col,g,s});
  switch(t){
    case 'chispas':add(EMBER[Math.random()*4|0],(Math.random()-.5)*30,-40-Math.random()*30,.5,160,1);break;
    case 'humo':add('rgba(160,150,170,.55)',(Math.random()-.5)*6,-12,1,-8,2);break;
    case 'pixel':add(['#ff5470','#ffd166','#5ad1ff','#8ef07a'][Math.random()*4|0],0,0,.6,0,2);break;
    case 'notas':if(Math.random()<.3)add('#ffffff',-P.face*10,-20,.8,0,2);break;
    case 'nieve':add('#ffffff',(Math.random()-.5)*10,10,.9,10,1);break;
    case 'oro':add(['#ffd166','#fff1b8','#ffb700'][Math.random()*3|0],(Math.random()-.5)*10,-10,.7,0,Math.random()<.3?2:1);break;
    case 'plata':add(['#e8ecf4','#b8c0cc','#ffffff'][Math.random()*3|0],(Math.random()-.5)*10,-10,.7,0,Math.random()<.3?2:1);break;
    case 'bronce':add(['#d08a4a','#a86a30','#f0b070'][Math.random()*3|0],(Math.random()-.5)*10,-10,.7,0,Math.random()<.3?2:1);break;
  }
}
function deathFx(){
  const x=P.x+P.w/2,y=P.y+P.h/2,fc=flameCols().c;
  switch(equipped('fx').id){
    case 'ceniza':puff(x,y,40,['#4a4450','#6a6470','#2a2430','#8a8490'],70,1.4,-30,2);break;
    case 'confeti':puff(x,y,50,['#ff5470','#ffd166','#5ad1ff','#8ef07a','#c28bff'],140,1.2,260,2);break;
    case 'pixeles':for(let i=0;i<16;i++){const a=i/16*Math.PI*2;parts.push({x,y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,life:.6,max:.6,col:fc[i%3],g:0,s:3});}break;
    case 'fantasma':parts.push({x,y,vx:0,vy:-30,life:1.3,max:1.3,col:'ghost',g:0,s:1});puff(x,y,14,fc,60,.6,0,1);break;
    default:puff(x,y,34,[...fc,'#ffffff'],110,.9,120,2);
  }
}
function drawHat(id,t){
  const ctx=XC||window.__ctx;
  // coordenadas relativas a la base de la llama (0,0) mirando a P.face
  switch(id){
    case 'lazo':ctx.fillStyle='#ff3d8a';ctx.fillRect(-5,-17,4,3);ctx.fillRect(1,-17,4,3);ctx.fillStyle='#ffb0d0';ctx.fillRect(-1,-16,2,2);break;
    case 'cuernos':ctx.fillStyle='#e8dcc8';ctx.fillRect(-6,-15,2,3);ctx.fillRect(-7,-17,2,2);ctx.fillRect(4,-15,2,3);ctx.fillRect(5,-17,2,2);break;
    case 'papel':ctx.fillStyle='#ffd166';ctx.fillRect(-5,-18,10,3);ctx.fillRect(-5,-20,2,2);ctx.fillRect(-1,-21,2,3);ctx.fillRect(3,-20,2,2);break;
    case 'bruja':ctx.fillStyle='#2a1a3a';ctx.fillRect(-8,-15,16,2);ctx.fillRect(-4,-19,8,4);ctx.fillRect(-2,-23,5,4);ctx.fillRect(1,-25,3,2);ctx.fillStyle='#8a3dff';ctx.fillRect(-4,-16,8,1);break;
    case 'aureola':ctx.strokeStyle=`rgba(255,230,140,${.7+Math.sin(t*4)*.2})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-22,6,2,0,0,7);ctx.stroke();ctx.lineWidth=1;break;
    case 'vela':ctx.fillStyle='#f4e8da';ctx.fillRect(-2,-22,4,6);ctx.fillStyle='#ffd166';ctx.fillRect(-1,-25+Math.sin(t*20),2,3);break;
    case 'gorro':ctx.fillStyle='#d93a3a';ctx.fillRect(-6,-17,12,4);ctx.fillRect(-4,-20,8,3);ctx.fillStyle='#fff';ctx.fillRect(-6,-14,12,2);ctx.fillRect(-1,-22,3,3);break;
    case 'real':ctx.fillStyle='#ffb700';ctx.fillRect(-6,-18,12,3);ctx.fillRect(-6,-21,2,3);ctx.fillRect(-1,-22,2,4);ctx.fillRect(4,-21,2,3);ctx.fillStyle='#ff3d5a';ctx.fillRect(-1,-17,2,1);ctx.fillStyle='#5ad1ff';ctx.fillRect(-5,-17,1,1);ctx.fillRect(4,-17,1,1);break;
  }
}

// ---------- arte de fondo por reino
const artCache={};
function zoneArt(Z){
  if(artCache[Z.kind+Z.seed])return artCache[Z.kind+Z.seed];
  const R=rng(Z.seed),BW=512;
  const sky=mkc(VW,VH),sg=sky.getContext('2d');
  const gr=sg.createLinearGradient(0,0,0,VH);gr.addColorStop(0,Z.sky[0]);gr.addColorStop(1,Z.sky[1]);
  sg.fillStyle=gr;sg.fillRect(0,0,VW,VH);
  for(let i=0;i<80;i++){sg.fillStyle=`rgba(255,240,225,${.1+R()*.5})`;sg.fillRect(R()*VW|0,R()*VH*.7|0,1,1);}
  const far=mkc(BW,VH),near=mkc(BW,VH),F=far.getContext('2d'),N=near.getContext('2d');
  const sF=[],sN=[];
  const tri=(g,x1,y1,x2,y2,x3,y3)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineTo(x3,y3);g.fill();};
  if(Z.kind==='crypt'){
    sg.fillStyle='rgba(230,220,255,.85)';sg.beginPath();sg.arc(300,44,14,0,7);sg.fill();sg.fillStyle=Z.sky[0];sg.beginPath();sg.arc(306,40,13,0,7);sg.fill();
    // bruma baja
    const m=sg.createLinearGradient(0,VH*.6,0,VH);m.addColorStop(0,'rgba(120,90,170,0)');m.addColorStop(1,'rgba(120,90,170,.25)');sg.fillStyle=m;sg.fillRect(0,0,VW,VH);
    for(let i=0;i<9;i++){const x=R()*BW,w=26+R()*34,h=70+R()*90,win=R();sF.push(g=>{g.fillStyle=Z.far;g.fillRect(x,VH-h,w,h);tri(g,x-3,VH-h,x+w/2,VH-h-22-w*.3,x+w+3,VH-h);
      g.fillRect(x+w/2-1,VH-h-34-w*.3,2,12);g.fillRect(x+w/2-4,VH-h-30-w*.3,8,2);
      g.fillStyle='rgba(255,184,107,.55)';if(win>.3){g.fillRect(x+w/2-2,VH-h+14,4,7);g.fillRect(x+w/2-3,VH-h+13,6,1);}if(win>.6)g.fillRect(x+w/2-2,VH-h+34,4,7);});}
    for(let i=0;i<16;i++){const x=R()*BW,h=8+R()*14,c=R();sN.push(g=>{g.fillStyle=Z.near;
      if(c<.4){g.fillRect(x+4,VH-24-h-6,3,h+6);g.fillRect(x,VH-24-h,11,3);}
      else if(c<.8){g.fillRect(x,VH-24-h,10,h);g.beginPath();g.arc(x+5,VH-24-h,5,Math.PI,0);g.fill();}
      else{g.fillRect(x,VH-24-h-10,3,h+10);g.fillRect(x+10,VH-24-h-10,3,h+10);g.fillRect(x,VH-24-h-12,13,3);g.fillStyle='rgba(255,209,102,.6)';g.fillRect(x+5,VH-24-h-4,3,3);}});}
    sN.push(g=>{g.fillStyle=Z.near;g.fillRect(0,VH-24,BW,24);});
  }else if(Z.kind==='frost'){
    // aurora + resplandor de forja
    for(let k=0;k<3;k++){const y0=30+k*14,c=['rgba(120,240,200,.12)','rgba(90,180,255,.10)','rgba(200,140,255,.08)'][k];sg.fillStyle=c;
      for(let x=0;x<VW;x+=2){const y=y0+Math.sin(x*.02+k)*10+Math.sin(x*.05)*4;sg.fillRect(x,y,2,18-k*4);}}
    const gl=sg.createLinearGradient(0,VH*.55,0,VH);gl.addColorStop(0,'rgba(255,90,31,0)');gl.addColorStop(1,'rgba(255,90,31,.35)');sg.fillStyle=gl;sg.fillRect(0,0,VW,VH);
    for(let i=0;i<7;i++){const x=R()*BW,w=18+R()*18,h=100+R()*70;sF.push(g=>{g.fillStyle=Z.far;g.fillRect(x,VH-h,w,h);g.fillRect(x-3,VH-h,w+6,5);
      g.fillStyle='#dff4ff';g.globalAlpha=.35;g.fillRect(x-3,VH-h-2,w+6,3);for(let k=0;k<w;k+=4)g.fillRect(x+k,VH-h+5,2,3+((k*7)%5));g.globalAlpha=1;
      g.fillStyle='rgba(255,120,50,.5)';for(let y=VH-h+22;y<VH-10;y+=24)g.fillRect(x+w/2-2,y,4,7);});}
    for(let i=0;i<14;i++){const x=R()*BW,w=6+R()*12,h=14+R()*40;sF.push(g=>{g.fillStyle=Z.far;tri(g,x,0,x+w,0,x+w/2,h);});}
    for(let i=0;i<5;i++){const x=R()*BW,r=14+R()*16,y=VH-40-R()*60;sN.push(g=>{g.fillStyle=Z.near;g.beginPath();g.arc(x,y,r,0,7);g.fill();for(let k=0;k<8;k++){const a=k/8*Math.PI*2;g.fillRect(x+Math.cos(a)*r-3,y+Math.sin(a)*r-3,6,6);}
      g.fillStyle='rgba(223,244,255,.3)';g.fillRect(x-r,y-r-3,r*2,2);g.fillStyle=Z.far;g.beginPath();g.arc(x,y,r*.35,0,7);g.fill();});}
    sN.push(g=>{g.fillStyle=Z.near;g.fillRect(0,VH-16,BW,16);g.fillStyle='rgba(223,244,255,.25)';g.fillRect(0,VH-16,BW,1);});
  }else{
    for(let i=0;i<8;i++){const x=R()*BW,w=20+R()*40,h=60+R()*100;sF.push(g=>{g.fillStyle=Z.far;g.fillRect(x,VH-h,w,h);});}
    sN.push(g=>{g.fillStyle=Z.near;g.fillRect(0,VH-20,BW,20);});
  }
  for(const o of[-BW,0,BW]){F.save();F.translate(o,0);sF.forEach(f=>f(F));F.restore();N.save();N.translate(o,0);sN.forEach(f=>f(N));N.restore();}
  return(artCache[Z.kind+Z.seed]={sky,far,near,BW});
}

// ---------- capa estática
const isBlock=c=>'#I()TCD<>HQ'.includes(c);
function bakeLevel(){
  const Z=L.Z,W=L.W,H=L.H,c=mkc(W*TS,H*TS),g=c.getContext('2d');
  const at=(x,y)=>(x<0||x>=W||y<0)?'#':(y>=H?'.':L.g[y][x]);
  // fondo de muro interior (profundidad): sombras detrás de los bloques
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
    const ch=L.g[ty][tx],x=tx*TS,y=ty*TS,h=hash(tx,ty);
    if(ch==='#'||ch==='H'){
      g.fillStyle=Z.stone;g.fillRect(x,y,16,16);
      g.fillStyle=Z.dark;g.fillRect(x,y+7,16,1);g.fillRect(x,y+15,16,1);
      const off=(ty%2)*8;g.fillRect(x+((5+off)%16),y,1,7);g.fillRect(x+((13+off)%16),y+8,1,7);
      g.fillStyle=Z.light;g.fillRect(x+((6+off)%16),y+1,4,1);if(h&1)g.fillRect(x+((14+off)%16),y+9,3,1);
      if(h%7===0){g.fillStyle=Z.dark;g.fillRect(x+(h>>3)%12+2,y+(h>>6)%5+2,2,1);}
      if(h%23===0&&Z.kind==='crypt'){g.fillStyle='rgba(230,220,255,.25)';g.fillRect(x+5,y+4,4,3);g.fillRect(x+6,y+7,2,2);g.fillStyle=Z.dark;g.fillRect(x+6,y+5,1,1);g.fillRect(x+8,y+5,1,1);}
      if(ch==='H'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+9,y+3,1,3);g.fillRect(x+10,y+5,1,3);g.fillRect(x+9,y+8,1,2);}
      g.fillStyle=Z.dark;
      if(!isBlock(at(tx-1,ty)))g.fillRect(x,y,1,16);
      if(!isBlock(at(tx+1,ty)))g.fillRect(x+15,y,1,16);
      if(!isBlock(at(tx,ty+1))){g.fillRect(x,y+14,16,2);
        if(Z.kind==='frost'&&ty+1<H){g.fillStyle='#cdefff';for(let k=0;k<3;k++)if((h>>k)&1){const ix=x+2+k*5,len=3+((h>>(k+3))&3)*2;g.beginPath();g.moveTo(ix,y+16);g.lineTo(ix+3,y+16);g.lineTo(ix+1.5,y+16+len);g.fill();}}
        if(Z.kind==='crypt'&&ty+1<H&&h%5===0){g.fillStyle='rgba(120,160,90,.6)';const vx=x+(h%12)+2,vl=3+(h>>4)%6;g.fillRect(vx,y+16,1,vl);g.fillRect(vx+1,y+16+vl-1,1,1);}}
      if(!isBlock(at(tx,ty-1))&&at(tx,ty-1)!=='='){
        g.fillStyle=Z.cap;g.fillRect(x,y,16,Z.kind==='frost'?4:3);
        for(let k=0;k<4;k++)if((h>>k)&1)g.fillRect(x+k*4+1,y+3,2,1+((h>>(k+4))&1)*2);
        if(Z.kind==='crypt'&&h%9===0){g.fillStyle='#e8dcc8';g.fillRect(x+4,y-2,3,2);g.fillRect(x+7,y-1,2,1);}
        if(Z.kind==='crypt'&&h%13===1){g.fillStyle='#6a8a4a';g.fillRect(x+10,y-2,1,2);g.fillRect(x+12,y-3,1,3);}
      }
    }else if(ch==='I'){
      g.fillStyle='#9fe3ff';g.fillRect(x,y,16,16);g.fillStyle='#6cc4ea';g.fillRect(x,y+11,16,5);
      g.fillStyle='#e8fbff';g.fillRect(x,y,16,2);g.fillRect(x+3+(h%5),y+4,5,1);g.fillRect(x+2+(h%5),y+5,2,1);
      g.fillStyle='#4aa3cf';if(!isBlock(at(tx+1,ty)))g.fillRect(x+15,y,1,16);if(!isBlock(at(tx-1,ty)))g.fillRect(x,y,1,16);
    }else if(ch==='^'||ch==='v'||ch===']'||ch==='['){
      g.fillStyle=Z.spike;
      for(let k=0;k<2;k++){g.beginPath();
        if(ch==='^'){g.moveTo(x+1+k*7,y+16);g.lineTo(x+4.5+k*7,y+8);g.lineTo(x+8+k*7,y+16);}
        else if(ch==='v'){g.moveTo(x+1+k*7,y);g.lineTo(x+4.5+k*7,y+8);g.lineTo(x+8+k*7,y);}
        else if(ch===']'){g.moveTo(x,y+1+k*7);g.lineTo(x+8,y+4.5+k*7);g.lineTo(x,y+8+k*7);}
        else{g.moveTo(x+16,y+1+k*7);g.lineTo(x+8,y+4.5+k*7);g.lineTo(x+16,y+8+k*7);}
        g.fill();}
      g.fillStyle='rgba(0,0,0,.25)';if(ch==='^')g.fillRect(x,y+15,16,1);
    }else if(ch==='<'||ch==='>'){
      const d=ch==='<'?-1:1;
      g.fillStyle='#2e2a30';g.fillRect(x,y,16,16);g.fillStyle='#4a4450';g.fillRect(x+1,y+1,14,3);
      g.fillStyle='#1a1618';g.beginPath();g.arc(x+8,y+9,5,0,7);g.fill();
      g.fillStyle='#e3c46e';g.fillRect(d<0?x:x+10,y+6,6,6);g.fillStyle='#120e10';g.fillRect(d<0?x:x+13,y+7,3,4);
      g.fillStyle='#ff5470';g.fillRect(x+7,y+8,2,2);
    }else if(ch==='T'){
      g.fillStyle='#3a3236';g.fillRect(x,y,16,16);g.fillStyle='#57494f';g.fillRect(x+1,y+1,14,3);
      g.fillStyle='#1a1416';g.fillRect(x+4,y,8,2);
      g.fillStyle='#e0a030';for(let k=0;k<4;k++)g.fillRect(x+k*4+(ty%2)*2,y+12,2,3);
    }else if(ch==='V'&&at(tx,ty+1)!=='V'){
      g.fillStyle='#3a3236';g.fillRect(x+1,y+13,14,3);g.fillStyle='#ff8a3d';for(let k=0;k<4;k++)g.fillRect(x+2+k*4,y+14,2,1);
    }
  }
  L.bake=c;
}

// ---------- tiles dinámicos
function drawTiles(cx,cy){
  const Z=L.Z,t=L.clock,x0=Math.max(0,Math.floor(cx/TS)),y0=Math.max(0,Math.floor(cy/TS)),x1=Math.min(L.W-1,x0+VW/TS+1),y1=Math.min(L.H-1,y0+Math.ceil(VH/TS)+1);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const c=L.g[ty][tx];if(!'~()CDwRBHQZYgx_Vf=W'.includes(c))continue;
    const x=tx*TS-cx,y=ty*TS-cy,k=ty*L.W+tx,h=hash(tx,ty);
    switch(c){
    case '=':{const b=L.burn.get(k);if(b===-1){ctx.fillStyle='rgba(40,20,20,.5)';ctx.fillRect(x,y,16,1);break;}
      ctx.fillStyle=b>0?'#3a2010':Z.plank;ctx.fillRect(x,y,16,4);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x,y+3,16,1);ctx.fillRect(x+7,y,1,3);
      ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x,y,16,1);
      if(tileAt(tx-1,ty)!=='='||tileAt(tx+1,ty)!=='='){ctx.fillStyle=Z.plank;const sx=tileAt(tx-1,ty)!=='='?x+2:x+12;ctx.fillRect(sx,y+4,2,5);}
      if(b>0){ctx.fillStyle='#ff8a3d';ctx.fillRect(x+(t*40+h)%14,y-2,2,2);ctx.fillStyle='#ffd166';ctx.fillRect(x+(t*30+h*3)%14,y-1,1,1);}
      break;}
    case 'W':{const wt=L.boss&&L.boss.wax?L.boss.wax.get(k):9;if(wt<1&&(t*12|0)%2)break;
      ctx.fillStyle='#f4e8da';ctx.fillRect(x,y,16,16);ctx.fillStyle='#d8c4ae';ctx.fillRect(x,y+12,16,4);ctx.fillRect(x+13,y,3,16);
      ctx.fillStyle='#fffaf0';ctx.fillRect(x+1,y+1,9,2);ctx.fillStyle='#e8d8c4';ctx.fillRect(x+3+(h%8),y+16,2,2+(h%3));
      break;}
    case 'w':
      ctx.fillStyle='rgba(210,255,240,.05)';ctx.fillRect(x,y,16,16);ctx.fillStyle='rgba(230,255,245,.45)';
      for(let q=0;q<2;q++){const ox=(h>>(q*4))%14+1,oy=16-((t*70+((h>>(q*5))%16))%16);ctx.fillRect(x+ox,y+oy,1,4);}
      break;
    case 'V':{ctx.fillStyle='rgba(255,120,40,.08)';ctx.fillRect(x,y,16,16);
      for(let q=0;q<3;q++){const ox=(h>>(q*3))%14+1,oy=16-((t*50+((h>>(q*5))%16)+q*5)%16);ctx.fillStyle=q?'rgba(255,170,80,.55)':'rgba(255,230,160,.6)';ctx.fillRect(x+ox+Math.sin(t*6+q+oy*.3),y+oy,1,3);}
      break;}
    case 'f':{ctx.fillStyle='rgba(180,230,255,.08)';ctx.fillRect(x,y,16,16);
      for(let q=0;q<3;q++){const ox=(t*40+(h>>(q*4))%16+q*6)%16,oy=((h>>(q*3))%14)+Math.sin(t*3+q+tx)*2;ctx.fillStyle='rgba(240,250,255,.75)';ctx.fillRect(x+ox,y+oy,1,1);ctx.fillRect(x+((ox+7)%16),y+((oy+5)%16),2,1);}
      break;}
    case 'H':if(L.revealed.has(k)){ctx.fillStyle='rgba(8,4,12,.55)';ctx.fillRect(x,y,16,16);ctx.strokeStyle='rgba(255,209,102,.25)';ctx.setLineDash([2,2]);ctx.strokeRect(x+.5,y+.5,15,15);ctx.setLineDash([]);}break;
    case 'Q':
      if(L.broken.has(k)){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+2,y+13,3,2);ctx.fillRect(x+9,y+14,4,2);break;}
      ctx.fillStyle=Z.stone;ctx.fillRect(x,y,16,16);ctx.fillStyle=Z.dark;ctx.fillRect(x,y+15,16,1);ctx.fillRect(x+15,y,1,16);
      {const gl=.55+Math.sin(t*4+tx+ty)*.25;ctx.fillStyle=`rgba(255,160,60,${gl})`;}
      ctx.fillRect(x+7,y+1,2,4);ctx.fillRect(x+5,y+5,2,3);ctx.fillRect(x+8,y+8,2,3);ctx.fillRect(x+10,y+11,2,4);ctx.fillRect(x+3,y+10,3,1);
      break;
    case 'x':
      if(L.melted.has(k)){if(h%3===0){ctx.fillStyle='rgba(143,216,255,.35)';ctx.fillRect(x+4,y+14,6,2);}break;}
      ctx.fillStyle='#bfe8ff';ctx.fillRect(x,y,16,16);ctx.fillStyle='#8fd0f0';ctx.fillRect(x,y+12,16,4);ctx.fillRect(x+12,y,4,16);
      ctx.fillStyle='#ffffff';ctx.fillRect(x+2,y+2,5,1);ctx.fillRect(x+2,y+3,1,3);ctx.fillRect(x+9+(h%3),y+7,2,1);
      ctx.fillStyle='#5ab0e0';ctx.fillRect(x+4+(h%6),y+9,1,3);ctx.fillRect(x+5+(h%6),y+8,3,1);
      if(P&&P.heat>0&&Math.abs(tx*TS+8-P.x)<40&&Math.abs(ty*TS+8-P.y)<40&&(t*10|0)%2){ctx.fillStyle='rgba(255,200,120,.25)';ctx.fillRect(x,y,16,16);}
      break;
    case '_':{const cr=L.thin.get(k);if(cr.st===2)break;
      const sx=cr.st===1?(Math.random()*2-1|0):0;
      ctx.fillStyle='rgba(200,236,255,.85)';ctx.fillRect(x+sx,y,16,6);ctx.fillStyle='rgba(143,216,255,.6)';ctx.fillRect(x+sx,y+6,16,3);
      ctx.fillStyle='#fff';ctx.fillRect(x+sx,y,16,1);ctx.fillStyle='rgba(90,150,200,.8)';ctx.fillRect(x+sx+3+(h%5),y+2,4,1);ctx.fillRect(x+sx+6+(h%5),y+3,1,2);
      break;}
    case 'g':{
      const ci=L.ghostOf.get(k),cd=L.candles[ci],on=cd&&cd.t>0,warn=on&&cd.t<1.2&&(t*12|0)%2;
      if(on&&!warn){ctx.fillStyle='#e8d8ff';ctx.fillRect(x,y,16,16);ctx.fillStyle='#b59cff';ctx.fillRect(x,y+13,16,3);ctx.fillRect(x+13,y,3,16);
        ctx.fillStyle='#fff';ctx.fillRect(x,y,16,1);ctx.fillStyle='#ffb13d';ctx.fillRect(x+6,y+5,3,4);ctx.fillStyle='#fff1b8';ctx.fillRect(x+7,y+6,1,2);}
      else{ctx.globalAlpha=on?.6:.28;ctx.strokeStyle='#cbb8ff';ctx.setLineDash([2,2]);ctx.strokeRect(x+1.5,y+1.5,13,13);ctx.setLineDash([]);
        ctx.fillStyle='rgba(203,184,255,.12)';ctx.fillRect(x+2,y+2,12,12);ctx.globalAlpha=1;}
      break;}
    case 'Z':case 'Y':{
      const on=(c==='Z')===(L.lever===0),col=c==='Z'?'#3ee0c0':'#ffb13d';
      if(on){ctx.fillStyle='#1d1822';ctx.fillRect(x,y,16,16);ctx.fillStyle=col;ctx.fillRect(x+2,y,3,16);ctx.fillRect(x+11,y,3,16);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+2,y,1,16);ctx.fillRect(x+11,y,1,16);ctx.fillStyle=col;ctx.fillRect(x,y+6,16,3);}
      else{ctx.strokeStyle=col;ctx.globalAlpha=.35;ctx.setLineDash([2,2]);ctx.strokeRect(x+1.5,y+1.5,13,13);ctx.setLineDash([]);ctx.globalAlpha=1;}
      break;}
    case 'R':case 'B':{
      const on=(c==='R')===(L.phase===0),col=c==='R'?['#ff5470','#ffb3c1','#8a1d33']:['#4aa3ff','#bfe1ff','#163f7a'];
      const pop=L.flipT>0&&on?Math.round(L.flipT*8):0;
      if(on){ctx.fillStyle=col[0];ctx.fillRect(x-pop/2,y-pop/2,16+pop,16+pop);ctx.fillStyle=col[2];ctx.fillRect(x,y+13,16,3);ctx.fillRect(x+13,y,3,16);
        ctx.fillStyle=col[1];ctx.fillRect(x,y,16,2);ctx.fillRect(x,y,2,14);
        ctx.fillStyle=col[2];if(c==='R'){ctx.fillRect(x+6,y+5,4,6);}else{ctx.fillRect(x+5,y+7,6,2);ctx.fillRect(x+7,y+5,2,6);}}
      else{ctx.strokeStyle=col[0];ctx.globalAlpha=.45;ctx.setLineDash([2,2]);ctx.strokeRect(x+1.5,y+1.5,13,13);ctx.setLineDash([]);ctx.globalAlpha=1;}
      break;}
    case '~':{
      const top=tileAt(tx,ty-1)!=='~',cr=L.crust.get(k);
      ctx.fillStyle='#d93a17';ctx.fillRect(x,y+(top?4:0),16,top?12:16);
      if(top){for(let q=0;q<16;q+=2){const wy=y+3+Math.sin(t*3+(tx*16+q)*.25)*1.5;ctx.fillStyle='#ffb13d';ctx.fillRect(x+q,wy,2,2);ctx.fillStyle='#ff6a2b';ctx.fillRect(x+q,wy+2,2,3);}}
      if(cr){const fade=cr<.6&&(t*14|0)%2;ctx.fillStyle=fade?'#6a3a2a':'#3a3036';ctx.fillRect(x,y+2,16,7);ctx.fillStyle='#5a4a50';ctx.fillRect(x,y+2,16,2);
        ctx.fillStyle='rgba(143,216,255,.7)';ctx.fillRect(x+3,y+3,4,1);ctx.fillRect(x+10,y+5,3,1);ctx.fillStyle='#ff6a2b';ctx.fillRect(x+7,y+6,2,1);}
      else if(hash(tx,ty+((t*1.5)|0))%9===0){ctx.fillStyle='#ffd166';ctx.fillRect(x+(h%12)+2,y+8+(t*6%6),2,2);}
      break;}
    case '(':case ')':{
      const d=c==='('?-1:1;
      ctx.fillStyle='#2f2a2e';ctx.fillRect(x,y,16,16);ctx.fillStyle='#4e4549';ctx.fillRect(x,y,16,5);
      const o=((t*CONV*d)%8+8)%8;ctx.fillStyle='#ffb13d';
      for(let q=-8;q<24;q+=8){const sx=x+q+o;if(sx>=x&&sx<x+14){ctx.fillRect(sx,y+1,2,1);ctx.fillRect(sx+d,y+2,2,1);ctx.fillRect(sx,y+3,2,1);}}
      ctx.fillStyle='#1c181a';ctx.fillRect(x,y+15,16,1);
      ctx.fillStyle='#6b6064';ctx.beginPath();ctx.arc(x+8,y+10,3,0,7);ctx.fill();
      ctx.fillStyle='#2f2a2e';ctx.fillRect(x+8+Math.cos(t*6*d)*2-.5,y+10+Math.sin(t*6*d)*2-.5,1.5,1.5);
      break;}
    case 'C':{
      const cr=L.crumble.get(k);
      if(cr.st===2){ctx.strokeStyle='rgba(255,255,255,.1)';ctx.setLineDash([2,2]);ctx.strokeRect(x+.5,y+.5,15,15);ctx.setLineDash([]);break;}
      const sx=cr.st===1?(Math.random()*2-1|0):0,sy=cr.st===1?(Math.random()*2-1|0):0;
      ctx.fillStyle=Z.crumb;ctx.fillRect(x+sx,y+sy,16,16);
      ctx.fillStyle=Z.dark;ctx.fillRect(x+sx,y+sy+15,16,1);ctx.fillRect(x+sx+15,y+sy,1,16);
      ctx.fillRect(x+sx+4,y+sy+3,1,4);ctx.fillRect(x+sx+5,y+sy+7,3,1);ctx.fillRect(x+sx+10,y+sy+9,1,4);ctx.fillRect(x+sx+8,y+sy+2,3,1);
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x+sx,y+sy,16,1);
      break;}
    case 'D':
      if(L.doorOpen[L.doorGid.get(k)]){ctx.fillStyle='rgba(169,159,184,.18)';ctx.fillRect(x+2,y,2,16);ctx.fillRect(x+12,y,2,16);break;}
      ctx.fillStyle='#1d1822';ctx.fillRect(x,y,16,16);ctx.fillStyle='#a99fb8';
      ctx.fillRect(x+2,y,2,16);ctx.fillRect(x+7,y,2,16);ctx.fillRect(x+12,y,2,16);ctx.fillRect(x,y+7,16,2);
      if(tileAt(tx,ty-1)!=='D'){ctx.fillStyle='#ffd166';ctx.fillRect(x+6,y+10,4,4);ctx.fillStyle='#1d1822';ctx.fillRect(x+7,y+11,2,2);}
      break;
    }
  }
}
function glow(x,y,r,col,a){
  if(!isFinite(x+y+r)||r<=0){if(!glow.w){glow.w=1;console.warn('glow NaN',new Error().stack);}return;}
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function flame(r,h,lean){const g=XC||ctx;g.beginPath();g.arc(0,-r,r,0,Math.PI);g.quadraticCurveTo(-r,-r-h*.45,lean,-h);g.quadraticCurveTo(r,-r-h*.45,r,-r);g.fill();}
function drawEntities(cx,cy){
  const t=L.clock,Z=L.Z,E=L.exit;
  const vis=(x,y,m)=>x>-m&&x<VW+m&&y>-m&&y<VH+m;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const j of L.jets){if(j.r>0&&jetOn(j))glow(j.x*TS+8-cx,(j.y-j.r/2)*TS-cy,22,'rgba(255,120,40,A)',.35);}
  if(L.spark&&!L.gotSpark)glow(L.spark.x*TS+8-cx,L.spark.y*TS+8-cy,16,'rgba(255,210,100,A)',.4);
  for(const o of L.orbs)if(o.on)glow(o.x*TS+8-cx,o.y*TS+8-cy,16,'rgba(120,240,255,A)',.4);
  if(E&&L.exitOn)glow(E.x*TS+8-cx,E.y*TS-2-cy,L.won?60:18,'rgba(255,200,90,A)',L.won?.6:.2);
  for(const gl of L.glows)glow(gl.x*TS+8-cx,gl.y*TS+11-cy,18,'rgba(120,255,200,A)',.25);
  for(const c of L.candles)if(c.t>0)glow(c.x*TS+8-cx,c.y*TS+4-cy,26,'rgba(255,170,90,A)',.35);
  ctx.restore();
  for(const j of L.jets){
    const x=j.x*TS-cx,y=j.y*TS-cy;if(!vis(x,y,60))continue;
    if(j.r>0&&jetOn(j)){const hgt=j.r*TS,fl=Math.sin(t*40+j.x)*2;
      ctx.fillStyle='#ff5a1f';ctx.fillRect(x+3,y-hgt+fl+2,10,hgt-fl-2);
      ctx.fillStyle='#ffb13d';ctx.fillRect(x+5,y-hgt+fl+6,6,hgt-fl-6);
      ctx.fillStyle='#fff1b8';ctx.fillRect(x+7,y-hgt*.6,2,hgt*.6);
      if(Math.random()<.4)parts.push({x:j.x*TS+4+Math.random()*8,y:(j.y-j.r)*TS+4,vx:(Math.random()-.5)*20,vy:-30-Math.random()*30,life:.4,max:.4,col:EMBER[Math.random()*4|0],g:0,s:1});
    }else if(jetWarn(j)&&(t*16|0)%2){ctx.fillStyle='#ffb13d';ctx.fillRect(x+6,y-3,4,3);}
  }
  for(const p of L.portals){const x=p.x*TS+8-cx,y=p.y*TS+8-cy,col=PORTAL_COL[p.id];if(!vis(x,y,30))continue;
    ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y,20,'rgba(255,255,255,A)',.15);ctx.restore();
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,6,9,0,0,7);ctx.stroke();
    ctx.lineWidth=1;ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(x,y,3+Math.sin(t*4)*1.5,6+Math.sin(t*4)*1.5,0,0,7);ctx.stroke();ctx.globalAlpha=1;
    const a=t*3+p.x;ctx.fillStyle='#fff';ctx.fillRect(x+Math.cos(a)*6-.5,y+Math.sin(a)*9-.5,1.5,1.5);}
  for(const c of L.cannons)if(c.flash>0){const x=c.x*TS+8+c.dir*10-cx,y=c.y*TS+8-cy;ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();}
  // velas
  for(const c of L.candles){const x=c.x*TS-cx,y=c.y*TS-cy;if(!vis(x,y,30))continue;const lit=c.t>0,max=L.d.candleT||K.candle;
    ctx.fillStyle='#3a2f3a';ctx.fillRect(x+3,y+14,10,2);ctx.fillRect(x+5,y+12,6,2);
    const hh=lit?Math.max(3,8*c.t/max):8;ctx.fillStyle='#f4e8da';ctx.fillRect(x+6,y+12-hh,4,hh);ctx.fillStyle='#d8c8b8';ctx.fillRect(x+9,y+12-hh,1,hh);
    ctx.fillStyle='#2a2226';ctx.fillRect(x+7,y+10-hh,1,2);
    if(lit){const f=Math.sin(t*22+c.x)*1;ctx.fillStyle='#ff8a3d';ctx.fillRect(x+6,y+5-hh+f,4,5-f);ctx.fillStyle='#fff1b8';ctx.fillRect(x+7,y+7-hh+f,2,3-f);
      // arco de tiempo restante
      ctx.strokeStyle='rgba(255,209,102,.6)';ctx.beginPath();ctx.arc(x+8,y+8-hh,8,-Math.PI/2,-Math.PI/2+Math.PI*2*c.t/max);ctx.stroke();}
    else if((t*2|0)%2){ctx.fillStyle='rgba(203,184,255,.5)';ctx.fillRect(x+7,y+6-hh,2,2);}}
  for(const b of L.balls){const x=b.x-cx,y=b.y-cy;
    if(b.draw){b.draw(x,y);continue;}
    if(b.col){ctx.fillStyle=b.col;ctx.beginPath();ctx.arc(x,y,b.r||3.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-1,y-1,2,2);}
    else{ctx.fillStyle='#ff5a1f';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(x,y,2.2,0,7);ctx.fill();}
    if(Math.random()<.4)parts.push({x:b.x,y:b.y,vx:-b.vx*.1,vy:-10,life:.3,max:.3,col:b.col||EMBER[Math.random()*4|0],g:0,s:1});}
  if(typeof drawBoss==='function')drawBoss(cx,cy);
  for(const s of L.springs){const x=s.x*TS-cx,y=s.y*TS-cy,c=s.a>0?4:0;
    ctx.fillStyle='#3b3140';ctx.fillRect(x+2,y+14,12,2);
    ctx.fillStyle='#c9c2d6';for(let q=0;q<3;q++)ctx.fillRect(x+4+(q%2)*2,y+13-q*(3-c/3)-2,6,1);
    ctx.fillStyle='#ff8a3d';ctx.fillRect(x+1,y+6+c,14,3);ctx.fillStyle='#ffd166';ctx.fillRect(x+1,y+6+c,14,1);}
  for(const o of L.orbs){const x=o.x*TS+8-cx,y=o.y*TS+8-cy;
    if(o.on){const p=Math.sin(t*5);ctx.fillStyle='#5ad1ff';ctx.beginPath();ctx.arc(x,y,5+p,0,7);ctx.fill();ctx.fillStyle='#dffcff';ctx.beginPath();ctx.arc(x-1,y-1,2.5,0,7);ctx.fill();
      ctx.strokeStyle='rgba(143,247,255,.6)';ctx.beginPath();ctx.arc(x,y,8+Math.sin(t*3)*1.5,0,7);ctx.stroke();}
    else{ctx.strokeStyle='rgba(143,247,255,.25)';ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.stroke();ctx.setLineDash([]);}}
  // brasas sueltas (moneda)
  for(const c of L.coins){if(c.taken)continue;const x=c.x*TS+8-cx,y=c.y*TS+8-cy+Math.sin(c.t*4)*1.5;if(!vis(x,y,10))continue;
    const w=Math.abs(Math.cos(c.t*3))*3+1;ctx.fillStyle='#ff8a3d';ctx.fillRect(x-w/2,y-3,w,6);ctx.fillStyle='#ffd166';ctx.fillRect(x-w/2+.5,y-2,Math.max(1,w-1),3);}
  if(L.spark&&!L.gotSpark){const x=L.spark.x*TS+8-cx,y=L.spark.y*TS+8-cy+Math.sin(t*3)*2,a=t*2;
    ctx.fillStyle='#ffd166';ctx.beginPath();for(let q=0;q<8;q++){const rr=q%2?2:6,an=a+q*Math.PI/4;ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr);}ctx.fill();
    ctx.fillStyle='#fff8e0';ctx.fillRect(x-1,y-1,2,2);}
  for(const n of L.notes){const x=n.x*TS-cx,y=n.y*TS-cy+Math.sin(t*2+n.x)*1.5;const rd=save.prog.notes&&save.prog.notes[n.id];
    ctx.fillStyle=rd?'#b8a890':'#efe2c8';ctx.fillRect(x+4,y+4,8,9);ctx.fillStyle='#8a6a4a';ctx.fillRect(x+3,y+3,10,2);ctx.fillRect(x+3,y+12,10,2);
    ctx.fillStyle='#6a5040';ctx.fillRect(x+5,y+7,6,1);ctx.fillRect(x+5,y+9,4,1);if(!rd&&(t*2|0)%2){ctx.fillStyle='#ffd166';ctx.fillRect(x+7,y-2,2,2);}}
  for(const k of L.keys){if(k.taken)continue;const x=k.x*TS-cx,y=k.y*TS-cy+Math.sin(t*3)*2;
    ctx.fillStyle='#ffd166';ctx.fillRect(x+3,y+4,6,6);ctx.fillStyle='#8a5a10';ctx.fillRect(x+5,y+6,2,2);
    ctx.fillStyle='#ffd166';ctx.fillRect(x+9,y+6,6,2);ctx.fillRect(x+12,y+8,1,3);ctx.fillRect(x+14,y+8,1,2);}
  for(const c of L.cps){const x=c.x*TS-cx,y=c.y*TS-cy,lit=L.cp===c;
    ctx.fillStyle='#4a3f45';ctx.fillRect(x+7,y+8,2,8);ctx.fillRect(x+4,y+15,8,1);
    ctx.fillStyle='#6b5a55';ctx.fillRect(x+2,y+5,12,4);ctx.fillStyle='#8a7870';ctx.fillRect(x+2,y+5,12,1);
    if(lit){const f=Math.sin(t*20);ctx.fillStyle='#ff5a1f';ctx.fillRect(x+4,y-2+f,8,7-f);ctx.fillStyle='#ffd166';ctx.fillRect(x+6,y+f,4,5-f);}
    else{ctx.fillStyle='#2a2226';ctx.fillRect(x+4,y+3,8,2);}}
  for(const lv of L.levers){const x=lv.x*TS-cx,y=lv.y*TS-cy,d=L.lever?1:-1;
    ctx.fillStyle='#4a3f45';ctx.fillRect(x+3,y+12,10,4);ctx.fillStyle='#6b5a55';ctx.fillRect(x+3,y+12,10,1);
    ctx.strokeStyle='#c9c2d6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+8,y+13);ctx.lineTo(x+8+d*5,y+4);ctx.stroke();ctx.lineWidth=1;
    ctx.fillStyle=L.lever?'#ffb13d':'#3ee0c0';ctx.beginPath();ctx.arc(x+8+d*5,y+4,2.5,0,7);ctx.fill();}
  for(const p of L.pups){const x=p.x*TS+8-cx,y=p.y*TS+8-cy+Math.sin(t*3+p.x)*2;
    if(p.taken){if(p.k!=='d'){ctx.strokeStyle='rgba(255,255,255,.15)';ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.stroke();ctx.setLineDash([]);}continue;}
    ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y,16,'rgba(255,240,200,A)',.35);ctx.restore();
    ctx.fillStyle='rgba(20,12,30,.75)';ctx.beginPath();ctx.arc(x,y,6.5,0,7);ctx.fill();
    ctx.strokeStyle='#ffd166';ctx.beginPath();ctx.arc(x,y,6.5,0,7);ctx.stroke();
    if(p.k==='a'){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x-5,y-3);ctx.lineTo(x-4,y+1);ctx.lineTo(x-5,y+3);ctx.fill();ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x+5,y-3);ctx.lineTo(x+4,y+1);ctx.lineTo(x+5,y+3);ctx.fill();}
    else if(p.k==='d'){ctx.fillStyle='#ffd166';ctx.beginPath();ctx.moveTo(x+1,y-5);ctx.lineTo(x-3,y+1);ctx.lineTo(x,y+1);ctx.lineTo(x-1,y+5);ctx.lineTo(x+3,y-1);ctx.lineTo(x,y-1);ctx.fill();}
    else if(p.k==='h'){ctx.fillStyle='#8ff7ff';ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+4,y-3);ctx.lineTo(x+4,y+1);ctx.lineTo(x,y+5);ctx.lineTo(x-4,y+1);ctx.lineTo(x-4,y-3);ctx.fill();}
    else{ctx.fillStyle='#e3c46e';ctx.fillRect(x-3,y-5,6,1);ctx.fillRect(x-3,y+4,6,1);ctx.beginPath();ctx.moveTo(x-3,y-4);ctx.lineTo(x+3,y-4);ctx.lineTo(x,y);ctx.lineTo(x+3,y+4);ctx.lineTo(x-3,y+4);ctx.lineTo(x,y);ctx.fill();}}
  for(const gl of L.glows){const x=gl.x*TS-cx,y=gl.y*TS-cy,p=.7+Math.sin(t*2+gl.x)*.3;
    ctx.fillStyle='#d7d0e8';ctx.fillRect(x+7,y+11,2,5);ctx.fillRect(x+3,y+13,1,3);
    ctx.fillStyle=`rgba(122,240,200,${p})`;ctx.beginPath();ctx.arc(x+8,y+11,4,Math.PI,0);ctx.fill();ctx.fillRect(x+2,y+12,3,1);}
  if(E){
    if(!L.exitOn){const x=E.x*TS-cx,y=E.y*TS-cy;ctx.strokeStyle='rgba(255,209,102,.18)';ctx.setLineDash([2,2]);ctx.strokeRect(x+3.5,y-7.5,9,9);ctx.setLineDash([]);}
    else{const x=E.x*TS-cx,y=E.y*TS-cy;
      ctx.fillStyle='#3a2f3a';ctx.fillRect(x+7,y+2,2,14);ctx.fillRect(x+4,y+15,8,1);ctx.fillRect(x+3,y-10,10,2);ctx.fillRect(x+5,y-12,6,2);
      ctx.fillStyle='#241c26';ctx.fillRect(x+3,y-8,10,10);
      const lit=L.won,fl=Math.sin(t*6)*.15;
      ctx.fillStyle=lit?'#ffd166':`rgba(120,100,150,${.55+fl})`;ctx.fillRect(x+4,y-7,8,8);
      if(lit){ctx.fillStyle='#fff8e0';ctx.fillRect(x+6,y-5,4,4);}
      ctx.fillStyle='#3a2f3a';ctx.fillRect(x+7,y-7,2,8);ctx.fillRect(x+3,y+1,10,2);
      if(!lit&&(t*2|0)%2){ctx.fillStyle='rgba(255,209,102,.8)';ctx.fillRect(x+7,y-19+Math.sin(t*4)*1.5,2,3);ctx.fillRect(x+6,y-17+Math.sin(t*4)*1.5,4,1);}}
  }
  for(const pl of L.plats){const x=Math.round(pl.x-cx),y=Math.round(pl.y-cy);
    ctx.fillStyle=Z.plank;ctx.fillRect(x,y,pl.w,5);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x,y+4,pl.w,2);
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x,y,pl.w,1);
    ctx.fillStyle='#ffd166';for(let q=4;q<pl.w;q+=16)ctx.fillRect(x+q,y+2,1,1);
    if(pl.ax==='y'){ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+pl.w/2-1,y+6,2,4);}}
  for(const e of L.enemies){if(!e.alive)continue;const x=Math.round(e.x-cx),y=Math.round(e.y-cy);if(!vis(x,y,20))continue;const d=e.vx>0?1:-1;
    if(e.k==='w'){const st=Math.sin(e.t*14)>0?1:0;
      ctx.fillStyle='#3d2a55';ctx.fillRect(x,y+1,12,8);ctx.fillRect(x+1,y,10,1);
      ctx.fillStyle='#1a1024';ctx.fillRect(x+1,y+1,10,7);
      ctx.fillRect(x+1+st,y+9,3,1);ctx.fillRect(x+8-st,y+9,3,1);
      ctx.fillStyle='#ff5470';ctx.fillRect(x+5+d*2,y+3,2,2);ctx.fillRect(x+8+d*2-3*(d<0),y+3,2,2);
    }else if(e.k==='b'){const fl=Math.sin(e.t*18)>0;
      ctx.fillStyle='#2a1f3a';ctx.fillRect(x+3,y+1,6,6);
      ctx.fillStyle='#46335e';if(fl){ctx.fillRect(x-2,y,5,2);ctx.fillRect(x+9,y,5,2);}else{ctx.fillRect(x-1,y+4,4,3);ctx.fillRect(x+9,y+4,4,3);}
      ctx.fillStyle='#ffd166';ctx.fillRect(x+4,y+3,1,1);ctx.fillRect(x+7,y+3,1,1);
    }else if(e.k==='y'){const f=e.face||1,op=e.flash>0;
      ctx.fillStyle='#5a4a5e';ctx.fillRect(x,y+4,12,8);ctx.fillRect(x+2,y+1,8,4);ctx.fillStyle='#3a2f3e';ctx.fillRect(x,y+10,12,2);
      ctx.fillRect(x-1+(f>0?0:10),y,3,3);ctx.fillRect(x+(f>0?10:0),y-1,3,3);
      ctx.fillStyle=op?'#ffd166':'#ff5470';ctx.fillRect(x+(f>0?7:3),y+3,2,2);
      ctx.fillStyle=op?'#ff8a3d':'#1a1024';ctx.fillRect(x+(f>0?8:0),y+6,4,2);
    }else if(e.k==='j'){const air=e.vy!==0,sq=air?0:Math.max(0,(1.2-e.cd))*2;
      ctx.fillStyle='#7a4a9a';ctx.fillRect(x+1,y+2+sq,10,8-sq);ctx.fillRect(x+2,y+1+sq,8,1);ctx.fillStyle='#b58ad8';ctx.fillRect(x+2,y+2+sq,3,2);
      ctx.fillStyle='#1a1024';ctx.fillRect(x+3,y+4+sq,2,2);ctx.fillRect(x+7,y+4+sq,2,2);ctx.fillRect(x+5,y+7+sq,2,1);}
  }
}
function drawPlayer(cx,cy){
  if(P.dead)return;const t=L.clock;
  const mx=P.x+P.w/2-cx,by=P.y+P.h-cy;
  const SK=flameCols();
  let cols=SK.c;if(P.heat>0)cols=['#ff8a3d','#ffe066','#ffffff'];else if(P.heat<0)cols=['#5ab0ff','#bfe8ff','#ffffff'];
  const blinkHeat=P.heat&&P.heatT<.8&&(t*12|0)%2;if(blinkHeat)cols=SK.c;
  ctx.save();ctx.globalCompositeOperation='lighter';glow(mx,by-7,P.heat>0?40:30,'rgba('+(P.heat>0?'255,190,90':P.heat<0?'120,200,255':SK.g)+',A)',.3);ctx.restore();
  const fl=RM?0:Math.sin(t*22)+Math.sin(t*13)*.7,lean=-P.vx*.035+(RM?0:Math.sin(t*9)*.8);
  const sq=P.sq,sx=1+sq*.3,sy=1-sq*.3;
  ctx.save();ctx.translate(Math.round(mx),Math.round(by));ctx.scale(sx,sy);
  if(P.spawnT>0)ctx.globalAlpha=1-P.spawnT/.35;
  if(P.invT>0&&((t*20|0)%2))ctx.globalAlpha=.35;
  if(P.wings){ctx.fillStyle='rgba(255,255,255,.85)';const fw=Math.sin(t*(P.onGround?4:18))*2;ctx.fillRect(-9,-8+fw,4,2);ctx.fillRect(-10,-6+fw,3,2);ctx.fillRect(5,-8+fw,4,2);ctx.fillRect(7,-6+fw,3,2);}
  const big=P.heat>0?1.2:1;
  ctx.fillStyle=cols[0];flame(6,(16+fl)*big,lean);
  ctx.fillStyle=cols[1];flame(4.6,(12+fl*.7)*big,lean*.8);
  ctx.fillStyle=cols[2];flame(3,7,lean*.4);
  if(SK.sparkle&&Math.random()<.2)parts.push({x:P.x+Math.random()*P.w,y:P.y-4+Math.random()*8,vx:0,vy:-10,life:.4,max:.4,col:'#ffffff',g:0,s:1});
  P.blink-=1/60;const bl=P.blink<.1;if(P.blink<0)P.blink=2+Math.random()*3;
  ctx.fillStyle=SK.eye;const ex=P.face*1.5;
  ctx.fillRect(-3+ex,bl?-5:-6.5,1.5,bl?1:2.5);ctx.fillRect(1.5+ex,bl?-5:-6.5,1.5,bl?1:2.5);
  drawHat(equipped('hat').id,t);
  if(P.airJump>0&&!P.wings){ctx.strokeStyle='rgba(143,247,255,.8)';ctx.beginPath();ctx.arc(0,-6,9,0,7);ctx.stroke();}
  if(P.shield){ctx.strokeStyle=`rgba(143,247,255,${.5+Math.sin(t*6)*.25})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-7,11,0,7);ctx.stroke();ctx.lineWidth=1;}
  if(hasDash()&&P.canDash){ctx.fillStyle='#ffd166';ctx.fillRect(-1,-23,2,2);}
  ctx.restore();
}
function drawLava(cx,cy){
  if(!L.lava)return;const y=L.lava.y-cy,t=L.clock;if(y>VH+8)return;
  const g=ctx.createLinearGradient(0,y-40,0,y);g.addColorStop(0,'rgba(255,90,31,0)');g.addColorStop(1,L.lava.wax?'rgba(255,230,180,.25)':'rgba(255,90,31,.35)');
  ctx.fillStyle=g;ctx.fillRect(0,y-40,VW,40);
  const W=L.lava.wax,C=W?['#e8d0a8','#fff4d8','#f0dcb8']:['#d93a17','#ffb13d','#ff6a2b'];
  ctx.fillStyle=C[0];ctx.fillRect(0,y+3,VW,VH);
  for(let x=0;x<VW;x+=2){const wy=y+Math.sin(t*3+(x+cx)*.08)*2;ctx.fillStyle=C[1];ctx.fillRect(x,wy,2,2);ctx.fillStyle=C[2];ctx.fillRect(x,wy+2,2,4);}
  if(Math.random()<.5)parts.push({x:Math.random()*VW+cx,y:L.lava.y,vx:0,vy:-30-Math.random()*40,life:.6,max:.6,col:W?'#fff4d8':EMBER[Math.random()*4|0],g:40,s:2});
}
function drawDark(cx,cy){
  const d=dctx,t=L.clock;
  d.globalCompositeOperation='source-over';d.fillStyle='rgba(3,2,8,.965)';d.fillRect(0,0,VW,VH);
  d.globalCompositeOperation='destination-out';
  const light=(x,y,r,a)=>{if(x<-r||x>VW+r||y<-r||y>VH+r)return;const g=d.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(.5,`rgba(0,0,0,${a*.75})`);g.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=g;d.fillRect(x-r,y-r,r*2,r*2);};
  if(!P.dead)light(P.x+P.w/2-cx,P.y+P.h/2-cy,(P.heat>0?90:64)+(RM?0:Math.sin(t*9)*3),1);
  else light(P.x+P.w/2-cx,P.y+P.h/2-cy,40*(P.deadT/.75),.8);
  const E=L.exit;if(E&&L.exitOn)light(E.x*TS+8-cx,E.y*TS-3-cy,L.won?110:30,L.won?1:.8);
  for(const p of L.portals)light(p.x*TS+8-cx,p.y*TS+8-cy,26,.9);
  for(const p of L.pups)if(!p.taken)light(p.x*TS+8-cx,p.y*TS+8-cy,22,.9);
  for(const lv of L.levers)light(lv.x*TS+8-cx,lv.y*TS+8-cy,16,.7);
  for(const b of L.balls)light(b.x-cx,b.y-cy,16,.8);
  for(const g of L.glows)light(g.x*TS+8-cx,g.y*TS+11-cy,38,.9);
  for(const c of L.candles)light(c.x*TS+8-cx,c.y*TS+6-cy,c.t>0?70:14,c.t>0?1:.6);
  for(const n of L.notes)light(n.x*TS+8-cx,n.y*TS+8-cy,14,.6);
  for(const c of L.cps)light(c.x*TS+8-cx,c.y*TS+4-cy,L.cp===c?46:14,.8);
  if(L.spark&&!L.gotSpark)light(L.spark.x*TS+8-cx,L.spark.y*TS+8-cy,22,.9);
  for(const o of L.orbs)if(o.on)light(o.x*TS+8-cx,o.y*TS+8-cy,24,.9);
  for(const k of L.keys)if(!k.taken)light(k.x*TS+8-cx,k.y*TS+8-cy,20,.8);
  for(const j of L.jets)if(j.r>0&&jetOn(j))light(j.x*TS+8-cx,(j.y-j.r/2)*TS-cy,36,.9);
  if(L.boss&&!L.boss.dead)light(L.boss.x+L.boss.w/2-cx,L.boss.y+L.boss.h/2-cy,L.boss.light||30,.9);
  const x0=Math.max(0,Math.floor(cx/TS)),x1=Math.min(L.W-1,x0+VW/TS+1),y0=Math.max(0,Math.floor(cy/TS)),y1=Math.min(L.H-1,y0+Math.ceil(VH/TS)+1);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const ch=L.g[ty][tx];
    if(ch==='~'&&tileAt(tx,ty-1)!=='~')light(tx*TS+8-cx,ty*TS+4-cy,30,.7);
    else if(ch==='g'&&ghostLit(ty*L.W+tx))light(tx*TS+8-cx,ty*TS+8-cy,18,.8);
    else if(ch==='V'&&tileAt(tx,ty+1)!=='V')light(tx*TS+8-cx,ty*TS+8-cy,34,.7);}
  if(L.lava){const ly=L.lava.y-cy;if(ly<VH+30)for(let x=0;x<VW;x+=40)light(x+20,ly,50,.8);}
  ctx.drawImage(darkCv,0,0);
  for(const e of L.enemies){if(!e.alive)continue;const x=Math.round(e.x-cx),y=Math.round(e.y-cy);
    ctx.fillStyle=e.k==='b'?'#ffd166':'#ff5470';
    if(e.k==='b'){ctx.fillRect(x+4,y+3,1,1);ctx.fillRect(x+7,y+3,1,1);}else{ctx.fillRect(x+4,y+3,2,2);ctx.fillRect(x+7,y+3,2,2);}}
}
// partículas ambientales
const amb=[];
function ambient(dt){
  const k=L.Z.kind,max=k==='crypt'?26:34;
  if(amb.length<max&&Math.random()<.5){
    const a={x:Math.random()*VW,y:-4,vx:0,vy:0,s:1,c:'#fff',life:9};
    if(k==='crypt'){a.y=Math.random()*VH;a.vx=(Math.random()-.5)*5;a.vy=-4-Math.random()*4;a.c=Math.random()<.2?'rgba(255,209,102,.5)':'rgba(203,184,255,.35)';}
    else if(k==='frost'){if(Math.random()<.5){a.vx=-4+Math.random()*8;a.vy=12+Math.random()*12;a.c='rgba(235,248,255,.8)';a.s=Math.random()<.3?2:1;}
      else{a.y=VH+4;a.vx=(Math.random()-.5)*10;a.vy=-15-Math.random()*20;a.c=EMBER[1+(Math.random()*3|0)];}}
    else{a.y=Math.random()*VH;a.vx=(Math.random()-.5)*6;a.vy=-3-Math.random()*4;a.c='rgba(255,255,255,.4)';}
    amb.push(a);
  }
  for(let i=amb.length-1;i>=0;i--){const a=amb[i];a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;
    if(a.life<=0||a.y>VH+6||a.y<-8||a.x<-8||a.x>VW+8){amb.splice(i,1);continue;}
    ctx.fillStyle=a.c;ctx.fillRect(a.x|0,a.y|0,a.s,a.s);}
}
function updateCam(dt,snap){
  const mw=L.W*TS,mh=L.H*TS;
  let tx=P.x+P.w/2-VW/2+P.face*22,ty=P.y+P.h/2-VH/2-8;
  if(L.boss&&L.W*TS<=VW+32){tx=(mw-VW)/2;}
  const k=snap?1:1-Math.exp(-dt*5);
  cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*Math.min(1,k*1.3);
  cam.x=mw<=VW?(mw-VW)/2:Math.max(0,Math.min(mw-VW,cam.x));
  cam.y=mh<=VH?(mh-VH)/2:Math.max(0,Math.min(mh-VH,cam.y));
}
function render(dt,paused){
  const Z=L.Z,art=zoneArt(Z);
  updateCam(dt,false);
  let sx=0,sy=0;if(shake>0){sx=(Math.random()*2-1)*shake;sy=(Math.random()*2-1)*shake;shake=Math.max(0,shake-dt*30);}
  const cx=Math.round(cam.x+sx),cy=Math.round(cam.y+sy);
  ctx.drawImage(art.sky,0,0);
  const mh=L.H*TS,vy=Math.max(-40,Math.min(40,(mh-VH-cam.y)*.08));
  for(const[layer,par,yo]of[[art.far,.15,vy*.5],[art.near,.4,vy]]){
    const o=-(((cam.x*par)%art.BW)+art.BW)%art.BW;
    ctx.drawImage(layer,Math.round(o),Math.round(yo));ctx.drawImage(layer,Math.round(o+art.BW),Math.round(yo));
  }
  if(L.boss&&typeof drawBossBack==='function')drawBossBack(cx,cy);
  ctx.drawImage(L.bake,-cx,-cy);
  drawTiles(cx,cy);
  drawEntities(cx,cy);
  drawGhostLinks(cx,cy);
  if(L.plaque)drawPlaque(cx,cy);
  drawPlayer(cx,cy);
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];
    if(!paused){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    if(p.life<=0){parts.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,p.life/p.max*1.5);
    if(p.col==='ghost'){const x=Math.round(p.x-cx),y=Math.round(p.y-cy);ctx.fillStyle='#f4e8ff';ctx.fillRect(x-4,y-5,8,8);ctx.fillRect(x-4,y+3,2,2);ctx.fillRect(x,y+3,2,2);ctx.fillRect(x+3,y+3,1,2);ctx.fillStyle='#2a1040';ctx.fillRect(x-2,y-3,1,2);ctx.fillRect(x+1,y-3,1,2);}
    else{ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x-cx),Math.round(p.y-cy),p.s,p.s);}}
  ctx.globalAlpha=1;
  drawLava(cx,cy);
  if(L.boss&&typeof drawBossFront==='function')drawBossFront(cx,cy);
  if(L.d.dark||(L.boss&&L.boss.dark))drawDark(cx,cy);
  if(L.slowT>0){ctx.fillStyle=`rgba(90,150,255,${Math.min(.18,L.slowT*.06)})`;ctx.fillRect(0,0,VW,VH);}
  ambient(paused?0:dt);
  const v=ctx.createRadialGradient(VW/2,VH/2,VH*.45,VW/2,VH/2,VW*.62);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=v;ctx.fillRect(0,0,VW,VH);
}

function drawPlaque(cx,cy){
  const p=L.plaque,x=p.x*TS-cx,y=p.y*TS-cy;if(x<-80||x>VW+20)return;
  ctx.fillStyle='#3a3048';ctx.fillRect(x,y-2,34,18);ctx.fillStyle='#57486a';ctx.fillRect(x,y-2,34,2);ctx.fillRect(x+2,y+16,4,2);ctx.fillRect(x+28,y+16,4,2);
  ctx.fillStyle='#ffd166';ctx.font='8px VT323, monospace';ctx.textBaseline='top';
  ctx.fillText('RÉCORD',x+4,y);ctx.fillStyle='#f4e8da';ctx.fillText(p.name.slice(0,8),x+3,y+7);
  ctx.fillStyle='#ff8a3d';ctx.fillRect(x+15,y-6+Math.sin(L.clock*8),3,4);
}
function drawGhostLinks(cx,cy){
  if(!L.ghostGroups)return;
  for(const gr of L.ghostGroups){const c=L.candles[gr.ci];if(!c||c.t<=0)continue;const max=L.d.candleT||K.candle;if(max-c.t>1.2)continue;
    const a=1-(max-c.t)/1.2,x0=c.x*TS+8-cx,y0=c.y*TS+4-cy,x1=gr.x*TS+8-cx,y1=gr.y*TS+8-cy;
    ctx.fillStyle=`rgba(255,209,102,${a*.8})`;for(let k=0;k<=12;k++){const f=k/12,px=x0+(x1-x0)*f,py=y0+(y1-y0)*f-Math.sin(f*Math.PI)*14;ctx.fillRect(px|0,py|0,2,2);}}
}
