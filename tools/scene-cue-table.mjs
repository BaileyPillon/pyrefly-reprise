// Scene-cue proof, the table (r46-scenecue; both games, shared loading plumbing): reads the JSON files tools/scene-cue-proof.mjs wrote and
// prints one markdown table per side, so BEFORE and AFTER are compared with the same arithmetic.
//
//   node tools/scene-cue-table.mjs --dir=D:/Tools/pyrefly-scratch/r46/before [--dir=...after] [--json=out.json]
//
// Per file (chapter and route): runs that ran; runs where the opening cue is the mixer's current cue at the first spoken line, and where it is
// also audible there (gain at least 0.1); median and 90th percentile of the time from the card confirm to the cue playing (first mixer sample
// with the cue current), to the first spoken line, to the first battle menu; the opening cue's own download (request to done); the peak
// renderer and total working set over the warm and the peak JS heap; the bytes still in flight at the confirm.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dirs = process.argv.filter((a) => a.startsWith('--dir=')).map((a) => a.slice(6));
const jsonOut = process.argv.find((a) => a.startsWith('--json='))?.slice(7);
if (dirs.length === 0) throw new Error('usage: node tools/scene-cue-table.mjs --dir=<folder of scene-cue-proof JSON files> [--dir=...] [--json=out.json]');

const nums = (xs) => xs.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
const med = (xs) => { const v = nums(xs); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
const p90 = (xs) => { const v = nums(xs); return v.length ? v[Math.min(v.length - 1, Math.ceil(v.length * 0.9) - 1)] : null; };
const fmt = (n) => (n === null || n === undefined ? '-' : String(Math.round(n)));
const s1 = (n) => (n === null || n === undefined ? '-' : (Math.round((n / 1000) * 10) / 10).toFixed(1));

const out = {};
for (const dir of dirs) {
  const rows = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const d = j.digests.filter((x) => x.status === 'ran');
    const failed = j.digests.length - d.length;
    rows.push({
      file: f.replace('.json', ''),
      label: j.cfg.label,
      query: j.cfg.query || '',
      link: j.summary.link,
      runs: j.digests.length,
      ran: d.length,
      failed,
      playingAtFirstLine: d.filter((x) => x.scenePlayingAtFirstLine).length,
      audibleAtFirstLine: d.filter((x) => x.sceneAudibleAtFirstLine).length,
      cueStartedMed: med(d.map((x) => x.sceneCueStartedMs)), cueStartedP90: p90(d.map((x) => x.sceneCueStartedMs)),
      firstLineMed: med(d.map((x) => x.toFirstLineMs)), firstLineP90: p90(d.map((x) => x.toFirstLineMs)),
      firstMenuMed: med(d.map((x) => x.toFirstMenuMs)), firstMenuP90: p90(d.map((x) => x.toFirstMenuMs)),
      battleMed: med(d.map((x) => x.toBattleScreenMs)),
      cueDoneMed: med(d.map((x) => x.sceneCue?.doneMs)), cueDoneP90: p90(d.map((x) => x.sceneCue?.doneMs)), cueDoneMax: nums(d.map((x) => x.sceneCue?.doneMs)).at(-1) ?? null,
      renWarmMed: med(d.map((x) => x.memoryMB?.renWsPeakWarm)), renWarmMax: nums(d.map((x) => x.memoryMB?.renWsPeakWarm)).at(-1) ?? null,
      totWarmMed: med(d.map((x) => x.memoryMB?.totWsPeakWarm)), totWarmMax: nums(d.map((x) => x.memoryMB?.totWsPeakWarm)).at(-1) ?? null,
      renRouteMed: med(d.map((x) => x.memoryMB?.renWsPeakRoute)),
      heapWarmMed: med(d.map((x) => x.memoryMB?.jsHeapPeakWarm)),
      inFlightAtConfirmMBMed: med(d.map((x) => x.inFlightAtConfirmMB)),
      decodedCuesPeakMax: nums(d.map((x) => x.decodedCuesPeak)).at(-1) ?? null,
      consoleErrors: d.reduce((n, x) => n + (x.consoleErrors || 0), 0),
      errors: j.digests.filter((x) => x.status !== 'ran').map((x) => x.error),
      perRun: d.map((x) => ({ playing: x.scenePlayingAtFirstLine, audible: x.sceneAudibleAtFirstLine, cueStarted: x.sceneCueStartedMs, firstLine: x.toFirstLineMs, menu: x.toFirstMenuMs, cueDone: x.sceneCue?.doneMs ?? null })),
    });
  }
  out[dir] = rows;
  console.log(`\n### ${dir}\n`);
  console.log('| chapter, route | runs | cue playing at first line | audible there | confirm to cue playing, s (median / p90) | confirm to cue downloaded, s (median / p90) | confirm to first line, s (median / p90) | confirm to first menu, s (median / p90) | renderer peak over the warm, MB (median / max) | all-process peak, MB (median / max) | JS heap, MB |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.file} ${r.query ? `(${r.query})` : ''} | ${r.ran}${r.failed ? ` (+${r.failed} failed)` : ''} | ${r.playingAtFirstLine} of ${r.ran} | ${r.audibleAtFirstLine} of ${r.ran} | ${s1(r.cueStartedMed)} / ${s1(r.cueStartedP90)} | ${s1(r.cueDoneMed)} / ${s1(r.cueDoneP90)} | ${s1(r.firstLineMed)} / ${s1(r.firstLineP90)} | ${s1(r.firstMenuMed)} / ${s1(r.firstMenuP90)} | ${fmt(r.renWarmMed)} / ${fmt(r.renWarmMax)} | ${fmt(r.totWarmMed)} / ${fmt(r.totWarmMax)} | ${fmt(r.heapWarmMed)} |`);
  }
  const bad = rows.filter((r) => r.errors.length || r.consoleErrors);
  for (const r of bad) console.log(`\n(${r.file}: ${r.errors.length} failed runs ${JSON.stringify(r.errors)}; ${r.consoleErrors} console errors)`);
}
if (jsonOut) writeFileSync(jsonOut, `${JSON.stringify(out, null, 1)}\n`);
