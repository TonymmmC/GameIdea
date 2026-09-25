'use strict';
// ============================================================
//  JEFES — cada fase te regala un escudo de brasa (aguanta 1 golpe).
//  Si te apagas, el jefe vuelve a empezar desde cero.
// ============================================================
const BOSS={};
let B=null;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function restoreGrid(){
  if(!L.g0)L.g0=L.g.map(r=>r.slice());
  else{L.g=L.g0.map(r=>r.slice());bakeLevel();}
}
function makeBoss(){
  restoreGrid();
  const D=BOSS[L.d.boss],s=L.bossSpawn||{x:L.W>>1,y:L.H-3};
  let fy=s.y;while(fy<L.H&&!solidAt(s.x,fy))fy++;
  B={type:L.d.boss,D,name:D.name,t:0,st:'intro',stT:D.introT||1.6,inv:0,dead:false,deadT:0,ph:-1,hp:1,trans:0,
    sx:s.x*TS+8,floor:fy*TS,w:20,h:20,x:0,y:0,vx:0,vy:0,dark:false,warns:[],wax:new Map(),cnt:0};
  L.lava=null;L.balls.length=0;
  D.make(B);
  startPhase(0,true);
  return B;
}
function startPhase(i,first){
  B.ph=i;B.hp=B.D.phases[i].hp;B.giveShield=true;B.trans=first?0:1.4;B.inv=first?0:1.4;
  if(!first){sfx('phase');shk(8);L.balls.length=0;for(const e of L.enemies)if(e.spawned)e.alive=false;}
  if(B.D.phase&&!first)B.D.phase(B,i);
  if(!first)showHint(`FASE ${i+1} · ${B.D.phases[i].n}`,2.4);
}
function hurtBoss(){
  if(B.inv>0||B.trans>0||B.dead)return false;
  B.hp--;B.inv=.9;sfx('hurt');shk(6);
  puff(B.x+B.w/2,B.y+B.h/2,20,B.D.cols,100,.6,150,2);
  if(B.hp<=0){if(B.ph<B.D.phases.length-1)startPhase(B.ph+1);else bossDie();}
  return true;
}
function bossDie(){
  B.dead=true;B.deadT=0;L.exitOn=true;shk(10);sfx('boom');sfx('win');
  for(const e of L.enemies)if(e.spawned)e.alive=false;
  L.balls.length=0;if(L.lava&&L.lava.boss)L.lava=null;B.dark=false;
  puff(B.x+B.w/2,B.y+B.h/2,60,B.D.cols,160,1.4,60,2);
  if(B.D.ach)unlock(B.D.ach);if(L.hitsTaken===0)unlock('intocable');
  save.stats.bosses++;
  showHint(B.D.outro||'El farol ha aparecido',3.5);
}
function updBoss(dt){
  if(!B)return;
  B.t+=dt;if(B.inv>0)B.inv-=dt;
  if(B.giveShield&&P&&!P.dead){B.giveShield=false;P.shield=true;sfx('shieldup');puff(P.x+P.w/2,P.y+P.h/2,16,['#8ff7ff','#ffffff'],50,.5,0,1);}
  for(let i=B.warns.length-1;i>=0;i--){const w=B.warns[i];w.t-=dt;if(w.t<=0){B.warns.splice(i,1);w.go&&w.go();}}
  B.wax.forEach((t,k)=>{t-=dt;if(t<=0){B.wax.delete(k);const tx=k%L.W,ty=(k/L.W)|0;if(L.g[ty][tx]==='W')L.g[ty][tx]='.';puff(tx*TS+8,ty*TS+8,6,['#f4e8da','#d8c4ae'],30,.5,100,2);}else B.wax.set(k,t);});
  if(B.dead){B.deadT+=dt;if(B.deadT<1.8&&Math.random()<.6)puff(B.x+Math.random()*B.w,B.y+Math.random()*B.h,4,B.D.cols,90,.6,0,2);return;}
  if(B.trans>0){B.trans-=dt;if(B.D.transUpd)B.D.transUpd(B,dt);return;}
  B.stT-=dt;
  if(B.st==='intro'){if(B.D.introUpd)B.D.introUpd(B,dt);if(B.stT<=0){B.st=B.D.startSt;B.stT=.8;}return;}
  B.D.upd(B,dt);
}
function bossTouch(){
  if(!B||B.dead||B.trans>0)return false;
  return B.D.touch(B);
}
// ¿el jugador cae sobre este rectángulo?
function stompOn(x,y,w,h){
  return P.vy>0&&P.prevBottom<=y+8&&ov(P.x,P.y,P.w,P.h,x,y,w,h);
}
function bounce(){P.vy=keys.jump?-400:-330;P.canCut=false;P.onGround=false;P.canDash=true;P.airJump=Math.max(P.airJump,P.wings?1:0);}
function drawBoss(cx,cy){if(B&&!(B.dead&&B.deadT>1.8))B.D.draw(B,cx,cy);
  for(const w of B?B.warns:[])if(w.draw)w.draw(cx,cy);}
