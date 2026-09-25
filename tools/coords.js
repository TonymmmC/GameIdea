const fs=require('fs'),vm=require('vm');const ctx={console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../no-name/js/levels.js'),'utf8')+';this.LEVELS=LEVELS;',ctx);
const want=process.argv[2]||'KLiVfd1234SEPFQ';
for(const d of ctx.LEVELS){if(d.boss)continue;const out={};
  d.map.forEach((r,y)=>[...r].forEach((c,x)=>{if(want.includes(c)){(out[c]=out[c]||[]).push(x+','+y);}}));
  const s=Object.entries(out).map(([c,v])=>c+': '+(v.length>6&&'Vf'.includes(c)?v[0]+' … ('+v.length+')':v.join(' '))).join(' | ');
  console.log(d.id,'|',s);}
