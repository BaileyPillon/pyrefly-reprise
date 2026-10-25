// Continuity harness: a PLANNED smear is stagecraft, not a snap (CHK-027).
//
// Conference demo, motion pass (lane "core", step 2). Bailey, 2026-10-22: "Cut on the motion peak with a smear": a big pose change is a CUT inside a 2 to 4 frame streak, on the
// fastest frame of the move (src/engine/motion/SmearPlan.ts, SmearDirector.ts, rig/RigSmearWindow.ts). To the harness that is exactly what CHK-027 exists to catch: a swap with no
// in-between frames (a SNAP, summary.motion.snaps, 0.25 a minute at most) and a head that steps tens of pixels in one frame (a JERK AT A SWAP, 40 px fails).
//
// The excuse is narrow, and it is his: "Yes, only planned smears." The engine writes every cut it plans as a smear to a log (src/engine/motion/SmearLog.ts, read from the page as
// window.__pyrefly.smearLog() by the probe: meta.smears, in the probe's clock). A swap is a planned smear when ALL of these hold:
//   - the log has an entry for the SAME figure and the SAME pair of paintings (or rig keys), from and to;
//   - the entry is a BIG change by the policy's own numbers (an outline overlap under `bigOverlap`, heads `bigAnchor` of the figure's height apart, a rig key that swaps the figure's
//     images, or a pair the engine itself marks `big` where it cannot read an outline: a knock-out's standing body and its lying one), so a small change the engine somehow cut is not excused;
//   - the swap's flip fell inside the entry's window (its start less `slackMs` and a frame, to its end plus `slackMs` and two frames);
//   - one entry excuses one swap.
// What the excuse does, and no more: the swap is not counted as a SNAP (`snap` false; `snapSmear` keeps what it would have been, and `hardCut` stays true), and a jerk AT that swap of no
// more than `maxJerkPx` is `smeared` (kept in `jerks` and shown, left out of the summary and the verdict, as a jerk under the Save Sphere's wash is). A jerk bigger than that stays a jerk:
// a streak does not hide a 300 px teleport. Every OTHER fast swap, with no log entry, a log entry for another pair, or one outside its window, is judged exactly as before; so is every size,
// feet and double-image reading (CHK-026 is not touched: a smear covers a cut, it does not make a head the wrong size).
//
// R63-M1 (the release 63 focused review, traced 2026-10-24) found the two limits of this excuse too tight for what the engine really plans, and fixed both, each behind its own policy word:
//   - ELASTIC (`elastic`): the flip a swap records is the first frame in which the new painting dominates. When the frames before it were long (a painting drawn for the first time uploads to the
//     GPU in the frame the cut begins, and its first reads follow in the next: 88 and 89 ms back to back measured in Chapter I), the flip lands as late as the stalls, so it fell outside the entry's
//     window by that much and the planned cut read as a SNAP (4 of the review's 0.62 snaps per minute). The window now also allows `swap.stallMs`: the time the long frames (over `motion.longFrameMs`)
//     among the swap's last `motion.windowFrames` frames took beyond one frame each (analyze sets it). Only a window that was missed by that much is widened: the pair, the figure and the entry's
//     own start still have to match.
//   - THE SIZE OF THE STEP (`maxJerkShare`): a step AT a planned smear is excused up to the larger of `maxJerkPx` (at 1600 wide) and `maxJerkShare` of the figure's DRAWN height at the swap
//     (`swap.figurePx`, at 1600 wide), because the pro camera's push-in magnifies a cut: the same Tidus hit cut read 133 px with the camera off and 237 px in the push-in, 0.41 of his drawn
//     height either way. The engine's own plan is a head step of 0.04 to 0.44 of the figure's height (`anchorDistance` in the log; the largest is Auron's return to his stance after the killing
//     blow); a step over half the drawn height is not a planned cut and stays a jerk, and a mid-move step of `jerks.teleportPx` (300 px) or more is a teleport whatever this says.
//
// `continuity.smear.excuse` in the policy switches it (false, or no block, gives the earlier reading back: every fast swap is judged).
//
// Game case: both (shared critic plumbing); FFX in Chapter I and FFX-2 in Chapter IV only because the engine plays the smear only there.

export const SMEAR_DEFAULTS = Object.freeze({ excuse: false, slackMs: 12, maxJerkPx: 120, maxJerkShare: 0, elastic: false, bigOverlap: 0.5, bigAnchor: 0.12 });

/** The policy's `continuity.smear` block over the defaults (a policy without one excuses nothing). */
export function smearPolicy(cfg) {
  const p = cfg && cfg.smear && typeof cfg.smear === 'object' ? cfg.smear : {};
  return { ...SMEAR_DEFAULTS, ...p, excuse: p.excuse === true };
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);

/** Is the logged plan a big change by the policy's numbers? A rig key is (the engine only plans a rig smear for a whole-figure image swap). */
export function loggedAsBig(e, policy) {
  return e.kind === 'rig' || e.big === true || (num(e.overlap) && e.overlap < policy.bigOverlap) || (num(e.anchorDistance) && e.anchorDistance >= policy.bigAnchor);
}

/**
 * The log entry a swap is a planned smear of, or null. `used` holds the indices already spent (one entry excuses one swap).
 * @param {{figure?: string, fromPose?: string, toPose?: string, tMs?: number}} swap
 * @param {Array<{actor: string, from: string, to: string, at: number, cutMs: number, kind?: string, overlap?: number|null, anchorDistance?: number|null}>} smears  meta.smears, `at` in the probe's clock (ms)
 */