function drawBossBack(cx,cy){if(B&&B.D.back)B.D.back(B,cx,cy);}
function drawBossFront(cx,cy){if(B&&B.D.front)B.D.front(B,cx,cy);}
function bossRespawn(){}
function warnCol(x,t,go){B.warns.push({t,go,draw:(cx,cy)=>{if((L.clock*14|0)%2)return;ctx.fillStyle='rgba(255,84,112,.35)';ctx.fillRect(x-5-cx,0,10,VH);ctx.fillStyle='#ff5470';ctx.fillRect(x-1-cx,2,2,6);}});}
function shot(x,y,vx,vy,o){L.balls.push(Object.assign({x,y,vx,vy,g:0},o||{}));}
function ring(x,y,n,sp,off,o){for(let k=0;k<n;k++){const a=off+k/n*Math.PI*2;shot(x,y,Math.cos(a)*sp,Math.sin(a)*sp,o);}}
function aimAt(x,y,sp){const a=Math.atan2(P.y+P.h/2-y,P.x+P.w/2-x);return[Math.cos(a)*sp,Math.sin(a)*sp];}
const drawNote=col=>(x,y)=>{ctx.fillStyle=col;ctx.fillRect(x-2,y,4,3);ctx.fillRect(x+1,y-6,1,7);ctx.fillRect(x+1,y-6,3,1);ctx.fillStyle='#fff';ctx.fillRect(x-1,y,1,1);};
const drawShard=(x,y)=>{ctx.fillStyle='#dff4ff';ctx.fillRect(x-3,y-1,6,2);ctx.fillStyle='#8fd8ff';ctx.fillRect(x-1,y-3,2,6);ctx.fillStyle='#fff';ctx.fillRect(x,y,1,1);};
const drawIcicle=(x,y)=>{ctx.fillStyle='#bfe8ff';ctx.beginPath();ctx.moveTo(x-4,y-8);ctx.lineTo(x+4,y-8);ctx.lineTo(x,y+6);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-2,y-7,1,6);};

