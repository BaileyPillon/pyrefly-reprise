import fs from 'node:fs';
for (const f of process.argv.slice(2)) {
  const L = fs.readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l.slice(5)));
  const b = L.filter(x=>x.scr==='battle');
  const n=b.reduce((a,x)=>a+x.n,0);
  const looks=[...new Set(b.map(x=>x.look?.look))].join('/');
  console.log(f, 'battleRows',b.length,'avgMs',(b.reduce((a,x)=>a+x.avgMs*x.n,0)/n).toFixed(1),'worstMax',Math.max(...b.map(x=>x.max)),'o100',b.reduce((a,x)=>a+x.o100,0),'o250',b.reduce((a,x)=>a+x.o250,0),'looks',looks);
  b.filter(x=>x.max>150).forEach(x=>console.log('  stall',x.max,x.look?.look,x.look?.room));
}
