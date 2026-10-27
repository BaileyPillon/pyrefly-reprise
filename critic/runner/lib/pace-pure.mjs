// Frame pacing from the in-page recorder's dump: the numbers a run of the game's own frames gives, in the unit the player feels (T-01 of the motion-fluidity pass, lane L5; both games, critic plumbing).
//
// PORTED from the pacing lane's analyze-run.mjs (PACE-02 to PACE-10) and made pure: a dump (the shape `pace-init.page.js` drains, merged by pace-record.mjs) and the run's meta in, plain numbers out.
// Nothing here reads a file, a clock or a browser.
//
// WHAT TO QUOTE (PACE-10): not "the share of late frames" but ANIMATION TIME LOST a minute: the game clamps its animation clock at 1/40 s a frame (PoseSwap.ts battleFrameClocks) and its timers at 1/20 s
// (App.ts maxDelta), so a frame that took 60 ms gives the figures 25 ms of motion and the picture loses 35 ms. Chapter I at 1440p and 60 Hz loses 674 ms a minute, Chapter IV 90. The steady window leaves out
// the first `entrySec` seconds of the battle (the first-sight work of the opening: it loses 2.0 to 5.3 s of its 10) and the frames the critic's own route disturbed (a debug-API read, a screenshot):
// `steadyNoHarness` is the game's. The continuity probe is NEVER a source for any of this (PACE-08).
//
// Game case: both (shared critic plumbing).

/** The game's animation clock clamp (PoseSwap.ts battleFrameClocks), ms. A frame longer than this loses the rest. */
export const ANIM_CLAMP_MS = 25;
/** The game's timer clamp (App.ts maxDelta), ms. */
export const TIMER_CLAMP_MS = 50;
/** The entry window left out of the steady numbers, seconds. */
export const ENTRY_SEC = 10;
/** The thresholds a frame interval is counted over, ms (the timer's own 0.1 ms granularity is in the 8.45 / 16.85: "over 16.7" means a refresh was missed by more than the rounding). */
export const OVER_MS = Object.freeze([['over8_3', 8.45], ['over16_7', 16.85], ['over25', 25], ['over33', 33.5], ['over50', 50], ['over100', 100], ['over250', 250]]);