// ============================================================
//  I · EL CAMPANERO (mini-jefe)
// ============================================================
BOSS.campanero={
  name:'EL CAMPANERO',title:'El que tañe por los apagados',ach:'boss1',cols:['#3a2f4a','#b08a3a','#ffd166','#cbb8ff'],
  intro:'«Cada campanada es un nombre olvidado. El tuyo suena bien.»',outro:'La campana calla. Sube.',
  phases:[{hp:2,n:'Campanadas'},{hp:2,n:'Suelo de púas'},{hp:2,n:'Toque de difuntos'}],
  startSt:'patrol',introUpd(B,dt){B.y+=(B.beamY-B.y)*Math.min(1,dt*2);},
  make(B){B.w=20;B.h=22;B.x=B.sx-10;B.y=-30;B.bx=B.sx;B.by=40;B.swing=0;B.rings=0;B.side=1;B.beamY=26;},
  phase(B,i){
    B.st='patrol';B.stT=1.2;B.rings=0;
    if(i===1){for(let x=9;x<=14;x++)L.g[11][x]='^';bakeLevel();}
    if(i===2){B.dark=true;}
  },
  upd(B,dt){
    const D=this,ph=B.ph,W=L.W*TS;
    B.swing*=Math.pow(.2,dt);
    const toward=(tx,ty,sp)=>{B.x+=clamp(tx-B.x,-sp*dt,sp*dt);B.y+=clamp(ty-B.y,-sp*dt,sp*dt);return Math.abs(tx-B.x)<2&&Math.abs(ty-B.y)<2;};
    switch(B.st){
      case 'patrol':{
        const tx=B.sx-10+Math.sin(B.t*1.3)*120;B.x+=clamp(tx-B.x,-90*dt,90*dt);B.y+=(B.beamY-B.y)*Math.min(1,dt*4);
        if(B.stT<=0){B.st='toBell';}break;}
      case 'toBell':if(toward(B.bx-10+(B.x<B.bx-10?-26:26),B.beamY+8,140)){B.st='pull';B.stT=.75;}break;
      case 'pull':B.y=B.beamY+8+Math.sin(B.stT*30)*2;if(B.stT<=0){D.ring(B);B.rings++;
        const n=3,swoop=ph===2&&B.rings<n;
        if(B.rings>=n){B.st='toDizzy';B.side=P.x<W/2?1:-1;B.rings=0;}
        else if(swoop){B.st='aim';B.stT=.55;}
        else{B.st='patrol';B.stT=ph?0.6:1.0;}}break;
      case 'aim':B.x+=Math.sin(B.t*60)*1.2;if(B.stT<=0){B.st='swoop';B.tx=P.x+P.w/2-10;B.ty=P.y-6;B.stT=1.1;sfx('roar');}break;
      case 'swoop':if(toward(B.tx,B.ty,230)||B.stT<=0){B.st='rise';}break;
      case 'rise':if(toward(B.x,B.beamY,150)){B.st='patrol';B.stT=.4;}break;
      case 'toDizzy':{const tx=(B.side>0?88:W-88)-10;if(toward(tx,70,150)){B.st='dizzy';B.stT=[4,3.3,2.7][ph];sfx('tick');}break;}
      case 'dizzy':B.y=70+Math.sin(B.t*3)*2;if(B.stT<=0){B.st='rise';}break;
    }
  },
  ring(B){
    sfx('bell');shk(5);B.swing=1;
    const fy=B.floor-TS-6+16-12+2;// sobre el suelo
    for(const d of[-1,1])shot(B.bx,B.floor-7,d*140,0,{r:5,draw:(x,y)=>{ctx.fillStyle='rgba(203,184,255,.8)';ctx.fillRect(x-4,y-5,8,12);ctx.fillStyle='#fff';ctx.fillRect(x-1,y-6,2,13);ctx.fillStyle='rgba(203,184,255,.35)';ctx.fillRect(x-8*d-4,y-2,6,9);}});
    const n=B.ph===0?2:3;
    for(let k=0;k<n;k++){const x=clamp(P.x+P.w/2+rnd(-70,70),28,L.W*TS-28);
      warnCol(x,.75+k*.18,()=>shot(x,20,0,0,{g:620,r:4,col:'#8a7aa0'}));}
    if(B.ph>=1)ring(B.bx,B.by+18,8,70,B.t,{r:3,draw:drawNote('#cbb8ff')});
  },
  touch(B){
    if(B.st==='dizzy'){if(stompOn(B.x,B.y,B.w,B.h)){const ph=B.ph;hurtBoss();bounce();if(B.ph===ph)B.st='rise';}return false;}
    if(B.inv<=0&&ov(P.x+1,P.y+2,P.w-2,P.h-3,B.x+3,B.y+3,B.w-6,B.h-4)){die();return true;}
    return false;
  },
  back(B,cx,cy){
    // viga, cuerda y campana
    const W=L.W*TS;ctx.fillStyle='#2a2036';ctx.fillRect(16-cx,18-cy,W-32,6);ctx.fillStyle='#4a3a5a';ctx.fillRect(16-cx,18-cy,W-32,1);
    const bx=B.bx-cx,by=B.by-cy,a=Math.sin(L.clock*8)*B.swing*.35;
    ctx.save();ctx.translate(bx,24-cy);ctx.rotate(a);
    ctx.fillStyle='#5a4630';ctx.fillRect(-1,0,2,by-24+cy-4);
    ctx.translate(0,by-24+cy);
    ctx.fillStyle='#8a6a2a';ctx.beginPath();ctx.moveTo(-9,-6);ctx.lineTo(9,-6);ctx.lineTo(16,18);ctx.lineTo(-16,18);ctx.fill();
    ctx.fillStyle='#b08a3a';ctx.fillRect(-9,-8,18,4);ctx.fillRect(-17,16,34,4);ctx.fillStyle='#e0b860';ctx.fillRect(-6,-4,2,18);
    ctx.fillStyle='#3a2a10';ctx.fillRect(-2,19,4,5);ctx.restore();
  },
  draw(B,cx,cy){
    const x=Math.round(B.x-cx),y=Math.round(B.y-cy),t=L.clock,fl=B.inv>0&&((t*20|0)%2),dz=B.st==='dizzy';
    // cuerda
    ctx.strokeStyle='#6a5a40';ctx.beginPath();ctx.moveTo(x+10,18-cy+6);ctx.lineTo(x+10,y+2);ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#2e2440';ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+20,y+8);ctx.lineTo(x+22,y+22);ctx.lineTo(x-2,y+22);ctx.lineTo(x,y+8);ctx.fill();
    ctx.fillStyle=fl?'#fff':'#443658';ctx.fillRect(x+3,y+4,14,4);ctx.fillRect(x+1,y+18,18,4);
    for(let k=0;k<4;k++){ctx.fillStyle='#2e2440';ctx.fillRect(x+k*5,y+22,3,2+Math.round(Math.sin(t*6+k)*1+1));}
    ctx.fillStyle='#0a0612';ctx.fillRect(x+5,y+6,10,8);
    const ec=B.ph===2?'#ff5470':'#ffd166';
    if(dz){ctx.fillStyle=ec;ctx.fillRect(x+6,y+9,3,1);ctx.fillRect(x+7,y+8,1,3);ctx.fillRect(x+11,y+9,3,1);ctx.fillRect(x+12,y+8,1,3);
      for(let k=0;k<3;k++){const a=t*4+k*2.1;ctx.fillStyle='#ffd166';ctx.fillRect(x+10+Math.cos(a)*12,y-4+Math.sin(a)*3,2,2);}}
    else{ctx.fillStyle=ec;ctx.fillRect(x+6,y+8,3,3);ctx.fillRect(x+11,y+8,3,3);if(B.st==='aim'){ctx.fillStyle='#fff';ctx.fillRect(x+7,y+9,1,1);ctx.fillRect(x+12,y+9,1,1);}}
    ctx.fillStyle='#d8ccc0';ctx.fillRect(x+8,y+14,2,3);ctx.fillRect(x+11,y+14,2,3);
  },
};

