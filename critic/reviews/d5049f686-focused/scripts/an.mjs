// Read one continuity run of the r73 motion lane: checks, the hops over 100 px, the attack gaps, the blow's frames, the playback speed log. Measuring only.
//   node an.mjs <run id> [--ev=<evidence root>]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const id = process.argv[2];
const EV = (process.argv.find((a) => a.startsWith('--ev=')) ?? '--ev=D:/pyrefly-release55/critic/reviews/d5049f686-focused/evidence').slice(5);
const dir = path.join(EV, id);
const sub = fs.readdirSync(dir).find((d) => /-win-/.test(d) && fs.existsSync(path.join(dir, d, 'continuity', 'continuity.json')));
if (!sub) { console.error(`no continuity.json under ${dir}`); process.exit(2); }
const cj = JSON.parse(fs.readFileSync(path.join(dir, sub, 'continuity', 'continuity.json'), 'utf8'));
const summaryFile = path.join(dir, 'continuity-summary.json');
const summary = fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, 'utf8')) : null;
const rawFile = path.join(dir, 'raw', `${cj.chapter}.json.gz`);
const raw = fs.existsSync(rawFile) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(rawFile)).toString()) : null;
const ffFile = path.join(dir, 'ff.jsonl');
const ff = fs.existsSync(ffFile) ? fs.readFileSync(ffFile, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];

const out = { id, chapter: cj.chapter, base: cj.base, date: cj.date, checks: Object.fromEntries(Object.entries(cj.checks).map(([k, v]) => [k, v.result])), reasons: Object.fromEntries(Object.entries(cj.checks).map(([k, v]) => [k, v.reasons ?? []])) };
out.battleSeconds = cj.summary?.battleSeconds ?? null;
out.fps = cj.probe?.fps ?? null;
out.frames = cj.probe?.battleFrames ?? null;
out.maxDtMs = cj.probe?.maxDtMs ?? null;
out.slowFrames = cj.probe?.slowFrames ?? null;
out.chk026 = { headOverTolerance: cj.summary?.size?.headOverTolerance, maxHeadJumpPct: cj.summary?.size?.maxHeadJumpPct, maxHeadJumpPctRegistration: cj.summary?.size?.maxHeadJumpPctRegistration, feetOverTolerance: cj.summary?.size?.feetOverTolerance, heightOverBand: cj.summary?.size?.heightOverBand };
const m = cj.summary?.motion ?? {};
out.chk027 = { jerks: m.jerks, worstJerkPx: m.worstJerkPx, jerksOverFail: m.jerksOverFail, teleports: m.teleports, teleportsWorstPx: m.teleportsWorstPx, dashes: m.dashes, dashesWorstPx: m.dashesWorstPx, swapJerks: m.swapJerks, swapJerksWorstPx: m.swapJerksWorstPx, snaps: m.snaps, ghostSwaps: m.ghostSwaps };

// ---- the hops over 100 px (one frame), per figure
const hops = (cj.jerks ?? []).filter((j) => j.px > 100 && !j.smeared);
out.hopsOver100 = { count: hops.length, worstPx: hops.reduce((x, j) => Math.max(x, j.px), 0), byFigure: {}, list: hops.map((j) => ({ n: j.n, figure: j.figure, px: j.px, part: j.part, kind: j.kind, atSwap: j.atSwap, ratio: j.ratio, localPx: j.localPx, frameMs: j.frameMs, longFrame: j.longFrame, cause: j.cause?.type })) };
for (const j of hops) { const f = (out.hopsOver100.byFigure[j.figure] ??= { count: 0, worstPx: 0 }); f.count++; f.worstPx = Math.max(f.worstPx, j.px); }
const all = cj.jerks ?? [];
out.largestStepPx = all.reduce((x, j) => Math.max(x, j.px), 0);
out.largestStepByFigure = {};
for (const j of all) out.largestStepByFigure[j.figure] = Math.max(out.largestStepByFigure[j.figure] ?? 0, j.px);

