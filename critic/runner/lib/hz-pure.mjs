// The 60 / 120 / 144 Hz equality matrix and the velocity-jolt probe, as pure functions (T-03 of the motion-fluidity pass, lane L5; both games, critic plumbing).
//
// A motion that is right at 60 Hz can be wrong at 144: a step counted in frames moves 2.4 times as often, a tween that credits a whole frame on its first update holds for a different time, a chained beat
// started a few milliseconds apart lands on one frame at one rate and two at another (TB-01, TB-04; the feel lane's F8 saw Chapter I's lunge walk-back differ by 16 px between rates). The curves lane never
// ran 144 Hz. So the same scripted moment is captured on a VIRTUAL clock at each rate (tools/hz-matrix.mjs; tools/measure/session.mjs) and this module judges the captures:
//   - WALL-TIME EQUALITY (`wallTimeEquality`): the same event-to-event interval takes the same time within 5 percent at 60, 120 and 144 Hz (the method of tests/unit/feel-120hz.test.ts);
//   - CHAINED-BEAT EQUALITY (`chainedBeatEquality`): the beats of a chain (a run, then a lunge, then a settle) land within ONE DISPLAY FRAME of the slower display of each pair;
//   - VELOCITY JOLTS (`findJolts`): a change of a figure's speed of 2.5 px per 60 Hz frame or more AND 30 percent or more of the local peak speed (the curves lane's jolts.mjs): the pops and
//     stalls the eye reads as a stutter even when no position is wrong. Counted per fight with baselines (Chapter I 106 in 100 s, 94 of them the hit rattle and 11 the KO landing; Chapter IV 580 in 105 s).
// THE GRID (review M1). Speeds are in px per 60 Hz frame, but a jump judged between two CONSECUTIVE SAMPLES depends on the sample interval: the same 120 Hz motion read every other frame gave 658 jolts for
// the 580 it gave at every frame (Chapter IV, +13 percent; Chapter I +22 to +29), and a 50 ms ramp that is one jolt at 60 Hz is none at 120 or 144. So by default the position series is resampled to a FIXED
// 1/60 s grid (linear between the capture's frames) before it is judged: `gridMs` 16.667, the jump is the change over one 60 Hz frame whatever the capture rate. `gridMs: 0` is the curves lane's raw
// method (every captured frame), kept to reproduce its 580 and 106 and never for a comparison across rates. Pure: samples in, numbers out.

/** The rates of the matrix. */
export const HZ_RATES = Object.freeze([60, 120, 144]);

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * The fake-clock steps (integer ms) that make a display of `hz` EXACTLY: 60 Hz 17,17,16 (50 ms for 3 frames); 120 Hz 8,8,9 (25 ms for 3); 144 Hz seventeen 7s and one 6 (125 ms for 18 frames). The plan wrote 144 Hz as
 * 7,7,7,7,7,7,6, which is 48 ms for 7 frames: 145.8 Hz, 1.3 percent fast: far inside the 5 percent interval gate, but over a 0.5 s chain it moves the beats by about one 144 Hz frame, which is the chained-beat gate. Any other rate gets cumulative rounding over its own cycle
 * (hz / gcd(hz, 1000) frames), so the long-run rate is exact.
 */
export function frameMsFor(hz) {
  if (hz === 60) return [17, 17, 16];
  if (hz === 120) return [8, 8, 9];
  const n = Math.round(hz) / gcd(Math.round(hz), 1000);
  const out = [];
  let prev = 0;
  for (let k = 1; k <= n; k++) { const t = Math.round((k * 1000) / hz); out.push(t - prev); prev = t; }
  return out;
}

/** The virtual milliseconds `n` frames at `hz` take (the sum of the steps). */
export function stepsTotal(hz, n) {
  const steps = frameMsFor(hz);
  let ms = 0;
  for (let i = 0; i < n; i++) ms += steps[i % steps.length];
  return ms;
}

const r1 = (x) => Math.round(x * 10) / 10;
const r3 = (x) => Math.round(x * 1000) / 1000;
const FRAME60 = 1000 / 60;

/**
 * Wall-time equality across rates for ONE interval (an event index to an event index, or a mark to a mark). An interval passes when it is within `tolerance` (5 percent) of the reference's OR within the
 * quantisation of the slowest display (`slackMs`: both ends of an interval are seen at the first FRAME at or after the event, so two rates can differ by up to one frame of the slower one with nothing wrong;
 * review m6: at 200 to 350 ms that alone is over 5 percent in up to 12 percent of phases). A real defect is both more than 5 percent and more than a frame.
 * @param {Array<{hz: number, ms: number}>} runs the interval's length in virtual ms at each rate
 * @param {{tolerance?: number, reference?: number, slackMs?: number}} [o] `tolerance` 0.05; `reference` the rate the others are compared with (default the lowest); `slackMs` default one frame of the slowest rate measured, rounded up
 */