// ============================================================
//  I · MADRE CIRIO (jefa del reino)
// ============================================================
BOSS.cirio={
  name:'MADRE CIRIO',title:'La primera vela',ach:'boss2',cols:['#f4e8da','#ffd166','#ff8a3d','#d8c4ae'],introT:2,
  intro:'«Niña brasa… yo encendí esta torre. Déjame apagarte con cariño.»',outro:'Su mecha se enfría. Tu luz es tuya ahora.',
  phases:[{hp:3,n:'Llanto de cera'},{hp:3,n:'Marea de cera'},{hp:3,n:'Pabilo desnudo'}],
  startSt:'cry',introUpd(B,dt){B.bodyH+=(100-B.bodyH)*Math.min(1,dt*2);const hr=BOSS.cirio.headRect(B);B.x=hr[0];B.y=hr[1];},
  make(B){B.w=20;B.h=18;B.bodyH=10;B.bodyT=100;B.mode='candle';B.cx=B.sx;},
  phase(B,i){
    B.st='cry';B.stT=2.4;B.cnt=0;
    if(i===1){L.lava={y:B.floor+2,sp:0,delay:0,wax:true,boss:true};B.st='cry';}
    if(i===2){L.lava=null;B.mode='wick';B.dark=true;B.x=B.cx-7;B.y=B.floor-60;B.w=14;B.h=16;B.vx=0;B.vy=-200;B.st='air';B.light=60;
      for(let k=0;k<30;k++)puff(B.cx+rnd(-24,24),B.floor-rnd(0,90),2,this.cols,80,1,200,2);}
  },
  transUpd(B,dt){if(B.ph===2)B.bodyH=Math.max(0,B.bodyH-dt*90);},
  headRect(B){const top=B.floor-B.bodyH-20;return[B.cx-9,top,18,20];},
  upd(B,dt){
    const ph=B.ph;
    if(ph===1&&L.lava){const per=7,a=(1-Math.cos(B.t*Math.PI*2/per))/2;L.lava.y=B.floor+2-a*64;}
    if(B.mode==='candle'){
      B.bodyH+=(B.bodyT-B.bodyH)*Math.min(1,dt*(B.st==='bow'?3:2));
      const hr=this.headRect(B);B.x=hr[0];B.y=hr[1];B.w=hr[2];B.h=hr[3];
      switch(B.st){
        case 'cry':B.bodyT=100;
          if(B.stT<=0){B.cnt++;B.stT=ph?.38:.5;this.drop(B);
            if(B.cnt>=(ph?8:6)){B.cnt=0;B.st='bowT';B.stT=.7;sfx('roar');}}break;
        case 'bowT':B.bodyT=96+Math.sin(B.t*40)*2;if(B.stT<=0){B.st='bow';B.stT=ph?2.1:2.6;B.bodyT=ph?44:52;}break;
        case 'bow':if(B.stT<=0){B.st='spit';B.stT=.3;}break;
        case 'spit':if(B.stT<=0){B.bodyT=100;const n=ph?7:5;for(let k=0;k<n;k++){const vx=(k-(n-1)/2)*42;shot(B.cx,B.y,vx,-260-Math.abs(vx)*.3,{g:520,r:3.5});}
          sfx('cannon');B.st='cry';B.stT=1;}break;
      }
    }else{
      // pabilo: salta hacia ti y deja fuego
      B.vy=Math.min(B.vy+GRAV*dt,MAXFALL);
      if(moveX(B,B.vx*dt))B.vx*=-1;
      const r=moveY(B,B.vy*dt,false);
      if(B.st==='air'&&r===1){B.vy=0;B.vx=0;B.st='land';B.stT=.85;sfx('stomp');shk(3);
        ring(B.x+7,B.y+8,8,95,B.t,{r:3});
        shot(B.x+7,B.floor-6,0,0,{ghost:1,r:5,life:2.2,draw:(x,y)=>{const f=Math.sin(L.clock*30+x)*2;ctx.fillStyle='#ff5a1f';ctx.fillRect(x-5,y-4+f,10,10-f);ctx.fillStyle='#ffd166';ctx.fillRect(x-2,y-1+f,4,6-f);}});}
      else if(B.st==='land'&&B.stT<=0){B.st='air';const d=P.x-B.x;B.vy=-rnd(330,420);B.vx=clamp(d*.9,-150,150);}
      if(B.y>L.H*TS)B.y=B.floor-40;
    }
  },
  drop(B){
    const tx=clamp(P.x+P.w/2+rnd(-50,50),30,L.W*TS-30),y0=B.floor-B.bodyH-26,T=1.0;
    const vx=(tx-B.cx)/T,vy=(B.floor-8-y0)/T-.5*500*T;
    shot(B.cx,y0,vx,vy,{g:500,r:4,col:'#f4e8da',onHit:b=>{
      const tx2=Math.floor(b.x/TS);let ty=Math.floor(b.y/TS);
      if(solidAt(tx2,ty))ty--;
      if(ty>0&&tx2>0&&tx2<L.W-1&&L.g[ty][tx2]==='.'&&!ov(P.x,P.y,P.w,P.h,tx2*TS,ty*TS,TS,TS)){L.g[ty][tx2]='W';B.wax.set(ty*L.W+tx2,B.ph?9:7);}
      puff(b.x,b.y,6,['#f4e8da','#fff'],40,.4,100,1);}});
  },
  touch(B){
    if(B.mode==='candle'){
      const[x,y,w,h]=this.headRect(B);
      if(B.st==='bow'&&stompOn(x,y,w,h)){const ph=B.ph;hurtBoss();bounce();if(B.ph===ph&&!B.dead){B.st='spit';B.stT=.5;}return false;}
      if(B.inv<=0&&ov(P.x+1,P.y+2,P.w-2,P.h-3,x+3,y+4,w-6,h-4)){die();return true;}
      return false;
    }
    if(B.st==='land'&&stompOn(B.x,B.y,B.w,B.h)){hurtBoss();bounce();if(!B.dead){B.st='air';B.vy=-380;B.vx=P.x<B.x?150:-150;}return false;}
    if(B.inv<=0&&ov(P.x+1,P.y+2,P.w-2,P.h-3,B.x+2,B.y+2,B.w-4,B.h-3)){die();return true;}
    return false;
  },
  back(B,cx,cy){
    if(B.bodyH<=1)return;
    const x=B.cx-cx,base=B.floor-cy,top=base-B.bodyH,t=L.clock;
    ctx.fillStyle='#e8dcc8';ctx.fillRect(x-24,top,48,B.bodyH);
    ctx.fillStyle='#fff8ec';ctx.fillRect(x-24,top,6,B.bodyH);ctx.fillStyle='#cbb8a0';ctx.fillRect(x+16,top,8,B.bodyH);
    for(let k=0;k<6;k++){const dx=-22+k*9,dl=6+((k*7)%5)*4+Math.sin(t+k)*2;ctx.fillStyle='#f4e8da';ctx.fillRect(x+dx,top,5,dl);ctx.fillRect(x+dx+1,top+dl,3,2);}
    // rostro sereno
    const fy=top+18,angry=B.st==='bowT'||B.st==='spit'||B.ph>0;
    ctx.fillStyle='#8a6a4a';
    if(angry){ctx.fillStyle='#ff8a3d';ctx.fillRect(x-12,fy,6,3);ctx.fillRect(x+6,fy,6,3);ctx.fillStyle='#fff1b8';ctx.fillRect(x-10,fy+1,2,1);ctx.fillRect(x+8,fy+1,2,1);}
    else{ctx.fillRect(x-12,fy+1,6,1);ctx.fillRect(x+6,fy+1,6,1);ctx.fillRect(x-11,fy+2,4,1);ctx.fillRect(x+7,fy+2,4,1);}
    ctx.fillStyle='#8a6a4a';ctx.fillRect(x-3,fy+12,6,1);if(angry)ctx.fillRect(x-4,fy+13,8,2);
    // lágrimas de cera
    ctx.fillStyle='#fff8ec';ctx.fillRect(x-10,fy+4+(t*8%10),2,3);ctx.fillRect(x+8,fy+4+((t*8+5)%10),2,3);
    // corona de velitas
    for(let k=-2;k<=2;k++){const vx=x+k*10-2,vy=top-7-(k===0?3:0);ctx.fillStyle='#f4e8da';ctx.fillRect(vx,vy,4,7);ctx.fillStyle='#ffd166';ctx.fillRect(vx+1,vy-3+Math.sin(t*20+k),2,3);}
  },
  draw(B,cx,cy){
    const t=L.clock,fl=B.inv>0&&((t*20|0)%2);
    if(B.mode==='candle'){
      const[x0,y0]=this.headRect(B),x=x0-cx+9,y=y0-cy+20,vul=B.st==='bow';
      ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y-10,34,vul?'rgba(255,240,180,A)':'rgba(255,140,50,A)',.45);ctx.restore();
      ctx.fillStyle='#2a2226';ctx.fillRect(x-1,y-2,2,4);
      ctx.save();ctx.translate(x,y);const s=vul?1.3:1.6;ctx.scale(s,s);
      ctx.fillStyle=fl?'#fff':'#ff5a1f';flame(6,16+Math.sin(t*20),Math.sin(t*6)*2);
      ctx.fillStyle=fl?'#fff':'#ffa53d';flame(4.5,12,Math.sin(t*6));ctx.fillStyle='#fff1b8';flame(3,7,0);
      ctx.fillStyle='#3a0d12';if(vul){ctx.fillRect(-3,-6,2,1);ctx.fillRect(1,-6,2,1);}else{ctx.fillRect(-3,-7,1.5,2.5);ctx.fillRect(1.5,-7,1.5,2.5);}
      ctx.restore();
      if(vul&&(t*3|0)%2){ctx.fillStyle='#ffd166';ctx.fillRect(x-1,y-44,2,5);ctx.fillRect(x-3,y-40,6,1);}
    }else{
      const x=Math.round(B.x-cx)+7,y=Math.round(B.y-cy)+B.h,vul=B.st==='land';
      ctx.save();ctx.translate(x,y);ctx.scale(1.3,1.3);
      ctx.fillStyle=fl?'#fff':vul?'#8a5a3a':'#ff5a1f';flame(6,15+Math.sin(t*25)*2,-B.vx*.03);
      ctx.fillStyle=vul?'#c89a6a':'#ffd166';flame(4,10,-B.vx*.02);
      ctx.fillStyle='#2a0a0a';ctx.fillRect(-3,-7,2,vul?1:2);ctx.fillRect(1,-7,2,vul?1:2);ctx.restore();
    }
  },
};

