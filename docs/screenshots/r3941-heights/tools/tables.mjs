// tables.mjs: markdown tables for the handoff from analysis.json (analyze.mjs).
//   node tables.mjs --analysis=analysis.json > tables.md
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const rows = JSON.parse(fs.readFileSync(args.analysis ?? 'analysis.json', 'utf8'));
const NUM = { 'seymour-flux': 'I', yunalesca: 'II', 'braskas-final-aeon': 'III', 'seymour-anima-macalania': 'VII', 'evrae-airship': 'VIII', 'yojimbo-cavern': 'IX', 'seymour-natus': 'X', 'seymour-omnis': 'XII', 'isaaru-via-purifico': 'XIV', 'sin-fins-core': 'XVII', 'sin-face': 'XVIII' };
const ORDER = Object.keys(NUM);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const pct = (x) => (x == null ? '-' : `${x >= 1 ? '+' : '-'}${Math.abs((x - 1) * 100).toFixed(1)}%`);
const byVp = (vp) => rows.filter((r) => r.viewport === vp).sort((a, b) => ORDER.indexOf(a.chapter) - ORDER.indexOf(b.chapter));

for (const vp of ['1600x900', '390x844']) {
  console.log(`\n### Each figure's height on screen, before to after (${vp}; the table ratio in brackets)\n`);
  console.log("| Chapter | Hero (table) | World before to after | Screen px before to after | Screen ratio | Against Tidus's own change |");
  console.log('|---|---|---|---|---|---|');
  for (const r of byVp(vp)) {
    const tid = r.figs.find((f) => f.id === 'tidus');
    for (const f of r.figs) {
      const rel = tid && f.id !== 'tidus' ? `x${(f.pxRatio / tid.pxRatio).toFixed(3)}` : f.id === 'tidus' ? 'reference' : '-';
      console.log(`| ${NUM[r.chapter]} | ${cap(f.id)} (${f.ratio.toFixed(3)}) | ${f.worldBefore} to ${f.worldAfter} | ${f.pxBefore} to ${f.pxAfter} | x${f.pxRatio} | ${rel} |`);
    }
  }
  console.log(`\n### Composition (${vp})\n`);
  console.log('| Chapter | Tallest head to the viewport top (px) | Nearest panel above a head, before to after (px) | Camera (planned master) moved | Tidus on screen | Boss rect height before to after | Faces and weapons under a panel (CHK-008) | New panel overlaps | CHK-011 newly failing / passing |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const r of byVp(vp)) {
    const t = r.figs.find((f) => f.id === 'tidus');
    const tall = [...r.figs].sort((a, b) => a.topMinAfter - b.topMinAfter)[0];
    const near = r.figs.filter((f) => f.aboveAfter).sort((a, b) => a.aboveAfter.gap - b.aboveAfter.gap)[0];
    const nearTxt = near ? `${cap(near.id)}: ${near.aboveBefore ? near.aboveBefore.gap : 'none above'} to ${near.aboveAfter.gap}` : 'no panel above any head';
    const bossB = r.boss.before?.h; const bossA = r.boss.after?.h;
    console.log(`| ${NUM[r.chapter]} | ${cap(tall.id)} ${tall.topMinBefore} to ${tall.topMinAfter} | ${nearTxt} | ${r.masterMove ?? '-'} | ${t ? pct(t.pxRatio) : 'n/a (no Tidus)'} | ${bossB} to ${bossA} (${bossB && bossA ? pct(bossA / bossB) : '-'}) | ${r.keyFeatureHitsBefore} to ${r.keyFeatureHitsAfter} | ${r.newHits.length} | ${r.newChk011.join(', ') || 'none'} / ${r.fixedChk011.join(', ') || 'none'} |`);
  }
}
