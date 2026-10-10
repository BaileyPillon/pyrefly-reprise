// r392-size: replay the continuity harness's analysis on what its probe recorded (CONT_RAW_DIR=<dir> node critic/runner/lib/continuity.mjs ...), with the CURRENT harness and with an OLD one
// (the analysis modules of any git revision), so a change of the harness can be shown on the same frames.
//
//   node docs/handoff/r392-size-evidence/harness-replay.mjs compare <raw.json.gz ...> [--old-rev=30e7d701] [--json=<file>]
//        every swap whose size or feet reading differs between the old and the current analysis, with the exact frames: the old and the new painting's planes in the frame before and in the swap's
//        frame (registered head and feet, px at 1600 wide), what the slot that held the old painting shows in the swap's frame, and how far the surviving plane moved between the two frames.
//   node docs/handoff/r392-size-evidence/harness-replay.mjs frames <raw.json.gz> --n=<swap frame> [--fig=<id>] [--window=6] [--old-rev=...]
//        the planes of one figure frame by frame around a swap.
//   node docs/handoff/r392-size-evidence/harness-replay.mjs worst <raw.json.gz ...> [--thr=0.02] [--feet=1.2]
//        the swaps nearest the tolerances.
//
// Paintings are read from the masters in public/art (no server). The pose registration records are the working tree's docs/target/pose-measure.json (override: --measure=<file>).
// Both games: shared critic plumbing; it only reads.
import fs from 'node:fs';
import path from 'node:path';

import { ROOT, analyse, loadHarness, oldHarnessDir, parseArgs, subjOf } from './replay-lib.mjs';

const { args, rest } = parseArgs(process.argv.slice(2));
const [cmd, ...files] = rest;
const measure = args.measure ? String(args.measure) : undefined;
const cur = await loadHarness();