// ============================================================
//  II · EL TÉMPANO (persecución)
// ============================================================
BOSS.tempano={
  name:'EL TÉMPANO',title:'La avalancha que piensa',ach:'boss3',cols:['#dff4ff','#8fd8ff','#ffffff','#5ab0ff'],introT:2.2,
  intro:'«Tu calor me despertó. Ahora corre, chispa, CORRE.»',outro:'Hecho agua. El camino sigue.',
  phases:[{hp:1,n:'La estampida'},{hp:1,n:'Ventisca'},{hp:1,n:'Derrumbe'}],
  startSt:'run',
  make(B){B.front=-60;B.x=-60;B.y=0;B.w=40;B.h=L.H*TS;B.icT=2;B.furn=(L.d.furnaces||[]).map(c=>({x:c,lit:false}));},
  phase(B,i){B.icT=1.5;},
  upd(B,dt){
    const sp=[54,62,70][B.ph];
    if(B.st==='knock'){B.front-=dt*260;if(B.stT<=0)B.st='run';}
    else B.front+=sp*dt;
    if(P.x-B.front>320)B.front=P.x-320;
    B.x=B.front-40;
    if(Math.random()<.4)puff(B.front,rnd(0,L.H*TS),1,this.cols,40,.6,0,2);
    B.icT-=dt;
    if(B.icT<=0){B.icT=[1.7,1.3,1.0][B.ph];const x=P.x+P.w/2+rnd(40,150);
      let ty=Math.floor(P.y/TS);while(ty>0&&!solidAt(Math.floor(x/TS),ty-1))ty--;
      const y0=ty*TS+2;warnCol(x,.6,()=>shot(x,y0,0,0,{g:700,r:4,draw:drawIcicle}));}
    for(const f of B.furn){if(!f.lit&&P.heat>0&&ov(P.x,P.y,P.w,P.h,f.x*TS,0,TS*2,L.H*TS)&&Math.abs(P.x-f.x*TS)<24){
      const fy=this.furnY(f);if(Math.abs(P.y+P.h-fy)<40){f.lit=true;sfx('boom');shk(8);B.st='knock';B.stT=.6;
        for(let k=0;k<40;k++)parts.push({x:f.x*TS+16,y:fy-10,vx:-rnd(80,260),vy:rnd(-80,40),life:.9,max:.9,col:EMBER[k%4],g:0,s:3});
        showHint('¡El horno ruge!',1.5);hurtBoss();}}}
  },
  furnY(f){let ty=L.H-1;while(ty>0&&solidAt(f.x,ty-1))ty--;while(ty<L.H&&!solidAt(f.x,ty))ty++;return ty*TS;},
  touch(B){if(P.x<B.front-2){die(true);return true;}return false;},
  front(B,cx,cy){
    const x=B.front-cx,t=L.clock;if(x<-50)return;
    ctx.fillStyle='rgba(200,236,255,.95)';ctx.fillRect(x-400,0,400,VH);
    ctx.fillStyle='#dff4ff';for(let y=0;y<VH;y+=8){const j=Math.sin(y*.3+t*6)*4+((y*13)%9);ctx.fillRect(x-4,y,6+j,8);}
    ctx.fillStyle='#8fd8ff';for(let y=4;y<VH;y+=16)ctx.fillRect(x-20+((y*7)%12),y,10,2);
    // cara
    const fy=clamp(P.y-cy-10,30,VH-60),angry=B.st!=='knock';
    ctx.fillStyle='#1e5a7a';ctx.fillRect(x-30,fy,8,angry?4:8);ctx.fillRect(x-14,fy,8,angry?4:8);
    ctx.fillStyle='#fff';ctx.fillRect(x-27,fy+1,2,2);ctx.fillRect(x-11,fy+1,2,2);
    ctx.fillStyle='#1e5a7a';ctx.fillRect(x-30,fy+16,22,4);for(let k=0;k<5;k++){ctx.fillStyle='#fff';ctx.fillRect(x-29+k*4,fy+16,2,3);}
  },
  draw(B,cx,cy){
    for(const f of B.furn){const x=f.x*TS-cx,y=this.furnY(f)-cy,t=L.clock;if(x<-40||x>VW+40)continue;
      ctx.fillStyle='#3a3236';ctx.fillRect(x,y-30,32,30);ctx.fillStyle='#57494f';ctx.fillRect(x-2,y-32,36,4);ctx.fillRect(x+10,y-44,12,12);
      ctx.fillStyle=f.lit?'#ff8a3d':'#1a1416';ctx.fillRect(x+6,y-22,20,16);
      if(f.lit){ctx.fillStyle='#ffd166';ctx.fillRect(x+10,y-18+Math.sin(t*20),12,10);if(Math.random()<.4)parts.push({x:f.x*TS+16,y:y+cy-44,vx:rnd(-10,10),vy:-40,life:.6,max:.6,col:'#8a8288',g:-10,s:2});}
      else{ctx.fillStyle='#dff4ff';ctx.fillRect(x+6,y-22,20,2);if((t*3|0)%2){ctx.fillStyle='#ff8a3d';ctx.fillRect(x+13,y-60,6,6);ctx.fillStyle='#1a1416';ctx.fillRect(x+15,y-58,2,2);}}}
  },
};

