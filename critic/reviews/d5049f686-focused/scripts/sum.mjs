import fs from 'node:fs';
const E='D:/pyrefly-release55/critic/reviews/d5049f686-focused/evidence';
const rows=[];
for (const d of fs.readdirSync(E)) { const f=`${E}/${d}/analysis.json`; if(!fs.existsSync(f)) continue; const a=JSON.parse(fs.readFileSync(f,'utf8'));
 const med=(x)=>{const v=Object.values(x||{}).flat().filter(n=>n!=null);return v.length?v.sort((p,q)=>p-q)[v.length>>1]:null};
 rows.push({id:d,c26:a.checks['CHK-026'],c27:a.checks['CHK-027'],sec:a.battleSeconds,fps:a.fps,hops100:a.hopsOver100.count,worst:a.hopsOver100.worstPx,largest:a.largestStepPx,jerks:a.chk027.jerks,over:a.chk027.jerksOverFail,tele:a.chk027.teleports,dash:a.chk027.dashes,head:a.chk026.headOverTolerance,atkGap:med(a.attackGaps),byFig:JSON.stringify(a.hopsOver100.byFigure)});}
console.table(rows);
fs.writeFileSync('../summary-table.json',JSON.stringify(rows,null,1));
