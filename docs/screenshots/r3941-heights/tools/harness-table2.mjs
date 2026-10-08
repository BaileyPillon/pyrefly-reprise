// harness-table.mjs: one table from continuity.json files (lock on vs off), plus every KO swap with a registered head, by figure.
//   node harness-table.mjs --ev <evidence dir> [--ev <dir2> ...] [--out table.txt] [--json table.json] [--ko]
// Each --ev dir holds <chapter>-win-<tag>/continuity/continuity.json (the harness' layout). The run's label (on/off) is read from the base URL.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const evs = []; let out = null; let jsonOut = null; const showKo = args.includes('--ko');
for (let i = 0; i < args.length; i++) { if (args[i] === '--ev') evs.push(args[++i]); else if (args[i] === '--out') out = args[++i]; else if (args[i] === '--json') jsonOut = args[++i]; }

const rows = [];
for (const ev of evs) {
  for (const d of fs.existsSync(ev) ? fs.readdirSync(ev, { withFileTypes: true }) : []) {
    if (!d.isDirectory()) continue;
    const f = path.join(ev, d.name, 'continuity', 'continuity.json');
    if (!fs.existsSync(f)) continue;
    const c = JSON.parse(fs.readFileSync(f, 'utf8'));
    const lock = /stature=off/.test(c.base ?? '') ? 'off' : 'on';
    const sz = c.summary?.size ?? {}; const mo = c.summary?.motion ?? {};
    const reg = (c.swaps ?? []).filter((s) => s.counted && s.head && s.head.source === 'registration' && !s.costume);
    const ko = reg.filter((s) => s.toPose === 'ko' || s.fromPose === 'ko');
    const dev = (s) => Math.abs(s.head.ratio - 1) * 100;
    const koWorst = ko.reduce((m, s) => Math.max(m, dev(s)), 0);
    const regWorst = reg.reduce((m, s) => Math.max(m, dev(s)), 0);
    const over1 = reg.filter((s) => dev(s) > 1);
    const log = path.join(ev, `run-${c.chapter}.log`);
    let fps = null;
    if (fs.existsSync(log)) { const m = fs.readFileSync(log, 'utf8').match(/(\d+(?:\.\d+)?) fps/g); if (m) fps = m[m.length - 1].replace(' fps', ''); }
    const koByFigure = {};
    for (const s of ko) { const k = `${s.figure} ${s.fromPose}->${s.toPose}`; (koByFigure[k] ||= []).push(s.head.ratio); }
    rows.push({
      ev: path.basename(ev), dir: d.name, chapter: c.chapter, game: c.game, lock, base: c.base,
      chk026: c.checks?.['CHK-026']?.result, chk027: c.checks?.['CHK-027']?.result,
      battleSeconds: c.summary?.battleSeconds, swaps: c.summary?.swaps, counted: c.summary?.counted,
      headMeasured: sz.headMeasured, headRegistration: sz.headRegistration, headSilhouette: sz.headSilhouette,
      headOverTolerance: sz.headOverTolerance, maxHeadJumpPct: sz.maxHeadJumpPct, maxHeadJumpPctRegistration: sz.maxHeadJumpPctRegistration,
      maxFeetShiftPx: sz.maxFeetShiftPx, feetOverTolerance: sz.feetOverTolerance,
      registeredSwaps: reg.length, koSwapsRegistered: ko.length, koWorstPct: Math.round(koWorst * 100) / 100, registeredWorstPct: Math.round(regWorst * 100) / 100, registeredOver1pct: over1.length,
      snapsPerMinute: mo.snapsPerMinute, hardCuts: mo.hardCuts, ghostOverFail: mo.ghostOverFail, jerksOverFail: mo.jerksOverFail, worstJerkPx: mo.worstJerkPx, fps,
      reasons026: c.checks?.['CHK-026']?.reasons, reasons027: c.checks?.['CHK-027']?.reasons,
      swapsOver1: over1.map((s) => ({ figure: s.figure, from: s.fromPose, to: s.toPose, ratio: s.head.ratio, n: s.n, cause: s.cause?.type })),
      koByFigure: Object.fromEntries(Object.entries(koByFigure).map(([k, v]) => [k, { n: v.length, min: Math.min(...v), max: Math.max(...v) }])),
    });
  }
}
rows.sort((a, b) => (a.chapter + a.lock).localeCompare(b.chapter + b.lock));
const pad = (v, n) => String(v ?? '-').padEnd(n);
const lines = [];
lines.push(`${pad('chapter', 26)}${pad('stature', 8)}${pad('CHK-026', 9)}${pad('CHK-027', 9)}${pad('swaps', 7)}${pad('regd', 6)}${pad('KO regd', 8)}${pad('worst% reg', 11)}${pad('worst% KO', 10)}${pad('>1%', 5)}${pad('overTol', 8)}${pad('feet px', 8)}${pad('fps', 6)}${pad('battle s', 9)}`);
for (const r of rows) lines.push(`${pad(r.chapter, 26)}${pad(r.lock, 8)}${pad(r.chk026, 9)}${pad(r.chk027, 9)}${pad(r.counted, 7)}${pad(r.registeredSwaps, 6)}${pad(r.koSwapsRegistered, 8)}${pad(r.registeredWorstPct, 11)}${pad(r.koWorstPct, 10)}${pad(r.registeredOver1pct, 5)}${pad(r.headOverTolerance, 8)}${pad(r.maxFeetShiftPx, 8)}${pad(r.fps, 6)}${pad(r.battleSeconds, 9)}`);
const text = lines.join('\n');
console.log(text);
if (showKo) for (const r of rows) {
  console.log(`\n${r.chapter} (stature ${r.lock}) KO swaps with a registered head, by figure:`);
  for (const [k, v] of Object.entries(r.koByFigure).sort()) console.log(`  ${pad(k, 28)} n ${pad(v.n, 3)} ratio ${v.min.toFixed(4)} to ${v.max.toFixed(4)}`);
}
for (const r of rows) if (r.swapsOver1.length) { console.log(`\n${r.chapter} (stature ${r.lock}) registered swaps over 1 percent:`); for (const s of r.swapsOver1.slice(0, 30)) console.log(`  ${pad(s.figure, 22)}${pad(s.from + ' -> ' + s.to, 24)}x${s.ratio.toFixed(4)}  frame ${s.n}  (${s.cause})`); }
if (out) fs.writeFileSync(out, text + '\n');
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));
