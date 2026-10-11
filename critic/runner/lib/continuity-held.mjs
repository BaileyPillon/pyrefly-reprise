// Continuity harness: a freeze in the middle of a blend (CHK-027), counted instead of inferred.
//
// A pose change that crossfades takes the two planes' fades from (1, 0) to (0, 1) over a few frames. When something stops the
// clock that drives them (the hit-stop zeroes the stage's `dt`, a pacing option stretches it) the fades stop where they are and
// the same double image is drawn for several frames in a row: round 23's "8 ghost frames" at one fade pair (PoseBlend, PR-0379,
// root cause RC2). `ghost.frames` counts the frames a double image shows but cannot tell a slow blend from a frozen one, so the
// freeze was inferred from the replica's numbers. This reads it: the longest run of consecutive frames in which BOTH planes of the swap
// show (each above `blendFadeMin`) and neither plane's fade has moved.
//
// r40 instrument edit (c) (FI-1, P5; Bailey, 2026-10-10): a swap carries `held` = { frames, ms }, the longest such plateau, 0 when there
// is none. A plateau of at least `HELD_MIN_FRAMES` frames is counted in the summary (`motion.heldSwaps`, `motion.longestHeldFrames`).
//
// Game case: both (shared critic plumbing; the hit-stop is 40/85 ms in FFX and 28/55 ms in FFX-2, so FFX shows the longer plateau).

/** Fades that differ by less than this are the same fade (the probe rounds them to 0.001). */
export const HELD_EPSILON = 0.002;

/** A plateau shorter than this is frame-pacing noise; this long or longer is a freeze that the summary counts. */
export const HELD_MIN_FRAMES = 3;

const fadeOf = (fig, key) => {
  for (const raw of fig.s) if (Array.isArray(raw) && raw[0] === key) return raw[1];
  return null;
};

/**
 * @param {Array<{n:number, t:number, fig:{s:Array}}>} frames  the swap's frames, in order (as `analyzeSwap` gets them)
 * @param {{from:number, to:number}} swap  the plane keys
 * @param {number} blendFadeMin  `motion.blendFadeMin`: a plane below this is not showing
 * @param {number} frameMs  one frame in ms, for the first frame of a plateau
 * @returns {{frames:number, ms:number, from:number|null}} the longest plateau: frames in it (0 when no two frames in a row repeat), its time, the frame number it began on
 */
export function heldPlateau(frames, swap, blendFadeMin, frameMs) {
  let best = { frames: 0, ms: 0, from: null };
  let run = null; // the plateau being counted: { start: index of its first frame, frames }
  for (let j = 1; j < frames.length; j++) {
    const prev = frames[j - 1], cur = frames[j];
    const pf = fadeOf(prev.fig, swap.from), pt = fadeOf(prev.fig, swap.to), cf = fadeOf(cur.fig, swap.from), ct = fadeOf(cur.fig, swap.to);
    const repeats = cur.n === prev.n + 1 && pf !== null && pt !== null && cf !== null && ct !== null
      && Math.min(cf, ct) > blendFadeMin && Math.abs(cf - pf) < HELD_EPSILON && Math.abs(ct - pt) < HELD_EPSILON;
    if (!repeats) { run = null; continue; }
    if (!run) run = { start: j - 1, frames: 1 };
    run.frames++;
    if (run.frames > best.frames) {
      // the time the plateau was on screen: every frame of it, the first for one frame's worth, the rest for the time since the frame before (capped like the ghost time)
      let ms = frameMs;
      for (let k = run.start + 1; k <= j; k++) ms += Math.min(100, Math.max(0, frames[k].t - frames[k - 1].t));
      best = { frames: run.frames, ms: Math.round(ms), from: frames[run.start].n };
    }
  }
  return best;
}
