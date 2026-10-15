/**
 * The report of the FFX camera tracking audit (`tools/ffxcam-audit.mjs`): reads one or more records and prints, over all of them, the share of battle time the camera lost track, by beat and by program,
 * the ten worst programs by lost seconds, the longest stretches of lost frames, and, for a run with the safety net on, where the net fired and how long it held the picture. The arithmetic is
 * `tools/ffxcam-audit-lib.mjs` (what "loses track" means is written there).
 *
 *   node tools/ffxcam-audit-report.mjs D:/Tools/ffx-parity/shots/tracking/before/seed*.json [--json=out.json] [--seen=0.3]
 *
 * Retail data is nowhere in the records (numbers only); the program names are ids of Bailey's local transcription.
 *
 * Game case: FFX only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { SEEN_MIN, SPECK_HEIGHT, analyse, group, programOfKey, stretches } from './ffxcam-audit-lib.mjs';

const argv = process.argv.slice(2);
const files = argv.filter((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const SEEN = Number(opt('seen', String(SEEN_MIN)));
const OUT = opt('json', null);

const pct = (a, b) => (b > 0 ? ((100 * a) / b).toFixed(2) : '0.00');
const sec = (ms) => (ms / 1000).toFixed(2);

const all = [];
const perFile = [];
const netEvents = [];
for (const file of files) {
  const rec = JSON.parse(readFileSync(file, 'utf8'));
  const rows = analyse(rec, file, SEEN);
  all.push(...rows);
  const total = rows.reduce((s, r) => s + r.dt, 0);
  const lostMs = rows.filter((r) => r.lost).reduce((s, r) => s + r.dt, 0);
  const heldMs = rows.filter((r) => r.net > 0).reduce((s, r) => s + r.dt, 0);
  const st = stretches(rows);
  const longest = st.reduce((m, s) => (s.ms > m.ms ? s : m), { ms: 0 });
  const events = rec.interventions ?? [];
  for (const e of events) netEvents.push({ ...e, file, seed: rec.seed });
  perFile.push({ file, seed: rec.seed, frames: rows.length, totalMs: total, lostMs, longestMs: longest.ms, stretches: st.length, netEvents: events.length, netEngagements: events.filter((e) => e.kind === 'engage').length, netHeldMs: heldMs });
}

const total = all.reduce((s, r) => s + r.dt, 0);
const lostAll = all.filter((r) => r.lost).reduce((s, r) => s + r.dt, 0);

console.log(`\n=== FFX camera tracking audit: ${files.length} record(s), ${sec(total)} s of battle, seen threshold ${SEEN}`);
console.log('\nper record');
console.log('seed   battle s   lost s   lost %  longest lost s  stretches  net engagements  net held s');
for (const p of perFile) console.log(`${String(p.seed).padStart(4)} ${sec(p.totalMs).padStart(9)} ${sec(p.lostMs).padStart(8)} ${pct(p.lostMs, p.totalMs).padStart(8)} ${sec(p.longestMs).padStart(15)} ${String(p.stretches).padStart(10)} ${String(p.netEngagements).padStart(16)} ${sec(p.netHeldMs).padStart(11)}`);
const speckAll = all.filter((r) => r.speck).reduce((s, r) => s + r.dt, 0);
console.log(`\nALL: lost ${sec(lostAll)} s of ${sec(total)} s = ${pct(lostAll, total)} %   (a second reading: in frame but a speck, under ${SPECK_HEIGHT * 100} % of the picture's height: ${sec(speckAll)} s = ${pct(speckAll, total)} %)`);

const byBeat = group(all, (r) => r.beat);
console.log('\nper beat (the last beat the presenter raised)');
console.log('beat              total s   lost s   lost %');
for (const [k, e] of [...byBeat].sort((a, b) => b[1].lost - a[1].lost)) console.log(`${k.padEnd(16)} ${sec(e.total).padStart(8)} ${sec(e.lost).padStart(8)} ${pct(e.lost, e.total).padStart(8)}`);

const byProgram = group(all, (r) => r.program);
const worst = [...byProgram].filter(([, e]) => e.lost > 0).sort((a, b) => b[1].lost - a[1].lost);
console.log('\nper program, the ten worst by lost seconds');
console.log('program                total s   lost s   lost %');
for (const [k, e] of worst.slice(0, 10)) console.log(`${k.padEnd(20)} ${sec(e.total).padStart(9)} ${sec(e.lost).padStart(8)} ${pct(e.lost, e.total).padStart(8)}`);
console.log('\nper program, all');
for (const [k, e] of [...byProgram].sort((a, b) => b[1].total - a[1].total)) console.log(`${k.padEnd(20)} ${sec(e.total).padStart(9)} ${sec(e.lost).padStart(8)} ${pct(e.lost, e.total).padStart(8)}`);

const st = files.flatMap((file) => stretches(all.filter((r) => r.file === file))); // per record: a stretch never runs from one fight into the next
const longest = [...st].sort((a, b) => b.ms - a.ms).slice(0, 8);
console.log('\nthe longest lost stretches');
console.log('ms     file         step..step       frames idx           beat           programs');
for (const s of longest) console.log(`${String(Math.round(s.ms)).padStart(6)} ${String(s.first.file.split(/[\\/]/).pop()).padEnd(12)} ${String(s.first.step).padStart(6)}..${String(s.last.step).padEnd(6)} ${String(s.first.i).padStart(6)}..${String(s.last.i).padEnd(6)} ${s.first.beat.padEnd(14)} ${[...s.programs].join(', ')}`);
const over = st.filter((s) => s.ms > 500).length;
console.log(`\nlost stretches over 0.5 s: ${over} of ${st.length}`);

const engages = netEvents.filter((e) => e.kind === 'engage');
const byNetProgram = new Map();
for (const e of engages) byNetProgram.set(programOfKey(e.key), (byNetProgram.get(programOfKey(e.key)) ?? 0) + 1);
if (netEvents.length > 0) {
  console.log(`\nsafety net: ${engages.length} engagement(s), ${netEvents.filter((e) => e.kind === 'retarget').length} retarget(s), ${netEvents.filter((e) => e.kind === 'release').length} release(s), ${netEvents.filter((e) => e.kind === 'drop').length} drop(s); the picture was the net's for ${sec(all.filter((r) => r.net > 0).reduce((s, r) => s + r.dt, 0))} s`);
  console.log('engagements by program:');
  for (const [k, n] of [...byNetProgram].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${String(n).padStart(4)}`);
}

const summary = {
  files,
  seen: SEEN,
  battleMs: total,
  lostMs: lostAll,
  lostPercent: total > 0 ? (100 * lostAll) / total : 0,
  speckMs: all.filter((r) => r.speck).reduce((s, r) => s + r.dt, 0),
  longestLostMs: longest[0]?.ms ?? 0,
  stretchesOver500ms: over,
  stretchCount: st.length,
  perFile,
  byBeat: Object.fromEntries([...byBeat].map(([k, e]) => [k, { totalMs: e.total, lostMs: e.lost }])),
  byProgram: Object.fromEntries([...byProgram].map(([k, e]) => [k, { totalMs: e.total, lostMs: e.lost }])),
  worstPrograms: worst.slice(0, 10).map(([k, e]) => ({ program: k, lostMs: e.lost, totalMs: e.total })),
  longest: longest.map((s) => ({ ms: s.ms, file: s.first.file, fromStep: s.first.step, toStep: s.last.step, fromFrame: s.first.i, toFrame: s.last.i, beat: s.first.beat, programs: [...s.programs] })),
  net: { engagements: engages.length, byProgram: Object.fromEntries(byNetProgram), events: netEvents.length },
};
if (OUT) {
  writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log(`\nwrote ${OUT}`);
}
