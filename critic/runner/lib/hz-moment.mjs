// One scripted moment captured at 60, 120 and 144 Hz, read as BEATS and judged for equality (T-03 of the motion-fluidity pass, lane L5; both games, critic plumbing). Pure.
//
// tools/hz-matrix.mjs plays the same moment (seed 1, the same real key presses, a virtual clock: tools/measure/session.mjs) once per rate and records every frame's engine channels and the battle-log events
// (tools/measure/channels.mjs). This module turns a recording into BEATS (the ordered, labelled moments of the move: the log's events, each figure's changes of painting, the start of a shake, the hit-stop's
// edges, the start and end of the curve driver's travel), aligns the beats of the three rates by label, and asks hz-pure.mjs the two questions of the plan: do the same intervals take the same time within
// 5 percent, and do the chained beats land within one display frame of the slower display. A beat is the first frame in which the change was SEEN, in the capture's exact virtual milliseconds from the moment's
// start, so the quantisation of a rate is its own frame: that is why the second gate is in display frames and not in milliseconds.
//
// Also: `sharedTimeDeviation` reads each figure's position at the times the three rates share (k / 12 s: 5k frames at 60, 10k at 120, 12k at 144; the method of tests/unit/feel-120hz.test.ts), leaving out
// the frames a hit rattle is running (its phase is random: C-01), and reports the largest difference in px; and `joltsPerRate` counts the velocity jolts of each capture. Both are REPORTED.

import { chainedBeatEquality, joltTally, joltsOfRecording, wallTimeEquality } from './hz-pure.mjs';

const r1 = (x) => Math.round(x * 10) / 10;

/**
 * The beats of a recording, relative to `t0` (virtual ms), in the order they were seen.
 * @param {{frames: Array<any>, events: Array<any>}} rec
 * @param {number} t0 virtual ms of the moment's start (`frames[i].vt` is on the same clock)
 * @returns {Array<{label: string, t: number, f: number}>}
 */
export function beatsOf(rec, t0 = 0) {
  const out = [];
  const count = new Map();
  const add = (base, vt, f) => { const k = (count.get(base) ?? 0) + 1; count.set(base, k); out.push({ label: `${base}#${k}`, t: r1(vt - t0), f }); };
  const F = rec.frames;
  const ids = [...new Set(F.flatMap((f) => Object.keys(f.actors ?? {})))];
  const prev = { pose: new Map(), shaking: new Map(), moving: new Map(), held: false };
  for (const e of rec.events ?? []) if (e.vt >= t0) add(`ev:${e.type}`, e.vt, e.f); // the log's events, each stamped with the frame that saw it
  for (let i = 0; i < F.length; i++) {
    const fr = F[i];
    if (fr.vt < t0) continue;
    for (const id of ids) {
      const a = fr.actors?.[id];
      if (!a) continue;
      if (prev.pose.has(id) && a.pose !== prev.pose.get(id)) add(`${id}:pose:${a.pose}`, fr.vt, i);
      prev.pose.set(id, a.pose);
      const shaking = (a.shL ?? 0) > 0;
      if (shaking && !prev.shaking.get(id)) add(`${id}:shake`, fr.vt, i);
      prev.shaking.set(id, shaking);
      const moving = Math.abs(a.cx ?? 0) > 1e-5 || Math.abs(a.lunge ?? 0) > 1e-4;
      if (moving !== (prev.moving.get(id) ?? false)) add(`${id}:travel:${moving ? 'start' : 'end'}`, fr.vt, i);
      prev.moving.set(id, moving);
    }
    const held = fr.hs !== null && fr.hs !== undefined && fr.hs < 0.5;
    if (held !== prev.held) add(`hitstop:${held ? 'start' : 'end'}`, fr.vt, i);
    prev.held = held;
  }
  return out.sort((a, b) => a.f - b.f || a.t - b.t);
}

/** The beats every rate saw, in the order the first rate saw them, and the labels some rate missed (reported: a move that has a beat at 144 Hz and not at 60 is not equal). */
export function alignBeats(byHz) {
  const hzs = Object.keys(byHz).map(Number).sort((a, b) => a - b);
  if (!hzs.length) return { common: [], missing: {}, hzs };
  const sets = hzs.map((hz) => new Map(byHz[hz].map((b) => [b.label, b])));
  const common = byHz[hzs[0]].map((b) => b.label).filter((l) => sets.every((m) => m.has(l)));
  const missing = {};
  for (const [i, hz] of hzs.entries()) {
    const others = new Set(hzs.flatMap((_, j) => (j === i ? [] : [...sets[j].keys()])));
    const gone = [...others].filter((l) => !sets[i].has(l));
    if (gone.length) missing[hz] = gone;
  }
  return { common, missing, hzs, sets };
}

/** Positions (px, world x/y times `pxPerUnit`, camera not included) of every figure at the shared times `k * stepMs` from `t0`, one row per time. */
export function sharedTimeTrace(rec, t0, { stepMs = 1000 / 12, count = 24, pxPerUnit = 146 } = {}) {
  const F = rec.frames;
  const rows = [];
  for (let k = 1; k <= count; k++) {
    const t = t0 + k * stepMs;
    let best = null;
    for (const fr of F) { if (fr.vt >= t - 0.6 && (best === null || fr.vt < best.vt)) { best = fr; break; } }
    if (!best || Math.abs(best.vt - t) > 1.5) { rows.push(null); continue; } // this rate produced no frame at that time
    const pos = {};
    for (const [id, a] of Object.entries(best.actors ?? {})) pos[id] = { x: ((a.gx ?? 0) + (a.ox ?? 0)) * pxPerUnit, y: ((a.gy ?? 0) + (a.oy ?? 0)) * pxPerUnit, rattle: (a.shL ?? 0) > 0 };
    rows.push({ k, t: r1(best.vt - t0), pos });
  }
  return rows;
}

