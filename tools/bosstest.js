const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
  const p=await b.newPage();await p.setViewport({width:1152,height:648});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text());});
  await p.goto('http://localhost:8765/index.html#dev',{waitUntil:'networkidle0'});
  const W=ms=>new Promise(r=>setTimeout(r,ms));
  for(const id of['1-6','1-12','2-6','2-12']){
    const i=await p.evaluate(id=>LEVELS.findIndex(l=>l.id===id),id);
    await p.evaluate(i=>{window.__die=window.__die||die;window.die=function(){};startLevel(i,{kind:'story'});},i);
    const log=[];
    for(let ph=0;ph<3;ph++){
      await W(ph===0?9000:7000);
      await p.screenshot({path:__dirname+`/shots/boss-${id}-p${ph+1}.png`});
      const st=await p.evaluate(()=>({ph:B.ph,hp:B.hp,st:B.st,balls:L.balls.length,dead:B.dead}));
      log.push(JSON.stringify(st));
      if(id==='2-6'){
        await p.evaluate(ph=>{const f=B.furn[ph];P.heat=1;P.heatT=3;P.x=f.x*TS+4;P.y=BOSS.tempano.furnY(f)-P.h-1;P.vy=0;},ph);
        await W(400);
      }else{
        await p.evaluate(()=>{const n=B.hp;for(let k=0;k<n;k++){B.inv=0;B.trans=0;if(B.type==='bicefala'){const hs=B.ph===2?[B.merged]:B.heads;const h=hs.find(h=>h.hp>0)||hs[0];h.hp--;}hurtBoss();}});
      }
    }
    await W(2500);
    const end=await p.evaluate(()=>({dead:B.dead,exitOn:L.exitOn,shield:P.shield}));
    log.push('fin '+JSON.stringify(end));
    await p.screenshot({path:__dirname+`/shots/boss-${id}-end.png`});
    console.log(id,log.join(' | '));
  }
  await p.evaluate(()=>{window.die=window.__die;});
  console.log(errs.length?errs.join('\n'):'SIN ERRORES');
  await b.close();
})();