// ---- attack gaps and the blow
const swaps = cj.swaps ?? [];
const byFig = {};
for (const s of swaps) (byFig[s.figure] ??= []).push(s);
out.attackGaps = {};
out.castGaps = {};
out.blow = {};
const numerals = ff.filter((e) => e.k === 'num');
const hitNumerals = numerals.filter((e) => /dnum--(damage|critical)|pf-num--(damage|crit)/.test(e.cls));
const rec = raw?.records ?? [];
const frameAtT = (t) => { let lo = 0, hi = rec.length - 1; if (!rec.length) return null; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (rec[mid].t <= t) lo = mid; else hi = mid - 1; } return rec[lo].n; };
const rawSwaps = raw?.meta?.swaps ?? [];
const rawFigs = raw?.meta?.figs ?? [];
for (const [fig, list] of Object.entries(byFig)) {
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (s.fromPose === 'ready' && s.toPose === 'attack') {
      const nxt = list.slice(i + 1).find((x) => x.fromPose === 'attack');
      const gap = nxt ? nxt.n - s.n : null;
      (out.attackGaps[fig] ??= []).push(gap);
      const rs = rawSwaps.find((r) => r.n === s.n && rawFigs[r.i]?.id === fig);
      const t = rs?.t ?? null;
      if (t != null && hitNumerals.length) {
        const nm = hitNumerals.find((e) => e.t >= t - 500 && e.t <= t + 1800);
        if (nm) { const nn = frameAtT(nm.t); (out.blow[fig] ??= []).push({ swapN: s.n, numeralN: nn, frames: nn != null ? nn - s.n : null, ms: Math.round(nm.t - t), txt: nm.txt, gap }); }
      }
    }
    if (s.fromPose === 'ready' && s.toPose === 'cast') {
      const nxt = list.slice(i + 1).find((x) => x.fromPose === 'cast');
      (out.castGaps[fig] ??= []).push(nxt ? nxt.n - s.n : null);
    }
  }
}
const stat = (a) => { const v = (a ?? []).filter((x) => Number.isFinite(x)).sort((x, y) => x - y); return v.length ? { n: v.length, min: v[0], median: v[Math.floor(v.length / 2)], max: v[v.length - 1] } : null; };
out.attackGapStats = Object.fromEntries(Object.entries(out.attackGaps).map(([k, v]) => [k, stat(v)]));
out.castGapStats = Object.fromEntries(Object.entries(out.castGaps).map(([k, v]) => [k, stat(v)]));
out.blowStats = Object.fromEntries(Object.entries(out.blow).map(([k, v]) => [k, stat(v.map((x) => x.frames))]));

// ---- the playback speed log
const samples = ff.filter((e) => e.k === 's');
const runs = [];
for (const s of samples) { const last = runs[runs.length - 1]; if (last && last.speed === s.speed) { last.seconds++; last.toBf = s.bf; } else runs.push({ speed: s.speed, seconds: 1, fromBf: s.bf, toBf: s.bf }); }
const reas = ff.filter((e) => e.k === 'reassert');
out.speed = { samples: samples.length, runs, reassertions: reas.length, reassertedFrom: reas.reduce((c, e) => ((c[e.was] = (c[e.was] ?? 0) + 1), c), {}), rPresses: ff.filter((e) => e.k === 'r').length, numerals: numerals.length, errors: ff.filter((e) => e.k === 'err').slice(0, 3), lastSample: samples[samples.length - 1] ?? null };
const sf = {};
for (const s of samples) sf[s.speed] = (sf[s.speed] ?? 0) + 1;
out.speed.samplesBySpeed = sf;

// ---- the run itself
const runJson = path.join(dir, sub, 'run.json');
if (fs.existsSync(runJson)) { const r = JSON.parse(fs.readFileSync(runJson, 'utf8')); out.run = { outcome: r.outcome ?? null, fails: (r.fails ?? []).length, consoleErrors: (r.consoleErrors ?? []).length, query: r.contexts?.query ?? null, seeds: r.battleSeeds ?? null }; }
out.summaryReportLine = summary?.reportLine ?? null;
fs.writeFileSync(path.join(dir, 'analysis.json'), JSON.stringify(out, null, 1));
const brief = { id, chapter: out.chapter, checks: out.checks, battleSeconds: out.battleSeconds, fps: out.fps, hopsOver100: { count: out.hopsOver100.count, worstPx: out.hopsOver100.worstPx, byFigure: out.hopsOver100.byFigure }, largestStepPx: out.largestStepPx, chk026: out.chk026, attackGapStats: out.attackGapStats, castGapStats: out.castGapStats, blowStats: out.blowStats, speedRuns: out.speed.runs.slice(0, 8), reassertions: out.speed.reassertions, rPresses: out.speed.rPresses, run: out.run };
console.log(JSON.stringify(brief, null, 1));
