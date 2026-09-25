const puppeteer=require('puppeteer-core'),fs=require('fs');
(async()=>{
  const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
  const p=await b.newPage();
  const out=await p.evaluate(()=>{
    function draw(S,mask){
      const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      // fondo nocturno con resplandor
      g.fillStyle='#0a0610';g.fillRect(0,0,S,S);
      const r=g.createRadialGradient(S/2,S*.62,0,S/2,S*.62,S*.55);r.addColorStop(0,'rgba(255,120,40,.55)');r.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=r;g.fillRect(0,0,S,S);
      // llama pixelada 16x16 escalada
      const px=mask?S/26:S/20,ox=S/2,oy=S*(mask?.72:.8);
      const F=[ // [x,y] relativos: ancho por fila (de abajo arriba)
        [10,'#ff5a1f'],[12,'#ff5a1f'],[12,'#ff5a1f'],[12,'#ff5a1f'],[10,'#ff5a1f'],[10,'#ff5a1f'],[8,'#ff5a1f'],[8,'#ff5a1f'],[6,'#ff5a1f'],[6,'#ff5a1f'],[4,'#ff5a1f'],[4,'#ff5a1f'],[2,'#ff5a1f'],[2,'#ff5a1f']];
      const M=[[8,'#ffa53d'],[8,'#ffa53d'],[8,'#ffa53d'],[8,'#ffa53d'],[6,'#ffa53d'],[6,'#ffa53d'],[4,'#ffa53d'],[4,'#ffa53d'],[2,'#ffa53d'],[2,'#ffa53d']];
      const I=[[4,'#fff1b8'],[4,'#fff1b8'],[4,'#fff1b8'],[2,'#fff1b8'],[2,'#fff1b8']];
      for(const[L,sh]of[[F,0],[M,1],[I,2]])L.forEach(([w,col],k)=>{g.fillStyle=col;g.fillRect(ox-w/2*px+(k>8?px*(sh?0:1):0),oy-(k+1+sh)*px,w*px,px);});
      g.fillStyle='#3a0d12';g.fillRect(ox-2.5*px,oy-6*px,px,px*2);g.fillRect(ox+1.5*px,oy-6*px,px,px*2);
      return c.toDataURL('image/png');
    }
    return{i192:draw(192),i512:draw(512),mask:draw(512,true)};
  });
  const D='C:/Unifranz/Juego Python/no-name/icons/';
  for(const[k,f]of[['i192','icon-192.png'],['i512','icon-512.png'],['mask','icon-maskable.png']])fs.writeFileSync(D+f,Buffer.from(out[k].split(',')[1],'base64'));
  await b.close();console.log('ok');
})();