const r2 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
/** The p-th percentile (0 to 1) by the nearest rank the lane used, or null. */
export function pct(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

/**
 * The battle window of a run: from the first `battle` screen to the first later screen that is not battle, pause or a transition (''), and the pauses inside it (a pause is time the battle was not played).
 * @param {Array<[number, string]>} screens `[page ms, screen name]` as the recorder saw them change
 * @param {number} lastStart page ms of the last recorded frame (the end when no later screen ended the battle)
 * @returns {{b0: number|null, b1: number|null, pauses: Array<[number, number]>}}
 */
export function battleWindow(screens, lastStart) {
  let b0 = null, b1 = null, curPause = null;
  const pauses = [];
  for (const [t, name] of screens) {
    if (b0 === null) { if (name === 'battle') b0 = t; continue; }
    if (b1 !== null) continue;
    if (name === 'pause') { curPause = t; continue; }
    if (name === 'battle' && curPause !== null) { pauses.push([curPause, t]); curPause = null; continue; }
    if (name && name !== 'battle' && name !== 'pause') b1 = t;
  }
  if (b0 !== null && b1 === null) b1 = lastStart;
  return { b0, b1, pauses };
}

/**
 * The statistics of a set of frames over `minutes` of play. `rows` are `{iv, js}`: the interval to the frame before (ms, the rAF timestamps' difference) and the ms spent in the frame's callbacks.
 * `animLostMsPerMin` is the PRIMARY number (time the animation clock gave away); the counts over each threshold are per run, per cent of frames and per minute.
 */
export function paceStats(rows, minutes) {
  if (!rows.length || !(minutes > 0)) return { frames: rows.length, seconds: r2(minutes * 60) };
  const iv = rows.map((r) => r.iv);
  const over = (x) => iv.filter((v) => v > x).length;
  const o = { frames: iv.length, seconds: r2(minutes * 60), fps: r2(iv.length / (minutes * 60)), p50: r2(pct(iv, 0.5)), p95: r2(pct(iv, 0.95)), p99: r2(pct(iv, 0.99)), p999: r2(pct(iv, 0.999)), max: r2(iv.reduce((a, b) => (b > a ? b : a), 0)), mean: r2(iv.reduce((a, b) => a + b, 0) / iv.length) };
  for (const [k, x] of OVER_MS) { o[k] = over(x); o[`${k}Pct`] = r2((100 * over(x)) / iv.length); o[`${k}PerMin`] = r2(over(x) / minutes); }
  o.animLostMsPerMin = r2(iv.reduce((a, v) => a + Math.max(0, v - ANIM_CLAMP_MS), 0) / minutes);
  o.timerLostMsPerMin = r2(iv.reduce((a, v) => a + Math.max(0, v - TIMER_CLAMP_MS), 0) / minutes);
  const js = rows.map((r) => r.js ?? 0);
  o.jsMean = r2(js.reduce((a, b) => a + b, 0) / js.length);
  o.jsP95 = r2(pct(js, 0.95));
  o.jsP99 = r2(pct(js, 0.99));
  return o;
}

/**
 * Every frame of the battle as a row, from the dump's columns. The first frame has no interval and is skipped.
 * @param {{n: number, fTs: number[], fStart: number[], fJs: number[], fHeap?: number[], fCbs?: number[]}} d
 */
export function frameRows(d, b0, b1) {
  const rows = [];
  for (let i = 1; i < d.n; i++) {
    const t = d.fStart[i];
    if (t < b0 || t > b1) continue;
    rows.push({ i, t, rel: (t - b0) / 1000, iv: d.fTs[i] - d.fTs[i - 1], gap: t - d.fStart[i - 1], js: d.fJs[i], jsPrev: d.fJs[i - 1], heap: d.fHeap ? d.fHeap[i] : 0, heapPrev: d.fHeap ? d.fHeap[i - 1] : 0, cbs: d.fCbs ? d.fCbs[i] : 0 });
  }
  return rows;
}

/**
 * The whole run's pacing: the battle window, the entry (first `entrySec` s), the steady rest, and the steady rest without the frames the route itself disturbed.
 * @param {{dump: object, meta?: {screenshots?: Array<[number, number]>}, entrySec?: number}} o  `dump` is the recorder's merged dump, `meta.screenshots` the route's `[epoch ms, ms]` screenshots
 * @returns {object|{error: string}}
 */
export function analyzePace({ dump, meta = {}, entrySec = ENTRY_SEC }) {
  const d = dump;
  if (!d || !(d.n > 2)) return { error: 'the recorder drained fewer than 3 frames' };
  const win = battleWindow(d.screens ?? [], d.fStart[d.n - 1]);
  if (win.b0 === null) return { error: 'the recorder never saw the battle screen' };
  const { b0, b1, pauses } = win;
  const inPause = (t) => pauses.some(([a, b]) => t >= a && t <= b);
  const battleSec = (b1 - b0) / 1000;
  const rows = frameRows(d, b0, b1);
  const notPause = rows.filter((r) => !inPause(r.t));
  const entry = notPause.filter((r) => r.rel < entrySec);
  const steady = notPause.filter((r) => r.rel >= entrySec);
  const steadyMin = Math.max(0.01, battleSec - entrySec) / 60;
  const toPage = (epoch) => epoch - d.timeOrigin;
  const shots = (meta.screenshots ?? []).map(([s, ms]) => [toPage(s), toPage(s) + ms]);
  const calls = (d.harness ?? []).map(([t, name, dur]) => [t, t + dur, name]);
  const near = (t0, t1) => calls.some(([a, b]) => b >= t0 && a <= t1) || shots.some(([a, b]) => b >= t0 && a <= t1);
  const clean = steady.filter((r) => !near(r.t - r.gap - 1, r.t + 1));
  const harness = { counts: d.harnessCount ?? {}, slowCalls: calls.length, totalMs: r2(calls.reduce((a, c) => a + (c[1] - c[0]), 0)) };
  const out = {
    battle: { startMs: r2(b0), endMs: r2(b1), seconds: r2(battleSec), pauses: pauses.length, pauseSec: r2(pauses.reduce((a, [x, y]) => a + (y - x), 0) / 1000) },
    entrySec,
    all: paceStats(notPause, battleSec / 60),
    entry: paceStats(entry, Math.max(0.01, Math.min(entrySec, battleSec) / 60)),
    steady: paceStats(steady, steadyMin),
    // the game's own steady frames: no debug-API read, screenshot or key-driven evaluate within the frame interval; minutes scaled by the share kept
    steadyNoHarness: { ...paceStats(clean, steadyMin * (steady.length ? clean.length / steady.length : 1)), note: 'steady frames with no debug-API read or screenshot (>= 0.15 ms) within the frame interval' },
    harness,
    screenshots: { n: shots.length, inBattle: shots.filter(([a]) => a >= b0 && a <= b1).length },
  };
  out.headline = headline(out);
  return out;
}

/**
 * The numbers to quote, from an analysis: animation time lost a minute and steady frames over 33 ms a minute, THE GAME'S (the frames the route's own reads and screenshots touched left out), and
 * `steadyAnimLostMsPerMin` for every steady frame, which is the unit the plan's baselines were quoted in (Chapter I 674, Chapter IV 90 ms a minute at 1440p and 60 Hz).
 */
export function headline(a) {
  const s = a.steadyNoHarness?.frames ? a.steadyNoHarness : a.steady;
  return { animLostMsPerMin: s?.animLostMsPerMin ?? null, steadyAnimLostMsPerMin: a.steady?.animLostMsPerMin ?? null, over33PerMin: s?.over33PerMin ?? null, over50PerMin: s?.over50PerMin ?? null, p99: s?.p99 ?? null, entryAnimLostMs: a.entry?.animLostMsPerMin == null ? null : r2((a.entry.animLostMsPerMin * a.entry.seconds) / 60), battleSeconds: a.battle?.seconds ?? null };
}

/** `{label: stats}` rows to a markdown-free text table of the headline numbers (for a log or a handoff note). */
export function headlineText(label, a) {
  if (a.error) return `${label}: ${a.error}`;
  const h = a.headline;
  return `${label}: ${h.battleSeconds} s of battle; steady animation time lost ${h.animLostMsPerMin} ms a minute (${h.steadyAnimLostMsPerMin} with the route's own frames); frames over 33 ms ${h.over33PerMin} a minute (over 50 ${h.over50PerMin}); p99 ${h.p99} ms; the first ${a.entrySec} s lose ${h.entryAnimLostMs} ms`;
}