// ============================================================
//  II · LA BICÉFALA
// ============================================================
BOSS.bicefala={
  name:'LA BICÉFALA',title:'Ígnea y Gélida',ach:'boss4',cols:['#ff8a3d','#ffd166','#8fd8ff','#dff4ff'],introT:2.2,
  intro:'«¿Calor o frío?» «¿Frío o calor?» «Ninguno te va a salvar.»',outro:'Las dos cabezas por fin se callan.',
  phases:[{hp:4,n:'Dos voces'},{hp:4,n:'Suelo fundido'},{hp:4,n:'Una sola garganta'}],
  startSt:'fight',
  make(B){
    const W=L.W*TS;B.bodyX=W/2;B.bodyY=34;B.w=20;B.h=18;
    B.heads=[{el:1,rx:W/2-60,ry:74,x:W/2-60,y:74,st:'idle',t:0,hp:2,fire:0},{el:-1,rx:W/2+60,ry:74,x:W/2+60,y:74,st:'idle',t:1.5,hp:2,fire:0}];
    B.turn=0;B.spin=0;B.told=false;
  },
  phase(B,i){
    const W=L.W*TS;
    B.heads.forEach((h,k)=>{h.hp=2;h.st='idle';h.t=1+k*1.2;h.x=h.rx;h.y=h.ry;});
    if(i===1){const fr=Math.floor(B.floor/TS);for(let x=7;x<=16;x++){L.g[fr][x]='~';L.g[fr+1][x]='~';}bakeLevel();}
    if(i===2){B.merged={x:W/2,y:74,st:'idle',t:1.2,el:1,elT:3,hp:4};}
  },
  headBox(h){return[h.x-10,h.y-9,20,18];},
  upd(B,dt){
    const W=L.W*TS,ph=B.ph;
    const heads=ph===2?[B.merged]:B.heads;
    if(ph===2){const m=B.merged;m.elT-=dt;if(m.elT<=0&&m.st!=='down'){m.el*=-1;m.elT=3;sfx(m.el>0?'hot':'cold');}
      if(m.st==='idle'){B.spin+=dt;if((B.spin*6|0)!==((B.spin-dt)*6|0)){const a=B.spin*1.7,el=((B.spin*6|0)%2)?1:-1;
        for(let k=0;k<3;k++){const aa=a+k*Math.PI*2/3;shot(B.bodyX,B.bodyY+10,Math.cos(aa)*80,Math.sin(aa)*80,el>0?{r:3.5}:{r:3.5,draw:drawShard});}}}}
    for(const h of heads){
      h.t-=dt;
      switch(h.st){
        case 'idle':h.x+=(h.rx-h.x)*Math.min(1,dt*3);h.y+=(h.ry+Math.sin(B.t*2+h.el)*4-h.y)*Math.min(1,dt*3);
          if(ph<2){h.fire-=dt;if(h.fire<=0&&!heads.some(o=>o!==h&&o.st==='idle'&&o.fire<.3)){h.fire=h.el>0?1.6:1.3;
            if(h.el>0){for(let k=-1;k<=1;k++){const T=.9,tx=P.x+P.w/2+k*28,vx=(tx-h.x)/T,vy=(P.y-h.y)/T-.5*420*T;shot(h.x,h.y+6,vx,vy,{g:420,r:3.5});}sfx('cannon');}
            else{for(let k=-1;k<=1;k++){const[vx,vy]=aimAt(h.x,h.y,150);const a=Math.atan2(vy,vx)+k*.2;shot(h.x,h.y+6,Math.cos(a)*150,Math.sin(a)*150,{r:3,draw:drawShard});}sfx('cold');}}}
          if(h.t<=0&&(h.hp>0||ph===2)){
            const other=heads.find(o=>o!==h);
            if(ph===0&&other&&other.st!=='idle'){h.t=.5;break;}
            h.st='aim';h.t=.6;const lo=ph===2?30:h.el>0?30:W/2+16,hi=ph===2?W-30:h.el>0?W/2-16:W-30;
            h.tx=clamp(P.x+P.w/2,lo,hi);sfx('roar');}
          break;
        case 'aim':h.x+=(h.tx-h.x)*Math.min(1,dt*6);h.y=h.ry+Math.sin(B.t*50)*2;if(h.t<=0){h.st='dive';}break;
        case 'dive':h.y+=dt*520;if(h.y>=B.floor-10){h.y=B.floor-10;h.st='down';h.t=ph===1?2.4:ph===2?1.8:2.2;shk(4);sfx('stomp');
          if(ph===1)for(const d of[-1,1])shot(h.x,B.floor-6,d*120,0,{r:4,col:h.el>0?'#ff8a3d':'#8fd8ff'});}break;
        case 'down':if(h.t<=0){h.st='up';}break;
        case 'up':h.y+=(h.ry-h.y)*Math.min(1,dt*4);h.x+=(h.rx-h.x)*Math.min(1,dt*3);if(Math.abs(h.y-h.ry)<3){h.st='idle';h.t=ph===1?1.4:ph===2?.9:1.8;}break;
      }
    }
    B.x=B.bodyX-24;B.y=B.bodyY-10;B.w=48;B.h=40;
  },
  touch(B){
    const heads=B.ph===2?[B.merged]:B.heads;
    for(const h of heads){
      const[x,y,w,hh]=this.headBox(h);
      if((h.st==='down'||h.st==='up')&&stompOn(x,y,w,hh)){
        const need=-h.el;// fuego necesita frío (-1), hielo necesita calor (+1)
        bounce();
        if(Math.sign(P.heat)===need&&(h.hp>0||B.ph===2)){if(B.inv<=0&&B.trans<=0){h.hp--;h.st='up';P.heat=0;hurtBoss();}}
        else{sfx('no');if(!B.told||Math.random()<.3){B.told=true;showHint(h.el>0?'Ígnea se ríe: solo teme al FRÍO':'Gélida se ríe: solo teme al CALOR',2.2);}}
        return false;
      }
      if(B.inv<=0&&h.st!=='idle'&&ov(P.x+1,P.y+2,P.w-2,P.h-3,x+2,y+2,w-4,hh-4)){die();return true;}
    }
    return false;
  },
  back(B,cx,cy){
    const t=L.clock,x=B.bodyX-cx,y=B.bodyY-cy;
    const heads=B.ph===2?[B.merged]:B.heads;
    for(const h of heads){ctx.strokeStyle=B.ph===2?'#6a4a5a':h.el>0?'#6a3a2a':'#2a4a6a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x+(h.el>0?-12:12)*(B.ph===2?0:1),y+14);
      ctx.quadraticCurveTo((x+h.x-cx)/2,y+50,h.x-cx,h.y-cy);ctx.stroke();ctx.lineWidth=1;}
    ctx.fillStyle='#3a3236';ctx.beginPath();ctx.moveTo(x-30,y);ctx.lineTo(x+30,y);ctx.lineTo(x+22,y+26);ctx.lineTo(x-22,y+26);ctx.fill();
    ctx.fillStyle='#57494f';ctx.fillRect(x-32,y-4,64,6);ctx.fillStyle='#ff8a3d';ctx.fillRect(x-20,y+8,14,8);ctx.fillStyle='#8fd8ff';ctx.fillRect(x+6,y+8,14,8);
    ctx.fillStyle='#ffd166';ctx.fillRect(x-16,y+10+Math.sin(t*10),6,4);ctx.fillStyle='#fff';ctx.fillRect(x+10,y+10,6,4);
  },
  draw(B,cx,cy){
    const t=L.clock,fl=B.inv>0&&((t*20|0)%2);
    const heads=B.ph===2?[B.merged]:B.heads;
    for(const h of heads){
      const x=Math.round(h.x-cx),y=Math.round(h.y-cy),fire=h.el>0,dead=B.ph<2&&h.hp<=0,vul=h.st==='down';
      const c=dead?['#4a4450','#2a2430']:fire?['#c2402a','#ff8a3d']:['#3a7aa8','#bfe8ff'];
      ctx.save();ctx.globalCompositeOperation='lighter';glow(x,y,28,fire?'rgba(255,120,40,A)':'rgba(120,200,255,A)',dead?.05:.3);ctx.restore();
      ctx.fillStyle=fl?'#fff':c[0];ctx.fillRect(x-10,y-8,20,16);ctx.fillRect(x-8,y-10,16,2);
      ctx.fillStyle=c[1];ctx.fillRect(x-8,y-6,16,3);
      if(fire){ctx.fillStyle='#ffd166';for(let k=-1;k<=1;k++)ctx.fillRect(x+k*6-1,y-14+Math.sin(t*20+k)*2,3,5);}
      else{ctx.fillStyle='#dff4ff';for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(x+k*6-3,y-10);ctx.lineTo(x+k*6+3,y-10);ctx.lineTo(x+k*6,y-17);ctx.fill();}}
      ctx.fillStyle=vul?'#fff':'#1a0a0a';ctx.fillRect(x-6,y-2,4,vul?1:3);ctx.fillRect(x+2,y-2,4,vul?1:3);
      ctx.fillStyle='#1a0a0a';ctx.fillRect(x-6,y+4,12,3);ctx.fillStyle=fire?'#ffd166':'#fff';for(let k=0;k<3;k++)ctx.fillRect(x-5+k*4,y+4,2,2);
      if(vul){ctx.fillStyle=fire?'#8fd8ff':'#ff8a3d';const a=(t*4|0)%2;ctx.fillRect(x-1,y-24-a,2,4);ctx.fillRect(x-3,y-22-a,6,1);}
    }
  },
};