/** The largest px difference between a rate's positions and the reference's at the shared times, per figure, skipping the frames a hit rattle runs in either capture. */
export function sharedTimeDeviation(refRows, rows) {
  const per = {};
  let compared = 0;
  for (let i = 0; i < Math.min(refRows.length, rows.length); i++) {
    const a = refRows[i], b = rows[i];
    if (!a || !b) continue;
    for (const id of Object.keys(a.pos)) {
      const p = a.pos[id], q = b.pos[id];
      if (!q || p.rattle || q.rattle) continue;
      compared++;
      per[id] = Math.max(per[id] ?? 0, Math.hypot(p.x - q.x, p.y - q.y));
    }
  }
  const worst = Object.values(per).reduce((m, v) => Math.max(m, v), 0);
  return { compared, worstPx: r1(worst), perFigure: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, r1(v)])) };
}

/**
 * The whole judgement of one moment captured at several rates.
 * @param {Record<number, {frames: any[], events: any[], t0: number, seconds?: number}>} recs by Hz; `t0` is the moment's start on the capture's virtual clock
 * @param {{ wallTolerance?: number, beatFrames?: number, minIntervalMs?: number, epsilonMs?: number }} [o]
 */
export function judgeMoment(recs, { wallTolerance = 0.05, beatFrames = 1, minIntervalMs = 200, epsilonMs = 1 } = {}) {
  const hzs = Object.keys(recs).map(Number).sort((a, b) => a - b);
  const beats = Object.fromEntries(hzs.map((hz) => [hz, beatsOf(recs[hz], recs[hz].t0)]));
  const al = alignBeats(beats);
  const ref = hzs[0];
  if (hzs.length < 2 || !al.common.length) return { hzs, beatCounts: Object.fromEntries(hzs.map((hz) => [hz, beats[hz].length])), commonBeats: 0, missing: al.missing, wall: [], chain: { pass: false, pairs: [] }, shared: {}, jolts: {}, pass: false, reasons: [hzs.length < 2 ? 'fewer than two rates were captured' : 'no beat is common to every rate'], beats };
  const at = (hz, label) => al.sets[hzs.indexOf(hz)].get(label)?.t;
  // wall time: the interval from the first to every later common beat that is at least minIntervalMs after it (short ones are all quantisation)
  const first = al.common[0];
  const wall = [];
  for (const label of al.common.slice(1)) {
    const lenRef = at(ref, label) - at(ref, first);
    if (lenRef < minIntervalMs) continue;
    const runs = hzs.map((hz) => ({ hz, ms: at(hz, label) - at(hz, first) }));
    wall.push({ from: first, to: label, ...wallTimeEquality(runs, { tolerance: wallTolerance }) });
  }
  const chain = chainedBeatEquality(hzs.map((hz) => ({ hz, beats: al.common.map((l) => at(hz, l) - at(hz, first)) })), { frames: beatFrames });
  // chainedBeatEquality allows exactly `frames` display frames; the capture's own rounding of a step is up to a millisecond
  for (const p of chain.pairs) if (!p.pass && p.worstMs <= p.allowedMs + epsilonMs && !p.lengthMismatch) p.pass = true;
  chain.pass = chain.pairs.every((p) => p.pass && !p.lengthMismatch);
  const traces = Object.fromEntries(hzs.map((hz) => [hz, sharedTimeTrace(recs[hz], recs[hz].t0)]));
  const shared = Object.fromEntries(hzs.filter((hz) => hz !== ref).map((hz) => [hz, sharedTimeDeviation(traces[ref], traces[hz])]));
  const jolts = Object.fromEntries(hzs.map((hz) => {
    const F = recs[hz].frames.filter((f) => f.vt >= recs[hz].t0);
    const seconds = F.length > 1 ? (F[F.length - 1].t - F[0].t) / 1000 : 0;
    return [hz, joltTally(joltsOfRecording(F), seconds)];
  }));
  const reasons = [];
  for (const w of wall) if (!w.pass) reasons.push(`wall time ${w.from} to ${w.to}: ${w.rows.map((r) => `${r.hz} Hz ${r.ms} ms`).join(', ')} (worst ${Math.round(w.worst * 1000) / 10} percent over ${wallTolerance * 100})`);
  for (const p of chain.pairs) if (!p.pass) reasons.push(`chained beats at ${p.hz} Hz vs ${p.vs} Hz: worst ${p.worstMs} ms at beat ${al.common[p.worstBeat]} (allowed ${p.allowedMs} ms)${p.lengthMismatch ? '; beat counts differ' : ''}`);
  for (const [hz, gone] of Object.entries(al.missing)) reasons.push(`${hz} Hz lacks beat(s) the other rate(s) have: ${gone.slice(0, 6).join(', ')}${gone.length > 6 ? ' ...' : ''}`);
  return { hzs, beatCounts: Object.fromEntries(hzs.map((hz) => [hz, beats[hz].length])), commonBeats: al.common.length, missing: al.missing, wall, chain, shared, jolts, pass: reasons.length === 0, reasons, beats: Object.fromEntries(hzs.map((hz) => [hz, beats[hz]])) };
}
