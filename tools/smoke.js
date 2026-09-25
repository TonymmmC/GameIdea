const puppeteer=require('puppeteer-core');
const OUT=__dirname+'/shots/';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage();await p.setViewport({width:1152,height:648});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text());});
  await p.goto('http://localhost:8765/index.html#dev',{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,800));
  await p.screenshot({path:OUT+'menu.png'});
  const which=process.argv.slice(2);
  const n=await p.evaluate(()=>LEVELS.length);
  for(let i=0;i<n;i++){
    const id=await p.evaluate(i=>LEVELS[i].id,i);
    if(which.length&&!which.includes(id))continue;
    await p.evaluate(i=>startLevel(i,{kind:'story'}),i);
    await new Promise(r=>setTimeout(r,2500));
    await p.screenshot({path:OUT+'lvl-'+id+'.png'});
  }
  for(const s of ['openTower','openShop','openRank','openOpt','openAcct','openMail','openAch','openRun']){
    if(which.length)break;
    await p.evaluate(s=>{toMenu();window[s]();},s);await new Promise(r=>setTimeout(r,500));
    await p.screenshot({path:OUT+'scr-'+s+'.png'});
  }
  console.log(errs.length?errs.join('\n'):'SIN ERRORES');
  await b.close();
})();
