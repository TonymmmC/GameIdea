const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
  const p=await b.newPage();await p.setViewport({width:1152,height:648});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  const W=ms=>new Promise(r=>setTimeout(r,ms));const S=n=>p.screenshot({path:__dirname+'/shots/ui-'+n+'.png'});
  await p.goto('http://localhost:8765/index.html',{waitUntil:'networkidle0'});await W(500);
  // navegar: bajar 3 (El taller) y entrar
  for(let k=0;k<3;k++){await p.keyboard.press('ArrowDown');await W(60);}
  console.log('sel:',await p.evaluate(()=>nav.el&&nav.el.textContent));
  await p.evaluate(()=>{save.brasas=500;});
  await p.keyboard.press('Enter');await W(400);
  await p.keyboard.press('ArrowDown');await W(80);await p.keyboard.press('ArrowRight');await W(80);
  console.log('item:',await p.evaluate(()=>nav.el&&nav.el.textContent));
  await p.keyboard.press('Enter');await W(200);
  console.log('compra:',await p.evaluate(()=>[save.brasas,save.equip.flame,$('shopMsg').textContent]));
  await S('shop');
  await p.keyboard.press('Escape');await W(300);
  console.log('estado tras ESC:',await p.evaluate(()=>state));
  // empezar y jugar un poco con teclado
  await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await W(100);
  await p.keyboard.press('Enter');await W(1500);
  await p.keyboard.down('ArrowRight');await W(900);await p.keyboard.press('Space');await W(700);await p.keyboard.up('ArrowRight');
  console.log('jugando:',await p.evaluate(()=>[state,L.i,Math.round(P.x)]));
  await p.keyboard.press('Escape');await W(300);await S('pause');
  console.log('pausa:',await p.evaluate(()=>state));
  await p.keyboard.press('Enter');await W(300);
  // forzar victoria
  await p.evaluate(()=>{P.x=L.exit.x*TS+3;P.y=L.exit.y*TS+4;});await W(2200);
  await S('win');console.log('win:',await p.evaluate(()=>[state,save.brasas,JSON.stringify(save.prog.best)]));
  // cuenta sin conexión, logros
  await p.evaluate(()=>{toMenu();openAcct();});await W(300);await S('acct');
  await p.evaluate(()=>{toMenu();openAch();});await W(300);await S('ach');
  await p.evaluate(()=>{toMenu();openMail();});await W(300);
  await p.type('#mailText','hola prueba');await p.evaluate(()=>$('bMailSend').click());await W(300);
  console.log('buzón:',await p.evaluate(()=>[$('mailMsg').textContent,localStorage.getItem('noname-queue-v1')]));
  // móvil
  const m=await b.newPage();await m.emulate({viewport:{width:915,height:412,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 13) Mobile'});
  await m.goto('http://localhost:8765/index.html',{waitUntil:'networkidle0'});await W(400);
  await m.screenshot({path:__dirname+'/shots/ui-mobile-menu.png'});
  await m.evaluate(()=>startLevel(0,{kind:'story'}));await W(800);
  await m.screenshot({path:__dirname+'/shots/ui-mobile-play.png'});
  console.log(errs.length?errs.join('\n'):'SIN ERRORES');
  await b.close();
})();
