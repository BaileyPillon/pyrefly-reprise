// Continuity harness: a swap whose blend began inside a gap of the recording is not a snap (CHK-027).
//
// Held-chapters lane, 2026-10-29 (Ixion XVI, FFX-2; release 68's measure-pose run `ffx2-ixion-djose-all`). The harness read one SNAP there: Paine's idle to hurt, a plain hard cut with an outline overlap of 0.44
// and no planned smear, seen once and not in the repeat. The recording has 4,765 ms of nothing between frames 2017 and 2303 (`records` jump; the battle was not the screen being recorded, a pause or the probe's
// own capture), and the swap was recorded at the first frame after the gap. The last frame BEFORE the gap already shows the hurt painting at a fade of 0.25 against the idle's 0.42: the blend had begun, so the
// change was not a cut, and the frames that would show how it was made are the ones missing. The harness walked back from the swap over consecutive frames, found none, and read a swap with no blend frames:
// a hard cut across two drawings that share 0.44, which is a snap.
//
// A swap is STARTED IN A GAP when the frame before it in the figure's record is not the previous frame of the game and the incoming painting was already showing there above the blend floor (`motion.blendFadeMin`).
// Such a swap keeps every reading the planes at the swap give (the size, the feet, the height: CHK-026 is read through the planes whatever the recording skipped) and is not a snap; `snapGap` keeps what it
// would have been, `summary.motion.snapsGapExcused` counts it. A cut the engine plans shows the incoming painting at a fade of 0 until its flip, a swap with no gap has its blend frames, so neither is touched.
// `continuity.gaps.excuse: false` in the policy gives the earlier reading back.
//
// Game case: both (shared critic plumbing; it can only fire where the recording itself has a gap).

export const GAP_DEFAULTS = Object.freeze({ excuse: true });

/** The policy's `continuity.gaps` block over the defaults (a policy without one switches the rule ON: it only ever stops a reading from frames nobody recorded). */
export function gapPolicy(cfg) {
  const p = cfg && cfg.gaps && typeof cfg.gaps === 'object' ? cfg.gaps : {};
  return { ...GAP_DEFAULTS, ...p, excuse: p.excuse !== false };
}

/**
 * Did the swap at index `at` of a figure's frame list begin in a gap of the recording?
 * @param {Array<{n: number, fig: object}>} list the figure's recorded frames, oldest first (`n` is the game's frame counter)
 * @param {number} at the index of the frame the swap was recorded at
 * @param {number} to the pose key of the incoming painting
 * @param {(fig: object, k: number) => number} fadeOf how visible painting `k` is in a figure record
 * @param {number} fadeMin the blend floor (`continuity.motion.blendFadeMin`)
 */
export function startedInGap(list, at, to, fadeOf, fadeMin) {
  if (!(at > 0) || !list[at] || !list[at - 1]) return false;
  if (list[at - 1].n === list[at].n - 1) return false; // the frame before it was recorded: the blend frames are there to read
  return fadeOf(list[at - 1].fig, to) > fadeMin;
}