export function wallTimeEquality(runs, { tolerance = 0.05, reference, slackMs } = {}) {
  const ok = runs.filter((r) => Number.isFinite(r.ms) && r.ms >= 0);
  if (ok.length < 2) return { pass: false, reason: 'fewer than two rates measured', rows: [] };
  const ref = ok.find((r) => r.hz === (reference ?? Math.min(...ok.map((x) => x.hz)))) ?? ok[0];
  const slack = slackMs ?? Math.ceil(1000 / Math.min(...ok.map((x) => x.hz)));
  const rows = ok.map((r) => ({ hz: r.hz, ms: r.ms, ratio: ref.ms > 0 ? r3(r.ms / ref.ms) : null, deviation: ref.ms > 0 ? r3(Math.abs(r.ms / ref.ms - 1)) : null, diffMs: r1(Math.abs(r.ms - ref.ms)) }));
  const worst = rows.reduce((m, r) => Math.max(m, r.deviation ?? 0), 0);
  const pass = rows.every((r) => (r.deviation ?? 0) <= tolerance || r.diffMs <= slack);
  return { pass, referenceHz: ref.hz, tolerance, slackMs: slack, worst, rows };
}

/**
 * Chained-beat equality: the beats of one chain (times in virtual ms from the chain's first event, one array per rate) land within `frames` display frames of the SLOWER display of each pair of rates.
 * @param {Array<{hz: number, beats: number[]}>} runs
 * @param {{frames?: number}} [o]
 */
export function chainedBeatEquality(runs, { frames = 1 } = {}) {
  const ok = runs.filter((r) => Array.isArray(r.beats) && r.beats.length);
  if (ok.length < 2) return { pass: false, reason: 'fewer than two rates measured', pairs: [] };
  const n = Math.min(...ok.map((r) => r.beats.length));
  const ref = ok.reduce((a, b) => (b.hz < a.hz ? b : a));
  const pairs = [];
  for (const r of ok) {
    if (r === ref) continue;
    const allowed = frames * (1000 / Math.min(r.hz, ref.hz));
    let worst = 0, worstAt = -1;
    for (let k = 0; k < n; k++) { const d = Math.abs(r.beats[k] - ref.beats[k]); if (d > worst) { worst = d; worstAt = k; } }
    pairs.push({ hz: r.hz, vs: ref.hz, beats: n, worstMs: r1(worst), worstBeat: worstAt, allowedMs: r1(allowed), pass: worst <= allowed, lengthMismatch: r.beats.length !== ref.beats.length });
  }
  return { pass: pairs.every((p) => p.pass && !p.lengthMismatch), frames, pairs };
}

/** Speeds in px per 60 Hz frame from `[{t, x}]` (t in ms): `v[i]` is the speed over the step that ended at sample i (v[0] = 0). */
export function speedSeries(samples) {
  return samples.map((s, i) => {
    if (!i) return 0;
    const dt = s.t - samples[i - 1].t;
    return dt > 0 ? ((s.x - samples[i - 1].x) / dt) * FRAME60 : 0;
  });
}

/** The 60 Hz frame, in ms, the jolt grid steps by. */
export const JOLT_GRID_MS = FRAME60;

/**
 * Resample `[{t, x}]` (t in ms, increasing) to a fixed grid of `stepMs`, linear between neighbours, from the first sample's time to the last. `src` is the index of the captured sample nearest the grid time
 * (what a jolt is classified from). A series with fewer than two samples comes back as it is.
 */
export function resampleToGrid(samples, stepMs = JOLT_GRID_MS) {
  if (!(stepMs > 0) || samples.length < 2) return samples.map((s, i) => ({ t: s.t, x: s.x, src: i }));
  const t0 = samples[0].t, tEnd = samples[samples.length - 1].t;
  const out = [];
  let j = 1;
  for (let k = 0; ; k++) {
    const t = t0 + k * stepMs;
    if (t > tEnd + 1e-6) break;
    while (j < samples.length - 1 && samples[j].t < t) j++;
    const a = samples[j - 1], b = samples[j];
    const f = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 1;
    out.push({ t, x: a.x + (b.x - a.x) * f, src: f > 0.5 ? j : j - 1 });
  }
  return out;
}