if (cmd === 'compare') {
  const old = await loadHarness(oldHarnessDir(String(args['old-rev'] ?? '30e7d701')));
  const out = [];
  let counted = 0;
  for (const file of files) {
    const o = await analyse(file, old, measure), n = await analyse(file, cur, measure);
    const { planeOf, unitSquareToQuad, headSizePx, feetPoint, scale1600 } = cur.pure;
    const k1600 = scale1600(n.meta.view?.[2] ?? 1600);
    const byFi = new Map();
    for (const r of n.records) for (const f of r.f) { if (!byFi.has(f.i)) byFi.set(f.i, new Map()); byFi.get(f.i).set(r.n, f); }
    const tag = path.basename(path.dirname(file)) + '/' + path.basename(file).replace('.json.gz', '');
    for (let i = 0; i < o.res.swaps.length; i++) {
      const a = o.res.swaps[i], b = n.res.swaps[i];
      if (!a.counted && !b.counted) continue;
      counted++;
      if ((a.head?.ratio ?? null) === (b.head?.ratio ?? null) && (a.feet?.px ?? null) === (b.feet?.px ?? null)) continue;
      const m = byFi.get(a.fi);
      const plane = (fr, k) => (fr ? fr.s.map(planeOf).find((p) => p && p.k === k) ?? null : null);
      const feetOf = (p, k) => { const an = n.anchors[k]; return p && an?.stance ? feetPoint(unitSquareToQuad(p.q), an.stance).map((v) => v * k1600) : null; };
      const headOf = (p, k) => { const an = n.anchors[k]; return p && an?.head ? headSizePx(unitSquareToQuad(p.q), an.head) * k1600 : null; };
      const f0 = m.get(a.n), fm = m.get(a.n - 1);
      const fromB = plane(fm, a.from), toB = plane(fm, a.to), fromA = plane(f0, a.from), toA = plane(f0, a.to);
      const ffB = feetOf(fromB, a.from), ftB = feetOf(toB, a.to), ftA = feetOf(toA, a.to);
      const dist = (p, q) => (p && q ? Math.hypot(q[0] - p[0], q[1] - p[1]) : null);
      const slot = fm ? fm.s.findIndex((raw) => { const p = planeOf(raw); return p && p.k === a.from; }) : -1;
      const now = slot >= 0 && f0 ? planeOf(f0.s[slot]) : null;
      const r1 = (v) => (v == null ? null : Math.round(v * 100) / 100);
      out.push({
        capture: tag, swap: a.id, figure: a.figure, pair: `${a.fromPose} to ${a.toPose}`, frame: a.n,
        oldReading: { feetPx: a.feet?.px, headRatio: a.head?.ratio, failFeet: a.failFeet, failHead: a.failHead }, newReading: { feetPx: b.feet?.px, headRatio: b.head?.ratio, failFeet: b.failFeet, failHead: b.failHead },
        frameBefore: { oldPlaneFade: fromB?.fade, newPlaneFade: toB?.fade, oldFeet: ffB?.map(r1), newFeet: ftB?.map(r1), planesApartPx: r1(dist(ffB, ftB)), oldHeadPx: r1(headOf(fromB, a.from)), newHeadPx: r1(headOf(toB, a.to)) },
        swapFrame: { oldPaintingsPlanePresent: Boolean(fromA), itsSlotNowShows: now ? `${subjOf(n.meta, now.k)}/${n.meta.poses[now.k]?.pose} at fade ${now.fade.toFixed(2)}` : null, newFeet: ftA?.map(r1), survivingPlaneMovedPx: r1(dist(ftB, ftA)), cameraShiftPx: f0?.g },
        oldReadingWasPx: r1(dist(ffB, ftA)),
      });
    }
  }
  const fails = (x) => x.failFeet || x.failHead;
  console.log(JSON.stringify({ capturesAnalysed: files.length, swapsCounted: counted, readingsThatDiffer: out.length, failToPass: out.filter((x) => fails(x.oldReading) && !fails(x.newReading)).length, passToFail: out.filter((x) => !fails(x.oldReading) && fails(x.newReading)).length, swaps: out }, null, 1));
  if (args.json) fs.writeFileSync(String(args.json), JSON.stringify(out, null, 1));
} else if (cmd === 'frames') {
  const h = args['old-rev'] ? await loadHarness(oldHarnessDir(String(args['old-rev']))) : cur;
  const { meta, records, anchors, res } = await analyse(files[0], h, measure);
  const { planeOf, unitSquareToQuad, headSizePx, feetPoint, scale1600 } = h.pure;
  const k1600 = scale1600(meta.view?.[2] ?? 1600);
  const win = Number(args.window ?? 6);
  const byFi = new Map();
  for (const r of records) for (const f of r.f) { if (!byFi.has(f.i)) byFi.set(f.i, new Map()); byFi.get(f.i).set(r.n, f); }
  for (const s of res.swaps.filter((x) => x.n === Number(args.n) && (!args.fig || x.figure === args.fig))) {
    console.log(`#${s.id} ${s.figure} ${s.fromPose} to ${s.toPose}, swap frame ${s.n}: head ${JSON.stringify(s.head)} feet ${JSON.stringify(s.feet)}`);
    for (let n = s.n - win; n <= s.n + win; n++) {
      const f = byFi.get(s.fi)?.get(n);
      if (!f) { console.log(n, 'no record'); continue; }
      const parts = f.s.map((raw, si) => {
        const p = planeOf(raw); if (!p) return `slot${si}: -`;
        const an = anchors[p.k], Hm = unitSquareToQuad(p.q);
        const head = an?.head ? headSizePx(Hm, an.head) * k1600 : null, feet = an?.stance ? feetPoint(Hm, an.stance) : null;
        return `slot${si}${si === f.act ? '*' : ' '} ${subjOf(meta, p.k).slice(0, 8)}/${String(meta.poses[p.k]?.pose).padEnd(8)} fade ${p.fade.toFixed(2)} head ${head === null ? '-' : head.toFixed(1)} feet ${feet ? feet.map((v) => (v * k1600).toFixed(1)).join(',') : '-'}`;
      });
      console.log(String(n).padStart(6), n === s.n ? '>' : ' ', `camera ${f.g.map((v) => v.toFixed(1)).join(',')}`, parts.join(' | '));
    }
  }
} else if (cmd === 'worst') {
  const thr = Number(args.thr ?? 0.02), feetThr = Number(args.feet ?? 1.2);
  for (const file of files) {
    const { meta, res } = await analyse(file, cur, measure);
    const z = res.summary.size;
    console.log(`== ${path.basename(file)}: CHK-026 ${res.summary.checks['CHK-026'].result}; judged ${z.judged}; registered max ${z.maxHeadJumpPctRegistration}%, mass max ${z.maxHeadJumpPct}%, feet max ${z.maxFeetShiftPx} px; over: head ${z.headOverTolerance} feet ${z.feetOverTolerance}`);
    for (const w of res.swaps) {
      if (!w.counted || w.costume || w.sameArt) continue;
      const hh = w.head && w.head.source === 'registration' && Math.abs(w.head.ratio - 1) >= thr, ff = w.feet && w.feet.standing && w.feet.px >= feetThr;
      if (hh || ff) console.log(`   #${w.id} ${subjOf(meta, w.from)} ${w.fromPose} to ${w.toPose}: head ${w.head ? `${w.head.ratio} (${w.head.source})` : '-'}, feet ${w.feet ? `${w.feet.px} px${w.feet.standing ? '' : ' (lying)'}` : '-'}${w.failHead || w.failFeet ? '  FAIL' : ''}`);
    }
  }
} else {
  console.error(`usage: harness-replay.mjs compare|frames|worst <raw.json.gz ...> [options]   (repo: ${ROOT})`);
  process.exit(2);
}
