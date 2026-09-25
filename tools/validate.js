const fs=require('fs'),vm=require('vm');
const G=require('path').join(__dirname,'../no-name/js/')+'/';
const src=fs.readFileSync(G+'levels.js','utf8');
const ctx={console};vm.createContext(ctx);
try{vm.runInContext(src+';this.LEVELS=LEVELS;',ctx);}catch(e){console.log('ERROR:',e.message);process.exit(1);}
const L=ctx.LEVELS;let bad=0;
for(const d of L){
  const H=d.map.length,W=d.map[0].length,flat=d.map.join('');
  const cnt=c=>flat.split(c).length-1;
  const probs=[];
  if(cnt('P')!==1)probs.push('P='+cnt('P'));
  if(cnt('E')!==1)probs.push('E='+cnt('E'));
  if(!d.boss&&cnt('*')!==1)probs.push('spark='+cnt('*'));
  const keys=cnt('K');
  // grupos de rejas
  const g=d.map.map(r=>r.split(''));const seen=new Set();let doors=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='D'&&!seen.has(y*W+x)){doors++;const st=[[x,y]];seen.add(y*W+x);while(st.length){const[a,b]=st.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&g[ny][nx]==='D'&&!seen.has(ny*W+nx)){seen.add(ny*W+nx);st.push([nx,ny]);}}}}
  if(keys!==doors)probs.push(`llaves ${keys} rejas ${doors}`);
  for(const p of '1234'){const n=cnt(p);if(n&&n!==2)probs.push('portal '+p+'='+n);}
  console.log(`${d.id.padEnd(5)} ${d.n.padEnd(22)} ${W}x${H} F=${cnt('F')} c=${cnt('c')} n=${cnt('n')} ${probs.length?'  <<< '+probs.join(', '):''}`);
  if(probs.length)bad++;
}
console.log(bad?`\n${bad} niveles con problemas`:'\nOK');
