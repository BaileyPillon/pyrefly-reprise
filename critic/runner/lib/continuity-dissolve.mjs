// Continuity harness: the travel of the weighted head inside a dissolve is not a jerk (CHK-027; pc-residues lane, 2026-10-28; method check 2026-10-26 step 2: "Kimahri follow to idle 69 px and Tidus
// hurt to critical 43 px, both blended swaps with no smear").
//
// The harness follows a figure's head as the average of its two planes' heads weighted by their fades. In a dissolve of two paintings whose heads are 0.3 to 0.45 of the figure's height apart
// (a lunge's follow-through and the idle) that average MOVES along the line between the two heads by construction, by (the change of the incoming painting's share) times (the gap): a smooth
// eight-frame dissolve moves it 0.2 of the gap, 46 px of 230, in its middle frame. Nothing on the screen moves: two figures fade, one in and one out, and the double image is judged on its
// own line (CHK-027's ghost severity, and the ghost frames a minute). What a player does see as a pop is the OTHER thing a swap jerk is for: a change that takes most of a painting's weight in
// one or two frames (a cut, a 50 ms blend), where the share jumps by 0.4 or more.
//
// So a swap jerk at a DISSOLVE (a swap that is not a hard cut, with at least `minBlendFrames` frames in which both paintings show) whose incoming painting's share changes by no more than
// `maxShareStep` in the step, and that is no bigger than `maxPx`, is the dissolve's own travel: tagged `dissolveTravel` (with the share step), reported (`motion.jerksDissolveTravel`) and left
// out of the gated swap jerks. A bigger one, or one in a blend that is nearly a cut, stays a swap jerk. The policy's `jerks.dissolveTravel` can switch the excuse off (`maxPx: 0`).
//
// Pure: plain numbers in, plain numbers out. Game case: both (shared critic plumbing).

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/** The fade of the plane that draws painting key `k` in a figure record (`s` entries are `[k, fade, ...]`), or 0 when it is not recorded. */
function fadeOf(fig, k) {
  if (!fig) return 0;
  for (const raw of fig.s) if (Array.isArray(raw) && raw[0] === k) return raw[1];
  return 0;
}

/** The incoming painting's share of the figure (its fade over the two fades) in one figure record; null when neither shows. */
function shareIn(fig, from, to) {
  const a = fadeOf(fig, from), b = fadeOf(fig, to);
  return a + b > 0.001 ? b / (a + b) : null;
}

/**
 * How much the incoming painting's share changed across the step that ended on frame `n` (the frame the jerk is reported on), the larger of the step into `n` and the step out of it (the
 * detector's two frames and the swap's own), or null where the shares are not readable.
 * @param {{n: number, fig: object}[]} frames the figure's consecutive frames
 * @param {number} n the jerk's frame
 * @param {number} from the swap's outgoing plane key
 * @param {number} to the swap's incoming plane key
 */
export function shareStepAt(frames, n, from, to) {
  const i = frames.findIndex((f) => f.n === n);
  if (i < 1) return null;
  const at = (j) => (frames[j] ? shareIn(frames[j].fig, from, to) : null);
  const steps = [];
  for (const j of [i, i + 1]) {
    const a = at(j - 1), b = at(j);
    if (a !== null && b !== null) steps.push(Math.abs(b - a));
  }
  return steps.length ? round(Math.max(...steps), 3) : null;
}

/** The policy's `jerks.dissolveTravel` block, with its defaults: `{ minBlendFrames, maxShareStep, maxPx }` (a `maxPx` of 0 turns the excuse off). */
export function dissolvePolicy(cfg) {
  const p = cfg?.jerks?.dissolveTravel ?? {};
  return { minBlendFrames: Number.isFinite(p.minBlendFrames) ? p.minBlendFrames : 5, maxShareStep: Number.isFinite(p.maxShareStep) ? p.maxShareStep : 0.3, maxPx: Number.isFinite(p.maxPx) ? p.maxPx : 0 };
}

/**
 * Is this swap jerk a dissolve's own travel? `swap` is the swap record it falls at (`hardCut`, `blendFrames`, the plane keys `from` and `to`), `frames` the figure's frames.
 * @returns {null | { shareStep: number, blendFrames: number }}
 */
export function dissolveTravel({ jerk, swap, frames, policy }) {
  if (!swap || !(policy.maxPx > 0) || jerk.px > policy.maxPx || swap.hardCut || !(swap.blendFrames >= policy.minBlendFrames)) return null;
  const shareStep = shareStepAt(frames, jerk.n, swap.from, swap.to);
  if (shareStep === null || shareStep > policy.maxShareStep) return null;
  return { shareStep, blendFrames: swap.blendFrames };
}