/**
 * The velocity jolts of one channel: samples `i` where the speed changed by `minJump` (px per 60 Hz frame, 2.5) or more AND by `minShare` (0.3) or more of the largest speed within `windowMs` (333) either side.
 * `gridMs` (default 16.667, one 60 Hz frame) resamples the series first, so the count does not depend on the capture rate; 0 judges every captured frame (the curves lane's raw method).
 * Samples closer than `skip` to either end are not judged (the speed needs a neighbour). Adjacent flagged samples are kept as separate jolts (the curves lane counted every flagged frame); `merge` joins the
 * run of flagged samples within `mergeMs` into the largest one. Each jolt's `src` is the captured frame it falls on.
 * @param {Array<{t: number, x: number}>} samples
 */
export function findJolts(samples, { minJump = 2.5, minShare = 0.3, windowMs = 333, skip = 3, mergeMs = 0, gridMs = JOLT_GRID_MS } = {}) {
  const S = gridMs > 0 ? resampleToGrid(samples, gridMs) : samples.map((s, i) => ({ ...s, src: i }));
  const v = speedSeries(S);
  const out = [];
  for (let i = Math.max(1, skip); i < S.length - skip; i++) {
    const jump = Math.abs(v[i] - v[i - 1]);
    if (jump < minJump) continue;
    let peak = 0;
    for (let k = i - 1; k >= 0 && S[i].t - S[k].t <= windowMs; k--) peak = Math.max(peak, Math.abs(v[k]));
    for (let k = i; k < S.length && S[k].t - S[i].t <= windowMs; k++) peak = Math.max(peak, Math.abs(v[k]));
    const share = jump / (peak || 1);
    if (share < minShare) continue;
    out.push({ i, src: S[i].src, t: S[i].t, vBefore: r1(v[i - 1]), vAfter: r1(v[i]), jump: r1(jump), share: r3(Math.min(share, 1)) });
  }
  if (!(mergeMs > 0)) return out;
  const merged = [];
  for (const j of out) {
    const last = merged[merged.length - 1];
    if (last && j.t - last.tLast <= mergeMs) { last.tLast = j.t; if (j.jump > last.jump) Object.assign(last, { i: j.i, src: j.src, t: j.t, vBefore: j.vBefore, vAfter: j.vAfter, jump: j.jump, share: j.share, tLast: j.t }); } else merged.push({ ...j, tLast: j.t });
  }
  return merged.map(({ tLast, ...rest }) => rest);
}

/**
 * What a jolt was, from the channels of the frame it fell on (the recorder's `actors[id]` row): the hit rattle (the shake is running), the KO (the fall or the lying pose), a leap (lift), the hit-stop
 * edge (the field clock is held), else the pose name. The classes the curves lane's baselines are quoted in.
 */
export function classifyJolt(row, frame = {}) {
  if (!row) return 'other';
  if (row.pose === 'ko' || row.life === 'ko' || (row.fdrop ?? 0) > 0.0001 || Math.abs(row.ftilt ?? 0) > 0.0001) return 'ko'; // the fall first: the landing shakes too
  if ((row.shL ?? 0) > 0) return 'hit rattle';
  if ((row.clift ?? 0) > 0.004 || (row.hop ?? 0) > 0.004) return 'leap';
  if (frame.hs !== null && frame.hs !== undefined && frame.hs < 0.5) return 'hit-stop';
  return row.pose ? `pose ${row.pose}` : 'other';
}

/**
 * The jolts of a stepped recording: every actor, both world axes (position = (gx+ox, gy+oy) world units times `pxPerUnit`, the curves lane's channel), classified.
 * @param {Array<{t: number, hs?: number|null, actors: Record<string, Record<string, any>>}>} frames the recorder's frames (tools/measure/channels.mjs)
 * @param {{pxPerUnit?: number, gridMs?: number}} [o] and the `findJolts` options (`gridMs` 0: the raw method)
 */
export function joltsOfRecording(frames, { pxPerUnit = 146, ...opts } = {}) {
  const ids = [...new Set(frames.flatMap((f) => Object.keys(f.actors ?? {})))];
  const all = [];
  for (const id of ids) {
    for (const [axis, g, o] of [['x', 'gx', 'ox'], ['y', 'gy', 'oy']]) {
      const samples = frames.map((f) => ({ t: f.t, x: ((f.actors?.[id]?.[g] ?? 0) + (f.actors?.[id]?.[o] ?? 0)) * pxPerUnit }));
      for (const j of findJolts(samples, opts)) all.push({ id, axis, ...j, class: classifyJolt(frames[j.src]?.actors?.[id], frames[j.src]), pose: frames[j.src]?.actors?.[id]?.pose ?? null });
    }
  }
  return all;
}