export function matchSmear(swap, smears, policy, frameMs = 1000 / 60, used = new Set()) {
  if (!policy.excuse || !num(swap.tMs) || !Array.isArray(smears)) return null;
  for (let i = 0; i < smears.length; i++) {
    const e = smears[i];
    if (used.has(i) || !e) continue;
    if (e.actor !== swap.figure || e.from !== swap.fromPose || e.to !== swap.toPose) continue;
    if (!loggedAsBig(e, policy)) continue;
    if (!num(e.at) || !num(e.cutMs)) continue;
    // a painting set's swap is the cut itself, inside the window; a rig's is the change of key, which the harness sees when the move BEGINS (the flip and its window are halfway through it)
    const span = e.kind === 'rig' && num(e.moveMs) ? e.moveMs : e.cutMs;
    const stall = policy.elastic && num(swap.stallMs) && swap.stallMs > 0 ? swap.stallMs : 0; // R63-M1: long frames before the flip land the flip that much late
    if (swap.tMs < e.at - policy.slackMs - frameMs || swap.tMs > e.at + span + policy.slackMs + 2 * frameMs + stall) continue;
    used.add(i);
    return { index: i, entry: e };
  }
  return null;
}

/**
 * Tag the swaps that are planned smears (mutates them): `smear` (what the engine planned), `snap` false and `snapSmear` (what it would have been). Returns the tally.
 * @returns {{planned: number, matched: number, unmatched: number, snapsExcused: number}}
 */
export function tagSmears(swaps, smears, policy, frameMs = 1000 / 60) {
  const list = Array.isArray(smears) ? smears : [];
  const used = new Set();
  let snapsExcused = 0;
  if (policy.excuse) {
    for (const s of swaps) {
      const m = matchSmear(s, list, policy, frameMs, used);
      if (!m) continue;
      const e = m.entry;
      s.smear = { style: e.style ?? null, kind: e.kind ?? 'plane', cutMs: e.cutMs, strength: e.strength ?? null, flash: e.flash ?? null, overlap: e.overlap ?? null, anchorDistance: e.anchorDistance ?? null };
      s.snapSmear = Boolean(s.snap);
      if (s.snap) {
        s.snap = false;
        snapsExcused++;
      }
    }
  }
  return { planned: list.length, matched: used.size, unmatched: list.length - used.size, snapsExcused };
}

/** How far a step AT this planned smear may be and still be excused, px at 1600 wide: `maxJerkPx`, or `maxJerkShare` of the figure's drawn height at the swap when that is more. */
export function smearCapPx(swap, policy) {
  const share = num(policy.maxJerkShare) && policy.maxJerkShare > 0 && num(swap?.figurePx) ? policy.maxJerkShare * swap.figurePx : 0;
  return Math.max(policy.maxJerkPx, share);
}

/** The tag a jerk AT a planned-smear swap carries when it is small enough to excuse, else null (it stays a jerk). */
export function smearedJerk(jerk, swap, policy) {
  if (!policy.excuse || !swap || !swap.smear || !(jerk.px <= smearCapPx(swap, policy))) return null;
  return { style: swap.smear.style, kind: swap.smear.kind, swap: swap.id, ...(num(swap.figurePx) && swap.figurePx > 0 ? { share: Math.round((jerk.px / swap.figurePx) * 1000) / 1000 } : {}) };
}

/**
 * How tall the figure is drawn around a swap, px at 1600 wide: the tallest of its planes that show (fade over 0.3) in the frames given (the frame before the flip and the flip's own), each plane's
 * height the distance from the middle of its top edge to the middle of its bottom edge (the quad's corners are top-left, top-right, bottom-right, bottom-left). Null when none shows.
 * @param {Array<{fig: {s?: Array}}|null|undefined>} frames
 * @param {number} k1600
 */
export function figureHeightPx(frames, k1600) {
  let best = null;
  for (const fr of frames) {
    for (const s of fr?.fig?.s ?? []) {
      if (!Array.isArray(s) || !(s[1] > 0.3) || s[2] !== 1 || s.length < 11) continue;
      const q = s.slice(3, 11);
      if (!q.every(num)) continue;
      const h = Math.hypot((q[0] + q[2]) / 2 - (q[6] + q[4]) / 2, (q[1] + q[3]) / 2 - (q[7] + q[5]) / 2) * k1600;
      if (num(h) && (best === null || h > best)) best = h;
    }
  }
  return best;
}

/** What the report carries about the smear: the policy in force, the tally and the jerks excused. */
export function smearReport({ tally, jerks, policy, smears }) {
  const smeared = jerks.filter((j) => j.smeared);
  const list = Array.isArray(smears) ? smears : [];
  return {
    note: 'planned smears (continuity.smear in the policy): the engine logs every cut it plans as a smear on a big change; a swap that matches a log entry (same figure, same pair, inside its window) is not a snap and a jerk of at most maxJerkPx at it is not counted. Every other fast swap is judged as before.',
    policy: { excuse: policy.excuse, slackMs: policy.slackMs, maxJerkPx: policy.maxJerkPx, maxJerkShare: policy.maxJerkShare, elastic: policy.elastic, bigOverlap: policy.bigOverlap, bigAnchor: policy.bigAnchor },
    ...tally,
    jerksExcused: smeared.length, worstJerkPx: Math.round(smeared.reduce((m, j) => Math.max(m, j.px), 0) * 10) / 10, worstJerkShare: Math.round(smeared.reduce((m, j) => Math.max(m, j.smeared?.share ?? 0), 0) * 1000) / 1000,
    byStyle: list.reduce((m, e) => ((m[e.style ?? 'unknown'] = (m[e.style ?? 'unknown'] ?? 0) + 1), m), {}),
    byKind: list.reduce((m, e) => ((m[e.kind ?? 'plane'] = (m[e.kind ?? 'plane'] ?? 0) + 1), m), {}),
  };
}
