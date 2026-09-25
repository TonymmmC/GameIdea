'use strict';
// ============================================================
//  AUDIO — todo sintetizado, sin archivos
// ============================================================
let AC=null,master,sfxBus,musBus,noiseBuf;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=.8;master.connect(AC.destination);
    sfxBus=AC.createGain();sfxBus.connect(master);
    musBus=AC.createGain();musBus.connect(master);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    applyAudioPrefs();
  }catch(e){AC=null;}
}
function applyAudioPrefs(){
  if(!AC)return;
  sfxBus.gain.value=(save.opt.sfx|0)/10;
  musBus.gain.value=(save.opt.mus|0)/10*.9;
}
function tone(f,dur,type,vol,slide,delay,bus){
  if(!AC)return;const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||.08,t+.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(bus||sfxBus);o.start(t);o.stop(t+dur+.03);
}
function noise(dur,vol,freq,delay,bus,hp){
  if(!AC)return;const t=AC.currentTime+(delay||0);
  const s=AC.createBufferSource();s.buffer=noiseBuf;
  const fl=AC.createBiquadFilter();fl.type=hp?'highpass':'lowpass';fl.frequency.value=freq||1200;
  const g=AC.createGain();g.gain.setValueAtTime(vol||.1,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(fl);fl.connect(g);g.connect(bus||sfxBus);s.start(t);s.stop(t+dur+.02);
}
function sfx(k){
  if(!AC)return;
  switch(k){
    case 'jump':tone(360,.09,'square',.05,620);break;
    case 'wall':tone(300,.1,'square',.05,720);noise(.05,.05,3000);break;
    case 'air':tone(520,.12,'triangle',.08,1040);break;
    case 'spring':tone(180,.3,'sine',.12,900);tone(360,.2,'triangle',.04,1400,.03);break;
    case 'orb':tone(660,.1,'triangle',.07);tone(990,.14,'triangle',.07,null,.06);break;
    case 'spark':[880,1175,1568,2093].forEach((f,i)=>tone(f,.16,'triangle',.06,null,i*.06));break;
    case 'coin':tone(1320,.05,'square',.03);tone(1760,.08,'square',.03,null,.04);break;
    case 'key':[523,659,784,1046].forEach((f,i)=>tone(f,.18,'square',.045,null,i*.07));break;
    case 'cp':tone(440,.12,'triangle',.07,880);tone(660,.2,'triangle',.05,null,.1);break;
    case 'stomp':tone(220,.12,'square',.07,70);noise(.08,.08,900);break;
    case 'crumble':noise(.18,.07,500);break;
    case 'land':noise(.05,.035,700);break;
    case 'die':noise(.35,.14,1800);tone(300,.4,'sawtooth',.06,50);break;
    case 'win':[523,659,784,1046,1318,1568].forEach((f,i)=>tone(f,.28,'triangle',.07,null,i*.09));break;
    case 'tick':tone(1400,.04,'square',.035);tone(700,.05,'square',.03,null,.03);break;
    case 'portal':tone(300,.25,'sine',.08,1200);tone(900,.2,'triangle',.04,300,.05);break;
    case 'cannon':noise(.12,.06,600);tone(160,.1,'square',.04,60);break;
    case 'dash':noise(.12,.07,2400);tone(200,.12,'sawtooth',.04,500);break;
    case 'break':noise(.3,.12,700);tone(90,.25,'square',.05,40);break;
    case 'pup':[660,880,1320].forEach((f,i)=>tone(f,.14,'square',.045,null,i*.05));break;
    case 'shield':tone(900,.25,'triangle',.08,300);noise(.1,.06,4000);break;
    case 'shieldup':[392,523,784].forEach((f,i)=>tone(f,.2,'triangle',.06,null,i*.07));break;
    case 'lever':tone(240,.06,'square',.06);tone(480,.08,'square',.05,null,.06);noise(.06,.05,1500);break;
    case 'door':tone(180,.3,'sawtooth',.05,90);noise(.25,.06,900);break;
    case 'candle':tone(520,.15,'triangle',.06,780);noise(.2,.05,3000,0,null,true);break;
    case 'candleout':tone(400,.25,'sine',.05,200);break;
    case 'hot':tone(160,.3,'sawtooth',.05,420);noise(.25,.06,1800);break;
    case 'cold':tone(1800,.2,'sine',.04,900);tone(2400,.15,'sine',.03,1200,.05);break;
    case 'melt':noise(.35,.07,2600,0,null,true);tone(600,.3,'sine',.04,200);break;
    case 'crust':noise(.15,.08,500);tone(120,.12,'square',.05,80);break;
    case 'bell':[196,392,588].forEach((f,i)=>tone(f,1.4,'sine',.09-i*.02,f*.98));noise(.1,.08,2000);break;
    case 'boom':noise(.5,.18,400);tone(80,.5,'sine',.15,30);break;
    case 'hurt':tone(140,.2,'square',.09,60);noise(.2,.1,1200);tone(90,.3,'sawtooth',.06,40,.05);break;
    case 'phase':[262,330,392,523,659].forEach((f,i)=>tone(f,.3,'square',.04,null,i*.05));noise(.4,.08,900);break;
    case 'roar':tone(90,.8,'sawtooth',.09,55);noise(.7,.1,600);break;
    case 'note':tone(880,.3,'sine',.05);tone(1320,.3,'sine',.03,null,.08);break;
    case 'mv':tone(660,.03,'square',.025);break;
    case 'ok':tone(880,.05,'square',.03);tone(1320,.08,'square',.03,null,.04);break;
    case 'back':tone(440,.06,'square',.03,330);break;
    case 'buy':[784,988,1175,1568].forEach((f,i)=>tone(f,.12,'square',.035,null,i*.05));break;
    case 'no':tone(160,.15,'square',.05,120);break;
    case 'ach':[523,784,1046,1568].forEach((f,i)=>tone(f,.25,'triangle',.06,null,i*.08));break;
  }
}
// ---------- música procedural
// progresión por reino; los jefes añaden percusión y suben el tempo
const mus={next:0,step:0,mode:'menu'};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function musicTick(){
  if(!AC||AC.state!=='running'||!save.opt.mus)return;
  const cfg=musicCfg();if(!cfg)return;
  const spb=60/cfg.bpm/4;
  if(mus.next<AC.currentTime)mus.next=AC.currentTime+.05;
  while(mus.next<AC.currentTime+.15){
    const s=mus.step,bar=(s>>4)&3,w=s&15,root=cfg.root+cfg.prog[bar],ch=cfg.chords[bar],t=mus.next-AC.currentTime;
    if(w===0||w===8)tone(mtof(root-24+(w===8?7:0)),.55,'sine',.09,null,t,musBus);
    if(w%2===0&&(!cfg.sparse||w%4===0))tone(mtof(root+ch[(w>>1)%4]),.2,cfg.lead||'triangle',.026,null,t,musBus);
    if(w===14&&bar%2===1)tone(mtof(root+24+ch[2]),.4,'sine',.02,null,t,musBus);
    if(cfg.drums){
      if(w%4===0)tone(110,.12,'sine',.12,40,t,musBus);
      if(w%4===2)noise(.03,.03,7000,t,musBus,true);
      if(w===4||w===12)noise(.12,.06,1800,t,musBus);
      if(cfg.drums>1&&w%2===1)noise(.02,.02,9000,t,musBus,true);
    }
    if(cfg.arp&&w%2===1)tone(mtof(root+12+ch[(w>>1)%4]),.1,'square',.012,null,t,musBus);
    mus.step=(s+1)%64;mus.next+=spb;
  }
}
setInterval(musicTick,40);