/** The tally of a set of jolts over `seconds` of play: total, a minute, by class (count and share), the largest jump. */
export function joltTally(jolts, seconds) {
  const byClass = {};
  for (const j of jolts) byClass[j.class] = (byClass[j.class] ?? 0) + 1;
  const total = jolts.length;
  return {
    total, seconds: r1(seconds), perMinute: seconds > 0 ? r1((total * 60) / seconds) : null, maxJump: jolts.reduce((m, j) => Math.max(m, j.jump), 0),
    byClass, shareByClass: Object.fromEntries(Object.entries(byClass).map(([k, n]) => [k, total ? r3(n / total) : 0])),
  };
}

/**
 * The jolt gate against a baseline: a fight must not have more jolts a minute than the baseline's plus `maxRise` (a share, 0.10), and no class may rise by more than that unless the item under test is the one
 * that declares it (`declared`: class names allowed to move). A rise is only reported when it is also beyond COUNT NOISE: jolts are events, and two captures of one scripted fight differ by chance (the same
 * fight at 60 and at 144 Hz gave 433 and 458 jolts in total, and 7 and 13 of one small class, which a bare 10 percent rule flagged). The candidate's count, scaled to the baseline's seconds, must exceed the
 * baseline's by more than `sigma` (2) standard deviations of the difference of two counts (the square root of their sum); `sigma: 0` is the bare rule. REPORTED unless the policy gates it (critic/policy.json `fluidity.jolts.mode`).
 */
export function joltGate(tally, baseline, { maxRise = 0.1, declared = [], sigma = 2 } = {}) {
  const reasons = [];
  const baseSeconds = baseline?.seconds ?? tally.seconds;
  const scale = tally.seconds > 0 && baseSeconds > 0 ? baseSeconds / tally.seconds : 1; // the candidate's counts as if over the baseline's seconds
  const beyondNoise = (n, was) => sigma <= 0 || n * scale - was > sigma * Math.sqrt(n * scale + was);
  const wasTotal = baseline?.total ?? ((baseline?.perMinute ?? 0) * baseSeconds) / 60;
  if (baseline?.perMinute > 0 && tally.perMinute != null && tally.perMinute > baseline.perMinute * (1 + maxRise) && beyondNoise(tally.total, wasTotal)) reasons.push(`${tally.perMinute} jolts a minute is over the baseline's ${baseline.perMinute} by more than ${Math.round(maxRise * 100)} percent`);
  for (const [cls, n] of Object.entries(tally.byClass)) {
    if (declared.includes(cls)) continue;
    const was = baseline?.byClass?.[cls] ?? 0;
    const rate = (c, s) => (s > 0 ? (c * 60) / s : 0);
    if (rate(n, tally.seconds) > rate(was, baseSeconds) * (1 + maxRise) + 0.5 && beyondNoise(n, was)) reasons.push(`class "${cls}" rose from ${r1(rate(was, baseSeconds))} to ${r1(rate(n, tally.seconds))} a minute`);
  }
  return { pass: reasons.length === 0, reasons };
}

/**
 * May two jolt counts be set side by side? (review M1: `--compare` waved a Chapter I run through against the Chapter IV baseline.) A count is comparable when both were judged the SAME way (the grid), on the
 * SAME scripted capture (chapter and query), over a stretch of similar length (a minute's rate over 45 s and over 105 s of a fight are not the same sample), under the same thresholds. The capture rate and the
 * build are what a comparison varies, so they are not reasons. Returns the reasons they may not (empty: comparable).
 * @param {{chapter?: string|null, query?: string|null, gridMs?: number|null, seconds?: number|null, policy?: any}} a
 * @param {{chapter?: string|null, query?: string|null, gridMs?: number|null, seconds?: number|null, policy?: any}} b
 */
export function joltsIncomparable(a, b, { maxSecondsRatio = 1.25 } = {}) {
  const why = [];
  const ga = a.gridMs ?? 0, gb = b.gridMs ?? 0;
  if (Math.abs(ga - gb) > 0.01) why.push(`judged differently (grid ${r1(ga)} ms, ${r1(gb)} ms): a raw count depends on the capture rate`);
  if (a.chapter && b.chapter && a.chapter !== b.chapter) why.push(`different chapters (${a.chapter}, ${b.chapter})`);
  if (a.query && b.query && a.query !== b.query) why.push(`different query (${a.query}, ${b.query})`);
  if (a.seconds > 0 && b.seconds > 0) {
    const ratio = Math.max(a.seconds, b.seconds) / Math.min(a.seconds, b.seconds);
    if (ratio > maxSecondsRatio) why.push(`captures of different length (${a.seconds} s, ${b.seconds} s)`);
  }
  const pa = a.policy, pb = b.policy;
  if (pa && pb) for (const k of ['minJumpPx', 'minShare', 'windowMs']) if (pa[k] !== pb[k]) why.push(`different threshold ${k} (${pa[k]}, ${pb[k]})`);
  return why;
}
